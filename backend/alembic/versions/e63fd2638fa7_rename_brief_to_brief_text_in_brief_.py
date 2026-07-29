"""rename brief to brief_text in brief_slides

Revision ID: e63fd2638fa7
Revises: 525cbfd0619e
Create Date: 2026-07-24 21:12:57.180980

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e63fd2638fa7'
down_revision: Union[str, None] = '525cbfd0619e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename brief column to brief_text
    op.alter_column('brief_slides', 'brief', new_column_name='brief_text')


def downgrade() -> None:
    op.alter_column('brief_slides', 'brief_text', new_column_name='brief')
