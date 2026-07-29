from datetime import date
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException, ForbiddenException, ValidationException
from app.core.permissions import Role, has_permission
from app.models.client import Client
from app.models.content_brief import BriefSlide, ContentBrief
from app.models.organization import TeamMember
from app.models.user import User
from app.schemas.content_brief import (
    BriefSlideResponse,
    ContentBriefResponse,
    CreateBriefRequest,
    UpdateBriefRequest,
    UpdateSlideRequest,
)

VALID_STATUS_TRANSITIONS = {
    "draft": ["in_progress"],
    "in_progress": ["generated"],
    "generated": ["in_review"],
    "in_review": ["approved", "draft"],
    "approved": ["published"],
    "published": [],
}


class ContentBriefService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_brief(self, data: CreateBriefRequest, user_id: UUID) -> ContentBriefResponse:
        org_id = UUID(data.organization_id)
        await self._check_permission(org_id, user_id, "create_content")
        await self._validate_client(UUID(data.client_id), org_id)

        brief = ContentBrief(
            organization_id=org_id,
            client_id=UUID(data.client_id),
            name=data.name,
            content_type=data.content_type,
            platform=data.platform,
            deadline_date=data.deadline_date,
            status="draft",
        )
        self.db.add(brief)
        await self.db.flush()

        for idx, slide_data in enumerate(data.slides, 1):
            slide = BriefSlide(
                brief_id=brief.id,
                slide_title=slide_data.slide_title,
                brief_text=slide_data.brief_text,
                notes=slide_data.notes,
                slide_number=idx,
            )
            self.db.add(slide)

        await self.db.commit()
        await self.db.refresh(brief)
        return await self._get_brief_response(brief.id)

    async def list_briefs(self, org_id: UUID, user_id: UUID) -> List[ContentBriefResponse]:
        await self._check_membership(org_id, user_id)
        result = await self.db.execute(
            select(ContentBrief)
            .options(selectinload(ContentBrief.slides))
            .where(ContentBrief.organization_id == org_id)
            .order_by(ContentBrief.created_at.desc())
        )
        return [self._to_response(b) for b in result.scalars().all()]

    async def get_brief(self, brief_id: UUID, user_id: UUID) -> ContentBriefResponse:
        brief = await self._get_brief(brief_id)
        await self._check_membership(brief.organization_id, user_id)
        return await self._get_brief_response(brief_id)

    async def update_brief(self, brief_id: UUID, data: UpdateBriefRequest, user_id: UUID) -> ContentBriefResponse:
        brief = await self._get_brief(brief_id)
        await self._check_permission(brief.organization_id, user_id, "update_content")

        if data.name is not None:
            brief.name = data.name
        if data.content_type is not None:
            brief.content_type = data.content_type
        if data.platform is not None:
            brief.platform = data.platform
        if data.deadline_date is not None:
            brief.deadline_date = data.deadline_date

        await self.db.commit()
        return await self._get_brief_response(brief.id)

    async def update_status(self, brief_id: UUID, new_status: str, user_id: UUID) -> ContentBriefResponse:
        brief = await self._get_brief(brief_id)
        await self._check_permission(brief.organization_id, user_id, "update_content")

        allowed = VALID_STATUS_TRANSITIONS.get(brief.status, [])
        if new_status not in allowed:
            raise ValidationException(
                f"Invalid status transition: {brief.status} → {new_status}. Allowed: {', '.join(allowed) if allowed else 'none'}"
            )

        brief.status = new_status
        await self.db.commit()
        return await self._get_brief_response(brief_id)

    async def update_slide(self, slide_id: UUID, data: UpdateSlideRequest, user_id: UUID) -> BriefSlideResponse:
        slide = await self._get_slide(slide_id)
        brief = await self._get_brief(slide.brief_id)
        await self._check_permission(brief.organization_id, user_id, "update_content")

        if data.slide_title is not None:
            slide.slide_title = data.slide_title
        if data.brief_text is not None:
            slide.brief_text = data.brief_text
        if data.notes is not None:
            slide.notes = data.notes

        await self.db.commit()
        await self.db.refresh(slide)
        return BriefSlideResponse(
            id=str(slide.id),
            slide_title=slide.slide_title,
            brief_text=slide.brief_text,
            notes=slide.notes,
            slide_number=slide.slide_number,
        )

    async def delete_brief(self, brief_id: UUID, user_id: UUID):
        brief = await self._get_brief(brief_id)
        await self._check_permission(brief.organization_id, user_id, "delete_content")
        await self.db.delete(brief)
        await self.db.commit()

    async def get_upcoming(self, user_id: UUID) -> List[ContentBriefResponse]:
        org_result = await self.db.execute(
            select(TeamMember.organization_id).where(TeamMember.user_id == user_id)
        )
        org_ids = [r[0] for r in org_result.all()]

        u = (await self.db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if u and u.is_superuser:
            org_result2 = await self.db.execute(select(ContentBrief.organization_id))
            org_ids = list(set(org_ids + [r[0] for r in org_result2.all()]))

        if not org_ids:
            return []

        today = date.today()
        result = await self.db.execute(
            select(ContentBrief)
            .options(selectinload(ContentBrief.slides))
            .where(
                ContentBrief.organization_id.in_(org_ids),
                ContentBrief.deadline_date >= today,
                ContentBrief.status.in_(["draft", "in_progress", "in_review"]),
            )
            .order_by(ContentBrief.deadline_date)
            .limit(10)
        )
        return [self._to_response(b) for b in result.scalars().all()]

    async def get_stats(self, org_id: UUID, user_id: UUID) -> dict:
        await self._check_membership(org_id, user_id)
        result = await self.db.execute(
            select(ContentBrief).where(ContentBrief.organization_id == org_id)
        )
        briefs = result.scalars().all()
        return {
            "total": len(briefs),
            "active": len([b for b in briefs if b.deadline_date is None or b.deadline_date >= date.today()]),
        }

    # --- Private helpers ---

    async def _get_brief(self, brief_id: UUID) -> ContentBrief:
        result = await self.db.execute(
            select(ContentBrief).where(ContentBrief.id == brief_id)
        )
        b = result.scalar_one_or_none()
        if not b:
            raise NotFoundException("Content Brief", str(brief_id))
        return b

    async def _get_brief_response(self, brief_id: UUID) -> ContentBriefResponse:
        result = await self.db.execute(
            select(ContentBrief)
            .options(selectinload(ContentBrief.slides))
            .where(ContentBrief.id == brief_id)
        )
        b = result.scalar_one()
        return self._to_response(b)

    async def _get_slide(self, slide_id: UUID) -> BriefSlide:
        result = await self.db.execute(select(BriefSlide).where(BriefSlide.id == slide_id))
        s = result.scalar_one_or_none()
        if not s:
            raise NotFoundException("Brief Slide", str(slide_id))
        return s

    async def _validate_client(self, client_id: UUID, org_id: UUID):
        result = await self.db.execute(
            select(Client).where(Client.id == client_id, Client.organization_id == org_id)
        )
        if not result.scalar_one_or_none():
            raise NotFoundException("Client", str(client_id))

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

    def _to_response(self, b: ContentBrief) -> ContentBriefResponse:
        slides = [
            BriefSlideResponse(
                id=str(s.id),
                slide_title=s.slide_title,
            brief_text=s.brief_text,
                notes=s.notes,
                slide_number=s.slide_number,
            )
            for s in (b.slides or [])
        ]
        return ContentBriefResponse(
            id=str(b.id),
            organization_id=str(b.organization_id),
            client_id=str(b.client_id),
            name=b.name,
            content_type=b.content_type,
            platform=b.platform,
            deadline_date=b.deadline_date,
            status=b.status,
            slides=slides,
            created_at=str(b.created_at) if b.created_at else None,
        )
