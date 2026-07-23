from typing import Optional
from pydantic import BaseModel, Field


class CreateOrganizationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class UpdateOrganizationRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class InviteMemberRequest(BaseModel):
    email: str
    role: str = Field(default="designer", pattern="^(admin|designer)$")


class UpdateMemberRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|designer)$")


class OrganizationResponse(BaseModel):
    id: str
    name: str
    owner_id: str

    model_config = {"from_attributes": True}


class TeamMemberResponse(BaseModel):
    id: str
    user_id: str
    role: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    model_config = {"from_attributes": True}
