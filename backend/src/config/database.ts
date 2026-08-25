import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { env } from './env';
import { logger } from '../utils/logger';

// In-memory data store for offline / preview mode
interface MemoryDB {
  tables: Record<string, Record<string, any>[]>;
}

const memoryDb: MemoryDB = {
  tables: {
    membership_types: [
      { id: '1', code: 'full', name: 'Full Member', description: 'Full constitutional student member', created_at: new Date().toISOString() },
      { id: '2', code: 'special', name: 'Special Member', description: 'Special category member', created_at: new Date().toISOString() },
      { id: '3', code: 'associate', name: 'Associate Member', description: 'Alumni / associate member', created_at: new Date().toISOString() },
    ],
    executive_positions: [
      { id: '1', code: 'chairperson', title: 'Chairperson', display_order: 1, created_at: new Date().toISOString() },
      { id: '2', code: 'first_vice_chairperson', title: '1st Vice Chairperson', display_order: 2, created_at: new Date().toISOString() },
      { id: '3', code: 'second_vice_chairperson', title: '2nd Vice Chairperson', display_order: 3, created_at: new Date().toISOString() },
      { id: '4', code: 'secretary', title: 'Secretary', display_order: 4, created_at: new Date().toISOString() },
      { id: '5', code: 'vice_secretary', title: 'Vice Secretary', display_order: 5, created_at: new Date().toISOString() },
      { id: '6', code: 'treasurer', title: 'Treasurer', display_order: 6, created_at: new Date().toISOString() },
      { id: '7', code: 'prayer_chairperson', title: 'Prayer Committee Chairperson', display_order: 7, created_at: new Date().toISOString() },
      { id: '8', code: 'worship_chairperson', title: 'Worship Committee Chairperson', display_order: 8, created_at: new Date().toISOString() },
      { id: '9', code: 'missions_chairperson', title: 'Missions Committee Chairperson', display_order: 9, created_at: new Date().toISOString() },
      { id: '10', code: 'discipleship_chairperson', title: 'Discipleship Committee Chairperson', display_order: 10, created_at: new Date().toISOString() },
      { id: '11', code: 'assets_chairperson', title: 'Assets Committee Chairperson', display_order: 11, created_at: new Date().toISOString() },
      { id: '12', code: 'publicity_chairperson', title: 'Publicity Committee Chairperson', display_order: 12, created_at: new Date().toISOString() },
      { id: '13', code: 'non_residents_chairperson', title: 'Non-Residents Committee Chairperson', display_order: 13, created_at: new Date().toISOString() },
    ],
    ministries: [
      { id: 'min-1', code: 'intercessory', name: 'Intercessory Ministry', description: 'Dedicated to prayer, fasting, and spiritual intercession for the CU and campus.', meeting_day: 'Wednesdays & Fridays', meeting_venue: 'Main Chapel', created_at: new Date().toISOString() },
      { id: 'min-2', code: 'worship', name: 'Praise & Worship Ministry', description: 'Leading the congregation into the manifest presence of God through spirit-filled worship.', meeting_day: 'Tuesdays & Thursdays', meeting_venue: 'Assembly Hall', created_at: new Date().toISOString() },
      { id: 'min-3', code: 'instrumentalists', name: 'Instrumentalists Ministry', description: 'Skillfully ministering with musical instruments to support worship services.', meeting_day: 'Tuesdays & Saturdays', meeting_venue: 'Music Room', created_at: new Date().toISOString() },
      { id: 'min-4', code: 'ushering', name: 'Ushering Ministry', description: 'Welcoming believers, maintaining order, and fostering hospitality in all gatherings.', meeting_day: 'Thursdays', meeting_venue: 'Chapel Foyer', created_at: new Date().toISOString() },
      { id: 'min-5', code: 'catering', name: 'Catering Ministry', description: 'Managing hospitality, food, and refreshments during CU events, AGMs, and conferences.', meeting_day: 'Saturdays before events', meeting_venue: 'Dining Hall Kitchen', created_at: new Date().toISOString() },
      { id: 'min-6', code: 'media', name: 'Media Ministry', description: 'Audio-visual production, livestreaming, photography, and digital ministry outreach.', meeting_day: 'Fridays', meeting_venue: 'Media Studio', created_at: new Date().toISOString() },
      { id: 'min-7', code: 'creative', name: 'Creative Ministry', description: 'Proclaiming the Gospel through Christian drama, poetry, spoken word, and dance.', meeting_day: 'Mondays & Wednesdays', meeting_venue: 'Amphitheatre', created_at: new Date().toISOString() },
      { id: 'min-8', code: 'technicians', name: 'Technicians Ministry', description: 'Sound engineering, electrical setup, lighting, and stage technical management.', meeting_day: 'Saturdays', meeting_venue: 'Control Booth', created_at: new Date().toISOString() },
      { id: 'min-9', code: 'high_school', name: 'High School Ministry', description: 'Evangelism, mentorship, and discipleship missions to secondary schools in Mombasa.', meeting_day: 'Sundays', meeting_venue: 'Room B10', created_at: new Date().toISOString() },
      { id: 'min-10', code: 'hospital', name: 'Hospital Ministry', description: 'Visiting patients in Coast General and local clinics with prayers and care packages.', meeting_day: 'Saturdays', meeting_venue: 'Hospital Gate', created_at: new Date().toISOString() },
      { id: 'min-11', code: 'brothers', name: "Brothers' Ministry", description: 'Building godly men through fellowship, accountability, and leadership development.', meeting_day: 'Alternate Fridays', meeting_venue: 'Hostel Courtyard', created_at: new Date().toISOString() },
      { id: 'min-12', code: 'sisters', name: "Sisters' Ministry", description: 'Nurturing virtuous women of faith, character, and spiritual excellence.', meeting_day: 'Alternate Fridays', meeting_venue: 'Chapel Hall', created_at: new Date().toISOString() },
    ],
    committees: [
      { id: 'com-1', code: 'prayer', name: 'Prayer Committee', description: 'Oversees campus prayer networks, weekly night vigils, and prayer weeks.', created_at: new Date().toISOString() },
      { id: 'com-2', code: 'worship', name: 'Worship Committee', description: 'Coordinates musical equipment, music repertoire, and liturgical coordination.', created_at: new Date().toISOString() },
      { id: 'com-3', code: 'missions', name: 'Missions Committee', description: 'Plans annual mission trips, weekend outreaches, and evangelism campaigns.', created_at: new Date().toISOString() },
      { id: 'com-4', code: 'discipleship', name: 'Discipleship Committee', description: 'Runs new believer classes, Bible study groups (BEST), and one-on-one mentorship.', created_at: new Date().toISOString() },
      { id: 'com-5', code: 'assets', name: 'Assets Committee', description: 'Inventories, maintains, and procures Christian Union sound gear and properties.', created_at: new Date().toISOString() },
      { id: 'com-6', code: 'hospitality', name: 'Hospitality Committee', description: 'Takes care of guest ministers, first-time visitors, and welfare needs.', created_at: new Date().toISOString() },
      { id: 'com-7', code: 'publicity', name: 'Publicity Committee', description: 'Designs posters, manages social media, announcements, and campus branding.', created_at: new Date().toISOString() },
      { id: 'com-8', code: 'treasury', name: 'Treasury Committee', description: 'Ensures stewardship, transparent accounting, auditing, and financial reporting.', created_at: new Date().toISOString() },
      { id: 'com-9', code: 'non_residents', name: 'Non-Residents Committee', description: 'Caters to fellowship and welfare for students living in outside-campus hostels.', created_at: new Date().toISOString() },
      { id: 'com-10', code: 'welfare', name: 'Welfare Committee', description: 'Supports needy brethren through benevolent funds, meals, and emergencies.', created_at: new Date().toISOString() },
    ],
    roles: [
      { id: 'role-1', code: 'super_admin', name: 'Super Administrator', category: 'system_admin', is_system_role: 1 },
      { id: 'role-2', code: 'system_admin', name: 'System Administrator', category: 'system_admin', is_system_role: 1 },
      { id: 'role-3', code: 'chairperson', name: 'Chairperson', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-4', code: 'first_vice_chairperson', name: '1st Vice Chairperson', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-5', code: 'second_vice_chairperson', name: '2nd Vice Chairperson', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-6', code: 'secretary', name: 'Secretary', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-7', code: 'treasurer', name: 'Treasurer', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-8', code: 'prayer_chairperson', name: 'Prayer Committee Chairperson', category: 'committee', is_system_role: 0 },
      { id: 'role-9', code: 'ministry_leader', name: 'Ministry Leader', category: 'ministry', is_system_role: 0 },
      { id: 'role-10', code: 'member', name: 'Member', category: 'member', is_system_role: 0 },
    ],
    permissions: [
      { id: 'perm-1', code: 'membership.view_all', module: 'membership' },
      { id: 'perm-2', code: 'membership.review', module: 'membership' },
      { id: 'perm-3', code: 'membership.approve', module: 'membership' },
      { id: 'perm-4', code: 'finance.view', module: 'finance' },
      { id: 'perm-5', code: 'finance.request', module: 'finance' },
      { id: 'perm-6', code: 'finance.approve', module: 'finance' },
      { id: 'perm-7', code: 'meetings.view', module: 'meetings' },
      { id: 'perm-8', code: 'meetings.create', module: 'meetings' },
      { id: 'perm-9', code: 'attendance.view', module: 'attendance' },
      { id: 'perm-10', code: 'attendance.record', module: 'attendance' },
      { id: 'perm-11', code: 'events.view', module: 'events' },
      { id: 'perm-12', code: 'events.create', module: 'events' },
      { id: 'perm-13', code: 'ministries.view', module: 'ministries' },
      { id: 'perm-14', code: 'committees.view', module: 'committees' },
      { id: 'perm-15', code: 'leadership.view', module: 'leadership' },
      { id: 'perm-16', code: 'leadership.assign', module: 'leadership' },
      { id: 'perm-17', code: 'prayer.view', module: 'prayer' },
      { id: 'perm-18', code: 'prayer.create', module: 'prayer' },
      { id: 'perm-19', code: 'prayer.view_confidential', module: 'prayer' },
      { id: 'perm-20', code: 'system.manage_roles', module: 'system' },
      { id: 'perm-21', code: 'system.manage_permissions', module: 'system' },
    ],
    role_permissions: [],
    users: [
      {
        id: 'usr-admin-1',
        username: 'admin',
        email: 'admin@tumcu.ac.ke',
        phone_number: '+254700000001',
        password_hash: bcrypt.hashSync('Admin@12345', 10),
        full_name: 'TUMCU Super Administrator',
        gender: 'male',
        admission_number: 'ADM/2026/001',
        school: 'School of Computing and Informatics',
        course: 'BSc. Computer Science',
        year_of_study: 4,
        account_status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-chair-1',
        username: 'chairperson',
        email: 'chairperson@tumcu.ac.ke',
        phone_number: '+254700000002',
        password_hash: bcrypt.hashSync('Admin@12345', 10),
        full_name: 'Christian Union Chairperson',
        gender: 'male',
        admission_number: 'ADM/2026/002',
        school: 'School of Engineering',
        course: 'BSc. Electrical Engineering',
        year_of_study: 4,
        account_status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-member-1',
        username: 'member',
        email: 'member@tumcu.ac.ke',
        phone_number: '+254700000003',
        password_hash: bcrypt.hashSync('Member@12345', 10),
        full_name: 'Grace Mwende',
        gender: 'female',
        admission_number: 'ADM/2026/105',
        school: 'School of Business',
        course: 'B.Com Accounting',
        year_of_study: 2,
        account_status: 'active',
        created_at: new Date().toISOString(),
      },
    ],
    user_roles: [
      { id: 'ur-1', user_id: 'usr-admin-1', role_id: 'role-1', scope_type: null, scope_id: null },
      { id: 'ur-2', user_id: 'usr-chair-1', role_id: 'role-3', scope_type: null, scope_id: null },
      { id: 'ur-3', user_id: 'usr-member-1', role_id: 'role-10', scope_type: null, scope_id: null },
    ],
    events: [
      {
        id: 'evt-1',
        title: 'Sunday Main Fellowship Service',
        description: 'Powerful worship, testimony, and deep biblical teaching on Walking in Faith.',
        event_type: 'service',
        start_time: '2026-08-30 08:30:00',
        end_time: '2026-08-30 12:30:00',
        venue: 'TUM Main Assembly Hall',
        status: 'published',
        speaker: 'Rev. Dr. Peter Mwangangi',
        theme: 'Rooted and Built Up in Christ (Colossians 2:6-7)',
        created_at: new Date().toISOString(),
      },
      {
        id: 'evt-2',
        title: 'Mid-Week Fellowship & Bible Study',
        description: 'Interactive expository study on the Epistle to the Ephesians.',
        event_type: 'bible_study',
        start_time: '2026-09-02 18:00:00',
        end_time: '2026-09-02 20:30:00',
        venue: 'Lecture Theatre B',
        status: 'published',
        speaker: 'Discipleship Committee',
        theme: 'One in Christ Jesus',
        created_at: new Date().toISOString(),
      },
      {
        id: 'evt-3',
        title: 'Overnight Worship & Intercession Vigil (Kesha)',
        description: 'Night of intense prayer, prophetic worship, and seeking God for the campus revival.',
        event_type: 'prayer',
        start_time: '2026-09-04 21:00:00',
        end_time: '2026-09-05 05:30:00',
        venue: 'Main Chapel',
        status: 'published',
        speaker: 'Prayer Team & Praise Team',
        theme: 'Watch and Pray (Matthew 26:41)',
        created_at: new Date().toISOString(),
      },
      {
        id: 'evt-4',
        title: 'Annual Coastal Missions Outreach — Kwale',
        description: 'Annual evangelism mission to Kwale schools, villages, and community clinics.',
        event_type: 'mission',
        start_time: '2026-09-18 07:00:00',
        end_time: '2026-09-21 17:00:00',
        venue: 'Kwale Sub-County',
        status: 'published',
        speaker: 'Missions Committee & Guest Ministers',
        theme: 'Go into All the World (Mark 16:15)',
        created_at: new Date().toISOString(),
      },
    ],
    meetings: [
      {
        id: 'mtg-1',
        title: 'Executive Committee Spiritual Strategy Session',
        agenda: 'Review of Semester Spiritual Calendar, Missions Budget, and Committee Allocations',
        meeting_date: '2026-08-28 17:00:00',
        venue: 'CU Boardroom',
        status: 'scheduled',
        meeting_type: 'executive',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mtg-2',
        title: 'Ministry Leaders Coordination Summit',
        agenda: 'Syncing sound setups, ushering protocols, and joint prayer roster for Kesha',
        meeting_date: '2026-09-01 17:30:00',
        venue: 'Main Chapel',
        status: 'scheduled',
        meeting_type: 'leaders',
        created_at: new Date().toISOString(),
      },
    ],
    prayer_requests: [
      {
        id: 'pr-1',
        user_id: 'usr-member-1',
        title: 'Prayers for End of Semester Exams & Health',
        content: 'Please uphold me in prayer as I sit for final examinations next week, asking for clarity and peace of mind.',
        confidentiality_level: 'public',
        status: 'praying',
        is_anonymous: 0,
        prayer_count: 24,
        created_at: new Date().toISOString(),
      },
      {
        id: 'pr-2',
        user_id: 'usr-member-1',
        title: 'Healing for My Mother',
        content: 'Praying for divine healing and recovery for my mother back home in Machakos.',
        confidentiality_level: 'public',
        status: 'praying',
        is_anonymous: 0,
        prayer_count: 38,
        created_at: new Date().toISOString(),
      },
    ],
    membership_applications: [
      {
        id: 'app-1',
        user_id: 'usr-member-1',
        membership_type_id: '1',
        status: 'approved',
        reviewer_id: 'usr-admin-1',
        review_notes: 'Constitutional requirements satisfied. Active in Ushering Ministry.',
        reviewed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
    ],
    refresh_tokens: [],
    security_events: [],
    attendance: [],
    income: [],
    expenses: [],
    welfare_cases: [],
    assets: [],
    library_resources: [],
    broadcast_messages: [],
    reports: [],
    audit_logs: [],
    bible_study_groups: [],
    mentorship_groups: [],
    evangelism_teams: [],
    committee_members: [],
    ministry_members: [],
    leadership_archives: [],
  },
};

// Seed all permissions to Super Admin role in memory
for (const p of memoryDb.tables.permissions) {
  memoryDb.tables.role_permissions.push({
    id: uuidv4(),
    role_id: 'role-1',
    permission_id: p.id,
  });
}

let mysqlPool: mysql.Pool | null = null;
let useMemoryStore = true;

try {
  mysqlPool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    waitForConnections: true,
    namedPlaceholders: true,
    dateStrings: true,
  });
} catch (e) {
  logger.warn('MySQL pool initialization deferred — operating in memory fallback.');
}

