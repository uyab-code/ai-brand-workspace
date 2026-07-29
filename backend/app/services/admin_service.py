from typing import List
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException
from app.core.permissions import Role, has_permission
from app.models.client import Client
from app.models.content_brief import ContentBrief
from app.models.credit import Credit
from app.models.design import GeneratedDesign
from app.models.organization import Organization, TeamMember
from app.models.user import User
from app.schemas.admin import AdminOverviewStats, OrgStatsResponse


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _check_superadmin(self, user_id: UUID):
        user = (await self.db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user or not user.is_superuser:
            raise ForbiddenException("Superadmin access required")

    async def get_overview_stats(self, user_id: UUID) -> AdminOverviewStats:
        await self._check_superadmin(user_id)

        users = (await self.db.execute(select(func.count(User.id)))).scalar() or 0
        orgs = (await self.db.execute(select(func.count(Organization.id)))).scalar() or 0
        clients = (await self.db.execute(select(func.count(Client.id)))).scalar() or 0
        briefs = (await self.db.execute(select(func.count(ContentBrief.id)))).scalar() or 0
        designs = (await self.db.execute(select(func.count(GeneratedDesign.id)))).scalar() or 0
        credits_used = (await self.db.execute(select(func.sum(Credit.used)))).scalar() or 0

        return AdminOverviewStats(
            total_users=users,
            total_organizations=orgs,
            total_clients=clients,
            total_briefs=briefs,
            total_designs=designs,
            total_credits_used=credits_used,
        )

    async def get_org_list(self, user_id: UUID) -> List[OrgStatsResponse]:
        await self._check_superadmin(user_id)

        # Get all orgs with owner in one query
        result = await self.db.execute(
            select(Organization, User.email.label("owner_email"))
            .join(User, Organization.owner_id == User.id, isouter=True)
        )
        org_rows = result.all()
        results = []

        for org, owner_email in org_rows:
            members = (await self.db.execute(
                select(func.count(TeamMember.id)).where(TeamMember.organization_id == org.id)
            )).scalar() or 0

            client_count = (await self.db.execute(
                select(func.count(Client.id)).where(Client.organization_id == org.id)
            )).scalar() or 0

            brief_count = (await self.db.execute(
                select(func.count(ContentBrief.id)).where(ContentBrief.organization_id == org.id)
            )).scalar() or 0

            credit = (await self.db.execute(
                select(Credit).where(Credit.organization_id == org.id)
            )).scalar_one_or_none()

            results.append(OrgStatsResponse(
                id=str(org.id),
                name=org.name,
                owner_email=owner_email or "unknown",
                member_count=members,
                client_count=client_count,
                brief_count=brief_count,
                design_count=0,
                credit_balance=credit.balance if credit else 0,
                credit_used=credit.used if credit else 0,
                created_at=str(org.created_at) if org.created_at else None,
            ))

        return results
