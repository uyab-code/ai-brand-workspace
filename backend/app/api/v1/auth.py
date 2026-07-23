from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.common import MessageResponse, SuccessResponse
from app.services.auth_service import AuthService

router = APIRouter()


# Public registration is disabled - invite only
# @router.post("/register", response_model=SuccessResponse[TokenResponse])
# async def register(
#     data: RegisterRequest,
#     db: AsyncSession = Depends(get_db),
# ):
#     auth_service = AuthService(db)
#     tokens = await auth_service.register(data)
#     return SuccessResponse(data=tokens)


@router.post("/login", response_model=SuccessResponse[TokenResponse])
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    tokens = await auth_service.login(data)
    return SuccessResponse(data=tokens)


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    tokens = await auth_service.refresh_token(data.refresh_token)
    return SuccessResponse(data=tokens)


@router.get("/me", response_model=SuccessResponse[UserResponse])
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    user_data = UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        is_superuser=current_user.is_superuser,
    )
    return SuccessResponse(data=user_data)


@router.post("/forgot-password", response_model=SuccessResponse[MessageResponse])
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    # TODO: Implement email sending logic
    return SuccessResponse(data=MessageResponse(message="Password reset email sent"))


@router.post("/reset-password", response_model=SuccessResponse[MessageResponse])
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    # TODO: Implement password reset logic
    return SuccessResponse(data=MessageResponse(message="Password reset successful"))
