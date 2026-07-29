from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.credit import CreditResponse
from app.schemas.common import SuccessResponse
from app.services.credit_service import CreditService

router = APIRouter()


@router.get("/{org_id}", response_model=SuccessResponse[CreditResponse])
async def get_credits(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    credit = await CreditService(db).get_credits(org_id)
    return SuccessResponse(data=CreditResponse(
        id=str(credit.id),
        organization_id=str(credit.organization_id),
        balance=credit.balance,
        used=credit.used,
        plan=credit.plan,
    ))
