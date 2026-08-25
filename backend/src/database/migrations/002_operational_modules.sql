-- ============================================================================
-- TECUMP — Schema Extension (Part III: Operational Modules)
-- Covers SRS Part III, Chapters 10–23. Depends on tecump_schema.sql (Part II)
-- for: users, roles, committees, committee_members, ministries, ministry_members,
--      meetings, meeting_minutes, meeting_resolutions, attendance_records,
--      events, spiritual_years, notifications, audit_logs.
-- Run this AFTER tecump_schema.sql.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- CHAPTER 10 — MEETING MANAGEMENT (extends Part II `meetings` table)
-- ============================================================================

-- Part II's `meetings.context_type` only distinguished who a meeting belonged
-- to. Chapter 10 requires the constitutional meeting type itself, plus the
-- fuller meeting-detail fields and lifecycle status.
ALTER TABLE meetings
    ADD COLUMN meeting_type ENUM('agm','sgm','regular_general','executive',
                                   'advisory_board','ministry','committee')
                NOT NULL DEFAULT 'regular_general' AFTER title,
    ADD COLUMN theme                VARCHAR(200) NULL AFTER meeting_type,
    ADD COLUMN description          TEXT NULL AFTER theme,
    ADD COLUMN venue                VARCHAR(200) NULL AFTER location,
    ADD COLUMN host_committee_or_ministry VARCHAR(150) NULL AFTER venue,
    ADD COLUMN chairperson_id       CHAR(36) NULL AFTER called_by,
    ADD COLUMN secretary_id         CHAR(36) NULL AFTER chairperson_id,
    ADD COLUMN expected_attendance  INT NULL AFTER secretary_id,
    ADD COLUMN quorum_requirement   INT NULL AFTER expected_attendance,
    ADD COLUMN constitution_reference VARCHAR(100) NULL AFTER quorum_requirement,
    MODIFY COLUMN status ENUM('draft','notice_sent','scheduled','held','cancelled','archived')
                NOT NULL DEFAULT 'draft',
    ADD CONSTRAINT fk_meet_chair FOREIGN KEY (chairperson_id) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_meet_secretary FOREIGN KEY (secretary_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE meeting_agenda_items (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    meeting_id    CHAR(36)  NOT NULL,
    title         VARCHAR(200) NOT NULL,
    description   TEXT NULL,
    is_voting_item BOOLEAN NOT NULL DEFAULT FALSE,
    presenter_id  CHAR(36) NULL,
    time_allocated_minutes SMALLINT NULL,
    display_order SMALLINT NOT NULL DEFAULT 0,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mai_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    CONSTRAINT fk_mai_presenter FOREIGN KEY (presenter_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE meeting_agenda_documents (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    agenda_item_id CHAR(36) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    title         VARCHAR(200) NOT NULL,
    uploaded_by   CHAR(36)  NOT NULL,
    uploaded_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mad_item FOREIGN KEY (agenda_item_id) REFERENCES meeting_agenda_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_mad_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE meeting_votes (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    agenda_item_id CHAR(36) NOT NULL,
    voter_id      CHAR(36)  NOT NULL,
    vote          ENUM('for','against','abstain') NOT NULL,
    voted_at      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mv2_item FOREIGN KEY (agenda_item_id) REFERENCES meeting_agenda_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_mv2_voter FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_item_voter (agenda_item_id, voter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE meeting_attendance_confirmations (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    meeting_id    CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    confirmed_at  DATETIME  NULL,
    method        ENUM('qr','manual','self_check_in','leader_check_in','nfc') NOT NULL DEFAULT 'manual',
    arrival_status ENUM('on_time','late','excused','absent') NOT NULL DEFAULT 'on_time',
    is_visitor    BOOLEAN NOT NULL DEFAULT FALSE,
    is_guest_speaker BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_mac_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    CONSTRAINT fk_mac_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_meeting_user (meeting_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Extend Part II's meeting_resolutions to match Chapter 10's fuller resolution record.
ALTER TABLE meeting_resolutions
    ADD COLUMN resolution_number VARCHAR(30) NULL AFTER meeting_id,
    ADD COLUMN motion             TEXT NULL AFTER description,
    ADD COLUMN mover_id           CHAR(36) NULL AFTER motion,
    ADD COLUMN seconder_id        CHAR(36) NULL AFTER mover_id,
    ADD COLUMN votes_for          INT NOT NULL DEFAULT 0 AFTER seconder_id,
    ADD COLUMN votes_against      INT NOT NULL DEFAULT 0 AFTER votes_for,
    ADD COLUMN votes_abstain      INT NOT NULL DEFAULT 0 AFTER votes_against,
    ADD CONSTRAINT fk_res_mover FOREIGN KEY (mover_id) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_res_seconder FOREIGN KEY (seconder_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- CHAPTER 11 — WEEKLY PROGRAMME MANAGEMENT
-- ============================================================================

CREATE TABLE weekly_programmes (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    programme_type ENUM('sunday_service','midweek_fellowship','bible_study','prayer_meeting',
                          'overnight_kesha','evangelism','leadership_meeting','committee_meeting',
                          'ministry_practice','worship_practice','instrument_practice',
                          'discipleship_class') NOT NULL,
    theme         VARCHAR(200) NULL,
    scripture_reference VARCHAR(100) NULL,
    scheduled_at  DATETIME NOT NULL,
    venue         VARCHAR(200) NULL,
    created_by    CHAR(36) NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wp_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Role assignments for a programme (speaker, worship leader, ushers, media, etc.)
-- Generic rather than one column per role, so new roles don't require schema changes.
CREATE TABLE programme_role_assignments (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    programme_id  CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    role_label    ENUM('speaker','worship_leader','praise_team','instrumentalist','prayer_leader',
                         'usher','media_team','creative_team','technician','offering_steward',
                         'announcements','closing_prayer') NOT NULL,
    notified_at   DATETIME NULL,
    confirmed_at  DATETIME NULL,
    CONSTRAINT fk_pra_programme FOREIGN KEY (programme_id) REFERENCES weekly_programmes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pra_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Drag-and-drop service flow: ordered list of segments per programme.
CREATE TABLE service_flow_items (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    programme_id  CHAR(36)  NOT NULL,
    segment       VARCHAR(100) NOT NULL,   -- e.g. 'Opening Prayer', 'Praise', 'Sermon'
    display_order SMALLINT NOT NULL DEFAULT 0,
    duration_minutes SMALLINT NULL,
    assigned_user_id CHAR(36) NULL,
    notes         VARCHAR(500) NULL,
    CONSTRAINT fk_sfi_programme FOREIGN KEY (programme_id) REFERENCES weekly_programmes(id) ON DELETE CASCADE,
    CONSTRAINT fk_sfi_user FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 12 — ATTENDANCE MANAGEMENT (extends Part II `attendance_records`)
-- ============================================================================

-- Part II's attendance_records already covers meeting/event/ministry_session/
-- committee_session. Chapter 12 adds programme + training + outreach contexts
-- and richer method/analytics tagging.
ALTER TABLE attendance_records
    MODIFY COLUMN attendable_type ENUM('meeting','event','ministry_session','committee_session',
                                         'programme','training','outreach') NOT NULL,
    ADD COLUMN method ENUM('qr','manual','nfc','mobile_app','self_check_in','leader_check_in')
                NOT NULL DEFAULT 'manual' AFTER status,
    ADD COLUMN visitor_type ENUM('none','first_time','returning') NOT NULL DEFAULT 'none' AFTER method;

-- Precomputed engagement flag per member per spiritual year, refreshed by a
-- scheduled job — avoids expensive full-table scans for "inactive member" alerts.
CREATE TABLE member_engagement_snapshots (
    id                CHAR(36)  NOT NULL PRIMARY KEY,
    user_id           CHAR(36)  NOT NULL,
    spiritual_year_id CHAR(36)  NOT NULL,
    engagement_status ENUM('active','inactive','frequently_absent','returning_visitor','first_time_visitor')
                            NOT NULL DEFAULT 'active',
    last_attended_at  DATETIME NULL,
    attendance_count_30d SMALLINT NOT NULL DEFAULT 0,
    computed_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mes_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_user_year_snapshot (user_id, spiritual_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 13 — EVENT MANAGEMENT (extends Part II `events`)
-- ============================================================================

ALTER TABLE events
    MODIFY COLUMN event_type ENUM('worship_night','missions','evangelism','high_school_mission',
                                    'retreat','conference','leadership_summit','bible_study',
                                    'prayer_retreat','training','agm','sgm','camp',
                                    'graduation_thanksgiving','other') NOT NULL,
    ADD COLUMN status ENUM('draft','budgeted','approved','registration_open','ongoing','completed','archived')
                NOT NULL DEFAULT 'draft' AFTER organized_by,
    ADD COLUMN capacity INT NULL AFTER status,
    ADD COLUMN registration_deadline DATETIME NULL AFTER capacity;

CREATE TABLE event_budgets (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    event_id      CHAR(36)  NOT NULL UNIQUE,
    proposed_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    approved_amount DECIMAL(12,2) NULL,
    currency      CHAR(3) NOT NULL DEFAULT 'KES',
    approved_by   CHAR(36) NULL,
    approved_at   DATETIME NULL,
    CONSTRAINT fk_eb_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_eb_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event_registrations (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    event_id      CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NULL,          -- nullable: walk-in registrants may not be app users
    walk_in_name  VARCHAR(150) NULL,
    registration_type ENUM('online','walk_in') NOT NULL DEFAULT 'online',
    status        ENUM('registered','waitlisted','cancelled','attended') NOT NULL DEFAULT 'registered',
    qr_code       VARCHAR(255) NULL UNIQUE,
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_er_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_er_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_er_event_status (event_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event_certificates (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    event_registration_id CHAR(36) NOT NULL UNIQUE,
    certificate_url VARCHAR(500) NOT NULL,
    issued_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ec_registration FOREIGN KEY (event_registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 14 — PRAYER MANAGEMENT
-- ============================================================================

CREATE TABLE prayer_requests (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    requested_by  CHAR(36)  NULL,           -- nullable: anonymous confidential requests
    title         VARCHAR(200) NOT NULL,
    details       TEXT NOT NULL,
    privacy_level ENUM('public','prayer_team','executive_only','private') NOT NULL DEFAULT 'public',
    status        ENUM('open','being_prayed_for','answered','closed') NOT NULL DEFAULT 'open',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_preq_user FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prayer_chains (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    coordinator_id CHAR(36) NOT NULL,
    CONSTRAINT fk_pc_coordinator FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prayer_chain_members (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    prayer_chain_id CHAR(36) NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    time_slot     VARCHAR(50) NULL,   -- e.g. '5:00 AM - 6:00 AM'
    CONSTRAINT fk_pcm_chain FOREIGN KEY (prayer_chain_id) REFERENCES prayer_chains(id) ON DELETE CASCADE,
    CONSTRAINT fk_pcm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_chain_user (prayer_chain_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prayer_partners (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id_a     CHAR(36)  NOT NULL,
    user_id_b     CHAR(36)  NOT NULL,
    paired_at     DATE NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_pp_a FOREIGN KEY (user_id_a) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pp_b FOREIGN KEY (user_id_b) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prayer_calendar_slots (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    topic         VARCHAR(200) NOT NULL,
    scheduled_date DATE NOT NULL,
    linked_kesha_event_id CHAR(36) NULL,
    CONSTRAINT fk_pcs_event FOREIGN KEY (linked_kesha_event_id) REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE testimonies (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    shared_by     CHAR(36)  NULL,
    title         VARCHAR(200) NOT NULL,
    content       TEXT NOT NULL,
    linked_prayer_request_id CHAR(36) NULL,
    is_public     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_user FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_test_request FOREIGN KEY (linked_prayer_request_id) REFERENCES prayer_requests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 15 — DISCIPLESHIP & MENTORSHIP (spiritual journey tracking)
-- Note: class enrollments, bible study groups, mentorship groups, reading
-- plans, memory verses, and certificates were already modeled in Part II
-- Chapter 9. This adds the journey-stage tracker and mentorship goal-setting.
-- ============================================================================

CREATE TABLE spiritual_journey_stages (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    stage         ENUM('visitor','first_fellowship','registered_member','bible_study',
                         'discipleship','mentorship','ministry_service','leadership_development',
                         'executive_leadership','alumni') NOT NULL,
    reached_at    DATE NOT NULL,
    recorded_by   CHAR(36) NULL,
    CONSTRAINT fk_sjs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sjs_recorder FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_user_stage (user_id, stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mentorship_goals (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    mentorship_group_id CHAR(36) NOT NULL,
    mentee_id     CHAR(36)  NOT NULL,
    goal          VARCHAR(300) NOT NULL,
    target_date   DATE NULL,
    status        ENUM('open','achieved','abandoned') NOT NULL DEFAULT 'open',
    CONSTRAINT fk_mgo_group FOREIGN KEY (mentorship_group_id) REFERENCES mentorship_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_mgo_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mentorship_growth_reports (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    mentorship_group_id CHAR(36) NOT NULL,
    mentee_id     CHAR(36)  NOT NULL,
    report_period VARCHAR(20) NOT NULL,   -- e.g. 'Term 1 2026'
    summary       TEXT NOT NULL,
    submitted_by  CHAR(36)  NOT NULL,
    submitted_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mgr_group FOREIGN KEY (mentorship_group_id) REFERENCES mentorship_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_mgr_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mgr_submitter FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 16 — EVANGELISM & MISSIONS
-- ============================================================================

CREATE TABLE evangelism_teams (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    outreach_type ENUM('campus','hostel','high_school','hospital','prison','community') NOT NULL,
    leader_id     CHAR(36)  NOT NULL,
    linked_event_id CHAR(36) NULL,
    CONSTRAINT fk_evt_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_evt_event FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evangelism_team_members (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    team_id       CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    CONSTRAINT fk_etm_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_etm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_user (team_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evangelism_reports (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    team_id       CHAR(36)  NOT NULL,
    outreach_date DATE NOT NULL,
    souls_reached INT NOT NULL DEFAULT 0,
    contacts_collected INT NOT NULL DEFAULT 0,
    summary       TEXT NULL,
    submitted_by  CHAR(36)  NOT NULL,
    submitted_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evr_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_evr_submitter FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evangelism_followups (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    evangelism_report_id CHAR(36) NOT NULL,
    contact_name  VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20) NULL,
    linked_user_id CHAR(36) NULL,   -- populated once they register as a visitor/member
    status        ENUM('pending','contacted','joined_bible_study','became_member','no_response')
                        NOT NULL DEFAULT 'pending',
    assigned_to   CHAR(36) NULL,
    CONSTRAINT fk_efu_report FOREIGN KEY (evangelism_report_id) REFERENCES evangelism_reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_efu_linked_user FOREIGN KEY (linked_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_efu_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 17 — FINANCE MANAGEMENT
-- ============================================================================

CREATE TABLE annual_budgets (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    spiritual_year_id CHAR(36) NOT NULL UNIQUE,
    total_amount  DECIMAL(14,2) NOT NULL DEFAULT 0,
    currency      CHAR(3) NOT NULL DEFAULT 'KES',
    approved_by   CHAR(36) NULL,
    approved_at   DATETIME NULL,
    CONSTRAINT fk_ab_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ab_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE income_records (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    income_type   ENUM('offering','donation','welfare_contribution','fundraising',
                         'merchandise','event_registration') NOT NULL,
    amount        DECIMAL(12,2) NOT NULL,
    currency      CHAR(3) NOT NULL DEFAULT 'KES',
    source_description VARCHAR(200) NULL,
    linked_event_id CHAR(36) NULL,
    received_date DATE NOT NULL,
    recorded_by   CHAR(36) NOT NULL,
    receipt_number VARCHAR(50) NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inc_event FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT fk_inc_recorder FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE expense_requests (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    expense_type  ENUM('ministry','welfare','equipment','speaker_support','missions','administration')
                        NOT NULL,
    amount        DECIMAL(12,2) NOT NULL,
    currency      CHAR(3) NOT NULL DEFAULT 'KES',
    description   TEXT NOT NULL,
    requested_by  CHAR(36)  NOT NULL,
    linked_committee_id CHAR(36) NULL,
    linked_ministry_id  CHAR(36) NULL,
    linked_event_id     CHAR(36) NULL,

    -- Approval workflow: Request -> Treasurer Review -> Secretary Verification -> Chairperson Approval -> Payment -> Receipt -> Audit
    status              ENUM('requested','treasurer_reviewed','secretary_verified','chairperson_approved',
                               'paid','receipted','audited','rejected') NOT NULL DEFAULT 'requested',
    treasurer_reviewed_by  CHAR(36) NULL,
    treasurer_reviewed_at  DATETIME NULL,
    secretary_verified_by  CHAR(36) NULL,
    secretary_verified_at  DATETIME NULL,
    chairperson_approved_by CHAR(36) NULL,
    chairperson_approved_at DATETIME NULL,
    paid_at                DATETIME NULL,
    receipt_number          VARCHAR(50) NULL,
    rejection_reason        TEXT NULL,

    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exp_requester FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_exp_committee FOREIGN KEY (linked_committee_id) REFERENCES committees(id) ON DELETE SET NULL,
    CONSTRAINT fk_exp_ministry FOREIGN KEY (linked_ministry_id) REFERENCES ministries(id) ON DELETE SET NULL,
    CONSTRAINT fk_exp_event FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT fk_exp_treasurer FOREIGN KEY (treasurer_reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_exp_secretary FOREIGN KEY (secretary_verified_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_exp_chairperson FOREIGN KEY (chairperson_approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_exp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE finance_audit_reports (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    spiritual_year_id CHAR(36) NOT NULL,
    title         VARCHAR(200) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    auditor_name  VARCHAR(150) NULL,
    submitted_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_far_year FOREIGN KEY (spiritual_year_id) REFERENCES spiritual_years(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 18 — WELFARE MANAGEMENT
-- ============================================================================

CREATE TABLE welfare_cases (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    case_type     ENUM('emergency','medical','bereavement','student_support','counselling_referral',
                         'financial_assistance') NOT NULL,
    description   TEXT NOT NULL,
    confidential_notes TEXT NULL,     -- access restricted to Welfare Committee + Chairperson
    status        ENUM('open','under_review','approved','declined','resolved') NOT NULL DEFAULT 'open',
    handled_by    CHAR(36) NULL,
    linked_expense_request_id CHAR(36) NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wc_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_wc_expense FOREIGN KEY (linked_expense_request_id) REFERENCES expense_requests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE welfare_emergency_contacts (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    user_id       CHAR(36)  NOT NULL,
    contact_name  VARCHAR(150) NOT NULL,
    relationship  VARCHAR(50) NULL,
    phone_number  VARCHAR(20) NOT NULL,
    CONSTRAINT fk_wec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 19 — ASSET MANAGEMENT
-- ============================================================================

CREATE TABLE assets (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    category      ENUM('musical_instrument','camera','projector','speaker','mixer','chair',
                         'table','office_equipment','book','library_resource','other') NOT NULL,
    serial_number VARCHAR(100) NULL UNIQUE,
    condition_status ENUM('new','good','fair','needs_repair','damaged','decommissioned')
                        NOT NULL DEFAULT 'good',
    acquired_date DATE NULL,
    value_amount  DECIMAL(12,2) NULL,
    currency      CHAR(3) NOT NULL DEFAULT 'KES',
    custodian_ministry_id CHAR(36) NULL,
    custodian_committee_id CHAR(36) NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_ministry FOREIGN KEY (custodian_ministry_id) REFERENCES ministries(id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_committee FOREIGN KEY (custodian_committee_id) REFERENCES committees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE asset_assignments (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    asset_id      CHAR(36)  NOT NULL,
    assigned_to   CHAR(36)  NOT NULL,
    assigned_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    returned_at   DATETIME  NULL,
    condition_on_assignment VARCHAR(200) NULL,
    condition_on_return     VARCHAR(200) NULL,
    CONSTRAINT fk_aa_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_aa_user FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE asset_maintenance_records (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    asset_id      CHAR(36)  NOT NULL,
    maintenance_type ENUM('routine','repair') NOT NULL,
    description   TEXT NOT NULL,
    cost          DECIMAL(10,2) NULL,
    performed_at  DATE NOT NULL,
    performed_by  VARCHAR(150) NULL,
    logged_by     CHAR(36) NOT NULL,
    CONSTRAINT fk_amr_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_amr_logger FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE asset_handovers (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    asset_id      CHAR(36)  NOT NULL,
    outgoing_user_id CHAR(36) NOT NULL,
    incoming_user_id CHAR(36) NOT NULL,
    handover_date DATE NOT NULL,
    condition_notes TEXT NULL,
    signed_off_by CHAR(36) NULL,     -- e.g. Assets Committee Chairperson
    CONSTRAINT fk_ah_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ah_outgoing FOREIGN KEY (outgoing_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ah_incoming FOREIGN KEY (incoming_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ah_signoff FOREIGN KEY (signed_off_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE asset_audits (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    conducted_by  CHAR(36)  NOT NULL,
    audit_date    DATE NOT NULL,
    notes         TEXT NULL,
    CONSTRAINT fk_aau_user FOREIGN KEY (conducted_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE asset_audit_items (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    asset_audit_id CHAR(36) NOT NULL,
    asset_id      CHAR(36)  NOT NULL,
    found         BOOLEAN NOT NULL DEFAULT TRUE,
    condition_noted VARCHAR(200) NULL,
    CONSTRAINT fk_aai_audit FOREIGN KEY (asset_audit_id) REFERENCES asset_audits(id) ON DELETE CASCADE,
    CONSTRAINT fk_aai_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 20 — LIBRARY & RESOURCE CENTRE
-- ============================================================================

CREATE TABLE library_resources (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    resource_type ENUM('book','devotional','sermon','audio','video','pdf','constitution',
                         'leadership_manual','bible_study_material','training_notes') NOT NULL,
    author_or_speaker VARCHAR(150) NULL,
    category      VARCHAR(100) NULL,
    file_url      VARCHAR(500) NULL,     -- for digital resources
    is_physical   BOOLEAN NOT NULL DEFAULT FALSE,
    physical_copies_total INT NOT NULL DEFAULT 0,
    physical_copies_available INT NOT NULL DEFAULT 0,
    added_by      CHAR(36) NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lr_adder FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT,
    FULLTEXT INDEX ft_library_search (title, author_or_speaker, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE library_borrowings (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    resource_id   CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    borrowed_at   DATE NOT NULL,
    due_date      DATE NOT NULL,
    returned_at   DATE NULL,
    overdue_notice_sent BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_lb_resource FOREIGN KEY (resource_id) REFERENCES library_resources(id) ON DELETE CASCADE,
    CONSTRAINT fk_lb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lb_due (due_date, returned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE library_reservations (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    resource_id   CHAR(36)  NOT NULL,
    user_id       CHAR(36)  NOT NULL,
    reserved_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        ENUM('pending','fulfilled','cancelled') NOT NULL DEFAULT 'pending',
    CONSTRAINT fk_lres_resource FOREIGN KEY (resource_id) REFERENCES library_resources(id) ON DELETE CASCADE,
    CONSTRAINT fk_lres_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 21 — COMMUNICATION & NOTIFICATIONS
-- (Part II already has `notifications` per-user. This adds broadcast groups
--  and outbound broadcast records; individual notifications fan out from here.)
-- ============================================================================

CREATE TABLE broadcast_groups (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    code          ENUM('entire_cu','ministry_members','committee_members','executive_committee',
                         'prayer_team','first_years','alumni') NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE broadcast_messages (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    broadcast_group_id CHAR(36) NOT NULL,
    channel       ENUM('email','sms','push','whatsapp','in_app') NOT NULL,
    subject       VARCHAR(200) NULL,
    body          TEXT NOT NULL,
    sent_by       CHAR(36)  NOT NULL,
    scheduled_at  DATETIME NULL,
    sent_at       DATETIME NULL,
    recipient_count INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_bm_group FOREIGN KEY (broadcast_group_id) REFERENCES broadcast_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_bm_sender FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Automated notification rules (birthday greetings, renewal reminders, etc.)
-- are configuration, not per-user data — modeled as a rules table the
-- notification scheduler reads, rather than one table per trigger type.
CREATE TABLE automated_notification_rules (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    trigger_code  ENUM('meeting_reminder','fellowship_reminder','event_reminder','birthday_greeting',
                         'membership_renewal','leadership_handover_task','prayer_meeting_alert',
                         'report_submission_deadline') NOT NULL UNIQUE,
    is_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    lead_time_hours INT NOT NULL DEFAULT 24,
    channel       ENUM('email','sms','push','whatsapp','in_app') NOT NULL DEFAULT 'in_app'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 22 — REPORTS & ANALYTICS
-- Dashboards/exports are computed from existing tables above; this table just
-- tracks generated report artifacts (for re-download and audit trail).
-- ============================================================================

CREATE TABLE generated_reports (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    report_type   ENUM('membership','attendance','ministries','committees','finance','assets',
                         'prayer_activities','bible_studies','evangelism','events',
                         'leadership_performance','system_usage') NOT NULL,
    export_format ENUM('pdf','excel','csv') NOT NULL,
    parameters    JSON NULL,          -- filters used: date range, ministry_id, committee_id, etc.
    file_url      VARCHAR(500) NOT NULL,
    generated_by  CHAR(36)  NOT NULL,
    generated_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gr_user FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_gr_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CHAPTER 23 — AUDIT LOGS & COMPLIANCE (extends Part II `audit_logs`)
-- ============================================================================

ALTER TABLE audit_logs
    ADD COLUMN device_fingerprint VARCHAR(255) NULL AFTER ip_address,
    ADD COLUMN module              VARCHAR(50) NULL AFTER device_fingerprint,
    ADD COLUMN result              ENUM('success','failure') NOT NULL DEFAULT 'success' AFTER module;

SET FOREIGN_KEY_CHECKS = 1;
