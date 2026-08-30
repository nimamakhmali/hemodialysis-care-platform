"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-01-01 00:00:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # ==========================================
    # ENUMS
    # ==========================================
    op.execute("""
        CREATE TYPE user_role_enum AS ENUM (
            'patient', 'clinician', 'admin'
        )
    """)

    op.execute("""
        CREATE TYPE gender_enum AS ENUM (
            'male', 'female'
        )
    """)

    op.execute("""
        CREATE TYPE vascular_access_type_enum AS ENUM (
            'fistula', 'graft', 'catheter'
        )
    """)

    op.execute("""
        CREATE TYPE alert_severity_enum AS ENUM (
            'low', 'medium', 'high'
        )
    """)

    op.execute("""
        CREATE TYPE alert_category_enum AS ENUM (
            'weight', 'blood_pressure', 'lab',
            'symptom', 'fluid', 'diet', 'combined'
        )
    """)

    op.execute("""
        CREATE TYPE alert_status_enum AS ENUM (
            'new', 'acknowledged', 'resolved'
        )
    """)

    op.execute("""
        CREATE TYPE recommendation_status_enum AS ENUM (
            'draft', 'approved', 'edited', 'rejected'
        )
    """)

    op.execute("""
        CREATE TYPE diet_adherence_enum AS ENUM (
            'good', 'moderate', 'poor'
        )
    """)

    # ==========================================
    # EXTENSIONS
    # ==========================================
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    # ==========================================
    # TABLE: users
    # ==========================================
    op.create_table(
        'users',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('phone_number', sa.String(15), nullable=False),
        sa.Column('full_name', sa.String(150), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column(
            'role',
            postgresql.ENUM(
                'patient', 'clinician', 'admin',
                name='user_role_enum',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_phone_number', 'users', ['phone_number'], unique=True)
    op.create_index('ix_users_role', 'users', ['role'])

    # ==========================================
    # TABLE: patients
    # ==========================================
    op.create_table(
        'patients',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column(
            'user_id',
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column('medical_record_number', sa.String(50), nullable=False),
        sa.Column('full_name', sa.String(150), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column(
            'gender',
            postgresql.ENUM(
                'male', 'female',
                name='gender_enum',
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column('phone_number', sa.String(15), nullable=True),
        sa.Column('emergency_contact', sa.String(150), nullable=True),
        sa.Column('dry_weight', sa.Float(), nullable=False),
        sa.Column('dry_weight_updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'dry_weight_updated_by',
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            'vascular_access_type',
            postgresql.ENUM(
                'fistula', 'graft', 'catheter',
                name='vascular_access_type_enum',
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            'dialysis_frequency_per_week',
            sa.Integer(),
            nullable=False,
            server_default='3',
        ),
        sa.Column('dialysis_start_date', sa.Date(), nullable=True),
        sa.Column('comorbidities', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('clinical_notes', sa.Text(), nullable=True),
        sa.Column(
            'assigned_clinician_id',
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ['user_id'], ['users.id'],
            ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(
            ['dry_weight_updated_by'], ['users.id'],
            ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(
            ['assigned_clinician_id'], ['users.id'],
            ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_patients_user_id', 'patients', ['user_id'], unique=True)
    op.create_index('ix_patients_medical_record_number', 'patients', ['medical_record_number'], unique=True)
    op.create_index('ix_patients_full_name', 'patients', ['full_name'])
    op.create_index('ix_patients_assigned_clinician_id', 'patients', ['assigned_clinician_id'])
    op.create_index('ix_patients_is_active', 'patients', ['is_active'])

    # GIN index برای جستجوی متنی روی نام
    op.execute("""
        CREATE INDEX ix_patients_full_name_gin
        ON patients USING gin(full_name gin_trgm_ops)
    """)

    # ==========================================
    # TABLE: lab_reference_ranges
    # ==========================================
    op.create_table(
        'lab_reference_ranges',
        sa.Column('test_code', sa.String(20), nullable=False),
        sa.Column('name_fa', sa.String(100), nullable=False),
        sa.Column('unit', sa.String(20), nullable=False),
        sa.Column('normal_low', sa.Float(), nullable=True),
        sa.Column('normal_high', sa.Float(), nullable=True),
        sa.Column('warning_low', sa.Float(), nullable=True),
        sa.Column('warning_high', sa.Float(), nullable=True),
        sa.Column('critical_low', sa.Float(), nullable=True),
        sa.Column('critical_high', sa.Float(), nullable=True),
        sa.Column('valid_min', sa.Float(), nullable=False),
        sa.Column('valid_max', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('test_code'),
    )

    # ==========================================
    # TABLE: dialysis_sessions
    # ==========================================
    op.create_table(
        'dialysis_sessions',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_date', sa.Date(), nullable=False),
        sa.Column('session_start_time', sa.Time(), nullable=True),
        sa.Column('session_end_time', sa.Time(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('pre_weight', sa.Float(), nullable=False),
        sa.Column('post_weight', sa.Float(), nullable=True),
        sa.Column('dry_weight_at_session', sa.Float(), nullable=False),
        sa.Column('weight_gain', sa.Float(), nullable=True),
        sa.Column('weight_gain_percent', sa.Float(), nullable=True),
        sa.Column('uf_volume', sa.Float(), nullable=True),
        sa.Column('bp_pre_systolic', sa.Integer(), nullable=True),
        sa.Column('bp_pre_diastolic', sa.Integer(), nullable=True),
        sa.Column('bp_during_systolic', sa.Integer(), nullable=True),
        sa.Column('bp_during_diastolic', sa.Integer(), nullable=True),
        sa.Column('bp_post_systolic', sa.Integer(), nullable=True),
        sa.Column('bp_post_diastolic', sa.Integer(), nullable=True),
        sa.Column('bp_drop_during', sa.Float(), nullable=True),
        sa.Column(
            'intradialytic_events',
            postgresql.ARRAY(sa.String()),
            nullable=True,
        ),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recorded_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id', 'session_date', name='uq_session_patient_date'),
        sa.CheckConstraint('pre_weight > 0', name='ck_session_pre_weight_positive'),
        sa.CheckConstraint(
            'post_weight IS NULL OR post_weight > 0',
            name='ck_session_post_weight_positive',
        ),
        sa.CheckConstraint(
            'post_weight IS NULL OR post_weight <= pre_weight',
            name='ck_session_post_lte_pre',
        ),
        sa.CheckConstraint(
            'duration_minutes IS NULL OR '
            '(duration_minutes >= 60 AND duration_minutes <= 480)',
            name='ck_session_duration_range',
        ),
        sa.CheckConstraint(
            'bp_pre_systolic IS NULL OR bp_pre_diastolic IS NULL OR '
            'bp_pre_systolic > bp_pre_diastolic',
            name='ck_bp_pre_systolic_gt_diastolic',
        ),
        sa.CheckConstraint(
            'bp_during_systolic IS NULL OR bp_during_diastolic IS NULL OR '
            'bp_during_systolic > bp_during_diastolic',
            name='ck_bp_during_systolic_gt_diastolic',
        ),
        sa.CheckConstraint(
            'bp_post_systolic IS NULL OR bp_post_diastolic IS NULL OR '
            'bp_post_systolic > bp_post_diastolic',
            name='ck_bp_post_systolic_gt_diastolic',
        ),
    )
    op.create_index('ix_session_patient_date', 'dialysis_sessions', ['patient_id', 'session_date'])
    op.create_index('ix_dialysis_sessions_patient_id', 'dialysis_sessions', ['patient_id'])
    op.create_index('ix_dialysis_sessions_session_date', 'dialysis_sessions', ['session_date'])

    # ==========================================
    # TABLE: lab_panels
    # ==========================================
    op.create_table(
        'lab_panels',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('collected_at', sa.Date(), nullable=False),
        sa.Column('reported_at', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recorded_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lab_panels_patient_date', 'lab_panels', ['patient_id', 'collected_at'])
    op.create_index('ix_lab_panels_patient_id', 'lab_panels', ['patient_id'])

    # ==========================================
    # TABLE: lab_results
    # ==========================================
    op.create_table(
        'lab_results',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('panel_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('test_code', sa.String(20), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(20), nullable=False),
        sa.Column('ref_range_low', sa.Float(), nullable=True),
        sa.Column('ref_range_high', sa.Float(), nullable=True),
        sa.Column('is_abnormal', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_critical', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('abnormality_direction', sa.String(10), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['panel_id'], ['lab_panels.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('panel_id', 'test_code', name='uq_lab_result_panel_test'),
        sa.CheckConstraint('value >= 0', name='ck_lab_result_value_non_negative'),
    )
    op.create_index(
        'ix_lab_result_patient_test_date',
        'lab_results',
        ['patient_id', 'test_code', 'created_at'],
    )
    op.create_index('ix_lab_results_panel_id', 'lab_results', ['panel_id'])
    op.create_index('ix_lab_results_test_code', 'lab_results', ['test_code'])

    # ==========================================
    # TABLE: symptom_reports
    # ==========================================
    op.create_table(
        'symptom_reports',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reported_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('symptoms', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('related_session_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('has_danger_symptoms', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['related_session_id'],
            ['dialysis_sessions.id'],
            ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_symptom_patient_time', 'symptom_reports', ['patient_id', 'reported_at'])
    op.create_index('ix_symptom_reports_patient_id', 'symptom_reports', ['patient_id'])

    # ==========================================
    # TABLE: fluid_logs
    # ==========================================
    op.create_table(
        'fluid_logs',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('log_date', sa.Date(), nullable=False),
        sa.Column('total_ml', sa.Integer(), nullable=False),
        sa.Column('items', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id', 'log_date', name='uq_fluid_log_patient_date'),
        sa.CheckConstraint(
            'total_ml >= 0 AND total_ml <= 10000',
            name='ck_fluid_total_ml_range',
        ),
    )
    op.create_index('ix_fluid_log_patient_date', 'fluid_logs', ['patient_id', 'log_date'])

    # ==========================================
    # TABLE: diet_logs
    # ==========================================
    op.create_table(
        'diet_logs',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('log_date', sa.Date(), nullable=False),
        sa.Column(
            'potassium_adherence',
            postgresql.ENUM(
                'good', 'moderate', 'poor',
                name='diet_adherence_enum',
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            'phosphorus_adherence',
            postgresql.ENUM(
                'good', 'moderate', 'poor',
                name='diet_adherence_enum',
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            'protein_adherence',
            postgresql.ENUM(
                'good', 'moderate', 'poor',
                name='diet_adherence_enum',
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            'sodium_adherence',
            postgresql.ENUM(
                'good', 'moderate', 'poor',
                name='diet_adherence_enum',
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column('phosphate_binder_taken', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('patient_id', 'log_date', name='uq_diet_log_patient_date'),
    )
    op.create_index('ix_diet_log_patient_date', 'diet_logs', ['patient_id', 'log_date'])

    # ==========================================
    # TABLE: alerts
    # ==========================================
    op.create_table(
        'alerts',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            'severity',
            postgresql.ENUM(
                'low', 'medium', 'high',
                name='alert_severity_enum',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            'category',
            postgresql.ENUM(
                'weight', 'blood_pressure', 'lab',
                'symptom', 'fluid', 'diet', 'combined',
                name='alert_category_enum',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('clinician_explanation', sa.Text(), nullable=False),
        sa.Column('evidence', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('triggered_by_rule', sa.String(100), nullable=False),
        sa.Column('source_session_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('source_panel_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('source_symptom_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            'status',
            postgresql.ENUM(
                'new', 'acknowledged', 'resolved',
                name='alert_status_enum',
                create_type=False,
            ),
            nullable=False,
            server_default='new',
        ),
        sa.Column('acknowledged_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['acknowledged_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(
            ['source_session_id'],
            ['dialysis_sessions.id'],
            ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(
            ['source_panel_id'],
            ['lab_panels.id'],
            ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(
            ['source_symptom_id'],
            ['symptom_reports.id'],
            ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_alert_patient_status', 'alerts', ['patient_id', 'status'])
    op.create_index('ix_alert_patient_severity', 'alerts', ['patient_id', 'severity'])
    op.create_index('ix_alert_created', 'alerts', ['created_at'])
    op.create_index('ix_alerts_patient_id', 'alerts', ['patient_id'])
    op.create_index('ix_alerts_status', 'alerts', ['status'])

    # ==========================================
    # TABLE: recommendations
    # ==========================================
    op.create_table(
        'recommendations',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alert_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('draft_for_clinician', sa.Text(), nullable=False),
        sa.Column('patient_content', sa.Text(), nullable=True),
        sa.Column('education_topic_code', sa.String(50), nullable=True),
        sa.Column('ai_reasoning', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column(
            'priority',
            postgresql.ENUM(
                'low', 'medium', 'high',
                name='alert_severity_enum',
                create_type=False,
            ),
            nullable=False,
            server_default='medium',
        ),
        sa.Column(
            'status',
            postgresql.ENUM(
                'draft', 'approved', 'edited', 'rejected',
                name='recommendation_status_enum',
                create_type=False,
            ),
            nullable=False,
            server_default='draft',
        ),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('alert_id', name='uq_recommendation_alert'),
    )
    op.create_index('ix_rec_patient_status', 'recommendations', ['patient_id', 'status'])
    op.create_index('ix_rec_created', 'recommendations', ['created_at'])

    # ==========================================
    # TABLE: patient_messages
    # ==========================================
    op.create_table(
        'patient_messages',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recommendation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(50), nullable=False, server_default='education'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sent_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['recommendation_id'],
            ['recommendations.id'],
            ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(['sent_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('recommendation_id', name='uq_message_recommendation'),
    )
    op.create_index('ix_message_patient_sent', 'patient_messages', ['patient_id', 'sent_at'])
    op.create_index('ix_message_read_at', 'patient_messages', ['patient_id', 'read_at'])

    # ==========================================
    # TABLE: education_contents
    # ==========================================
    op.create_table(
        'education_contents',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('topic_code', sa.String(50), nullable=False),
        sa.Column('title_fa', sa.String(255), nullable=False),
        sa.Column('content_fa', sa.Text(), nullable=False),
        sa.Column('summary_fa', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('category', sa.String(50), nullable=False, server_default='general'),
        sa.Column('trigger_conditions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('display_priority', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('topic_code', name='uq_education_topic_code'),
    )
    op.create_index('ix_education_is_active', 'education_contents', ['is_active'])
    op.create_index('ix_education_contents_topic_code', 'education_contents', ['topic_code'])

    # ==========================================
    # TABLE: audit_logs
    # ==========================================
    op.create_table(
        'audit_logs',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            server_default=sa.text('uuid_generate_v4()'),
            nullable=False,
        ),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(100), nullable=False),
        sa.Column('entity_id', sa.String(100), nullable=True),
        sa.Column('old_values', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'timestamp',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('ix_audit_logs_user_timestamp', 'audit_logs', ['user_id', 'timestamp'])
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])

    # ==========================================
    # TRIGGER: updated_at خودکار
    # ==========================================
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)

    tables_with_updated_at = [
        'users', 'patients', 'dialysis_sessions',
        'lab_panels', 'lab_results', 'symptom_reports',
        'fluid_logs', 'diet_logs', 'alerts',
        'recommendations', 'patient_messages', 'education_contents',
    ]

    for table in tables_with_updated_at:
        op.execute(f"""
            CREATE TRIGGER trigger_update_{table}_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """)


def downgrade() -> None:
    tables = [
        'audit_logs', 'patient_messages', 'recommendations',
        'alerts', 'diet_logs', 'fluid_logs', 'symptom_reports',
        'lab_results', 'lab_panels', 'dialysis_sessions',
        'lab_reference_ranges', 'patients', 'users',
        'education_contents',
    ]

    for table in tables:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")

    enums = [
        'user_role_enum', 'gender_enum', 'vascular_access_type_enum',
        'alert_severity_enum', 'alert_category_enum', 'alert_status_enum',
        'recommendation_status_enum', 'diet_adherence_enum',
    ]

    for enum in enums:
        op.execute(f"DROP TYPE IF EXISTS {enum}")

    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE")