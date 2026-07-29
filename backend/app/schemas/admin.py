from pydantic import BaseModel
from typing import Optional


class AdminOverviewStats(BaseModel):
    total_users: int = 0
    total_organizations: int = 0
    total_clients: int = 0
    total_briefs: int = 0
    total_designs: int = 0
    total_credits_used: int = 0


class OrgStatsResponse(BaseModel):
    id: str
    name: str
    owner_email: str
    member_count: int = 0
    client_count: int = 0
    brief_count: int = 0
    design_count: int = 0
    credit_balance: int = 0
    credit_used: int = 0
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id: str
    user_name: str
    action: str
    entity_type: str
    details: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}
