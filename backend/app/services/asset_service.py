from typing import List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.client import BrandAsset, Client
from app.schemas.asset import AssetResponse, BrandColorsRequest, BrandFontRequest, BrandStyleRequest
from app.services.client_service import ClientService


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

    async def update_brand_colors(self, client_id: UUID, data: BrandColorsRequest, user_id: UUID) -> AssetResponse:
        client = await self._get_client(client_id)
        await self.client_svc._check_permission(client.organization_id, user_id, "manage_assets")
        asset = await self._get_or_create_meta(client_id)
        asset.brand_colors = {"colors": data.colors}
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
