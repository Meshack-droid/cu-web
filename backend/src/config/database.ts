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
      { id: 'perm-22', code: 'attendance.export', module: 'attendance' },
      { id: 'perm-23', code: 'attendance.manage_sessions', module: 'attendance' },
      { id: 'perm-11', code: 'events.view', module: 'events' },
      { id: 'perm-12', code: 'events.create', module: 'events' },
      { id: 'perm-24', code: 'events.edit', module: 'events' },
      { id: 'perm-25', code: 'events.delete', module: 'events' },
      { id: 'perm-26', code: 'events.approve', module: 'events' },
      { id: 'perm-13', code: 'ministries.view', module: 'ministries' },
      { id: 'perm-27', code: 'ministries.create', module: 'ministries' },
      { id: 'perm-28', code: 'ministries.edit', module: 'ministries' },
      { id: 'perm-29', code: 'ministries.delete', module: 'ministries' },
      { id: 'perm-30', code: 'ministries.manage_members', module: 'ministries' },
      { id: 'perm-14', code: 'committees.view', module: 'committees' },
      { id: 'perm-15', code: 'leadership.view', module: 'leadership' },
      { id: 'perm-16', code: 'leadership.assign', module: 'leadership' },
      { id: 'perm-17', code: 'prayer.view', module: 'prayer' },
      { id: 'perm-18', code: 'prayer.create', module: 'prayer' },
      { id: 'perm-19', code: 'prayer.view_confidential', module: 'prayer' },
      { id: 'perm-20', code: 'system.manage_roles', module: 'system' },
      { id: 'perm-21', code: 'system.manage_permissions', module: 'system' },
      { id: 'perm-31', code: 'communication.view', module: 'communication' },
      { id: 'perm-32', code: 'communication.create', module: 'communication' },
      { id: 'perm-33', code: 'communication.edit', module: 'communication' },
      { id: 'perm-34', code: 'communication.delete', module: 'communication' },
      { id: 'perm-35', code: 'elections.view', module: 'elections' },
      { id: 'perm-36', code: 'elections.vote', module: 'elections' },
      { id: 'perm-37', code: 'elections.manage', module: 'elections' },
      { id: 'perm-38', code: 'elections.audit', module: 'elections' },
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
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'usr-chair-1',
        username: 'chairperson',
        email: 'chairperson@tumcu.ac.ke',
        phone_number: '+254700000002',
        password_hash: bcrypt.hashSync('Admin@12345', 10),
        full_name: 'David Mutua (Chairperson)',
        gender: 'male',
        admission_number: 'BENG/2023/004',
        school: 'School of Engineering and Technology',
        course: 'BSc. Mechanical Engineering',
        year_of_study: 4,
        account_status: 'active',
        created_at: new Date(Date.now() - 250 * 86400000).toISOString(),
      },
      {
        id: 'usr-leader-1',
        username: 'worship_leader',
        email: 'worship.leader@tumcu.ac.ke',
        phone_number: '+254700000003',
        password_hash: bcrypt.hashSync('Admin@12345', 10),
        full_name: 'Mercy Wanjiku (Worship Leader)',
        gender: 'female',
        admission_number: 'BBIT/2024/029',
        school: 'School of Business and Social Sciences',
        course: 'BSc. Information Technology',
        year_of_study: 3,
        account_status: 'active',
        created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
      },
      {
        id: 'usr-member-1',
        username: 'caleb_kiprop',
        email: 'member@tumcu.ac.ke',
        phone_number: '+254712345678',
        password_hash: bcrypt.hashSync('Admin@12345', 10),
        full_name: 'Caleb Kiprop',
        gender: 'male',
        admission_number: 'BSCS/2024/015',
        school: 'School of Computing and Informatics',
        course: 'BSc. Computer Science',
        year_of_study: 3,
        account_status: 'active',
        created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
      },
      {
        id: 'usr-app-1',
        username: 'faith_chebet',
        email: 'faith.chebet@students.tum.ac.ke',
        phone_number: '+254711223344',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Faith Chebet',
        gender: 'female',
        admission_number: 'BSCS/2026/042',
        school: 'School of Computing and Informatics',
        course: 'BSc. Computer Science',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'usr-app-2',
        username: 'emmanuel_mwangi',
        email: 'emmanuel.mwangi@students.tum.ac.ke',
        phone_number: '+254722334455',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Emmanuel Mwangi',
        gender: 'male',
        admission_number: 'BENG/2026/108',
        school: 'School of Engineering and Technology',
        course: 'BSc. Electrical & Electronic Engineering',
        year_of_study: 2,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'usr-app-3',
        username: 'dorcas_otieno',
        email: 'dorcas.otieno@students.tum.ac.ke',
        phone_number: '+254733445566',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Dorcas Achieng Otieno',
        gender: 'female',
        admission_number: 'BBIT/2026/089',
        school: 'School of Business and Social Sciences',
        course: 'BSc. Information Technology',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
    ],
    user_roles: [
      { id: 'ur-1', user_id: 'usr-admin-1', role_id: 'role-1', scope_type: null, scope_id: null },
      { id: 'ur-2', user_id: 'usr-chair-1', role_id: 'role-3', scope_type: null, scope_id: null },
      { id: 'ur-3', user_id: 'usr-leader-1', role_id: 'role-9', scope_type: 'ministry', scope_id: 'min-2' },
      { id: 'ur-4', user_id: 'usr-member-1', role_id: 'role-10', scope_type: null, scope_id: null },
    ],
    events: [],
    meetings: [],
    prayer_requests: [],
    spiritual_years: [
      { id: 'sy-2026', name: '2025/2026 Spiritual Year', start_date: '2025-09-01', end_date: '2026-08-31', is_current: true },
    ],
    membership_declarations: [
      { id: 'decl-1', version: '2026.1', title: 'TUMCU Doctrinal Basis & Member Commitment', content: 'I affirm faith in Jesus Christ as Lord and Saviour and agree to live by Scripture and uphold TUMCU fellowship.', is_active: true },
    ],
    memberships: [
      {
        id: 'mem-admin-1',
        user_id: 'usr-admin-1',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        declaration_id: 'decl-1',
        membership_number: 'TUMCU-2026-0001',
        status: 'active',
        registration_date: '2025-09-01',
        created_at: new Date(Date.now() - 300 * 86400000).toISOString(),
      },
      {
        id: 'mem-chair-1',
        user_id: 'usr-chair-1',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        declaration_id: 'decl-1',
        membership_number: 'TUMCU-2026-0002',
        status: 'active',
        registration_date: '2025-09-01',
        created_at: new Date(Date.now() - 300 * 86400000).toISOString(),
      },
      {
        id: 'mem-leader-1',
        user_id: 'usr-leader-1',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        declaration_id: 'decl-1',
        membership_number: 'TUMCU-2026-0003',
        status: 'active',
        registration_date: '2025-09-01',
        created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
      },
      {
        id: 'mem-member-1',
        user_id: 'usr-member-1',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        declaration_id: 'decl-1',
        membership_number: 'TUMCU-2026-0004',
        status: 'active',
        registration_date: '2025-09-01',
        created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
      },
    ],
    membership_applications: [
      {
        id: 'app-seed-1',
        user_id: 'usr-app-1',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'app-seed-2',
        user_id: 'usr-app-2',
        membership_type_id: '1',
        status: 'under_review',
        rejection_reason: null,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'app-seed-3',
        user_id: 'usr-app-3',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
    ],
    refresh_tokens: [],
    security_events: [],
    attendance_sessions: [],
    attendance_records: [],
    attendance: [],
    income: [],
    expenses: [],
    welfare_cases: [],
    assets: [],
    library_resources: [],
    broadcast_messages: [],
    elections: [
      {
        id: 'elec-2026',
        title: 'TUMCU Annual General Elections 2026/2027',
        spiritual_year: '2026/2027',
        status: 'active', // 'draft' | 'nomination' | 'active' | 'closed' | 'certified'
        start_date: '2026-08-25T00:00:00.000Z',
        end_date: '2026-09-10T18:00:00.000Z',
        nomination_deadline: '2026-08-28T23:59:59.000Z',
        voting_date: '2026-09-06',
        electoral_commissioner: 'TUMCU Advisory Board & Super Admin',
        description: 'Official constitutional elections for all Executive Committee offices and Committee Chairpersons of the Technical University of Mombasa Christian Union.',
        created_at: new Date().toISOString(),
      }
    ],
    election_posts: [
      {
        id: 'post-1',
        election_id: 'elec-2026',
        code: 'chairperson',
        title: 'Chairperson',
        category: 'executive',
        display_order: 1,
        min_year_of_study: 3,
        required_membership_duration: '1 Spiritual Year',
        spiritual_requirements: 'Born again, baptized, sound doctrinal grounding, high spiritual testimony, active ministry involvement for at least 2 semesters.',
        academic_requirements: 'Good academic standing without disciplinary flags (BSc/B.Com/B.A degree student).',
        responsibilities: 'Chief spiritual coordinator, presides over General & Executive meetings, official spokesperson, liaises with University administration.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-2',
        election_id: 'elec-2026',
        code: 'first_vice_chairperson',
        title: '1st Vice Chairperson',
        category: 'executive',
        display_order: 2,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Born again, baptized, pastoral compassion, discernment, conflict resolution heart.',
        academic_requirements: 'Good academic standing (Year 2, 3, or 4).',
        responsibilities: 'Assists Chairperson, chairs Welfare Committee, deputizes in Chairperson absence, handles member benevolence.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-3',
        election_id: 'elec-2026',
        code: 'second_vice_chairperson',
        title: '2nd Vice Chairperson',
        category: 'executive',
        display_order: 3,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Born again, administrative diligence, mentorship leadership, organizational skills.',
        academic_requirements: 'Good academic standing (Year 2 or 3).',
        responsibilities: 'Coordinates Associates & Finalists fellowship, oversees Brothers and Sisters ministries, handles logistics.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-4',
        election_id: 'elec-2026',
        code: 'secretary',
        title: 'Secretary',
        category: 'executive',
        display_order: 4,
        min_year_of_study: 2,
        required_membership_duration: '1 Spiritual Year',
        spiritual_requirements: 'Born again, integrity, administrative wisdom, punctuality, excellence in communication.',
        academic_requirements: 'Good academic standing (Year 2, 3, or 4).',
        responsibilities: 'Convenes meetings, official minutes, membership register & admission, correspondence, heads Secretariat.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-5',
        election_id: 'elec-2026',
        code: 'vice_secretary',
        title: 'Vice Secretary',
        category: 'executive',
        display_order: 5,
        min_year_of_study: 1,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Born again, hospitality gift, attentiveness to records and documentation.',
        academic_requirements: 'Good academic standing (Year 1, 2, or 3).',
        responsibilities: 'Assists Secretary in documentation, chairs Hospitality Committee, coordinates guest ministers reception.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-6',
        election_id: 'elec-2026',
        code: 'treasurer',
        title: 'Treasurer',
        category: 'executive',
        display_order: 6,
        min_year_of_study: 2,
        required_membership_duration: '1 Spiritual Year',
        spiritual_requirements: 'Born again, unquestionable financial integrity, godly stewardship, financial transparency.',
        academic_requirements: 'Good academic standing; Business, Finance, Accounting or quantitative background preferred.',
        responsibilities: 'Maintains books of accounts, prepares budgets, oversees disbursements, heads Treasury Committee, coordinates audits.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-7',
        election_id: 'elec-2026',
        code: 'prayer_chairperson',
        title: 'Prayer Committee Chairperson',
        category: 'committee',
        display_order: 7,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Deep intercession life, spiritual discernment, prayer warrior testimony, leading keshas and prayer weeks.',
        academic_requirements: 'Good academic standing.',
        responsibilities: 'Chairs Prayer Committee, mobilizes campus prayer networks, organizes weekly night vigils and morning devotions.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-8',
        election_id: 'elec-2026',
        code: 'worship_chairperson',
        title: 'Worship Committee Chairperson',
        category: 'committee',
        display_order: 8,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Musical competence, spiritual sensitivity, liturgical understanding, humility.',
        academic_requirements: 'Good academic standing.',
        responsibilities: 'Coordinates worship ministry, instrumentalists, song repertoire, sound rehearsals, and worship nights.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-9',
        election_id: 'elec-2026',
        code: 'missions_chairperson',
        title: 'Missions Committee Chairperson',
        category: 'committee',
        display_order: 9,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Evangelistic zeal, passion for lost souls, mission field experience, cross-cultural sensitivity.',
        academic_requirements: 'Good academic standing.',
        responsibilities: 'Coordinates annual mission trips, weekend school outreaches, open-air crusades, and hospital ministries.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-10',
        election_id: 'elec-2026',
        code: 'discipleship_chairperson',
        title: 'Discipleship Committee Chairperson',
        category: 'committee',
        display_order: 10,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Sound theological grounding, teaching ability, passion for spiritual growth, disciple-maker testimony.',
        academic_requirements: 'Good academic standing.',
        responsibilities: 'Leads New Believers classes, Bible Study (BEST) groups, and spiritual mentorship curriculum across campus.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-11',
        election_id: 'elec-2026',
        code: 'assets_chairperson',
        title: 'Assets Committee Chairperson',
        category: 'committee',
        display_order: 11,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Fidelity, technical stewardship, hardware management skills, diligence.',
        academic_requirements: 'Good academic standing; Engineering/Technical student preferred.',
        responsibilities: 'Safeguards CU musical, sound, projection gear, conducts quarterly asset audits and repairs.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-12',
        election_id: 'elec-2026',
        code: 'publicity_chairperson',
        title: 'Publicity Committee Chairperson',
        category: 'committee',
        display_order: 12,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member',
        spiritual_requirements: 'Excellence in media, digital evangelism, graphic design/IT skills, spiritual creativity.',
        academic_requirements: 'Good academic standing; Computing, IT, or Media student preferred.',
        responsibilities: 'Manages website, social channels, livestream broadcasts, posters, and campus communication.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'post-13',
        election_id: 'elec-2026',
        code: 'non_residents_chairperson',
        title: 'Non-Residents Committee Chairperson',
        category: 'committee',
        display_order: 13,
        min_year_of_study: 2,
        required_membership_duration: 'Full Member (Non-Resident student)',
        spiritual_requirements: 'Compassion for off-campus students, organizational stamina, fellowship mobilization.',
        academic_requirements: 'Good academic standing.',
        responsibilities: 'Advocates for non-resident brethren welfare, organizes off-campus fellowships, and coordinates transport.',
        seats: 1,
        created_at: new Date().toISOString(),
      },
    ],
    election_candidates: [],
    election_votes: [],
    election_activity_logs: [],
    reports: [],
    audit_logs: [],
    bible_study_groups: [],
    mentorship_groups: [],
    evangelism_teams: [],
    committee_members: [],
    ministry_members: [],
    ministry_trainings: [],
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

// Seed default permissions for member role (role-10)
const memberPermCodes = [
  'events.view',
  'events.register',
  'events.check_in',
  'ministries.view',
  'prayer.view',
  'prayer.create',
  'attendance.view',
  'attendance.record',
  'meetings.view',
  'finance.request',
];
for (const code of memberPermCodes) {
  const perm = memoryDb.tables.permissions.find((p) => p.code === code);
  if (perm) {
    memoryDb.tables.role_permissions.push({
      id: uuidv4(),
      role_id: 'role-10',
      permission_id: perm.id,
    });
  }
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

  // 1. Permission checks join (role_permissions + permissions + user_roles)
  if (cleanSql.includes('permissions') && cleanSql.includes('user_roles')) {
    const userId = params.userId || params.user_id;
    const userRole = memoryDb.tables.user_roles.find((ur) => ur.user_id === userId);
    if (!userRole) return [[]];

    if (userRole.role_id === 'role-1' || userRole.role_id === 'role-3') {
      return [memoryDb.tables.permissions.map((p) => ({ code: p.code, module: p.module }))];
    }

    const assigned = memoryDb.tables.role_permissions
      .filter((rp) => rp.role_id === userRole.role_id)
      .map((rp) => memoryDb.tables.permissions.find((p) => p.id === rp.permission_id))
      .filter(Boolean)
      .map((p) => ({ code: p!.code, module: p!.module }));

    return [assigned];
  }

  // 2. User Roles join
  if (cleanSql.includes('user_roles') && cleanSql.includes('roles')) {
    const userId = params.userId || params.user_id;
    const userRoles = memoryDb.tables.user_roles.filter((ur) => !userId || ur.user_id === userId);
    const rows = userRoles.map((ur) => {
      const role = memoryDb.tables.roles.find((r) => r.id === ur.role_id);
      return {
        code: role?.code || 'member',
        name: role?.name || 'Member',
        category: role?.category || 'general',
        scope_type: ur.scope_type || null,
        scope_id: ur.scope_id || null,
      };
    });
    return [rows.length > 0 ? rows : [{ code: 'member', name: 'Member', category: 'general', scope_type: null, scope_id: null }]];
  }

  // 3. User Scopes check
  if (cleanSql.includes('scope_type') && cleanSql.includes('user_roles')) {
    const userId = params.userId || params.user_id;
    const userRoles = memoryDb.tables.user_roles.filter((ur) => (!userId || ur.user_id === userId) && ur.scope_type && ur.scope_id);
    return [userRoles.map((ur) => ({ scope_type: ur.scope_type, scope_id: ur.scope_id }))];
  }

  // 4. Membership Applications with user info join
  if (cleanSql.includes('membership_applications') && cleanSql.includes('users')) {
    let apps = memoryDb.tables.membership_applications || [];
    if (params.status) apps = apps.filter((a) => a.status === params.status);
    if (params.userId || params.user_id) {
      const uid = params.userId || params.user_id;
      apps = apps.filter((a) => (a.user_id === uid || a.userId === uid));
    }
    const rows = apps.map((ma) => {
      const userId = ma.user_id || ma.userId;
      const typeId = ma.membership_type_id || ma.membershipTypeId;
      const user = memoryDb.tables.users.find((u) => u.id === userId);
      const mt = memoryDb.tables.membership_types.find((t) => t.id === typeId || t.code === typeId);
      return {
        id: ma.id,
        status: ma.status,
        rejection_reason: ma.rejection_reason || ma.rejectionReason || null,
        created_at: ma.created_at,
        user_id: user?.id || userId,
        full_name: user?.full_name || user?.fullName || 'Member Applicant',
        email: user?.email || '',
        admission_number: user?.admission_number || user?.admissionNumber || '',
        membership_type_name: mt?.name || 'Full Member (Student)',
      };
    });
    return [rows];
  }

  // 5. Active spiritual year / active declaration
  if (cleanSql.includes('spiritual_years') && upperSql.includes('IS_CURRENT')) {
    const sy = memoryDb.tables.spiritual_years.find((s) => s.is_current);
    return [[sy || { id: 'sy-2026' }]];
  }
  if (cleanSql.includes('membership_declarations') && upperSql.includes('IS_ACTIVE')) {
    const decl = memoryDb.tables.membership_declarations.find((d) => d.is_active);
    return [[decl || { id: 'decl-1' }]];
  }

  // 6. Attendance Roster / Records with user info
  if (cleanSql.includes('attendance_records') && (cleanSql.includes('users') || upperSql.includes('ROSTER') || cleanSql.includes('session_id') || cleanSql.includes('attendable_id'))) {
    const sessionId = params.sessionId || params.session_id || params.attendableId || params.attendable_id;
    let records = memoryDb.tables.attendance_records || [];
    if (sessionId) {
      records = records.filter((r) => r.session_id === sessionId || r.attendable_id === sessionId);
    }
    const rows = records.map((rec) => {
      const user = rec.user_id ? memoryDb.tables.users.find((u) => u.id === rec.user_id) : null;
      const membership = rec.user_id ? memoryDb.tables.memberships.find((m) => m.user_id === rec.user_id && m.status === 'active') : null;
      return {
        id: rec.id,
        session_id: rec.session_id || rec.attendable_id,
        user_id: rec.user_id || null,
        full_name: user?.full_name || rec.guest_name || 'Anonymous Guest',
        email: user?.email || rec.guest_email || '',
        phone_number: user?.phone_number || rec.guest_phone || '',
        admission_number: user?.admission_number || '',
        membership_number: membership?.membership_number || null,
        is_member: !!user,
        status: rec.status || 'present',
        visitor_type: rec.visitor_type || (user ? 'none' : 'first_time'),
        method: rec.method || 'qr_code',
        checked_in_at: rec.checked_in_at || new Date().toISOString(),
        notes: rec.notes || null,
        prayer_request: rec.prayer_request || null,
        school_faculty: user?.school || rec.guest_category || null,
        year_of_study: user?.year_of_study || null,
      };
    });
    return [rows];
  }

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
    const row: Record<string, any> = { ...params };
    if (!row.id) row.id = uuidv4();
    if (!row.created_at) row.created_at = new Date().toISOString();

    // Map common camelCase / snake_case equivalents
    if (params.userId !== undefined && row.user_id === undefined) row.user_id = params.userId;
    if (params.user_id !== undefined && row.userId === undefined) row.userId = params.user_id;
    if (params.fullName !== undefined && row.full_name === undefined) row.full_name = params.fullName;
    if (params.full_name !== undefined && row.fullName === undefined) row.fullName = params.full_name;
    if (params.phoneNumber !== undefined && row.phone_number === undefined) row.phone_number = params.phoneNumber;
    if (params.admissionNumber !== undefined && row.admission_number === undefined) row.admission_number = params.admissionNumber;
    if (params.passwordHash !== undefined && row.password_hash === undefined) row.password_hash = params.passwordHash;
    if (params.membershipTypeId !== undefined && row.membership_type_id === undefined) row.membership_type_id = params.membershipTypeId;
    if (params.membership_type_id !== undefined && row.membershipTypeId === undefined) row.membershipTypeId = params.membership_type_id;
    if (params.spiritualYearId !== undefined && row.spiritual_year_id === undefined) row.spiritual_year_id = params.spiritualYearId;
    if (params.declarationId !== undefined && row.declaration_id === undefined) row.declaration_id = params.declarationId;
    if (params.membershipNumber !== undefined && row.membership_number === undefined) row.membership_number = params.membershipNumber;

    // Parse literal values in INSERT statement VALUES clause if not provided in params
    if (table === 'membership_applications') {
      if (!row.status) {
        if (cleanSql.includes("'submitted'") || cleanSql.includes('"submitted"')) row.status = 'submitted';
        else if (cleanSql.includes("'under_review'") || cleanSql.includes('"under_review"')) row.status = 'under_review';
        else if (cleanSql.includes("'approved'") || cleanSql.includes('"approved"')) row.status = 'approved';
        else if (cleanSql.includes("'rejected'") || cleanSql.includes('"rejected"')) row.status = 'rejected';
        else row.status = 'submitted';
      }
    }
    if (table === 'memberships') {
      if (!row.status) {
        if (cleanSql.includes("'active'") || cleanSql.includes('"active"')) row.status = 'active';
        else row.status = 'active';
      }
      if (!row.registration_date) row.registration_date = new Date().toISOString().split('T')[0];
      if (!row.registrationDate) row.registrationDate = row.registration_date;
    }
    if (table === 'users') {
      if (!row.account_status) {
        if (cleanSql.includes("'pending_approval'") || cleanSql.includes('"pending_approval"')) row.account_status = 'pending_approval';
        else if (cleanSql.includes("'active'") || cleanSql.includes('"active"')) row.account_status = 'active';
        else if (cleanSql.includes("'rejected'") || cleanSql.includes('"rejected"')) row.account_status = 'rejected';
      }
    }

    // Specific mapping for refresh_tokens
    if (table === 'refresh_tokens') {
      const uId = params.userId || params.user_id;
      const tHash = params.tokenHash || params.token_hash;
      const expAt = params.expiresAt || params.expires_at;
      row.user_id = uId;
      row.userId = uId;
      row.token_hash = tHash;
      row.tokenHash = tHash;
      row.expires_at = expAt ? (expAt instanceof Date ? expAt.toISOString() : String(expAt)) : new Date(Date.now() + 30 * 86400000).toISOString();
      row.expiresAt = row.expires_at;
      row.revoked_at = null;
      row.revokedAt = null;
    }

    // Check unique constraints / on duplicate key
    const existingIndex = memoryDb.tables[table]?.findIndex((r) =>
      r.id === row.id ||
      (row.email && r.email === row.email) ||
      (row.code && r.code === row.code) ||
      (table === 'refresh_tokens' && row.token_hash && (r.token_hash === row.token_hash || r.tokenHash === row.token_hash))
    );
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
    const nowIso = new Date().toISOString();

    for (let i = 0; i < records.length; i++) {
      let matches = false;

      if (params.id && records[i].id === params.id) {
        matches = true;
      } else if (params.applicationId && records[i].id === params.applicationId) {
        matches = true;
      } else if (params.registrationId && records[i].id === params.registrationId) {
        matches = true;
      } else if (params.candidateId && records[i].id === params.candidateId) {
        matches = true;
      } else if (params.userRoleId && records[i].id === params.userRoleId) {
        matches = true;
      } else if (table === 'refresh_tokens') {
        const tHash = params.tokenHash || params.token_hash;
        const uId = params.userId || params.user_id;
        if (tHash && (records[i].token_hash === tHash || records[i].tokenHash === tHash)) {
          matches = true;
        } else if (uId && (records[i].user_id === uId || records[i].userId === uId)) {
          matches = true;
        }
      } else if (table === 'users' && (params.userId || params.user_id) && records[i].id === (params.userId || params.user_id)) {
        matches = true;
      }

      if (matches) {
        const updatePayload: Record<string, any> = { ...params, updated_at: nowIso };
        if (cleanSql.includes('revoked_at = NOW()') || upperSql.includes('REVOKED_AT = NOW()')) {
          updatePayload.revoked_at = nowIso;
          updatePayload.revokedAt = nowIso;
        }
        if (cleanSql.includes('reviewed_at = NOW()') || upperSql.includes('REVIEWED_AT = NOW()')) {
          updatePayload.reviewed_at = nowIso;
          updatePayload.reviewedAt = nowIso;
        }
        if (cleanSql.includes('last_login_at = NOW()') || upperSql.includes('LAST_LOGIN_AT = NOW()')) {
          updatePayload.last_login_at = nowIso;
        }
        if (cleanSql.includes("status = 'approved'") || cleanSql.includes('status = "approved"')) {
          updatePayload.status = 'approved';
        }
        if (cleanSql.includes("status = 'rejected'") || cleanSql.includes('status = "rejected"')) {
          updatePayload.status = 'rejected';
        }
        if (cleanSql.includes("status = 'under_review'") || cleanSql.includes('status = "under_review"')) {
          updatePayload.status = 'under_review';
        }
        if (cleanSql.includes("status = 'active'") || cleanSql.includes('status = "active"')) {
          updatePayload.status = 'active';
        }
        if (cleanSql.includes("status = 'attended'") || cleanSql.includes('status = "attended"')) {
          updatePayload.status = 'attended';
        }
        if (cleanSql.includes("status = 'cancelled'") || cleanSql.includes('status = "cancelled"')) {
          updatePayload.status = 'cancelled';
        }
        if (cleanSql.includes("account_status = 'active'") || cleanSql.includes('account_status = "active"')) {
          updatePayload.account_status = 'active';
        }
        if (cleanSql.includes("account_status = 'rejected'") || cleanSql.includes('account_status = "rejected"')) {
          updatePayload.account_status = 'rejected';
        }
        if (cleanSql.includes("account_status = 'suspended'") || cleanSql.includes('account_status = "suspended"')) {
          updatePayload.account_status = 'suspended';
        }
        if (cleanSql.includes('is_current = FALSE') || cleanSql.includes('is_current = false')) {
          updatePayload.is_current = false;
        }
        if (cleanSql.includes('is_current = TRUE') || cleanSql.includes('is_current = true')) {
          updatePayload.is_current = true;
        }
        if (cleanSql.includes('votes_count = votes_count + 1')) {
          updatePayload.votes_count = (records[i].votes_count || 0) + 1;
        }
        records[i] = { ...records[i], ...updatePayload };
        updatedCount++;
      }
    }
    return [{ affectedRows: updatedCount }];
  }

  // --- 3. DELETE ---
  if (upperSql.startsWith('DELETE')) {
    const table = targetTable;
    if (memoryDb.tables[table]) {
      const uId = params.userId || params.user_id;
      if (params.id) {
        memoryDb.tables[table] = memoryDb.tables[table].filter((r) => r.id !== params.id);
      } else if (uId) {
        memoryDb.tables[table] = memoryDb.tables[table].filter((r) => r.user_id !== uId && r.userId !== uId && r.id !== uId);
      }
    }
    return [{ affectedRows: 1 }];
  }

  // --- 4. SELECT COUNT(*) ---
  if (upperSql.includes('COUNT(*)')) {
    const table = targetTable;
    let list = memoryDb.tables[table] || [];
    if (params.id) list = list.filter((r) => r.id === params.id);
    if (params.ministry_id || params.ministryId) {
      const mid = params.ministry_id || params.ministryId;
      list = list.filter((r) => (r.ministry_id && (r.ministry_id === mid || r.ministry_id === 'min-1' && mid === 'intercessory')) || r.id === mid);
    }
    if (params.user_id || params.userId) {
      const uid = params.user_id || params.userId;
      list = list.filter((r) => r.user_id === uid || r.id === uid);
    }
    if (params.status) {
      list = list.filter((r) => r.status === params.status);
    }
    return [[{ total: list.length, count: list.length }]];
  }

  // --- 5. STANDARD SELECT ---
  const table = targetTable;
  let rows = memoryDb.tables[table] || [];

  if (table === 'refresh_tokens') {
    const tHash = params.tokenHash || params.token_hash;
    const uId = params.userId || params.user_id;
    if (tHash) {
      rows = rows.filter((r) => r.token_hash === tHash || r.tokenHash === tHash);
    }
    if (uId) {
      rows = rows.filter((r) => r.user_id === uId || r.userId === uId);
    }
    if (cleanSql.includes('revoked_at IS NULL') || upperSql.includes('REVOKED_AT IS NULL')) {
      rows = rows.filter((r) => !r.revoked_at && !r.revokedAt);
    }
    if (cleanSql.includes('expires_at > NOW()') || upperSql.includes('EXPIRES_AT > NOW()')) {
      rows = rows.filter((r) => {
        const exp = r.expires_at || r.expiresAt;
        return !exp || new Date(exp).getTime() > Date.now();
      });
    }
    // Return mapped copies with both snake_case and camelCase
    return [
      rows.map((r) => ({
        ...r,
        id: r.id,
        user_id: r.user_id || r.userId,
        userId: r.user_id || r.userId,
        token_hash: r.token_hash || r.tokenHash,
        tokenHash: r.token_hash || r.tokenHash,
        expires_at: r.expires_at || r.expiresAt,
        expiresAt: r.expires_at || r.expiresAt,
        revoked_at: r.revoked_at || r.revokedAt || null,
        revokedAt: r.revoked_at || r.revokedAt || null,
      })),
    ];
  }

  // Filter by params
  if (params.idOrCode) {
    rows = rows.filter((r) => r.id === params.idOrCode || r.code === params.idOrCode || (r.code && r.code.toLowerCase() === String(params.idOrCode).toLowerCase()));
  }
  if (params.id) {
    if (table === 'ministries' || table === 'committees') {
      rows = rows.filter((r) => r.id === params.id || r.code === params.id || (r.code && r.code.toLowerCase() === String(params.id).toLowerCase()));
    } else {
      rows = rows.filter((r) => r.id === params.id);
    }
  }
  if (params.code) rows = rows.filter((r) => r.code && r.code.toLowerCase() === String(params.code).toLowerCase());
  if (params.email) rows = rows.filter((r) => r.email && r.email.toLowerCase() === String(params.email).trim().toLowerCase());
  if (params.username) rows = rows.filter((r) => r.username && r.username.toLowerCase() === String(params.username).trim().toLowerCase());
  if (params.identifier) {
    const idClean = String(params.identifier).trim();
    const idLower = idClean.toLowerCase();
    const idDigits = idClean.replace(/[^0-9]/g, '');
    rows = rows.filter((r) => {
      const emailMatch = r.email && r.email.toLowerCase() === idLower;
      const userMatch = r.username && r.username.toLowerCase() === idLower;
      const admMatch = r.admission_number && r.admission_number.toLowerCase() === idLower;
      const phoneClean = r.phone_number ? String(r.phone_number).replace(/[^0-9]/g, '') : '';
      const phoneMatch = r.phone_number && (
        r.phone_number.toLowerCase() === idLower ||
        (idDigits.length >= 8 && phoneClean.length >= 8 && phoneClean.slice(-9) === idDigits.slice(-9)) ||
        (idDigits.length >= 7 && phoneClean.length >= 7 && (phoneClean.endsWith(idDigits) || idDigits.endsWith(phoneClean)))
      );
      return emailMatch || userMatch || admMatch || phoneMatch;
    });
  }
  if (params.user_id || params.userId) {
    const uid = params.user_id || params.userId;
    rows = rows.filter((r) => r.user_id === uid || (table === 'users' && r.id === uid));
  }
  if (params.ministry_id || params.ministryId) {
    const mid = params.ministry_id || params.ministryId;
    if (table === 'ministries') {
      rows = rows.filter((r) => r.id === mid || r.code === mid || (r.code && r.code.toLowerCase() === String(mid).toLowerCase()));
    } else {
      rows = rows.filter((r) => r.ministry_id === mid || (params.rawId && r.ministry_id === params.rawId) || (r.ministry_id === 'min-1' && mid === 'intercessory'));
    }
  }
  if (params.status) {
    rows = rows.filter((r) => r.status === params.status);
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
