import uuid
from typing import Optional

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )

    # Relationships
    team_members: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="organization", cascade="all, delete-orphan"
    )


class TeamMember(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "team_members"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        Enum("admin", "designer", name="member_role"),
        nullable=False,
        default="designer",
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="team_members"
    )
    user: Mapped["User"] = relationship("User", back_populates="team_memberships")
