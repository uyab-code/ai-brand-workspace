from typing import List
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_for_user(self, user_id: UUID, limit: int = 20) -> tuple[List[Notification], int]:
        """(latest notifications, unread count) for a user."""
        result = await self.db.execute(
            select(Notification)
            .where(Notification.recipient_user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        items = result.scalars().all()

        count_result = await self.db.execute(
            select(Notification.id).where(
                Notification.recipient_user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        unread_count = len(count_result.all())
        return items, unread_count

    async def mark_all_read(self, user_id: UUID) -> int:
        """Mark every notification of the user as read. Returns rows updated."""
        result = await self.db.execute(
            update(Notification)
            .where(Notification.recipient_user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True)
        )
        await self.db.commit()
        return result.rowcount

    async def mark_read(self, notification_id: UUID, user_id: UUID) -> Notification:
        """Mark one notification as read; 404 if it is not the user's."""
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        n = result.scalar_one_or_none()
        if not n or n.recipient_user_id != user_id:
            raise NotFoundException("Notification", str(notification_id))
        n.is_read = True
        await self.db.commit()
        await self.db.refresh(n)
        return n
