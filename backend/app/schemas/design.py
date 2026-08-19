from typing import List, Optional
from pydantic import BaseModel, Field


class GenerateDesignRequest(BaseModel):
    client_id: str
    content_type: str = Field(..., pattern="^(feed|story|carousel)$")
    prompt: str = Field(..., min_length=1)
    content_brief_id: Optional[str] = None
    slide_id: Optional[str] = None
    logo_position: str = Field(default="none", pattern="^(none|top_left|top_right)$")


class CarouselSlideRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    content_type: str = Field(default="carousel", pattern="^(feed|story|carousel)$")
    name: Optional[str] = None


class GenerateCarouselRequest(BaseModel):
    client_id: str
    slides: List[CarouselSlideRequest] = Field(..., min_length=1, max_length=10)
    content_brief_id: Optional[str] = None
    logo_position: str = Field(default="none", pattern="^(none|top_left|top_right)$")


class GeneratedDesignResponse(BaseModel):
    id: str
    client_id: str
    content_brief_id: Optional[str] = None
    slide_id: Optional[str] = None
    image_url: str
    prompt_used: str
    content_type: str
    version: int
    credits_used: int
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}
