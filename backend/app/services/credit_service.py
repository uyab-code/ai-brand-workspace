from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ValidationException
from app.models.credit import Credit


class CreditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_credits(self, org_id: UUID) -> Credit:
        """Get or create credit record for an organization."""
        result = await self.db.execute(
            select(Credit).where(Credit.organization_id == org_id)
        )
        credit = result.scalar_one_or_none()
        if not credit:
            credit = Credit(organization_id=org_id, balance=200, used=0, plan="freelancer")
            self.db.add(credit)
            await self.db.commit()
            await self.db.refresh(credit)
        return credit

    async def get_credits(self, org_id: UUID) -> Credit:
        credit = await self.ensure_credits(org_id)
        return credit

    async def deduct_credits(self, org_id: UUID, amount: int = 1) -> Credit:
        credit = await self.ensure_credits(org_id)
        if credit.balance < amount:
            raise ValidationException(
                f"Insufficient credits. Balance: {credit.balance}, required: {amount}"
            )
        credit.balance -= amount
        credit.used += amount
        await self.db.commit()
        await self.db.refresh(credit)
        return credit

    async def add_credits(self, org_id: UUID, amount: int) -> Credit:
        credit = await self.ensure_credits(org_id)
        credit.balance += amount
        await self.db.commit()
        await self.db.refresh(credit)
        return credit
