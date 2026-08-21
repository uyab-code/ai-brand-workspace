"""add brief_assignments and notifications tables

Revision ID: f8a9b0c1d2e3
Revises: a1b2c3d4e5f6
Create Date: 2026-08-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8a9b0c1d2e3'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('brief_assignments',
    sa.Column('brief_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['brief_id'], ['content_briefs.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('brief_id', 'user_id', name='uq_brief_assignments_brief_user')
    )
    op.create_index('ix_brief_assignments_brief_id', 'brief_assignments', ['brief_id'], unique=False)
    op.create_index('ix_brief_assignments_user_id', 'brief_assignments', ['user_id'], unique=False)

    op.create_table('notifications',
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('recipient_user_id', sa.UUID(), nullable=False),
    sa.Column('type', sa.String(length=32), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('entity_type', sa.String(length=32), nullable=True),
    sa.Column('entity_id', sa.UUID(), nullable=True),
    sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['recipient_user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_recipient_read', 'notifications', ['recipient_user_id', 'is_read'], unique=False)
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_notifications_created_at', table_name='notifications')
    op.drop_index('ix_notifications_recipient_read', table_name='notifications')
    op.drop_table('notifications')
    op.drop_index('ix_brief_assignments_user_id', table_name='brief_assignments')
    op.drop_index('ix_brief_assignments_brief_id', table_name='brief_assignments')
    op.drop_table('brief_assignments')
