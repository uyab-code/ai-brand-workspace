import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Client(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "clients"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", name="client_status"),
        nullable=False,
        default="active",
    )


class BrandAsset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "brand_assets"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )
    asset_type: Mapped[str] = mapped_column(
        Enum("logo", "guideline", "reference", "font", name="asset_type"),
        nullable=False,
    )
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    font_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    font_type: Mapped[str | None] = mapped_column(
        Enum("primary", "secondary", "accent", name="font_type"),
        nullable=True,
    )
    brand_colors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    brand_style: Mapped[str | None] = mapped_column(Text, nullable=True)
