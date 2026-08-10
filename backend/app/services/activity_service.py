from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog
from app.models.user import User
from app.schemas.activity import ActivityResponse


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        organization_id: UUID,
        user_id: UUID,
        action: str,
        entity_type: str,
        entity_id: UUID,
        entity_name: str,
        details: str | None = None,
    ) -> None:
        entry = ActivityLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            details=details,
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)

    async def list_activities(self, org_id: UUID, limit: int = 20) -> List[ActivityResponse]:
        result = await self.db.execute(
            select(ActivityLog, User)
            .join(User, User.id == ActivityLog.user_id)
            .where(ActivityLog.organization_id == org_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
        )
        return [
            ActivityResponse(
                id=str(entry.id),
                user_name=user.name,
                user_email=user.email,
                action=entry.action,
                entity_type=entry.entity_type,
                entity_id=str(entry.entity_id),
                entity_name=entry.entity_name,
                details=entry.details,
                created_at=str(entry.created_at) if entry.created_at else None,
            )
            for entry, user in result.all()
        ]
