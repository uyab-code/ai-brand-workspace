"""add superadmin role

Revision ID: da94f55edcd4
Revises: 0e14fca84567
Create Date: 2026-07-23 15:31:04.926398

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'da94f55edcd4'
down_revision: Union[str, None] = '0e14fca84567'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('false'))
    )


def downgrade() -> None:
    op.drop_column('users', 'is_superuser')
