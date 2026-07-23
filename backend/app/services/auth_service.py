from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> TokenResponse:
        # Check if email exists
        existing_user = await self.get_user_by_email(data.email)
        if existing_user:
            raise ConflictException("Email already registered")

        # Create user
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            name=data.name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Generate tokens
        return self._create_tokens(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.get_user_by_email(data.email)
        if not user:
            raise UnauthorizedException("Invalid email or password")

        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        return self._create_tokens(user)

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        payload = decode_refresh_token(refresh_token)
        if not payload:
            raise UnauthorizedException("Invalid or expired refresh token")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload")

        user = await self.get_user_by_id(UUID(user_id))
        if not user:
            raise UnauthorizedException("User not found")

        return self._create_tokens(user)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    def _create_tokens(self, user: User) -> TokenResponse:
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )
