"""fix audit log created at default

Revision ID: 1605f17f3a9c
Revises: 05692280cb0b
Create Date: 2026-09-11
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1605f17f3a9c"
down_revision: Union[str, Sequence[str], None] = "05692280cb0b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "audit_logs",
        "created_at",
        existing_type=sa.DateTime(),
        existing_nullable=False,
        server_default=sa.text("CURRENT_TIMESTAMP"),
    )


def downgrade() -> None:
    op.alter_column(
        "audit_logs",
        "created_at",
        existing_type=sa.DateTime(),
        existing_nullable=False,
        server_default=None,
    )