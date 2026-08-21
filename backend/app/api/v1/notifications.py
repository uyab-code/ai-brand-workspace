from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.services.notification_service import NotificationService

router = APIRouter()


class NotificationItem(BaseModel):
    id: str
    type: str
    title: str
    message: str
    entity_type: str | None = None
    entity_id: str | None = None
    is_read: bool
    created_at: str | None = None


class NotificationListResponse(BaseModel):
    items: List[NotificationItem]
    unread_count: int


def _to_item(n: Notification) -> NotificationItem:
    return NotificationItem(
        id=str(n.id),
        type=n.type,
        title=n.title,
        message=n.message,
        entity_type=n.entity_type,
        entity_id=str(n.entity_id) if n.entity_id else None,
        is_read=n.is_read,
        created_at=str(n.created_at) if n.created_at else None,
    )


@router.get("", response_model=SuccessResponse[NotificationListResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, unread_count = await NotificationService(db).list_for_user(current_user.id)
    return SuccessResponse(data=NotificationListResponse(
        items=[_to_item(n) for n in items],
        unread_count=unread_count,
    ))


@router.patch("/read-all", response_model=SuccessResponse[dict])
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = await NotificationService(db).mark_all_read(current_user.id)
    return SuccessResponse(data={"updated": updated})


@router.patch("/{notification_id}/read", response_model=SuccessResponse[NotificationItem])
async def mark_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = await NotificationService(db).mark_read(notification_id, current_user.id)
    return SuccessResponse(data=_to_item(n))
