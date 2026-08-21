from typing import Optional
from pydantic import BaseModel, Field


class CreateClientRequest(BaseModel):
    organization_id: str
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="active", pattern="^(active|inactive)$")


class UpdateClientRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")


class ClientResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    status: str
    logo_url: Optional[str] = None

    model_config = {"from_attributes": True}
