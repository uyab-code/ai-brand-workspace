from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.design import (
    GenerateCarouselRequest,
    GenerateDesignRequest,
    GeneratedDesignResponse,
)
from app.schemas.common import SuccessResponse
from app.services.design_service import DesignService

router = APIRouter()


@router.get("/slide/{slide_id}", response_model=SuccessResponse[List[GeneratedDesignResponse]])
async def list_designs_by_slide(
    slide_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        data=await DesignService(db).list_by_slide(slide_id, current_user.id)
    )


@router.post("/generate", response_model=SuccessResponse[GeneratedDesignResponse])
async def generate_design(
    data: GenerateDesignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        data=await DesignService(db).generate_single(data, current_user.id)
    )


@router.post("/generate/carousel", response_model=SuccessResponse[List[GeneratedDesignResponse]])
async def generate_carousel(
    data: GenerateCarouselRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        data=await DesignService(db).generate_carousel(data, current_user.id)
    )


@router.get("/client/{client_id}", response_model=SuccessResponse[List[GeneratedDesignResponse]])
async def list_designs(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        data=await DesignService(db).list_by_client(client_id, current_user.id)
    )


@router.get("/detail/{design_id}", response_model=SuccessResponse[GeneratedDesignResponse])
async def get_design(
    design_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return SuccessResponse(
        data=await DesignService(db).get_design(design_id, current_user.id)
    )


@router.delete("/{design_id}")
async def delete_design(
    design_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await DesignService(db).delete_design(design_id, current_user.id)
    return SuccessResponse(data={"message": "Design deleted"})
