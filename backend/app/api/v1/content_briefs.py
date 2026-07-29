from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.content_brief import (
    BriefSlideResponse,
    ContentBriefResponse,
    CreateBriefRequest,
    UpdateBriefRequest,
    UpdateSlideRequest,
    UpdateStatusRequest,
)
from app.schemas.common import SuccessResponse
from app.services.content_brief_service import ContentBriefService

router = APIRouter()


@router.post("/", response_model=SuccessResponse[ContentBriefResponse])
async def create_brief(
    data: CreateBriefRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(data=await ContentBriefService(db).create_brief(data, current_user.id))


@router.get("/{org_id}", response_model=SuccessResponse[List[ContentBriefResponse]])
async def list_briefs(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(data=await ContentBriefService(db).list_briefs(org_id, current_user.id))


@router.get("/detail/{brief_id}", response_model=SuccessResponse[ContentBriefResponse])
async def get_brief(
    brief_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(data=await ContentBriefService(db).get_brief(brief_id, current_user.id))


@router.put("/{brief_id}", response_model=SuccessResponse[ContentBriefResponse])
async def update_brief(
    brief_id: UUID,
    data: UpdateBriefRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(data=await ContentBriefService(db).update_brief(brief_id, data, current_user.id))


@router.patch("/{brief_id}/status", response_model=SuccessResponse[ContentBriefResponse])
async def update_status(
    brief_id: UUID,
    data: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(data=await ContentBriefService(db).update_status(brief_id, data.status, current_user.id))


@router.put("/slides/{slide_id}", response_model=SuccessResponse[BriefSlideResponse])
async def update_slide(
    slide_id: UUID,
    data: UpdateSlideRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(data=await ContentBriefService(db).update_slide(slide_id, data, current_user.id))


@router.delete("/{brief_id}")
async def delete_brief(
    brief_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ContentBriefService(db).delete_brief(brief_id, current_user.id)
    return SuccessResponse(data={"message": "Brief deleted"})


@router.get("/upcoming/list", response_model=SuccessResponse[List[ContentBriefResponse]])
async def get_upcoming(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(data=await ContentBriefService(db).get_upcoming(current_user.id))


@router.get("/stats/{org_id}", response_model=SuccessResponse[dict])
async def get_stats(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(data=await ContentBriefService(db).get_stats(org_id, current_user.id))
