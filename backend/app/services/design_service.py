import asyncio
import os
from typing import List
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.permissions import Role, has_permission
from app.models.client import BrandAsset, Client
from app.models.content_brief import BriefSlide, ContentBrief
from app.models.design import GeneratedDesign
from app.models.organization import TeamMember
from app.models.user import User
from app.schemas.design import (
    CarouselSlideRequest,
    GenerateCarouselRequest,
    GenerateDesignRequest,
    GeneratedDesignResponse,
)
from app.services.ai_service import AIService
from app.services.credit_service import CreditService
from app.services.activity_service import ActivityService

settings = get_settings()


class DesignService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai = AIService()
        self.credits = CreditService(db)

    async def generate_single(
        self, data: GenerateDesignRequest, user_id: UUID
    ) -> GeneratedDesignResponse:
        client = await self._get_client(UUID(data.client_id))
        await self._check_permission(client.organization_id, user_id, "generate_design")

        # Design Director: build structured brief, then elaborate it for the image model
        brand_context = await self._get_brand_context(UUID(data.client_id), client)
        await self._add_brief_context(
            brand_context,
            UUID(data.content_brief_id) if data.content_brief_id else None,
            UUID(data.slide_id) if data.slide_id else None,
        )
        structured_prompt = self.ai.build_structured_prompt(
            user_prompt=data.prompt,
            brand_context=brand_context,
            content_type=data.content_type,
            platform=brand_context.get("platform", "instagram"),
        )
        elaborated_prompt = await asyncio.to_thread(
            self.ai.elaborate_prompt,
            user_prompt=structured_prompt,
            content_type=data.content_type,
            platform=brand_context.get("platform", "instagram"),
        )

        # Use elaborated prompt for image generation, but store both in prompt_used
        full_prompt = elaborated_prompt

        # Call AI (off the event loop — sync OpenAI client is blocking).
        # Deduct credits only AFTER generation succeeds, so a failed call doesn't burn credits.
        logo_bytes = await self._get_logo_bytes(client.id)
        image_url = await asyncio.to_thread(self.ai.generate_image, full_prompt, data.content_type)
        if logo_bytes and data.logo_position != "none":
            image_url = await asyncio.to_thread(self.ai.overlay_logo, image_url, logo_bytes, data.logo_position)
        await self.credits.deduct_credits(client.organization_id, 1)

        # Save design
        slide_uuid = UUID(data.slide_id) if data.slide_id else None
        brief_uuid = UUID(data.content_brief_id) if data.content_brief_id else None
        version = await self._next_version(slide_uuid, brief_uuid, client.id)

        # Store both structured and elaborated prompts
        combined_prompt = f"--- STRUCTURED BRIEF ---\n\n{structured_prompt}\n\n--- ELABORATED PROMPT (Design Director) ---\n\n{elaborated_prompt}"

        design = GeneratedDesign(
            client_id=client.id,
            content_brief_id=brief_uuid,
            slide_id=slide_uuid,
            image_url=image_url,
            prompt_used=combined_prompt,
            content_type=data.content_type,
            version=version,
            credits_used=1,
        )
        self.db.add(design)
        await self.db.commit()
        await self.db.refresh(design)

        await ActivityService(self.db).log(
            organization_id=client.organization_id,
            user_id=user_id,
            action="generate",
            entity_type="design",
            entity_id=design.id,
            entity_name=f"Design v{design.version}",
            details=data.content_type,
        )

        return self._to_response(design)

    async def generate_carousel(
        self, data: GenerateCarouselRequest, user_id: UUID
    ) -> List[GeneratedDesignResponse]:
        client = await self._get_client(UUID(data.client_id))
        await self._check_permission(client.organization_id, user_id, "generate_design")

        n_slides = len(data.slides)
        brand_context = await self._get_brand_context(UUID(data.client_id), client)
        await self._add_brief_context(
            brand_context,
            UUID(data.content_brief_id) if data.content_brief_id else None,
            None,
        )

        brief_uuid = UUID(data.content_brief_id) if data.content_brief_id else None
        next_version = await self._next_version(None, brief_uuid, client.id)

        logo_bytes = await self._get_logo_bytes(client.id)

        results = []
        for slide in data.slides:
            slide_context = {**brand_context, "slide_text": slide.prompt}
            if slide.name:
                slide_context["slide_title"] = slide.name
            structured_prompt = self.ai.build_structured_prompt(
                user_prompt=slide.prompt,
                brand_context=slide_context,
                content_type=slide.content_type,
                platform=slide_context.get("platform", "instagram"),
            )
            elaborated_prompt = await asyncio.to_thread(
                self.ai.elaborate_prompt,
                user_prompt=structured_prompt,
                content_type=slide.content_type,
                platform=slide_context.get("platform", "instagram"),
            )
            image_url = await asyncio.to_thread(
                self.ai.generate_image, elaborated_prompt, slide.content_type
            )
            if logo_bytes and data.logo_position != "none":
                image_url = await asyncio.to_thread(
                    self.ai.overlay_logo, image_url, logo_bytes, data.logo_position
                )

            combined_prompt = f"--- STRUCTURED BRIEF ---\n\n{structured_prompt}\n\n--- ELABORATED PROMPT (Design Director) ---\n\n{elaborated_prompt}"

            design = GeneratedDesign(
                client_id=client.id,
                content_brief_id=brief_uuid,
                image_url=image_url,
                prompt_used=combined_prompt,
                content_type=slide.content_type,
                version=next_version,
                credits_used=1,
            )
            next_version += 1
            self.db.add(design)
            await self.db.flush()
            results.append(self._to_response(design))

        # Deduct credits only after ALL slides generated successfully, so a
        # failed call doesn't burn credits.
        await self.credits.deduct_credits(client.organization_id, n_slides)

        await self.db.commit()

        if results:
            first = results[0]
            await ActivityService(self.db).log(
                organization_id=client.organization_id,
                user_id=user_id,
                action="generate",
                entity_type="design",
                entity_id=UUID(first.id),
                entity_name=f"Generated {len(results)} designs",
                details="carousel",
            )

        return results

    async def list_by_client(self, client_id: UUID, user_id: UUID) -> List[GeneratedDesignResponse]:
        client = await self._get_client(client_id)
        await self._check_membership(client.organization_id, user_id)

        result = await self.db.execute(
            select(GeneratedDesign)
            .where(GeneratedDesign.client_id == client_id)
            .order_by(GeneratedDesign.created_at.desc())
            .limit(50)
        )
        return [self._to_response(d) for d in result.scalars().all()]

    async def list_by_slide(self, slide_id: UUID, user_id: UUID) -> List[GeneratedDesignResponse]:
        result = await self.db.execute(
            select(GeneratedDesign)
            .where(GeneratedDesign.slide_id == slide_id)
            .order_by(GeneratedDesign.created_at.desc())
            .limit(10)
        )
        designs = result.scalars().all()
        if designs:
            client = await self._get_client(designs[0].client_id)
            await self._check_membership(client.organization_id, user_id)
        return [self._to_response(d) for d in designs]

    async def get_design(self, design_id: UUID, user_id: UUID) -> GeneratedDesignResponse:
        design = await self._get_design(design_id)
        client = await self._get_client(design.client_id)
        await self._check_membership(client.organization_id, user_id)
        return self._to_response(design)

    async def delete_design(self, design_id: UUID, user_id: UUID):
        design = await self._get_design(design_id)
        client = await self._get_client(design.client_id)
        await self._check_permission(client.organization_id, user_id, "delete_content")
        await ActivityService(self.db).log(
            organization_id=client.organization_id,
            user_id=user_id,
            action="delete",
            entity_type="design",
            entity_id=design.id,
            entity_name=f"Design v{design.version}",
            details=design.content_type,
        )
        await self.db.delete(design)
        await self.db.commit()

    # --- Brand Memory ---

    async def _get_brand_context(self, client_id: UUID, client: Client) -> dict:
        """Fetch brand assets and return as prompt context dict."""
        result = await self.db.execute(
            select(BrandAsset).where(BrandAsset.client_id == client_id)
        )
        assets = result.scalars().all()

        style = ""
        colors = ""
        fonts = ""

        style_asset = next((a for a in assets if a.brand_style), None)
        if style_asset and style_asset.brand_style:
            style = style_asset.brand_style

        colors_asset = next((a for a in assets if a.brand_colors), None)
        if colors_asset and colors_asset.brand_colors:
            raw = colors_asset.brand_colors.get("colors", [])
            if raw:
                parts = []
                for i, c in enumerate(raw):
                    if isinstance(c, dict) and "hex" in c:
                        parts.append(f"{c.get('role', 'primary')}: {c['hex']}")
                    else:  # string lama — role posisional
                        role = ["primary", "secondary", "accent"][i] if i < 3 else "accent"
                        parts.append(f"{role}: {c}")
                colors = ", ".join(parts)

        font_list = [a for a in assets if a.asset_type == "font" and a.font_name]
        if font_list:
            fonts = ", ".join([f"{f.font_name} ({f.font_type})" for f in font_list])

        return {
            "client_name": client.name,
            "style": style,
            "colors": colors,
            "fonts": fonts,
            "has_logo": any(a.asset_type == "logo" and a.file_url for a in assets),
            "has_guideline": any(a.asset_type == "guideline" and a.file_url for a in assets),
            "reference_count": len([a for a in assets if a.asset_type == "reference" and a.file_url]),
        }

    async def _get_logo_bytes(self, client_id: UUID) -> bytes | None:
        """Read uploaded logo bytes from disk, if the client has a logo."""
        r = await self.db.execute(
            select(BrandAsset).where(
                BrandAsset.client_id == client_id,
                BrandAsset.asset_type == "logo",
                BrandAsset.file_url.isnot(None),
            )
        )
        a = r.scalar_one_or_none()
        if not a or not a.file_url:
            return None
        # "/uploads/{cid}/logo.png" -> "./uploads/{cid}/logo.png"
        rel = a.file_url.removeprefix("/uploads")
        path = os.path.join(settings.UPLOAD_DIR, rel.lstrip("/"))
        if not os.path.exists(path):
            return None
        with open(path, "rb") as f:
            return f.read()

    async def _add_brief_context(
        self,
        context: dict,
        brief_id: UUID | None,
        slide_id: UUID | None,
    ) -> None:
        """Mutate context with optional content brief and slide details."""
        if brief_id:
            result = await self.db.execute(select(ContentBrief).where(ContentBrief.id == brief_id))
            brief = result.scalar_one_or_none()
            if brief:
                context.update(
                    {
                        "brief_name": brief.name,
                        "platform": brief.platform,
                        "content_type": brief.content_type,
                    }
                )

        if slide_id:
            result = await self.db.execute(select(BriefSlide).where(BriefSlide.id == slide_id))
            slide = result.scalar_one_or_none()
            if slide:
                context.update(
                    {
                        "slide_title": slide.slide_title,
                        "slide_text": slide.brief_text,
                        "slide_notes": slide.notes,
                    }
                )

        # --- Helpers ---

    async def _next_version(
        self, slide_id: UUID | None, brief_id: UUID | None, client_id: UUID
    ) -> int:
        """Next version number for a design, scoped slide → brief → client."""
        if slide_id:
            col = GeneratedDesign.slide_id
            val = slide_id
        elif brief_id:
            col = GeneratedDesign.content_brief_id
            val = brief_id
        else:
            col = GeneratedDesign.client_id
            val = client_id
        result = await self.db.execute(
            select(func.max(GeneratedDesign.version)).where(col == val)
        )
        max_v = result.scalar()
        return (max_v or 0) + 1

    async def _get_client(self, client_id: UUID) -> Client:
        result = await self.db.execute(select(Client).where(Client.id == client_id))
        c = result.scalar_one_or_none()
        if not c:
            raise NotFoundException("Client", str(client_id))
        return c

    async def _get_design(self, design_id: UUID) -> GeneratedDesign:
        result = await self.db.execute(
            select(GeneratedDesign).where(GeneratedDesign.id == design_id)
        )
        d = result.scalar_one_or_none()
        if not d:
            raise NotFoundException("Design", str(design_id))
        return d

    async def _check_membership(self, org_id: UUID, user_id: UUID):
        result = await self.db.execute(
            select(TeamMember).where(TeamMember.organization_id == org_id, TeamMember.user_id == user_id)
        )
        m = result.scalar_one_or_none()
        if not m:
            u = (await self.db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
            if u and u.is_superuser:
                class V:
                    role = Role.ADMIN.value
                return V()
            raise ForbiddenException("Not a member of this organization")
        return m

    async def _check_permission(self, org_id: UUID, user_id: UUID, permission: str):
        m = await self._check_membership(org_id, user_id)
        u = (await self.db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not has_permission(Role(m.role), permission, u.is_superuser if u else False):
            raise ForbiddenException(f"Insufficient permissions: {permission}")

    def _to_response(self, d: GeneratedDesign) -> GeneratedDesignResponse:
        return GeneratedDesignResponse(
            id=str(d.id),
            client_id=str(d.client_id),
            content_brief_id=str(d.content_brief_id) if d.content_brief_id else None,
            slide_id=str(d.slide_id) if d.slide_id else None,
            image_url=d.image_url,
            prompt_used=d.prompt_used,
            content_type=d.content_type,
            version=d.version,
            credits_used=d.credits_used,
            created_at=str(d.created_at) if d.created_at else None,
        )
