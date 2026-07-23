from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.invitation import (
    InvitationDetailResponse,
    InviteMemberRequest,
    SetPasswordRequest,
)
from app.services.invitation_service import InvitationService

router = APIRouter()


@router.post("/{org_id}/invite")
async def invite_member(
    org_id: UUID,
    data: InviteMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invitation_service = InvitationService(db)
    result = await invitation_service.create_invitation(
        organization_id=org_id,
        email=data.email,
        role=data.role,
        invited_by=current_user.id,
    )
    return SuccessResponse(data=result)


@router.get("/{token}", response_model=SuccessResponse[InvitationDetailResponse])
async def get_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    invitation_service = InvitationService(db)
    invitation = await invitation_service.get_invitation_by_token(token)
    return SuccessResponse(data=invitation)


@router.post("/{token}/password")
async def set_password(
    token: str,
    data: SetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    invitation_service = InvitationService(db)
    user = await invitation_service.set_password(token, data.password)
    return SuccessResponse(data={"message": "Password set successfully", "email": user.email})
