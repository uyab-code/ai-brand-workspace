import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ContentBrief(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "content_briefs"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(
        Enum("feed", "story", "carousel", name="content_type_brief"),
        nullable=False,
        default="feed",
    )
    platform: Mapped[str] = mapped_column(
        Enum("instagram", "tiktok", "facebook", "twitter", "linkedin", name="platform_type"),
        nullable=False,
        default="instagram",
    )
    deadline_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(
            "draft", "in_progress", "generated", "in_review", "approved", "published",
            name="brief_status",
        ),
        nullable=False,
        default="draft",
    )

    slides: Mapped[list["BriefSlide"]] = relationship(
        "BriefSlide",
        cascade="all, delete-orphan",
        order_by="BriefSlide.slide_number",
    )


class BriefSlide(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "brief_slides"

    brief_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_briefs.id", ondelete="CASCADE"),
        nullable=False,
    )
    slide_title: Mapped[str] = mapped_column(String(255), nullable=False)
    brief_text: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    slide_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
