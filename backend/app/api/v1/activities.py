from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ForbiddenException
from app.models.organization import TeamMember
from app.models.user import User
from app.schemas.activity import ActivityResponse
from app.schemas.common import SuccessResponse
from app.services.activity_service import ActivityService

router = APIRouter()


async def _check_membership(db: AsyncSession, org_id: UUID, user_id: UUID):
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.organization_id == org_id,
            TeamMember.user_id == user_id,
        )
    )
    m = result.scalar_one_or_none()
    if not m:
        u = (
            await db.execute(select(User).where(User.id == user_id))
        ).scalar_one_or_none()
        if u and u.is_superuser:
            return
        raise ForbiddenException("Not a member of this organization")


@router.get("/{org_id}", response_model=SuccessResponse[List[ActivityResponse]])
async def list_activities(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _check_membership(db, org_id, current_user.id)
    data = await ActivityService(db).list_activities(org_id)
    return SuccessResponse(data=data)
