import os
from typing import List
from uuid import UUID
from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.core.exceptions import NotFoundException
from app.models.client import BrandAsset, Client
from app.schemas.asset import AssetResponse, BrandColorsRequest, BrandFontRequest, BrandStyleRequest
from app.services.client_service import ClientService

settings = get_settings()


class AssetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client_svc = ClientService(db)

    async def get_client_assets(self, client_id: UUID, user_id: UUID) -> List[AssetResponse]:
        client = await self._get_client(client_id)
        await self.client_svc._check_membership(client.organization_id, user_id)
        r = await self.db.execute(select(BrandAsset).where(BrandAsset.client_id == client_id))
        return [self._resp(a) for a in r.scalars().all()]

    async def add_file_asset(self, client_id: UUID, asset_type: str, file_url: str, user_id: UUID) -> AssetResponse:
        client = await self._get_client(client_id)
        await self.client_svc._check_permission(client.organization_id, user_id, "manage_assets")
        if asset_type in ["logo", "guideline"]:
            existing = (await self.db.execute(select(BrandAsset).where(BrandAsset.client_id == client_id, BrandAsset.asset_type == asset_type))).scalar_one_or_none()
            if existing:
                existing.file_url = file_url
                await self.db.commit(); await self.db.refresh(existing)
                return self._resp(existing)
        asset = BrandAsset(client_id=client_id, asset_type=asset_type, file_url=file_url)
        self.db.add(asset)
        await self.db.commit(); await self.db.refresh(asset)
        return self._resp(asset)

    async def upload_logo(self, client_id: UUID, file: UploadFile, user_id: UUID) -> AssetResponse:
        """Simpan file logo client ke disk lokal dan simpan URL-nya."""
        client = await self._get_client(client_id)
        await self.client_svc._check_permission(client.organization_id, user_id, "manage_assets")

        # Validasi tipe & ukuran
        if not (file.content_type or "").startswith("image/"):
            raise HTTPException(status_code=400, detail="File harus berupa gambar (image/*)")
        data = await file.read()
        max_bytes = settings.UPLOAD_MAX_SIZE_MB * 1024 * 1024
        if len(data) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File terlalu besar — maksimal {settings.UPLOAD_MAX_SIZE_MB}MB",
            )
        if not data:
            raise HTTPException(status_code=400, detail="File kosong")

        # Tulis ke disk: uploads/{client_id}/logo.png
        rel = os.path.join(str(client_id), "logo.png")
        dest = os.path.join(settings.UPLOAD_DIR, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)

        file_url = f"/uploads/{client_id}/logo.png"
        return await self.add_file_asset(client_id, "logo", file_url, user_id)

    async def update_brand_colors(self, client_id: UUID, data: BrandColorsRequest, user_id: UUID) -> AssetResponse:
        client = await self._get_client(client_id)
        await self.client_svc._check_permission(client.organization_id, user_id, "manage_assets")
        asset = await self._get_or_create_meta(client_id)
        asset.brand_colors = {"colors": [{"role": c.role, "hex": c.hex} for c in data.colors]}
        await self.db.commit(); await self.db.refresh(asset)
        return self._resp(asset)

    async def update_brand_style(self, client_id: UUID, data: BrandStyleRequest, user_id: UUID) -> AssetResponse:
        client = await self._get_client(client_id)
        await self.client_svc._check_permission(client.organization_id, user_id, "manage_assets")
        asset = await self._get_or_create_meta(client_id)
        asset.brand_style = data.style
        await self.db.commit(); await self.db.refresh(asset)
        return self._resp(asset)

    async def add_font(self, client_id: UUID, data: BrandFontRequest, user_id: UUID) -> AssetResponse:
        client = await self._get_client(client_id)
        await self.client_svc._check_permission(client.organization_id, user_id, "manage_assets")
        asset = BrandAsset(client_id=client_id, asset_type="font", file_url=data.file_url, font_name=data.font_name, font_type=data.font_type)
        self.db.add(asset)
        await self.db.commit(); await self.db.refresh(asset)
        return self._resp(asset)

    async def remove_font(self, client_id: UUID, font_id: UUID, user_id: UUID):
        client = await self._get_client(client_id)
        await self.client_svc._check_permission(client.organization_id, user_id, "manage_assets")
        r = await self.db.execute(select(BrandAsset).where(BrandAsset.id == font_id, BrandAsset.client_id == client_id, BrandAsset.asset_type == "font"))
        a = r.scalar_one_or_none()
        if not a: raise NotFoundException("Font", str(font_id))
        await self.db.delete(a); await self.db.commit()

    async def remove_asset(self, client_id: UUID, asset_id: UUID, user_id: UUID):
        client = await self._get_client(client_id)
        await self.client_svc._check_permission(client.organization_id, user_id, "manage_assets")
        r = await self.db.execute(select(BrandAsset).where(BrandAsset.id == asset_id, BrandAsset.client_id == client_id))
        a = r.scalar_one_or_none()
        if not a: raise NotFoundException("Asset", str(asset_id))
        await self.db.delete(a); await self.db.commit()

    async def _get_client(self, cid: UUID) -> Client:
        r = await self.db.execute(select(Client).where(Client.id == cid))
        c = r.scalar_one_or_none()
        if not c: raise NotFoundException("Client", str(cid))
        return c

    async def _get_or_create_meta(self, cid: UUID) -> BrandAsset:
        r = await self.db.execute(select(BrandAsset).where(BrandAsset.client_id == cid, BrandAsset.asset_type == "reference", BrandAsset.file_url.is_(None)))
        a = r.scalar_one_or_none()
        if a: return a
        a = BrandAsset(client_id=cid, asset_type="reference")
        self.db.add(a); await self.db.flush()
        return a

    def _resp(self, a: BrandAsset) -> AssetResponse:
        return AssetResponse(id=str(a.id), client_id=str(a.client_id), asset_type=a.asset_type, file_url=a.file_url, font_name=a.font_name, font_type=a.font_type, brand_colors=a.brand_colors, brand_style=a.brand_style)
