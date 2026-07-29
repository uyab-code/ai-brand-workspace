import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class GeneratedDesign(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "generated_designs"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_brief_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_briefs.id", ondelete="SET NULL"),
        nullable=True,
    )
    slide_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brief_slides.id", ondelete="SET NULL"),
        nullable=True,
    )
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    prompt_used: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(
        Enum("feed", "story", "carousel", name="design_content_type"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    credits_used: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
