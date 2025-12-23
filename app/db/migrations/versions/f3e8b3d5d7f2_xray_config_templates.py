"""Add xray config templates and node template relation

Revision ID: f3e8b3d5d7f2
Revises: 2b231de97dc3
Create Date: 2025-06-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f3e8b3d5d7f2'
down_revision = '2b231de97dc3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'xray_config_templates',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=256, collation='NOCASE'), nullable=False, unique=True),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )

    op.add_column('nodes', sa.Column('template_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_nodes_template_id_xray_config_templates',
        'nodes',
        'xray_config_templates',
        ['template_id'],
        ['id'],
        ondelete="SET NULL"
    )


def downgrade() -> None:
    op.drop_constraint('fk_nodes_template_id_xray_config_templates', 'nodes', type_='foreignkey')
    op.drop_column('nodes', 'template_id')
    op.drop_table('xray_config_templates')

