import uuid

from sqlalchemy import Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Credit(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "credits"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=200)
    used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    plan: Mapped[str] = mapped_column(
        Enum("freelancer", "starter", "pro", name="credit_plan"),
        nullable=False,
        default="freelancer",
    )
