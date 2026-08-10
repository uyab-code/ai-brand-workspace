from typing import Optional

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: str
    user_name: str
    user_email: str
    action: str
    entity_type: str
    entity_id: str
    entity_name: str
    details: Optional[str] = None
    created_at: Optional[str] = None