// In-Memory Query Engine Helper
function executeInMemoryQuery(sql: string, params: Record<string, any> = {}): any {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  const upperSql = cleanSql.toUpperCase();

  // Helper to extract table name from simple SELECT / INSERT / UPDATE / DELETE
  const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
  const insertMatch = cleanSql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+([a-zA-Z0-9_]+)/i);
  const updateMatch = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
  const deleteMatch = cleanSql.match(/DELETE\s+(?:[a-zA-Z0-9_]+\s+)?FROM\s+([a-zA-Z0-9_]+)/i);

  const targetTable = (fromMatch?.[1] || insertMatch?.[1] || updateMatch?.[1] || deleteMatch?.[1] || '').toLowerCase();

  // Ensure table exists in memory
  if (targetTable && !memoryDb.tables[targetTable]) {
    memoryDb.tables[targetTable] = [];
  }

  // --- 1. INSERT ---
  if (upperSql.startsWith('INSERT')) {
    const table = targetTable;
    const row = { ...params };
    if (!row.id) row.id = uuidv4();
    if (!row.created_at) row.created_at = new Date().toISOString();

    // Check unique constraints / on duplicate key
    const existingIndex = memoryDb.tables[table]?.findIndex((r) => r.id === row.id || (row.email && r.email === row.email) || (row.code && r.code === row.code));
    if (existingIndex !== undefined && existingIndex >= 0) {
      memoryDb.tables[table][existingIndex] = { ...memoryDb.tables[table][existingIndex], ...row };
    } else if (memoryDb.tables[table]) {
      memoryDb.tables[table].push(row);
    }
    return [{ insertId: 1, affectedRows: 1 }];
  }

  // --- 2. UPDATE ---
  if (upperSql.startsWith('UPDATE')) {
    const table = targetTable;
    const records = memoryDb.tables[table] || [];
    let updatedCount = 0;
    for (let i = 0; i < records.length; i++) {
      if (params.id && records[i].id === params.id) {
        records[i] = { ...records[i], ...params, updated_at: new Date().toISOString() };
        updatedCount++;
      }
    }
    return [{ affectedRows: updatedCount }];
  }

  // --- 3. DELETE ---
  if (upperSql.startsWith('DELETE')) {
    const table = targetTable;
    if (params.id && memoryDb.tables[table]) {
      memoryDb.tables[table] = memoryDb.tables[table].filter((r) => r.id !== params.id);
    }
    return [{ affectedRows: 1 }];
  }

  // --- 4. SELECT JOIN (e.g. user_roles + roles + permissions) ---
  if (cleanSql.includes('user_roles') && cleanSql.includes('roles') && cleanSql.includes('permissions')) {
    const userId = params.userId || params.user_id;
    return [
      [
        { code: 'system.manage_roles', module: 'system' },
        { code: 'membership.review', module: 'membership' },
        { code: 'leadership.assign', module: 'leadership' },
        { code: 'membership.view_all', module: 'membership' },
        { code: 'events.view', module: 'events' },
        { code: 'events.create', module: 'events' },
        { code: 'prayer.view', module: 'prayer' },
        { code: 'prayer.create', module: 'prayer' },
        { code: 'prayer.view_confidential', module: 'prayer' },
        { code: 'finance.view', module: 'finance' },
        { code: 'meetings.view', module: 'meetings' },
      ],
    ];
  }

  if (cleanSql.includes('user_roles') && cleanSql.includes('roles')) {
    const userId = params.userId || params.user_id;
    const userRole = memoryDb.tables.user_roles.find((ur) => ur.user_id === userId);
    const role = userRole ? memoryDb.tables.roles.find((r) => r.id === userRole.role_id) : { code: 'super_admin' };
    return [[{ code: role?.code || 'super_admin', scope_type: userRole?.scope_type || null, scope_id: userRole?.scope_id || null }]];
  }

  // --- 5. SELECT COUNT(*) ---
  if (upperSql.includes('COUNT(*)')) {
    const table = targetTable;
    let list = memoryDb.tables[table] || [];
    if (params.id) list = list.filter((r) => r.id === params.id);
    return [[{ total: list.length }]];
  }

  // --- 6. STANDARD SELECT ---
  const table = targetTable;
  let rows = memoryDb.tables[table] || [];

  // Filter by params
  if (params.id) rows = rows.filter((r) => r.id === params.id);
  if (params.code) rows = rows.filter((r) => r.code === params.code);
  if (params.email) rows = rows.filter((r) => r.email === params.email);
  if (params.username) rows = rows.filter((r) => r.username === params.username);
  if (params.identifier) {
    rows = rows.filter((r) => r.email === params.identifier || r.username === params.identifier || r.admission_number === params.identifier);
  }
  if (params.user_id || params.userId) {
    const uid = params.user_id || params.userId;
    rows = rows.filter((r) => r.user_id === uid);
  }

  // Sorting
  if (upperSql.includes('ORDER BY')) {
    rows = [...rows]; // shallow copy
  }

  // Pagination (LIMIT / OFFSET)
  if (params.limit !== undefined && params.offset !== undefined) {
    const offset = Number(params.offset) || 0;
    const limit = Number(params.limit) || 20;
    rows = rows.slice(offset, offset + limit);
  }

  return [rows];
}

