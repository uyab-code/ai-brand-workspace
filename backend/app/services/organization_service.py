from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, NotFoundException
from app.core.permissions import Role
from app.models.organization import Organization, TeamMember
from app.models.user import User
from app.schemas.organization import (
    CreateOrganizationRequest,
    OrganizationResponse,
    TeamMemberResponse,
    UpdateOrganizationRequest,
)


class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_organization(
        self, data: CreateOrganizationRequest, owner_id: UUID
    ) -> OrganizationResponse:
        # Create organization
        org = Organization(name=data.name, owner_id=owner_id)
        self.db.add(org)
        await self.db.flush()

        # Add owner as team member
        team_member = TeamMember(
            organization_id=org.id,
            user_id=owner_id,
            role=Role.OWNER.value,
        )
        self.db.add(team_member)
        await self.db.commit()
        await self.db.refresh(org)

        return OrganizationResponse(
            id=str(org.id),
            name=org.name,
            owner_id=str(org.owner_id),
        )

    async def get_organization(
        self, org_id: UUID, user_id: UUID
    ) -> OrganizationResponse:
        # Check membership
        await self._check_membership(org_id, user_id)

        org = await self._get_org_by_id(org_id)
        if not org:
            raise NotFoundException("Organization", str(org_id))

        return OrganizationResponse(
            id=str(org.id),
            name=org.name,
            owner_id=str(org.owner_id),
        )

    async def get_user_organizations(self, user_id: UUID) -> List[OrganizationResponse]:
        result = await self.db.execute(
            select(Organization)
            .join(TeamMember)
            .where(TeamMember.user_id == user_id)
        )
        orgs = result.scalars().all()

        return [
            OrganizationResponse(
                id=str(org.id),
                name=org.name,
                owner_id=str(org.owner_id),
            )
            for org in orgs
        ]

    async def update_organization(
        self, org_id: UUID, data: UpdateOrganizationRequest, user_id: UUID
    ) -> OrganizationResponse:
        # Check permission
        await self._check_permission(org_id, user_id, "update_organization")

        org = await self._get_org_by_id(org_id)
        if not org:
            raise NotFoundException("Organization", str(org_id))

        if data.name is not None:
            org.name = data.name

        await self.db.commit()
        await self.db.refresh(org)

        return OrganizationResponse(
            id=str(org.id),
            name=org.name,
            owner_id=str(org.owner_id),
        )

    async def add_member(
        self, org_id: UUID, email: str, role: str, invited_by: UUID
    ) -> TeamMemberResponse:
        # Check permission
        await self._check_permission(org_id, invited_by, "invite_member")

        # Find user by email
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundException("User with email", email)

        # Check if already member
        existing = await self.db.execute(
            select(TeamMember).where(
                TeamMember.organization_id == org_id,
                TeamMember.user_id == user.id,
            )
        )
        if existing.scalar_one_or_none():
            raise ForbiddenException("User is already a member")

        # Add member
        member = TeamMember(
            organization_id=org_id,
            user_id=user.id,
            role=role,
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)

        return TeamMemberResponse(
            id=str(member.id),
            user_id=str(member.user_id),
            role=member.role,
            user_email=user.email,
            user_name=user.name,
        )

    async def get_members(
        self, org_id: UUID, user_id: UUID
    ) -> List[TeamMemberResponse]:
        # Check membership
        await self._check_membership(org_id, user_id)

        result = await self.db.execute(
            select(TeamMember, User)
            .join(User, TeamMember.user_id == User.id)
            .where(TeamMember.organization_id == org_id)
        )
        rows = result.all()

        return [
            TeamMemberResponse(
                id=str(member.id),
                user_id=str(member.user_id),
                role=member.role,
                user_email=user.email,
                user_name=user.name,
            )
            for member, user in rows
        ]

    async def update_member_role(
        self, org_id: UUID, member_id: UUID, role: str, updated_by: UUID
    ) -> TeamMemberResponse:
        # Check permission
        await self._check_permission(org_id, updated_by, "update_member_role")

        result = await self.db.execute(
            select(TeamMember).where(
                TeamMember.organization_id == org_id,
                TeamMember.id == member_id,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise NotFoundException("Team member", str(member_id))

        member.role = role
        await self.db.commit()
        await self.db.refresh(member)

        return TeamMemberResponse(
            id=str(member.id),
            user_id=str(member.user_id),
            role=member.role,
        )

    async def _get_org_by_id(self, org_id: UUID) -> Optional[Organization]:
        result = await self.db.execute(
            select(Organization).where(Organization.id == org_id)
        )
        return result.scalar_one_or_none()

    async def _check_membership(self, org_id: UUID, user_id: UUID) -> TeamMember:
        result = await self.db.execute(
            select(TeamMember).where(
                TeamMember.organization_id == org_id,
                TeamMember.user_id == user_id,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise ForbiddenException("Not a member of this organization")
        return member

    async def _check_permission(self, org_id: UUID, user_id: UUID, permission: str):
        from app.core.permissions import has_permission, Role

        member = await self._check_membership(org_id, user_id)
        role = Role(member.role)
        if not has_permission(role, permission):
            raise ForbiddenException(f"Insufficient permissions: {permission}")
