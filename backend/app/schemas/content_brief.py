from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


# --- Slide ---

class SlideRequest(BaseModel):
    slide_title: str = Field(..., min_length=1, max_length=255)
    brief_text: str = Field(..., min_length=1)
    notes: Optional[str] = None
    slide_number: Optional[int] = None


class UpdateSlideRequest(BaseModel):
    slide_title: Optional[str] = Field(None, min_length=1, max_length=255)
    brief_text: Optional[str] = Field(None, min_length=1)
    notes: Optional[str] = None


class BriefSlideResponse(BaseModel):
    id: str
    slide_title: str
    brief_text: str
    notes: Optional[str] = None
    slide_number: int

    model_config = {"from_attributes": True}


# --- Brief ---

class CreateBriefRequest(BaseModel):
    organization_id: str
    client_id: str
    name: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(default="feed", pattern="^(feed|story|carousel)$")
    platform: str = Field(default="instagram", pattern="^(instagram|tiktok|facebook|twitter|linkedin)$")
    deadline_date: Optional[date] = None
    slides: List[SlideRequest] = Field(..., min_length=1, max_length=10)


class UpdateBriefRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    content_type: Optional[str] = Field(None, pattern="^(feed|story|carousel)$")
    platform: Optional[str] = Field(None, pattern="^(instagram|tiktok|facebook|twitter|linkedin)$")
    deadline_date: Optional[date] = None


class UpdateStatusRequest(BaseModel):
    status: str = Field(
        ...,
        pattern="^(draft|in_progress|generated|in_review|approved|published)$",
    )


class ContentBriefResponse(BaseModel):
    id: str
    organization_id: str
    client_id: str
    name: str
    content_type: str
    platform: str
    deadline_date: Optional[date] = None
    status: str
    slides: List[BriefSlideResponse] = []
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}
