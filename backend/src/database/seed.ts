/**
 * Seeds reference/lookup data required for the platform to function:
 * membership types, executive positions, constitutional ministries,
 * committees, the full 18-role RBAC matrix + permissions, and an initial
 * spiritual year.
 *
 * The role/permission design follows the constitutional hierarchy:
 * Super Admin (technical, unrestricted) -> Executive Committee (Chairperson,
 * 1st/2nd Vice Chairperson, Secretary, Vice Secretary, Treasurer) ->
 * Committee Chairpersons (Prayer, Worship, Missions, Discipleship, Assets,
 * Publicity, Non-Residents — one per constitutional committee) -> Ministry
 * leadership (Leader / Secretary / Treasurer — generic roles assigned with
 * a scope_id pointing at the specific ministry, so a leader only manages
 * their own ministry, never every ministry) -> Ordinary Member.
 *
 * Per Chapter 80: no operational data (members, financial records) is
 * seeded here — only the fixed reference data every deployment needs.
 * Idempotent: safe to re-run.
 */
import { randomUUID } from 'crypto';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

async function upsert(table: string, uniqueCol: string, rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const withId = { id: randomUUID(), ...row };
    const columns = Object.keys(withId);
    const updates = columns
      .filter((c) => c !== 'id' && c !== uniqueCol)
      .map((c) => `${c} = VALUES(${c})`)
      .join(', ');

    await pool.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((c) => `:${c}`).join(', ')})
       ON DUPLICATE KEY UPDATE ${updates || `${uniqueCol} = VALUES(${uniqueCol})`}`,
      withId
    );
  }
  logger.info(`Seeded ${rows.length} rows into ${table}`);
}

async function seed() {
  // --- Membership Types (Chapter 4 / constitution) --------------------------
  await upsert('membership_types', 'code', [
    { code: 'full', name: 'Full Member', description: 'Full constitutional member' },
    { code: 'special', name: 'Special Member', description: 'Special category member' },
    { code: 'associate', name: 'Associate Member', description: 'Alumni / associate member' },
  ]);

  // --- Executive Positions (Chapter 5) --------------------------------------
  await upsert('executive_positions', 'code', [
    { code: 'chairperson', title: 'Chairperson', display_order: 1 },
    { code: 'first_vice_chairperson', title: '1st Vice Chairperson', display_order: 2 },
    { code: 'second_vice_chairperson', title: '2nd Vice Chairperson', display_order: 3 },
    { code: 'secretary', title: 'Secretary', display_order: 4 },
    { code: 'vice_secretary', title: 'Vice Secretary', display_order: 5 },
    { code: 'treasurer', title: 'Treasurer', display_order: 6 },
    { code: 'prayer_chairperson', title: 'Prayer Committee Chairperson', display_order: 7 },
    { code: 'worship_chairperson', title: 'Worship Committee Chairperson', display_order: 8 },
    { code: 'missions_chairperson', title: 'Missions Committee Chairperson', display_order: 9 },
    { code: 'discipleship_chairperson', title: 'Discipleship Committee Chairperson', display_order: 10 },
    { code: 'assets_chairperson', title: 'Assets Committee Chairperson', display_order: 11 },
    { code: 'publicity_chairperson', title: 'Publicity Committee Chairperson', display_order: 12 },
    { code: 'non_residents_chairperson', title: 'Non-Residents Committee Chairperson', display_order: 13 },
  ]);

  // --- Constitutional Ministries (Chapter 8 / 64) ---------------------------
  // Includes Brothers'/Sisters' Ministry, which the 2nd Vice Chairperson may
  // be appointed to oversee alongside Associates/Finalists.
  await upsert('ministries', 'code', [
    { code: 'intercessory', name: 'Intercessory Ministry' },
    { code: 'worship', name: 'Praise & Worship Ministry' },
    { code: 'instrumentalists', name: 'Instrumentalists Ministry' },
    { code: 'ushering', name: 'Ushering Ministry' },
    { code: 'catering', name: 'Catering Ministry' },
    { code: 'media', name: 'Media Ministry' },
    { code: 'creative', name: 'Creative Ministry' },
    { code: 'technicians', name: 'Technicians Ministry' },
    { code: 'high_school', name: 'High School Ministry' },
    { code: 'hospital', name: 'Hospital Ministry' },
    { code: 'brothers', name: "Brothers' Ministry" },
    { code: 'sisters', name: "Sisters' Ministry" },
  ]);

  // --- Constitutional Committees (Chapter 7) --------------------------------
  await upsert('committees', 'code', [
    { code: 'prayer', name: 'Prayer Committee' },
    { code: 'worship', name: 'Worship Committee' },
    { code: 'missions', name: 'Missions Committee' },
    { code: 'discipleship', name: 'Discipleship Committee' },
    { code: 'assets', name: 'Assets Committee' },
    { code: 'hospitality', name: 'Hospitality Committee' },
    { code: 'publicity', name: 'Publicity Committee' },
    { code: 'treasury', name: 'Treasury Committee' },
    { code: 'non_residents', name: 'Non-Residents Committee' },
    { code: 'welfare', name: 'Welfare Committee' },
  ]);

  // --- Permissions (extend freely — RBAC is fully database-driven) ---------
  // Modules marked "reserved" below back a dashboard described in the RBAC
  // spec but don't have dedicated tables/endpoints yet (e.g. venue booking,
  // transport, song library, live streaming, website CMS). The permission
  // codes exist now so roles can be granted them today and the real
  // module can be wired in later without a second RBAC migration.
  const permissionModules: Record<string, string[]> = {
    membership: ['view_all', 'review', 'approve', 'create', 'edit'],
    finance: ['view', 'request', 'approve', 'treasurer_review', 'secretary_verify', 'pay', 'audit'],
    meetings: ['view', 'create', 'edit', 'delete', 'manage_minutes', 'approve_minutes', 'archive'],
    attendance: ['view', 'record', 'edit', 'delete'],
    events: ['view', 'create', 'edit', 'delete', 'approve', 'register', 'check_in'],
    // manage_members = add/remove/transfer members within a scoped ministry
    // or committee (enforced against the caller's own scope — see
    // enforceScope.middleware.ts). manage_all_members bypasses that scope
    // check, for roles senior enough to touch every ministry/committee.
    ministries: ['view', 'create', 'edit', 'delete', 'manage_members', 'manage_all_members', 'manage_details'],
    committees: ['view', 'create', 'edit', 'delete', 'manage_members', 'manage_all_members'],
    leadership: ['view', 'create', 'edit', 'delete', 'assign'],
    // view_confidential = can see 'prayer_team', 'executive_only', and
    // 'private' requests, not just 'public' ones — everyone with plain
    // 'view' can still always see their OWN requests regardless of privacy.
    prayer: ['view', 'view_confidential', 'create', 'edit', 'delete'],
    discipleship: ['view', 'create', 'edit', 'delete'],
    evangelism: ['view', 'create', 'edit', 'delete'],
    welfare: ['view', 'create', 'edit', 'delete', 'approve'],
    assets: ['view', 'create', 'edit', 'delete'],
    library: ['view', 'create', 'edit', 'delete'],
    communication: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'create', 'edit', 'delete'],
    audit: ['view'],
    system: [
      'manage_roles',
      'manage_permissions',
      'manage_settings',
      'manage_backups',
      'manage_academic_years',
      'archive_leadership',
      'restore_records',
    ],
    // --- Reserved: no dedicated module yet, see note above ------------------
    hospitality: ['view', 'manage'], // guest management, catering requests, external ministers
    venue: ['view', 'book', 'manage'], // 2nd VC / Brothers' Ministry venue booking
    transport: ['view', 'manage'], // 2nd VC / Brothers' Ministry transport
    associates: ['view', 'manage'], // Associates & Finalists database
    worship_committee: ['view', 'manage'], // song library, team roster, practices — distinct
    // from the Praise & Worship *ministry*'s day-to-day operations above
    publicity: ['manage_website', 'manage_social', 'manage_gallery', 'manage_publications', 'manage_livestream', 'manage_media'],
    non_residents: ['view', 'manage'],
  };

  const permissionRows = Object.entries(permissionModules).flatMap(([module, actions]) =>
    actions.map((action) => ({
      code: `${module}.${action}`,
      module,
      description: `${action.replace(/_/g, ' ')} on ${module}`,
    }))
  );
  await upsert('permissions', 'code', permissionRows);

  // --- Roles: the full 18-role constitutional hierarchy ----------------------
  await upsert('roles', 'code', [
    { code: 'super_admin', name: 'Super Administrator', category: 'system_admin', is_system_role: true },
    { code: 'system_admin', name: 'System Administrator', category: 'system_admin', is_system_role: true },
    { code: 'it_admin', name: 'IT Administrator', category: 'system_admin', is_system_role: true },

    { code: 'chairperson', name: 'Chairperson', category: 'constitutional_leadership' },
    { code: 'first_vice_chairperson', name: '1st Vice Chairperson', category: 'constitutional_leadership' },
    { code: 'second_vice_chairperson', name: '2nd Vice Chairperson', category: 'constitutional_leadership' },
    { code: 'secretary', name: 'Secretary', category: 'constitutional_leadership' },
    { code: 'vice_secretary', name: 'Vice Secretary', category: 'constitutional_leadership' },
    { code: 'treasurer', name: 'Treasurer', category: 'constitutional_leadership' },

    { code: 'prayer_chairperson', name: 'Prayer Committee Chairperson', category: 'committee' },
    { code: 'worship_chairperson', name: 'Worship Committee Chairperson', category: 'committee' },
    { code: 'missions_chairperson', name: 'Missions Committee Chairperson', category: 'committee' },
    { code: 'discipleship_chairperson', name: 'Discipleship Committee Chairperson', category: 'committee' },
    { code: 'assets_chairperson', name: 'Assets Committee Chairperson', category: 'committee' },
    { code: 'non_residents_chairperson', name: 'Non-Residents Committee Chairperson', category: 'committee' },
    { code: 'publicity_chairperson', name: 'Publicity Committee Chairperson', category: 'committee' },

    // Generic, scoped roles: always assigned with user_roles.scope_type =
    // 'ministry' and scope_id = the specific ministry. A person holding
    // 'ministry_leader' for Media Ministry has no special access to
    // Ushering Ministry — see enforceScope.middleware.ts.
    { code: 'ministry_leader', name: 'Ministry Leader', category: 'ministry' },
    { code: 'ministry_secretary', name: 'Ministry Secretary', category: 'ministry' },
    { code: 'ministry_treasurer', name: 'Ministry Treasurer', category: 'ministry' },

    { code: 'patron', name: 'Patron', category: 'advisory' },
    { code: 'member', name: 'Member', category: 'member' },
  ]);

  const roleRows = (await pool.query(`SELECT id, code FROM roles`))[0] as { id: string; code: string }[];
  const roleId = (code: string) => roleRows.find((r) => r.code === code)?.id;

  async function grant(roleCode: string, permissionCodes: string[]) {
    const id = roleId(roleCode);
    if (!id) {
      logger.warn(`Cannot grant permissions to unknown role "${roleCode}" — check the roles seed above.`);
      return;
    }
    for (const code of permissionCodes) {
      await pool.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id)
         SELECT :roleId, id FROM permissions WHERE code = :code`,
        { roleId: id, code }
      );
    }
  }

  /**
   * grant() is additive-only by design (INSERT IGNORE) — safe to re-run
   * without accidentally wiping permissions a deployment may have granted
   * outside this file. That means correcting a *misplaced* grant (a
   * permission that moved from one role to another between seed versions)
   * requires an explicit revoke, since simply removing it from grant()'s
   * argument list here does nothing to existing rows on re-run.
   */
  async function revoke(roleCode: string, permissionCodes: string[]) {
    const id = roleId(roleCode);
    if (!id) return;
    for (const code of permissionCodes) {
      await pool.query(
        `DELETE rp FROM role_permissions rp
           JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = :roleId AND p.code = :code`,
        { roleId: id, code }
      );
    }
  }

  // --- System administration roles ----------------------------------------
  // Super Admin is the only wildcard role. System Admin and IT Admin are
  // deliberately narrower so technical access follows least privilege.
  const superAdminId = roleId('super_admin');
  if (superAdminId) {
    await pool.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT :roleId, id FROM permissions`,
      { roleId: superAdminId }
    );
  }

  await grant('system_admin', [
    'system.manage_roles',
    'system.manage_permissions',
    'system.manage_settings',
    'system.manage_backups',
    'system.manage_academic_years',
    'system.archive_leadership',
    'system.restore_records',
    'leadership.view',
    'leadership.assign',
    'membership.view_all',
    'reports.view',
    'audit.view',
  ]);

  await grant('it_admin', [
    'system.manage_settings',
    'system.manage_backups',
    'system.restore_records',
    'leadership.view',
    'membership.view_all',
    'reports.view',
    'audit.view',
  ]);

  // --- Chairperson: coordinates all CU activity, presides over meetings,
  // official spokesperson, links CU with University Administration. Views
  // everything, cannot touch technical system settings. --------------------
  await grant('chairperson', [
    'reports.view',
    'finance.approve',
    'finance.view',
    'events.view',
    'events.create',
    'events.edit',
    'events.approve',
    'membership.approve',
    'membership.review',
    'membership.view_all',
    'leadership.view',
    'leadership.assign',
    'meetings.view',
    'meetings.create',
    'meetings.archive',
    'ministries.view',
    'committees.view',
    'assets.view',
    'welfare.view',
    'prayer.view',
    'prayer.view_confidential',
    'communication.create',
  ]);

  // --- 1st Vice Chairperson: assists Chairperson, stands in for them,
  // chairs Welfare Committee. Read-only visibility into the Chairperson's
  // own view-level permissions (never approval/edit rights on those). ------
  await grant('first_vice_chairperson', [
    'welfare.view',
    'welfare.create',
    'welfare.edit',
    'welfare.approve',
    'reports.view',
    'leadership.view',
    'ministries.view',
    'committees.view',
    'membership.view_all',
    'meetings.view',
  ]);

  // --- 2nd Vice Chairperson: Associates & Finalists, and (depending on
  // appointment) Brothers'/Sisters' Ministry oversight including venue
  // booking and transport. ---------------------------------------------------
  await grant('second_vice_chairperson', [
    'associates.view',
    'associates.manage',
    'ministries.view',
    'ministries.manage_members',
    'venue.view',
    'venue.book',
    'venue.manage',
    'transport.view',
    'transport.manage',
  ]);

  // --- Secretary: correspondence, convenes meetings, minutes, membership
  // records, certificates, announcements, heads the ministry leaders. -------
  await grant('secretary', [
    'membership.create',
    'membership.review',
    'membership.view_all',
    'membership.edit',
    'meetings.view',
    'meetings.create',
    'meetings.edit',
    'meetings.delete',
    'meetings.manage_minutes',
    'meetings.approve_minutes',
    'attendance.view',
    'attendance.record',
    'communication.create',
    'reports.create',
    'reports.view',
    'ministries.view',
    'ministries.manage_all_members', // "heads the ministry leaders" — assigns/oversees across all ministries
    'ministries.edit',
    'leadership.assign',
    'system.archive_leadership',
    // "Secretary Verification" is a distinct step in the expense approval
    // chain (Chapter 17) — belongs to the Secretary, not the Treasurer.
    'finance.view',
    'finance.secretary_verify',
  ]);

  // --- Vice Secretary: assists Secretary, chairs Hospitality Committee. ----
  await grant('vice_secretary', [
    'hospitality.view',
    'hospitality.manage',
    'meetings.view',
    'attendance.view',
  ]);

  // --- Treasurer: receives/disburses funds, budgets, projects, fundraising,
  // heads Treasury Committee. -------------------------------------------------
  await grant('treasurer', [
    'finance.view',
    'finance.request',
    'finance.treasurer_review',
    'finance.pay',
    // Treasurer "maintains financial records" (constitution) — the final
    // audit/close-out step of the approval chain belongs here, not to any
    // other role. Without this, completed expenses could never be marked
    // audited by anyone.
    'finance.audit',
    'reports.create',
    'reports.view',
  ]);
  // Corrects an earlier seed version that granted this to Treasurer instead
  // of Secretary — see the "Secretary Verification" step in Chapter 17.
  await revoke('treasurer', ['finance.secretary_verify']);

  // --- Committee Chairpersons — one per constitutional committee -----------
  await grant('prayer_chairperson', ['prayer.view', 'prayer.view_confidential', 'prayer.create', 'prayer.edit', 'prayer.delete', 'meetings.view', 'attendance.view']);
  await grant('worship_chairperson', ['worship_committee.view', 'worship_committee.manage', 'meetings.view', 'attendance.view']);
  await grant('missions_chairperson', ['evangelism.view', 'evangelism.create', 'evangelism.edit', 'evangelism.delete', 'membership.review']);
  await grant('discipleship_chairperson', [
    'discipleship.view',
    'discipleship.create',
    'discipleship.edit',
    'discipleship.delete',
    'membership.create', // orientation of new students / registration
  ]);
  await grant('assets_chairperson', ['assets.view', 'assets.create', 'assets.edit', 'assets.delete']);
  await grant('non_residents_chairperson', ['non_residents.view', 'non_residents.manage', 'attendance.view']);
  await grant('publicity_chairperson', [
    'publicity.manage_website',
    'publicity.manage_social',
    'publicity.manage_gallery',
    'publicity.manage_publications',
    'publicity.manage_livestream',
    'publicity.manage_media',
    'library.create',
    'library.edit',
  ]);

  // --- Ministry-level roles — generic + scoped. Only manage_members (not
  // manage_all_members), so enforceScope.middleware.ts restricts every
  // holder of these roles to the specific ministry their user_roles row is
  // scoped to. -----------------------------------------------------------
  await grant('ministry_leader', [
    'ministries.view',
    'ministries.manage_members',
    'ministries.manage_details',
    'meetings.view',
    'meetings.create',
    'attendance.view',
    'attendance.record',
    'reports.create',
    'reports.view',
    'library.view',
  ]);
  await grant('ministry_secretary', [
    // Assists the leader: attendance, minutes, documents, schedules — but
    // per the constitution cannot remove members, assign leaders, or
    // delete the ministry, so 'manage_members' is deliberately NOT granted.
    'ministries.view',
    'meetings.view',
    'meetings.manage_minutes',
    'attendance.view',
    'attendance.record',
    'reports.create',
    'library.edit',
  ]);
  await grant('ministry_treasurer', [
    // Ministry-level finance only — cannot approve/pay without Executive
    // oversight, so 'finance.approve' / 'finance.pay' are not granted.
    'finance.view',
    'finance.request',
    'reports.view',
  ]);

  // --- Patron / Advisory ---------------------------------------------------
  // Patrons provide pastoral/advisory oversight without technical control.
  await grant('patron', [
    'events.view',
    'meetings.view',
    'ministries.view',
    'committees.view',
    'membership.view_all',
    'prayer.view',
    'welfare.view',
    'reports.view',
    'library.view',
  ]);

  // --- Ordinary Member ------------------------------------------------------
  const MEMBER_BASE_PERMISSIONS = [
    'events.view',
    'events.register',
    'meetings.view',
    'attendance.record',
    'prayer.view',
    'prayer.create',
    'library.view',
  ];

  await grant('member', MEMBER_BASE_PERMISSIONS);

  // Every leadership role — Executive, Committee Chair, or Ministry — is
  // held by someone who is fundamentally still a Member of the union, and
  // should never end up LESS able to do ordinary self-service things
  // (submit a prayer request, register for an event, mark their own
  // attendance) than a plain member is. Permissions in this seed are
  // per-role rather than hierarchical/inherited, so without this, a
  // Chairperson who was only ever assigned the "chairperson" role — never
  // "member" — would be blocked from actions any ordinary member can do.
  // This is exactly the bug that surfaced during manual testing: a
  // chairperson account couldn't submit its own prayer request.
  const LEADERSHIP_ROLE_CODES = [
    'chairperson',
    'first_vice_chairperson',
    'second_vice_chairperson',
    'secretary',
    'vice_secretary',
    'treasurer',
    'prayer_chairperson',
    'worship_chairperson',
    'missions_chairperson',
    'discipleship_chairperson',
    'assets_chairperson',
    'non_residents_chairperson',
    'publicity_chairperson',
    'ministry_leader',
    'ministry_secretary',
    'ministry_treasurer',
    'patron',
  ];
  for (const roleCode of LEADERSHIP_ROLE_CODES) {
    await grant(roleCode, MEMBER_BASE_PERMISSIONS);
  }

  // --- Academic / Spiritual Year Template ------------------------------------
  const currentYear = new Date().getFullYear();
  await upsert('spiritual_years', 'label', [
    {
      label: `${currentYear}/${currentYear + 1}`,
      start_date: `${currentYear}-09-01`,
      end_date: `${currentYear + 1}-08-31`,
      is_current: true,
    },
  ]);

  // --- Membership Declaration (constitutional wording — placeholder) --------
  await pool.query(
    `INSERT INTO membership_declarations (id, declaration_text, version, is_active)
     SELECT :id, :text, 'v1', TRUE WHERE NOT EXISTS (
       SELECT 1 FROM membership_declarations WHERE version = 'v1'
     )`,
    {
      id: randomUUID(),
      text:
        'I declare Jesus Christ as my Lord and Savior and commit to upholding the mission, ' +
        'vision, and values of the Technical University of Mombasa Christian Union as set out ' +
        'in its constitution. [Replace with the exact constitutional declaration text.]',
    }
  );

  logger.info('✅ Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
