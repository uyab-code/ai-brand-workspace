from pydantic import BaseModel


class CreditResponse(BaseModel):
    id: str
    organization_id: str
    balance: int
    used: int
    plan: str

    model_config = {"from_attributes": True}
