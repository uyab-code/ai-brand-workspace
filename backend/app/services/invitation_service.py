import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, ValidationException
from app.core.security import hash_password
from app.models.invitation import Invitation
from app.models.organization import Organization, TeamMember
from app.models.user import User
from app.schemas.invitation import InvitationDetailResponse


class InvitationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_invitation(
        self,
        organization_id: UUID,
        email: str,
        role: str,
        invited_by: UUID,
    ) -> dict:
        # Check if user already exists
        existing_user = await self._get_user_by_email(email)
        if existing_user:
            # Check if already a member of this organization
            existing_member = await self._get_team_member(organization_id, existing_user.id)
            if existing_member:
                raise ConflictException("User is already a member of this organization")

        # Check if there's a pending invitation
        existing_invitation = await self._get_pending_invitation(organization_id, email)
        if existing_invitation:
            raise ConflictException("Invitation already sent to this email")

        # Generate token
        token = secrets.token_urlsafe(32)

        # Create invitation (expires in 7 days)
        invitation = Invitation(
            email=email,
            organization_id=organization_id,
            invited_by=invited_by,
            token=token,
            role=role,
            status="pending",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        self.db.add(invitation)
        await self.db.commit()
        await self.db.refresh(invitation)

        # TODO: Send email here
        # For now, return the token so it can be used for testing
        return {
            "id": str(invitation.id),
            "email": email,
            "token": token,
            "expires_at": invitation.expires_at,
        }

    async def get_invitation_by_token(self, token: str) -> Optional[InvitationDetailResponse]:
        result = await self.db.execute(
            select(Invitation, Organization)
            .join(Organization, Invitation.organization_id == Organization.id)
            .where(Invitation.token == token)
        )
        row = result.first()
        if not row:
            return None

        invitation, organization = row

        # Check if expired
        if invitation.expires_at < datetime.now(timezone.utc):
            invitation.status = "expired"
            await self.db.commit()
            return None

        # Check if already accepted
        if invitation.status == "accepted":
            return None

        return InvitationDetailResponse(
            id=str(invitation.id),
            email=invitation.email,
            organization_name=organization.name,
            role=invitation.role,
            status=invitation.status,
            expires_at=invitation.expires_at,
        )

    async def set_password(self, token: str, password: str) -> User:
        result = await self.db.execute(
            select(Invitation).where(Invitation.token == token)
        )
        invitation = result.scalar_one_or_none()

        if not invitation:
            raise NotFoundException("Invitation")

        # Check if expired
        if invitation.expires_at < datetime.now(timezone.utc):
            raise ValidationException("Invitation has expired")

        # Check if already accepted
        if invitation.status == "accepted":
            raise ValidationException("Invitation already accepted")

        # Check if user already exists
        existing_user = await self._get_user_by_email(invitation.email)
        if existing_user:
            raise ConflictException("User with this email already exists")

        # Create user
        user = User(
            email=invitation.email,
            password_hash=hash_password(password),
            name=invitation.email.split("@")[0],  # Default name from email
        )
        self.db.add(user)
        await self.db.flush()

        # Add to organization
        team_member = TeamMember(
            organization_id=invitation.organization_id,
            user_id=user.id,
            role=invitation.role,
        )
        self.db.add(team_member)

        # Update invitation status
        invitation.status = "accepted"

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def _get_team_member(
        self, organization_id: UUID, user_id: UUID
    ) -> Optional[TeamMember]:
        result = await self.db.execute(
            select(TeamMember).where(
                TeamMember.organization_id == organization_id,
                TeamMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def _get_pending_invitation(
        self, organization_id: UUID, email: str
    ) -> Optional[Invitation]:
        result = await self.db.execute(
            select(Invitation).where(
                Invitation.organization_id == organization_id,
                Invitation.email == email,
                Invitation.status == "pending",
            )
        )
        return result.scalar_one_or_none()
