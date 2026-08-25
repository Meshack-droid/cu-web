-- ============================================================================
-- TECUMP — TUMCU Enterprise Christian Union Management Platform
-- Database Schema (MySQL 8+)
-- Covers SRS Part II, Chapters 1–9:
--   1. User Management   2. Authentication   3. Roles & Permissions
--   4. Membership         5. Executive Committee  6. Advisory Board
--   7. Committees         8. Ministries        9. Discipleship
--
-- Conventions:
--   - Primary keys are CHAR(36) UUIDs (app-generated) for portability & audit trails.
--   - snake_case naming, InnoDB engine, utf8mb4 charset.
--   - Soft-delete via `deleted_at` where records must be preserved (constitutional history).
--   - All FKs use ON DELETE RESTRICT by default to protect historical/audit data;
--     ON DELETE CASCADE is used only for genuinely dependent child rows.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- CHAPTER 1 — USER MANAGEMENT
-- ============================================================================

CREATE TABLE users (
    id                      CHAR(36)      NOT NULL PRIMARY KEY,
    username                VARCHAR(50)   NOT NULL UNIQUE,
    email                   VARCHAR(150)  NOT NULL UNIQUE,
    phone_number            VARCHAR(20)   NULL UNIQUE,
    password_hash           VARCHAR(255)  NOT NULL,

    -- Personal Information
    full_name               VARCHAR(150)  NOT NULL,
    gender                  ENUM('male','female') NULL,
    date_of_birth           DATE          NULL,
    national_id             VARCHAR(20)   NULL,
    passport_photo_url      VARCHAR(500)  NULL,

    -- University Information
    admission_number        VARCHAR(30)   NULL UNIQUE,
    registration_number     VARCHAR(30)   NULL,
    school                  VARCHAR(150)  NULL,
    faculty                 VARCHAR(150)  NULL,
    department              VARCHAR(150)  NULL,
    course                  VARCHAR(150)  NULL,
    programme                VARCHAR(100)  NULL,   -- e.g. Diploma, Degree, Certificate
    year_of_study           TINYINT       NULL,
    expected_graduation_year YEAR         NULL,
    campus_residence        VARCHAR(100)  NULL,
    is_non_resident          BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Spiritual Information
    date_of_salvation        DATE          NULL,
    baptism_status           ENUM('not_baptized','baptized') NULL,

    -- System Information
    account_status           ENUM('active','pending_approval','suspended','inactive',
                                    'graduated','alumni','archived','deceased')
                                    NOT NULL DEFAULT 'pending_approval',
    email_verified_at        DATETIME      NULL,
    two_factor_enabled       BOOLEAN       NOT NULL DEFAULT FALSE,
    two_factor_secret        VARCHAR(255)  NULL,
    last_login_at            DATETIME      NULL,
    last_password_change_at  DATETIME      NULL,

    created_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at                DATETIME      NULL,

    INDEX idx_users_status (account_status),
    INDEX idx_users_admission_number (admission_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A user may belong to a mentorship group / bible study group even before
-- discipleship-specific tables are joined; kept here as it's core profile data.
CREATE TABLE user_spiritual_groups (
    id                CHAR(36)  NOT NULL PRIMARY KEY,
    user_id           CHAR(36)  NOT NULL,
    mentorship_group_id CHAR(36) NULL,
    bible_study_group_id CHAR(36) NULL,
    created_at        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- FKs to mentorship_group_id / bible_study_group_id added after Ch.9 tables exist.

CREATE TABLE login_devices (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    device_name   VARCHAR(150) NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    ip_address    VARCHAR(45) NULL,
    user_agent    VARCHAR(255) NULL,
    trusted       BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_device (user_id, device_fingerprint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 2 — AUTHENTICATION
-- ============================================================================

CREATE TABLE refresh_tokens (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    token_hash    VARCHAR(255) NOT NULL,
    device_id     CHAR(36) NULL,
    expires_at    DATETIME NOT NULL,
    revoked_at    DATETIME NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rt_device FOREIGN KEY (device_id) REFERENCES login_devices(id) ON DELETE SET NULL,
    INDEX idx_rt_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE otp_codes (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    purpose       ENUM('email_verification','login_2fa','password_reset','phone_verification')
                        NOT NULL,
    code_hash     VARCHAR(255) NOT NULL,
    expires_at    DATETIME NOT NULL,
    consumed_at   DATETIME NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_otp_user_purpose (user_id, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE password_resets (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    token_hash    VARCHAR(255) NOT NULL,
    expires_at    DATETIME NOT NULL,
    used_at       DATETIME NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_sessions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    device_id     CHAR(36) NULL,
    ip_address    VARCHAR(45) NULL,
    started_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at      DATETIME NULL,
    CONSTRAINT fk_sess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sess_device FOREIGN KEY (device_id) REFERENCES login_devices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 3 — ROLES & PERMISSIONS (database-driven RBAC)
-- ============================================================================

CREATE TABLE roles (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    code          VARCHAR(50)  NOT NULL UNIQUE,   -- e.g. 'chairperson', 'secretary', 'super_admin'
    name          VARCHAR(100) NOT NULL,
    category      ENUM('constitutional_leadership','committee','ministry','advisory','system_admin','member')
                        NOT NULL,
    description   TEXT NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,  -- true for Super Admin / System Admin / IT Admin
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE permissions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    code          VARCHAR(100) NOT NULL UNIQUE,   -- e.g. 'reports.view_all', 'finance.approve_expense'
    module        VARCHAR(50)  NOT NULL,          -- e.g. 'finance', 'membership', 'audit'
    description   TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE role_permissions (
    role_id       CHAR(36)  NOT NULL,
    permission_id CHAR(36)  NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A user can hold multiple roles concurrently (e.g. Ministry Leader + Committee Member).
-- Time-bounded to naturally support leadership transition / handover history.
CREATE TABLE user_roles (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    role_id       CHAR(36)  NOT NULL,
    scope_type    ENUM('global','committee','ministry','executive') NOT NULL DEFAULT 'global',
    scope_id      CHAR(36)  NULL,      -- FK'd loosely; points to committee_id / ministry_id depending on scope_type
    start_date    DATE      NOT NULL,
    end_date      DATE      NULL,
    is_current    BOOLEAN   NOT NULL DEFAULT TRUE,
    assigned_by   CHAR(36)  NULL,
    created_at    DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ur_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ur_user (user_id),
    INDEX idx_ur_scope (scope_type, scope_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE audit_logs (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NULL,             -- nullable: system-triggered events
    action        VARCHAR(100) NOT NULL,      -- e.g. 'member.approve', 'expense.approve'
    entity_type   VARCHAR(100) NOT NULL,
    entity_id     CHAR(36)  NULL,
    old_values    JSON      NULL,
    new_values    JSON      NULL,
    ip_address    VARCHAR(45) NULL,
    created_at    DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Note: audit_logs is intentionally append-only at the application layer
-- (no UPDATE/DELETE permission granted to any role, including Chairperson).

-- ============================================================================
-- CHAPTER 4 — MEMBERSHIP MANAGEMENT
-- ============================================================================

CREATE TABLE membership_types (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    code          ENUM('full','special','associate') NOT NULL UNIQUE,
    name          VARCHAR(50) NOT NULL,
    description   TEXT NULL,
    rights_summary TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE spiritual_years (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    label         VARCHAR(20) NOT NULL UNIQUE,   -- e.g. '2025/2026'
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    is_current    BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE membership_declarations (
    id                CHAR(36)  NOT NULL PRIMARY KEY,
    declaration_text  TEXT      NOT NULL,   -- versioned wording, per constitution
    version           VARCHAR(20) NOT NULL,
    is_active         BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE memberships (
    id                    CHAR(36)  NOT NULL PRIMARY KEY,
    user_id               CHAR(36)  NOT NULL,
    membership_number     VARCHAR(30) NOT NULL UNIQUE,
    membership_type_id    CHAR(36)  NOT NULL,
    spiritual_year_id     CHAR(36)  NOT NULL,
    status                ENUM('pending','active','expired','suspended') NOT NULL DEFAULT 'pending',
    registration_date     DATE NOT NULL,
    renewal_date          DATE NULL,
    declaration_id        CHAR(36)  NOT NULL,
    declaration_signed_at DATETIME NOT NULL,
    declaration_signature_ip VARCHAR(45) NULL,
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mem_type FOREIGN KEY (membership_type_id) REFERENCES membership_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mem_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mem_declaration FOREIGN KEY (declaration_id) REFERENCES membership_declarations(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_user_year (user_id, spiritual_year_id),
    INDEX idx_mem_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Application/approval workflow: Application -> Review -> Approval -> Number Generated -> Welcome -> Register
CREATE TABLE membership_applications (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    membership_type_id CHAR(36) NOT NULL,
    status        ENUM('submitted','under_review','approved','rejected') NOT NULL DEFAULT 'submitted',
    reviewed_by   CHAR(36)  NULL,
    reviewed_at   DATETIME  NULL,
    rejection_reason TEXT   NULL,
    resulting_membership_id CHAR(36) NULL,
    created_at    DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_type FOREIGN KEY (membership_type_id) REFERENCES membership_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_app_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_app_membership FOREIGN KEY (resulting_membership_id) REFERENCES memberships(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 5 — EXECUTIVE COMMITTEE MANAGEMENT
-- ============================================================================

CREATE TABLE executive_positions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    code          VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'chairperson', 'treasurer'
    title         VARCHAR(100) NOT NULL,
    display_order TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Holds current + historical occupants of each executive office (handover trail).
CREATE TABLE executive_terms (
    id                CHAR(36)  NOT NULL PRIMARY KEY,
    executive_position_id CHAR(36) NOT NULL,
    user_id           CHAR(36)  NOT NULL,
    spiritual_year_id CHAR(36)  NOT NULL,
    start_date        DATE NOT NULL,
    end_date          DATE NULL,
    handover_notes    TEXT NULL,
    handover_document_url VARCHAR(500) NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_et_position FOREIGN KEY (executive_position_id) REFERENCES executive_positions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_et_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_et_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_position_year (executive_position_id, spiritual_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 6 — ADVISORY BOARD
-- ============================================================================

CREATE TABLE advisory_board_members (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NULL,          -- nullable: external professional advisers may not be app users
    external_name VARCHAR(150) NULL,
    external_contact VARCHAR(150) NULL,
    role          ENUM('patron','focus_representative','associate_representative','professional_adviser')
                        NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NULL,
    CONSTRAINT fk_abm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE advisory_recommendations (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    advisory_board_member_id CHAR(36) NOT NULL,
    subject       VARCHAR(200) NOT NULL,
    details       TEXT NOT NULL,
    status        ENUM('open','acknowledged','implemented','closed') NOT NULL DEFAULT 'open',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_arec_member FOREIGN KEY (advisory_board_member_id) REFERENCES advisory_board_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE constitution_reviews (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    reviewed_by   CHAR(36)  NOT NULL,
    review_date   DATE NOT NULL,
    notes         TEXT NULL,
    document_url  VARCHAR(500) NULL,
    CONSTRAINT fk_crev_user FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 7 — COMMITTEE MANAGEMENT (generic, reusable for all committees)
-- ============================================================================

CREATE TABLE committees (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    code          VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'prayer', 'welfare', 'assets'
    name          VARCHAR(150) NOT NULL,
    description   TEXT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE committee_members (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    committee_id  CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    position      ENUM('chairperson','secretary','treasurer','member') NOT NULL DEFAULT 'member',
    spiritual_year_id CHAR(36) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NULL,
    CONSTRAINT fk_cm_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_committee_user_year (committee_id, user_id, spiritual_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE committee_budgets (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    committee_id  CHAR(36)  NOT NULL,
    spiritual_year_id CHAR(36) NOT NULL,
    allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency      CHAR(3) NOT NULL DEFAULT 'KES',
    CONSTRAINT fk_cb_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
    CONSTRAINT fk_cb_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE committee_documents (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    committee_id  CHAR(36)  NOT NULL,
    title         VARCHAR(200) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    uploaded_by   CHAR(36)  NOT NULL,
    uploaded_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cd_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
    CONSTRAINT fk_cd_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 8 — MINISTRY MANAGEMENT (generic, reusable for all ministries)
-- ============================================================================

CREATE TABLE ministries (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    code          VARCHAR(50) NOT NULL UNIQUE,   -- e.g. 'intercessory', 'worship', 'media'
    name          VARCHAR(150) NOT NULL,
    description   TEXT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ministry_members (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    ministry_id   CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    position      ENUM('leader','deputy_leader','member') NOT NULL DEFAULT 'member',
    spiritual_year_id CHAR(36) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NULL,
    CONSTRAINT fk_mm_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE,
    CONSTRAINT fk_mm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mm_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_ministry_user_year (ministry_id, user_id, spiritual_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ministry_trainings (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    ministry_id   CHAR(36)  NOT NULL,
    title         VARCHAR(200) NOT NULL,
    training_date DATE NOT NULL,
    facilitator   VARCHAR(150) NULL,
    notes         TEXT NULL,
    CONSTRAINT fk_mt_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SHARED: MEETINGS, ATTENDANCE, EVENTS
-- (Used across Executive, Advisory, Committees, Ministries — Chapter 10 admin
--  module in the fuller spec, included here since 5–8 all reference meetings.)
-- ============================================================================

CREATE TABLE meetings (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    context_type  ENUM('executive','advisory_board','committee','ministry','general') NOT NULL,
    context_id    CHAR(36)  NULL,   -- committee_id / ministry_id depending on context_type
    scheduled_at  DATETIME  NOT NULL,
    location      VARCHAR(200) NULL,
    called_by     CHAR(36)  NOT NULL,
    status        ENUM('scheduled','held','cancelled') NOT NULL DEFAULT 'scheduled',
    created_at    DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_meet_caller FOREIGN KEY (called_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE meeting_minutes (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    meeting_id    CHAR(36)  NOT NULL UNIQUE,
    recorded_by   CHAR(36)  NOT NULL,
    content       TEXT      NOT NULL,
    ai_summary    TEXT      NULL,       -- AI-assisted summarization output (Ch.9 AI features, editable by Secretary)
    approved_at   DATETIME  NULL,
    approved_by   CHAR(36)  NULL,
    created_at    DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_min_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    CONSTRAINT fk_min_recorder FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_min_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE meeting_resolutions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    meeting_id    CHAR(36)  NOT NULL,
    description   TEXT      NOT NULL,
    status        ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
    responsible_user_id CHAR(36) NULL,
    due_date      DATE NULL,
    CONSTRAINT fk_res_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    CONSTRAINT fk_res_responsible FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Generic attendance table, reused for meetings, fellowships, events, ministry sessions.
CREATE TABLE attendance_records (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    attendable_type ENUM('meeting','event','ministry_session','committee_session') NOT NULL,
    attendable_id CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    status        ENUM('present','absent','excused','late') NOT NULL DEFAULT 'present',
    checked_in_at DATETIME NULL,
    CONSTRAINT fk_att_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_attendable_user (attendable_type, attendable_id, user_id),
    INDEX idx_att_attendable (attendable_type, attendable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE events (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    event_type    ENUM('weekly_fellowship','kesha','worship_night','conference','missions',
                         'camp','retreat','training','leadership_summit','other') NOT NULL,
    description   TEXT NULL,
    ai_generated_description BOOLEAN NOT NULL DEFAULT FALSE,
    start_at      DATETIME NOT NULL,
    end_at        DATETIME NULL,
    location      VARCHAR(200) NULL,
    organized_by  CHAR(36) NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ev_organizer FOREIGN KEY (organized_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 9 — DISCIPLESHIP MODULE
-- ============================================================================

CREATE TABLE new_believers_classes (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    title         VARCHAR(150) NOT NULL,
    facilitator_id CHAR(36) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NULL,
    CONSTRAINT fk_nbc_facilitator FOREIGN KEY (facilitator_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE new_believers_enrollments (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    class_id      CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    enrolled_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at  DATETIME  NULL,
    CONSTRAINT fk_nbe_class FOREIGN KEY (class_id) REFERENCES new_believers_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_nbe_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_class_user (class_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE foundations_classes (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    title         VARCHAR(150) NOT NULL,
    facilitator_id CHAR(36) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NULL,
    CONSTRAINT fk_fc_facilitator FOREIGN KEY (facilitator_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE foundations_enrollments (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    class_id      CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    enrolled_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at  DATETIME  NULL,
    CONSTRAINT fk_fe_class FOREIGN KEY (class_id) REFERENCES foundations_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_fe_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_fclass_user (class_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bible_study_groups (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    leader_id     CHAR(36)  NOT NULL,
    meeting_day   VARCHAR(20) NULL,
    meeting_time  TIME NULL,
    location      VARCHAR(200) NULL,
    CONSTRAINT fk_bsg_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bible_study_members (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    group_id      CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    joined_at     DATE NOT NULL,
    CONSTRAINT fk_bsm_group FOREIGN KEY (group_id) REFERENCES bible_study_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_bsm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_bsgroup_user (group_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mentorship_groups (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    mentor_id     CHAR(36)  NOT NULL,
    spiritual_year_id CHAR(36) NOT NULL,
    CONSTRAINT fk_mg_mentor FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mg_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mentorship_members (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    mentorship_group_id CHAR(36) NOT NULL,
    mentee_id     CHAR(36)  NOT NULL,
    joined_at     DATE NOT NULL,
    CONSTRAINT fk_mm2_group FOREIGN KEY (mentorship_group_id) REFERENCES mentorship_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_mm2_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_mgroup_mentee (mentorship_group_id, mentee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One-on-one follow-up records, distinct from group mentorship.
CREATE TABLE followup_sessions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    mentor_id     CHAR(36)  NOT NULL,
    mentee_id     CHAR(36)  NOT NULL,
    session_date  DATE NOT NULL,
    notes         TEXT NULL,          -- pastoral notes: access restricted to mentor + discipleship leadership
    CONSTRAINT fk_fs_mentor FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fs_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bible_reading_plans (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    title         VARCHAR(150) NOT NULL,
    description   TEXT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NULL,
    created_by    CHAR(36)  NOT NULL,
    CONSTRAINT fk_brp_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bible_reading_progress (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    plan_id       CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    reading_date  DATE NOT NULL,
    completed     BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_brpr_plan FOREIGN KEY (plan_id) REFERENCES bible_reading_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_brpr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_plan_user_date (plan_id, user_id, reading_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE memory_verses (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    reference     VARCHAR(50) NOT NULL,     -- e.g. 'John 3:16'
    text          TEXT NOT NULL,
    plan_id       CHAR(36) NULL,
    week_number   SMALLINT NULL,
    CONSTRAINT fk_mv_plan FOREIGN KEY (plan_id) REFERENCES bible_reading_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE memory_verse_completions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    memory_verse_id CHAR(36) NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    completed_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mvc_verse FOREIGN KEY (memory_verse_id) REFERENCES memory_verses(id) ON DELETE CASCADE,
    CONSTRAINT fk_mvc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_verse_user (memory_verse_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE training_certificates (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    title         VARCHAR(150) NOT NULL,     -- e.g. 'Foundations Class Certificate'
    issued_at     DATE NOT NULL,
    issued_by     CHAR(36) NOT NULL,
    certificate_url VARCHAR(500) NULL,
    CONSTRAINT fk_tc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_issuer FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rollup profile view of a member's discipleship journey (support tool, not a worth-score).
CREATE TABLE discipleship_profiles (
    id                    CHAR(36)  NOT NULL PRIMARY KEY,
    user_id               CHAR(36)  NOT NULL UNIQUE,
    new_believers_class_status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
    foundations_class_status   ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
    current_bible_study_group_id CHAR(36) NULL,
    current_mentorship_group_id  CHAR(36) NULL,
    assigned_mentor_id    CHAR(36) NULL,
    notes                 TEXT NULL,
    updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_dp_bsg FOREIGN KEY (current_bible_study_group_id) REFERENCES bible_study_groups(id) ON DELETE SET NULL,
    CONSTRAINT fk_dp_mg FOREIGN KEY (current_mentorship_group_id) REFERENCES mentorship_groups(id) ON DELETE SET NULL,
    CONSTRAINT fk_dp_mentor FOREIGN KEY (assigned_mentor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Deferred FKs from Chapter 1 (tables referenced groups defined in Chapter 9)
-- ----------------------------------------------------------------------------
ALTER TABLE user_spiritual_groups
    ADD CONSTRAINT fk_usg_mentorship FOREIGN KEY (mentorship_group_id) REFERENCES mentorship_groups(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_usg_bible_study FOREIGN KEY (bible_study_group_id) REFERENCES bible_study_groups(id) ON DELETE SET NULL;

-- ============================================================================
-- CORE: NOTIFICATIONS (referenced throughout — registration, renewal, approvals)
-- ============================================================================

CREATE TABLE notifications (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    type          VARCHAR(50) NOT NULL,   -- e.g. 'membership_renewal_due', 'welcome', 'meeting_reminder'
    title         VARCHAR(200) NOT NULL,
    body          TEXT NULL,
    channel       ENUM('in_app','email','sms') NOT NULL DEFAULT 'in_app',
    read_at       DATETIME NULL,
    sent_at       DATETIME NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
