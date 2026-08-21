from datetime import date
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException, ForbiddenException, ValidationException
from app.core.permissions import Role, has_permission
from app.models.client import Client
from app.models.content_brief import BriefAssignment, BriefSlide, ContentBrief
from app.models.notification import Notification
from app.models.organization import TeamMember
from app.models.user import User
from app.schemas.content_brief import (
    BriefAssignee,
    BriefSlideResponse,
    ContentBriefResponse,
    CreateBriefRequest,
    UpdateBriefRequest,
    UpdateSlideRequest,
)
from app.services.activity_service import ActivityService

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

        await self.db.flush()
        if data.assigned_user_ids:
            await self._sync_assignments(brief, org_id, data.assigned_user_ids)
            await self._notify_assignees(
                brief,
                org_id,
                actor_id=user_id,
                type="brief_assigned",
                message=f"menugaskan Anda pada brief \"{brief.name}\"",
                recipient_ids=data.assigned_user_ids,
            )

        await self.db.commit()
        await self.db.refresh(brief)
        await self._log_activity("create", brief, org_id, user_id)
        return await self._get_brief_response(brief.id)

    async def list_briefs(self, org_id: UUID, user_id: UUID) -> List[ContentBriefResponse]:
        await self._check_membership(org_id, user_id)
        result = await self.db.execute(
            select(ContentBrief)
            .options(selectinload(ContentBrief.slides))
            .where(ContentBrief.organization_id == org_id)
            .order_by(ContentBrief.created_at.desc())
        )
        briefs = result.scalars().all()
        responses = [self._to_response(b) for b in briefs]
        for response in responses:
            response.assigned_users = await self._load_assignees(UUID(response.id))
        return responses

    async def get_brief(self, brief_id: UUID, user_id: UUID) -> ContentBriefResponse:
        brief = await self._get_brief(brief_id)
        await self._check_membership(brief.organization_id, user_id)
        return await self._get_brief_response(brief_id)

    async def update_brief(self, brief_id: UUID, data: UpdateBriefRequest, user_id: UUID) -> ContentBriefResponse:
        brief = await self._get_brief(brief_id)
        await self._check_permission(brief.organization_id, user_id, "update_content")

        field_changed = False
        if data.name is not None:
            if brief.name != data.name:
                field_changed = True
            brief.name = data.name
        if data.content_type is not None:
            if brief.content_type != data.content_type:
                field_changed = True
            brief.content_type = data.content_type
        if data.platform is not None:
            if brief.platform != data.platform:
                field_changed = True
            brief.platform = data.platform
        if data.deadline_date is not None and brief.deadline_date != data.deadline_date:
            field_changed = True
            brief.deadline_date = data.deadline_date

        # Sync assignees; newly added users get an assignment notification.
        new_user_ids: list[UUID] = []
        if data.assigned_user_ids is not None:
            new_user_ids = await self._sync_assignments(
                brief, brief.organization_id, data.assigned_user_ids
            )

        current_ids = await self._assignment_user_ids(brief.id)
        if field_changed and current_ids:
            await self._notify_assignees(
                brief,
                brief.organization_id,
                actor_id=user_id,
                type="brief_updated",
                message=f"memperbarui brief \"{brief.name}\"",
                recipient_ids=current_ids,
            )
        if new_user_ids:
            await self._notify_assignees(
                brief,
                brief.organization_id,
                actor_id=user_id,
                type="brief_assigned",
                message=f"menugaskan Anda pada brief \"{brief.name}\"",
                recipient_ids=new_user_ids,
            )

        await self.db.commit()
        await self._log_activity("update", brief, brief.organization_id, user_id)
        return await self._get_brief_response(brief.id)

    async def update_status(self, brief_id: UUID, new_status: str, user_id: UUID) -> ContentBriefResponse:
        brief = await self._get_brief(brief_id)
        await self._check_permission(brief.organization_id, user_id, "update_content")

        if new_status not in VALID_STATUS_TRANSITIONS:
            raise ValidationException(f"Invalid status: {new_status}")

        old_status = brief.status
        brief.status = new_status

        current_ids = await self._assignment_user_ids(brief.id)
        if current_ids:
            await self._notify_assignees(
                brief,
                brief.organization_id,
                actor_id=user_id,
                type="brief_updated",
                message=f"mengubah status \"{brief.name}\" menjadi {new_status}",
                recipient_ids=current_ids,
            )

        await self.db.commit()
        await self._log_activity(
            "status_change",
            brief,
            brief.organization_id,
            user_id,
            details=f"{old_status} → {new_status}",
        )
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

        current_ids = await self._assignment_user_ids(brief.id)
        if current_ids:
            await self._notify_assignees(
                brief,
                brief.organization_id,
                actor_id=user_id,
                type="brief_updated",
                message=f"memperbarui slide \"{slide.slide_title}\" pada brief \"{brief.name}\"",
                recipient_ids=current_ids,
            )

        await self.db.commit()
        await self.db.refresh(slide)
        await self._log_activity(
            "update",
            brief,
            brief.organization_id,
            user_id,
            details=f"slide '{slide.slide_title}'",
        )
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
        await self._log_activity("delete", brief, brief.organization_id, user_id)
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

    async def _sync_assignments(
        self, brief: ContentBrief, org_id: UUID, user_ids: List[str]
    ) -> List[UUID]:
        """Replace the brief's assignees with user_ids. Returns ids that are NEW
        (for assignment notifications). Ids must be members of the organization."""
        valid_ids = await self._org_member_user_ids(org_id)
        requested = []
        for raw in user_ids:
            uid = UUID(raw)
            if uid not in valid_ids:
                raise ValidationException(f"User {raw} bukan anggota organization ini")
            if uid not in requested:
                requested.append(uid)

        result = await self.db.execute(
            select(BriefAssignment).where(BriefAssignment.brief_id == brief.id)
        )
        existing = {a.user_id: a for a in result.scalars().all()}

        # Remove de-selected assignees
        for uid, row in existing.items():
            if uid not in requested:
                await self.db.delete(row)

        # Add new assignees
        added = [uid for uid in requested if uid not in existing]
        for uid in added:
            self.db.add(BriefAssignment(brief_id=brief.id, user_id=uid))
        return added

    async def _assignment_user_ids(self, brief_id: UUID) -> List[UUID]:
        """Current assignee user ids of a brief."""
        result = await self.db.execute(
            select(BriefAssignment.user_id).where(BriefAssignment.brief_id == brief_id)
        )
        return [r[0] for r in result.all()]

    async def _org_member_user_ids(self, org_id: UUID) -> set[UUID]:
        result = await self.db.execute(
            select(TeamMember.user_id).where(TeamMember.organization_id == org_id)
        )
        return {r[0] for r in result.all()}

    async def _notify_assignees(
        self,
        brief: ContentBrief,
        org_id: UUID,
        actor_id: UUID,
        type: str,
        message: str,
        recipient_ids: List[UUID],
    ) -> None:
        """Insert one notification per recipient; the actor never notifies themself."""
        for uid in recipient_ids:
            if uid == actor_id:
                continue
            self.db.add(
                Notification(
                    organization_id=org_id,
                    recipient_user_id=uid,
                    type=type,
                    title=brief.name,
                    message=message,
                    entity_type="content_brief",
                    entity_id=brief.id,
                )
            )

    async def _load_assignees(self, brief_id: UUID) -> List[BriefAssignee]:
        """Assignees with display names, ordered by name."""
        result = await self.db.execute(
            select(User.id, User.name)
            .join(BriefAssignment, BriefAssignment.user_id == User.id)
            .where(BriefAssignment.brief_id == brief_id)
            .order_by(User.name)
        )
        return [BriefAssignee(id=str(uid), name=name) for uid, name in result.all()]

    async def _log_activity(
        self,
        action: str,
        brief: ContentBrief,
        org_id: UUID,
        user_id: UUID,
        details: str | None = None,
    ):
        await ActivityService(self.db).log(
            organization_id=org_id,
            user_id=user_id,
            action=action,
            entity_type="content_brief",
            entity_id=brief.id,
            entity_name=brief.name,
            details=details,
        )

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
        response = self._to_response(b)
        response.assigned_users = await self._load_assignees(brief_id)
        return response

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
