from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.admin import AdminOverviewStats, OrgStatsResponse
from app.schemas.common import SuccessResponse
from app.services.admin_service import AdminService

router = APIRouter()


@router.get("/stats", response_model=SuccessResponse[AdminOverviewStats])
async def get_overview_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        data=await AdminService(db).get_overview_stats(current_user.id)
    )


@router.get("/organizations", response_model=SuccessResponse[List[OrgStatsResponse]])
async def get_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        data=await AdminService(db).get_org_list(current_user.id)
    )