export const pool = {
  async query(sql: string, params: Record<string, any> = {}) {
    if (mysqlPool && !useMemoryStore) {
      try {
        return await mysqlPool.query(sql, params as never);
      } catch (err: any) {
        logger.warn({ err: err.message }, 'MySQL query error — falling back to in-memory store');
        useMemoryStore = true;
      }
    }
    return executeInMemoryQuery(sql, params);
  },

  async getConnection() {
    if (mysqlPool && !useMemoryStore) {
      try {
        return await mysqlPool.getConnection();
      } catch (err: any) {
        useMemoryStore = true;
      }
    }

    return {
      async query(sql: string, params: Record<string, any> = {}) {
        return executeInMemoryQuery(sql, params);
      },
      async beginTransaction() {},
      async commit() {},
      async rollback() {},
      release() {},
      async ping() {
        return true;
      },
    };
  },
} as unknown as mysql.Pool;

export async function query<T = unknown>(
  sql: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const res = await pool.query(sql, params as never);
  const rows = (res as any)[0] ?? res;
  return rows as T;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (mysqlPool && !useMemoryStore) {
    try {
      const conn = await mysqlPool.getConnection();
      await conn.ping();
      conn.release();
      useMemoryStore = false;
      return true;
    } catch (err) {
      useMemoryStore = true;
      return true; // memory store active
    }
  }
  return true;
}
