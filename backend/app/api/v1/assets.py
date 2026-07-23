from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.asset import AssetResponse, BrandColorsRequest, BrandFontRequest, BrandStyleRequest
from app.schemas.common import SuccessResponse
from app.services.asset_service import AssetService

router = APIRouter()

@router.get("/{client_id}", response_model=SuccessResponse[List[AssetResponse]])
async def get_assets(client_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await AssetService(db).get_client_assets(client_id, current_user.id))

@router.post("/{client_id}/logo", response_model=SuccessResponse[AssetResponse])
async def upload_logo(client_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await AssetService(db).add_file_asset(client_id, "logo", f"/uploads/{client_id}/logo.png", current_user.id))

@router.post("/{client_id}/guideline", response_model=SuccessResponse[AssetResponse])
async def upload_guideline(client_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await AssetService(db).add_file_asset(client_id, "guideline", f"/uploads/{client_id}/guideline.pdf", current_user.id))

@router.post("/{client_id}/references", response_model=SuccessResponse[AssetResponse])
async def upload_reference(client_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await AssetService(db).add_file_asset(client_id, "reference", f"/uploads/{client_id}/reference.png", current_user.id))

@router.post("/{client_id}/fonts", response_model=SuccessResponse[AssetResponse])
async def add_font(client_id: UUID, data: BrandFontRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await AssetService(db).add_font(client_id, data, current_user.id))

@router.delete("/{client_id}/fonts/{font_id}")
async def remove_font(client_id: UUID, font_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await AssetService(db).remove_font(client_id, font_id, current_user.id)
    return SuccessResponse(data={"message": "Font removed"})

@router.put("/{client_id}/colors", response_model=SuccessResponse[AssetResponse])
async def update_colors(client_id: UUID, data: BrandColorsRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await AssetService(db).update_brand_colors(client_id, data, current_user.id))

@router.put("/{client_id}/style", response_model=SuccessResponse[AssetResponse])
async def update_style(client_id: UUID, data: BrandStyleRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await AssetService(db).update_brand_style(client_id, data, current_user.id))
