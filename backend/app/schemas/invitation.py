from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="designer", pattern="^(admin|designer)$")


class SetPasswordRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)


class InvitationResponse(BaseModel):
    id: str
    email: str
    organization_id: str
    role: str
    status: str
    expires_at: datetime

    model_config = {"from_attributes": True}


class InvitationDetailResponse(BaseModel):
    id: str
    email: str
    organization_name: str
    role: str
    status: str
    expires_at: datetime

    model_config = {"from_attributes": True}
