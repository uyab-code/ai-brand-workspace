from typing import Optional
from pydantic import BaseModel, Field


class BrandColorsRequest(BaseModel):
    colors: list[str] = Field(default_factory=list)


class BrandStyleRequest(BaseModel):
    style: str = Field(..., min_length=1)


class BrandFontRequest(BaseModel):
    font_name: str = Field(..., min_length=1, max_length=255)
    font_type: str = Field(default="primary", pattern="^(primary|secondary|accent)$")
    file_url: Optional[str] = None


class AssetResponse(BaseModel):
    id: str
    client_id: str
    asset_type: str
    file_url: Optional[str] = None
    font_name: Optional[str] = None
    font_type: Optional[str] = None
    brand_colors: Optional[dict] = None
    brand_style: Optional[str] = None

    model_config = {"from_attributes": True}
