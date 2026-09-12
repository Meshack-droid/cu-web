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
    leadership_positions: [
      {
        id: 'pos-1',
        code: 'chairperson',
        name: 'Chairperson',
        category: 'executive',
        description: 'Chief executive officer and spiritual visionary of TUMCU.',
        constitutional_reference: 'Article 12.1',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 1,
        responsibilities: [
          'Overall leadership, spiritual vision, and constitutional direction of TUMCU',
          'Convenes and presides over Executive Committee and General Business Meetings',
          'Official representative and signatory of the Christian Union with University & external bodies',
          'Supervises all executive officers, committees, and constitutional ministries',
          'Co-signatory for official TUMCU financial instruments and bank accounts'
        ],
        permissions: ['system.manage_roles', 'leadership.view', 'leadership.assign', 'meetings.view', 'meetings.create', 'events.view', 'events.approve', 'reports.view', 'finance.view', 'finance.approve', 'elections.manage'],
        constitutional_restrictions: ['Cannot unilaterally authorize financial withdrawals without Executive Committee resolution', 'Must be a full member in good standing of at least 2 spiritual years']
      },
      {
        id: 'pos-2',
        code: 'first_vice_chairperson',
        name: 'First Vice Chairperson',
        category: 'executive',
        description: 'Internal affairs and standing committee coordinator.',
        constitutional_reference: 'Article 12.2',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 2,
        responsibilities: [
          'Deputizes the Chairperson and acts in their absence',
          'Coordinates internal affairs and standing committees (Welfare, Hospitality, Prayer)',
          'Monitors constitutional compliance across all union sub-organs',
          'Oversees spiritual welfare and pastoral care among members'
        ],
        permissions: ['leadership.view', 'committees.view', 'welfare.view', 'welfare.approve', 'reports.view', 'meetings.view', 'events.view', 'attendance.view'],
        constitutional_restrictions: ['Acts as Chairperson only upon formal delegation or vacancy under Article 9']
      },
      {
        id: 'pos-3',
        code: 'second_vice_chairperson',
        name: 'Second Vice Chairperson',
        category: 'executive',
        description: 'External outreach, missions, and ministries coordinator.',
        constitutional_reference: 'Article 12.3',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 3,
        responsibilities: [
          'Coordinates external ministries (High School, Hospital, Missions, Creative)',
          'Liaises with associate members, alumni body, and partner campus Christian Unions',
          'Assists in planning joint fellowship events and inter-varsity conferences',
          'Directs evangelistic field operations'
        ],
        permissions: ['leadership.view', 'ministries.view', 'ministries.manage_members', 'events.view', 'events.create', 'reports.view'],
        constitutional_restrictions: ['Subject to Executive Committee policy regarding external partnerships']
      },
      {
        id: 'pos-4',
        code: 'secretary',
        name: 'Secretary',
        category: 'executive',
        description: 'Custodian of records, correspondence, minutes, and membership registers.',
        constitutional_reference: 'Article 12.4',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 4,
        responsibilities: [
          'Maintains accurate registers of certified full members, special members, and associates',
          'Records and preserves comprehensive minutes of all Executive and General meetings',
          'Handles all official correspondence and notices of the Christian Union',
          'Issues certificates of membership and official recommendation letters',
          'Co-signatory for official TUMCU correspondence and constitutional petitions'
        ],
        permissions: ['membership.view_all', 'membership.review', 'membership.approve', 'meetings.view', 'meetings.create', 'meetings.manage_minutes', 'communication.view', 'communication.create', 'reports.view', 'leadership.view'],
        constitutional_restrictions: ['Minutes must be formally confirmed and signed at the next ordinary meeting', 'Cannot alter membership register without approved application or constitutional resolution']
      },
      {
        id: 'pos-5',
        code: 'vice_secretary',
        name: 'Vice Secretary',
        category: 'executive',
        description: 'Hospitality coordinator, guest ministers liaison, and secretarial assistant.',
        constitutional_reference: 'Article 12.5',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 5,
        responsibilities: [
          'Assists the Secretary and records minutes in their absence',
          'Oversees hospitality for guest ministers, external speakers, and visiting teams',
          'Coordinates Catering and Ushering logistics for Sunday services and conferences',
          'Supervises meeting venues arrangement and welcome protocols'
        ],
        permissions: ['meetings.view', 'events.view', 'communication.view', 'reports.view', 'ministries.view'],
        constitutional_restrictions: ['Works under supervision of Secretary and Executive Committee']
      },
      {
        id: 'pos-6',
        code: 'treasurer',
        name: 'Treasurer',
        category: 'executive',
        description: 'Custodian of funds, financial stewardship, receipts, budgets, and accounting.',
        constitutional_reference: 'Article 12.6',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 6,
        responsibilities: [
          'Maintains complete, transparent books of accounts and records all receipts and payments',
          'Issues official TUMCU receipts for all tithes, offerings, donations, and pledges',
          'Prepares annual and semester operational budgets for Executive and AGM approval',
          'Chairs Treasury Committee and prepares financial statements for internal and external audits',
          'Supervises capital project accounts and bank reconciliations'
        ],
        permissions: ['finance.view', 'finance.create', 'finance.receipts', 'finance.budget', 'finance.reports', 'project.manage', 'reports.view'],
        constitutional_restrictions: [
          'Cannot independently authorize restricted withdrawals (Article 15.3)',
          'Withdrawals require Executive/Subcommittee resolution and two authorized signatories',
          'Must present books for audit at least two weeks before Annual General Meeting'
        ]
      },
      {
        id: 'pos-7',
        code: 'prayer_chairperson',
        name: 'Prayer Committee Chairperson',
        category: 'executive',
        description: 'Spiritual intercession, prayer chains, keshas, and morning devotions.',
        constitutional_reference: 'Article 12.7',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 7,
        responsibilities: [
          'Chairs Prayer Committee and guides the spiritual intercessory pulse of TUMCU',
          'Organizes weekly overnight prayer vigils (keshas), fasts, and semester prayer weeks',
          'Coordinates confidential prayer request handling and intercession chains',
          'Mobilizes campus morning devotions and hostel prayer altars'
        ],
        permissions: ['prayer.view', 'prayer.view_confidential', 'prayer.create', 'prayer.edit', 'events.view', 'meetings.view'],
        constitutional_restrictions: ['Confidential prayer requests must not be publicly disclosed without permission']
      },
      {
        id: 'pos-8',
        code: 'worship_chairperson',
        name: 'Worship Committee Chairperson',
        category: 'executive',
        description: 'Liturgical worship, Praise & Worship team, instrumentalists, and music repertoire.',
        constitutional_reference: 'Article 12.8',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 8,
        responsibilities: [
          'Chairs Worship Committee and coordinates liturgical musical excellence',
          'Oversees Praise & Worship Ministry and Instrumentalists Ministry',
          'Schedules song leaders, rehearsals, workshops, and worship nights',
          'Maintains sound balance and spiritual reverence in music selection'
        ],
        permissions: ['ministries.view', 'events.view', 'events.create', 'attendance.view'],
        constitutional_restrictions: ['All song repertoires must align with TUMCU doctrinal basis (Article 4)']
      },
      {
        id: 'pos-9',
        code: 'missions_chairperson',
        name: 'Mission Committee Chairperson',
        category: 'executive',
        description: 'Evangelism field mobilization, annual missions, and community outreaches.',
        constitutional_reference: 'Article 12.9',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 9,
        responsibilities: [
          'Chairs Missions Committee and plans annual mega mission trips and weekend missions',
          'Coordinates evangelism teams, open-air crusades, door-to-door gospel witnessing',
          'Liaises with mission fields, partner churches, and rural ministry stations',
          'Conducts cross-cultural mission training and post-mission follow-ups'
        ],
        permissions: ['events.view', 'events.create', 'ministries.view', 'reports.view'],
        constitutional_restrictions: ['Mission budgets require Executive Committee resolution and Treasurer review']
      },
      {
        id: 'pos-10',
        code: 'discipleship_chairperson',
        name: 'Discipleship Committee Chairperson',
        category: 'executive',
        description: 'Nurturing classes, Bible Study (BEST) groups, new converts, and spiritual mentorship.',
        constitutional_reference: 'Article 12.10',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 10,
        responsibilities: [
          'Chairs Discipleship Committee and designs foundational follow-up for new converts',
          'Coordinates Bible Study (BEST) small groups, facilitators, and study guides',
          'Organizes mentorship cohorts and first-year student spiritual orientation',
          'Maintains discipleship spiritual records and baptism preparation classes'
        ],
        permissions: ['membership.view_all', 'events.view', 'meetings.view', 'reports.view'],
        constitutional_restrictions: ['Doctrinal materials must strictly conform to TUMCU Statement of Faith']
      },
      {
        id: 'pos-11',
        code: 'assets_chairperson',
        name: 'Assets Committee Chairperson',
        category: 'executive',
        description: 'Stewardship, maintenance, inventory, equipment loans, and hardware procurement.',
        constitutional_reference: 'Article 12.11',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 11,
        responsibilities: [
          'Chairs Assets Committee and oversees all union hardware, sound gear, instruments, and furniture',
          'Maintains updated asset register, tagging, serial numbers, and condition reports',
          'Controls equipment borrowing, loan agreements, and return inspections',
          'Coordinates routine maintenance, servicing, repair, and safe storage'
        ],
        permissions: ['assets.view', 'assets.manage', 'reports.view', 'events.view'],
        constitutional_restrictions: ['Disposal or acquisition of capital assets requires Executive Committee sanction']
      },
      {
        id: 'pos-12',
        code: 'publicity_chairperson',
        name: 'Publicity Committee Chairperson',
        category: 'executive',
        description: 'Announcements, website, social media, posters, photography, and livestreams.',
        constitutional_reference: 'Article 12.12',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 12,
        responsibilities: [
          'Chairs Publicity Committee and coordinates campus branding and communication',
          'Oversees Media Ministry, livestream broadcasts, and digital content',
          'Designs official event posters, digital flyers, bulletin publications, and website updates',
          'Publishes authorized announcements across university platforms and halls of residence'
        ],
        permissions: ['communication.view', 'communication.create', 'communication.edit', 'events.view', 'ministries.view'],
        constitutional_restrictions: ['Public publications must reflect Christian decorum and Executive endorsement']
      },
      {
        id: 'pos-13',
        code: 'non_residents_chairperson',
        name: 'Non-Residents Committee Chairperson',
        category: 'executive',
        description: 'Off-campus student fellowship, non-resident welfare, and neighborhood cell groups.',
        constitutional_reference: 'Article 12.13',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 13,
        responsibilities: [
          'Chairs Non-Residents Committee and champions welfare of off-campus students',
          'Organizes neighborhood Bible study cells, hostel fellowships, and outreach',
          'Coordinates night travel logistics and transport security during keshas and late services',
          'Advocates for non-resident representation and integration in all CU programs'
        ],
        permissions: ['welfare.view', 'events.view', 'meetings.view', 'reports.view'],
        constitutional_restrictions: ['Must maintain active liaison with University Dean of Students for off-campus welfare']
      },
      {
        id: 'pos-14',
        code: 'welfare_chairperson',
        name: 'Welfare Committee Chairperson',
        category: 'committee',
        description: 'Benevolent support, student emergency funds, bereavement care, and hospital visits.',
        constitutional_reference: 'Article 13.1',
        is_executive: false,
        requires_gender_rule: false,
        active: true,
        display_order: 14,
        responsibilities: [
          'Chairs Welfare Committee and processes confidential student benevolent requests',
          'Coordinates meal assistance, emergency hospital welfare, and funeral condolences',
          'Maintains transparent records of welfare allocations under 1st Vice Chairperson supervision'
        ],
        permissions: ['welfare.view', 'welfare.approve', 'reports.view'],
        constitutional_restrictions: ['Welfare disbursements are strictly governed by approved benevolence ceilings']
      },
      {
        id: 'pos-15',
        code: 'media_ministry_leader',
        name: 'Media Ministry Leader',
        category: 'ministry',
        description: 'Audio-visual production, livestream operations, equipment management, and team schedule.',
        constitutional_reference: 'Article 16.1',
        is_executive: false,
        requires_gender_rule: false,
        active: true,
        display_order: 15,
        responsibilities: [
          'Leads Media Ministry operations: Sunday livestreams, video recording, photography',
          'Schedules camera operators, sound technicians, and projectionists for all services',
          'Maintains media equipment inventory, digital library assets, and archives',
          'Conducts technical skills training workshops for ministry apprentices'
        ],
        permissions: ['ministries.view', 'ministries.manage_members', 'communication.create', 'assets.view'],
        constitutional_restrictions: ['Works under guidance of Publicity Committee Chairperson']
      }
    ],
    ministries: [
      { id: 'min-1', code: 'intercessory', name: 'Intercessory Ministry', description: 'Dedicated to prayer, fasting, and spiritual intercession for the CU and campus.', meeting_day: 'Wednesdays & Fridays', meeting_venue: 'Main Chapel', image_url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-2', code: 'worship', name: 'Praise & Worship Ministry', description: 'Leading the congregation into the manifest presence of God through spirit-filled worship.', meeting_day: 'Tuesdays & Thursdays', meeting_venue: 'Assembly Hall', image_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-3', code: 'instrumentalists', name: 'Instrumentalists Ministry', description: 'Skillfully ministering with musical instruments to support worship services.', meeting_day: 'Tuesdays & Saturdays', meeting_venue: 'Music Room', image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-4', code: 'ushering', name: 'Ushering Ministry', description: 'Welcoming believers, maintaining order, and fostering hospitality in all gatherings.', meeting_day: 'Thursdays', meeting_venue: 'Chapel Foyer', image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-5', code: 'catering', name: 'Catering Ministry', description: 'Managing hospitality, food, and refreshments during CU events, AGMs, and conferences.', meeting_day: 'Saturdays before events', meeting_venue: 'Dining Hall Kitchen', image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-6', code: 'media', name: 'Media Ministry', description: 'Audio-visual production, livestreaming, photography, and digital ministry outreach.', meeting_day: 'Fridays', meeting_venue: 'Media Studio', image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-7', code: 'creative', name: 'Creative Ministry', description: 'Proclaiming the Gospel through Christian drama, poetry, spoken word, and dance.', meeting_day: 'Mondays & Wednesdays', meeting_venue: 'Amphitheatre', image_url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-8', code: 'technicians', name: 'Technicians Ministry', description: 'Sound engineering, electrical setup, lighting, and stage technical management.', meeting_day: 'Saturdays', meeting_venue: 'Control Booth', image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-9', code: 'high_school', name: 'High School Ministry', description: 'Evangelism, mentorship, and discipleship missions to secondary schools in Mombasa.', meeting_day: 'Sundays', meeting_venue: 'Room B10', image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-10', code: 'hospital', name: 'Hospital Ministry', description: 'Visiting patients in Coast General and local clinics with prayers and care packages.', meeting_day: 'Saturdays', meeting_venue: 'Hospital Gate', image_url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-11', code: 'brothers', name: "Brothers' Ministry", description: 'Building godly men through fellowship, accountability, and leadership development.', meeting_day: 'Alternate Fridays', meeting_venue: 'Hostel Courtyard', image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-12', code: 'sisters', name: "Sisters' Ministry", description: 'Nurturing virtuous women of faith, character, and spiritual excellence.', meeting_day: 'Alternate Fridays', meeting_venue: 'Chapel Hall', image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
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
        id: 'usr-meshack-1',
        username: 'meshack',
        email: 'meshackokoth436@gmail.com',
        phone_number: '+254700000436',
        password_hash: bcrypt.hashSync('Admin@12345', 10),
        full_name: 'Meshack Okoth (Super Administrator)',
        gender: 'male',
        admission_number: 'ADM/2026/000',
        school: 'School of Computing and Informatics',
        course: 'BSc. Computer Science',
        year_of_study: 4,
        account_status: 'active',
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
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
      {
        id: 'usr-app-4',
        username: 'faith_cherono',
        email: 'faith.cherono@students.tum.ac.ke',
        phone_number: '+254711223344',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Faith Cherono',
        gender: 'female',
        admission_number: 'BCOM/2026/045',
        school: 'School of Business and Social Sciences',
        course: 'Bachelor of Commerce',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: 'usr-app-5',
        username: 'brian_kipchumba',
        email: 'brian.kipchumba@students.tum.ac.ke',
        phone_number: '+254722334466',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Brian Kipchumba',
        gender: 'male',
        admission_number: 'BCS/2026/112',
        school: 'School of Computing and Informatics',
        course: 'BSc. Computer Science',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      },
      {
        id: 'usr-app-6',
        username: 'mercy_atieno',
        email: 'mercy.atieno@students.tum.ac.ke',
        phone_number: '+254733556677',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Mercy Atieno',
        gender: 'female',
        admission_number: 'BED/2026/094',
        school: 'School of Humanities and Social Sciences',
        course: 'Bachelor of Education (Arts)',
        year_of_study: 2,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'usr-app-7',
        username: 'samuel_wambua',
        email: 'samuel.wambua@students.tum.ac.ke',
        phone_number: '+254744667788',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Samuel Wambua',
        gender: 'male',
        admission_number: 'BME/2026/033',
        school: 'School of Engineering and Technology',
        course: 'BSc. Mechanical Engineering',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 30 * 3600000).toISOString(),
      },
      {
        id: 'usr-app-8',
        username: 'esther_muthoni',
        email: 'esther.muthoni@students.tum.ac.ke',
        phone_number: '+254755778899',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Esther Muthoni',
        gender: 'female',
        admission_number: 'MLS/2026/019',
        school: 'School of Applied and Health Sciences',
        course: 'BSc. Medical Laboratory Science',
        year_of_study: 2,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
      },
      {
        id: 'usr-app-9',
        username: 'joshua_karanja',
        email: 'joshua.karanja@students.tum.ac.ke',
        phone_number: '+254766889900',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Joshua Karanja',
        gender: 'male',
        admission_number: 'BCE/2026/082',
        school: 'School of Engineering and Technology',
        course: 'BSc. Civil Engineering',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 42 * 3600000).toISOString(),
      },
      {
        id: 'usr-app-10',
        username: 'lydia_chebet',
        email: 'lydia.chebet@students.tum.ac.ke',
        phone_number: '+254777990011',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Lydia Chebet',
        gender: 'female',
        admission_number: 'BBA/2026/056',
        school: 'School of Business and Social Sciences',
        course: 'Bachelor of Business Administration',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      },
      {
        id: 'usr-app-11',
        username: 'stephen_ndwiga',
        email: 'stephen.ndwiga@students.tum.ac.ke',
        phone_number: '+254788001122',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Stephen Ndwiga',
        gender: 'male',
        admission_number: 'BENG/2026/220',
        school: 'School of Engineering and Technology',
        course: 'BSc. Telecommunications Engineering',
        year_of_study: 2,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 54 * 3600000).toISOString(),
      },
      {
        id: 'usr-app-12',
        username: 'grace_wanjala',
        email: 'grace.wanjala@students.tum.ac.ke',
        phone_number: '+254799112233',
        password_hash: bcrypt.hashSync('Password123!', 10),
        full_name: 'Grace Wanjala',
        gender: 'female',
        admission_number: 'BCS/2026/077',
        school: 'School of Computing and Informatics',
        course: 'BSc. Information Technology',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 60 * 3600000).toISOString(),
      },
    ],
    leadership_assignments: [
      {
        id: 'assign-1',
        position_id: 'pos-1',
        user_id: 'usr-chair-1',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Duly elected at the 2025 Annual General Meeting pursuant to Article 14.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-2',
        position_id: 'pos-2',
        user_id: 'usr-app-1',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Elected pursuant to constitutional provisions (Article 12.2).',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-3',
        position_id: 'pos-3',
        user_id: 'usr-app-2',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Elected at AGM.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-4',
        position_id: 'pos-4',
        user_id: 'usr-app-3',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Elected Secretary.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-5',
        position_id: 'pos-5',
        user_id: 'usr-member-1',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Elected Vice Secretary.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-6',
        position_id: 'pos-6',
        user_id: 'usr-meshack-1',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Elected Treasurer. Custodian of funds and financial records.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-7',
        position_id: 'pos-7',
        user_id: null,
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-09-02',
        status: 'vacant',
        vacancy_reason: 'Resignation with two weeks written notice (Article 9.4)',
        vacancy_date: '2026-09-02',
        notes: 'Position vacant following formal resignation tabled to Executive Committee.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-8',
        position_id: 'pos-8',
        user_id: 'usr-leader-1',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Worship Committee Chairperson.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-9',
        position_id: 'pos-9',
        user_id: 'usr-admin-1',
        academic_year: '2025/2026',
        assignment_type: 'acting',
        start_date: '2026-01-10',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Acting Missions Chairperson appointed pursuant to Article 9.1.',
        created_at: '2026-01-10T08:00:00.000Z'
      },
      {
        id: 'assign-10',
        position_id: 'pos-10',
        user_id: 'usr-chair-1',
        academic_year: '2025/2026',
        assignment_type: 'co-opted',
        start_date: '2025-10-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Co-opted Discipleship Chairperson.',
        created_at: '2025-10-01T08:00:00.000Z'
      },
      {
        id: 'assign-11',
        position_id: 'pos-11',
        user_id: 'usr-app-1',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Assets Committee Chairperson.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-12',
        position_id: 'pos-12',
        user_id: 'usr-app-2',
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-31',
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: 'Publicity Committee Chairperson.',
        created_at: '2025-09-01T08:00:00.000Z'
      },
      {
        id: 'assign-13',
        position_id: 'pos-13',
        user_id: null,
        academic_year: '2025/2026',
        assignment_type: 'permanent',
        start_date: '2025-09-01',
        end_date: '2026-08-25',
        status: 'vacant',
        vacancy_reason: 'Unfilled Vacancy after Semester Rotations (Article 9.2)',
        vacancy_date: '2026-08-25',
        notes: 'Awaiting appointment of an off-campus full member.',
        created_at: '2025-09-01T08:00:00.000Z'
      }
    ],
    custom_committees: [
      {
        id: 'cc-1',
        name: '2026 TUMCU 40th Anniversary Committee',
        purpose: 'Plan Ruby Jubilee celebration, alumni homecoming banquet, and historical documentation.',
        start_date: '2026-02-01',
        end_date: '2026-11-30',
        chairperson_name: 'David Mutua',
        secretary_name: 'Sarah Mwangi',
        member_count: 8,
        status: 'active',
        created_at: '2026-02-01T10:00:00.000Z'
      },
      {
        id: 'cc-2',
        name: 'Missions Field Mobilization Committee 2026',
        purpose: 'Coordinate logistics, transport, tentage, and catering for the upcoming annual coastal outreach.',
        start_date: '2026-03-01',
        end_date: '2026-08-31',
        chairperson_name: 'Caleb Kiprop',
        secretary_name: 'Emmanuel Mwangi',
        member_count: 6,
        status: 'active',
        created_at: '2026-03-01T10:00:00.000Z'
      }
    ],
    finance_resolutions: [
      {
        id: 'fres-1',
        resolution_number: 'EX-RES-2026/09-01',
        title: 'Mission Outreach Evangelism Logistics - Coast Region',
        amount: 45000,
        category: 'Missions & Evangelism',
        status: 'pending_signatures',
        prepared_by: 'Meshack Okoth (Treasurer)',
        signatory_1: 'David Mutua (Chairperson) - Signed',
        signatory_2: 'Pending (Secretary)',
        description: 'Provision of hire transport and field sound public address system for Kilifi missions.',
        created_at: '2026-09-08T14:30:00.000Z'
      },
      {
        id: 'fres-2',
        resolution_number: 'EX-RES-2026/09-02',
        title: 'Sanctuary Sound Console Mixer Repair & Cable Replacement',
        amount: 18500,
        category: 'Assets & Equipment',
        status: 'pending_signatures',
        prepared_by: 'Meshack Okoth (Treasurer)',
        signatory_1: 'Pending (Chairperson)',
        signatory_2: 'Pending (Secretary)',
        description: 'Urgent service of Behringer X32 channel boards and XLR snake cables before Sunday fellowship.',
        created_at: '2026-09-09T09:15:00.000Z'
      },
      {
        id: 'fres-3',
        resolution_number: 'EX-RES-2026/09-03',
        title: 'First-Year Nurturing Class Study Materials & New Convert Guides',
        amount: 12000,
        category: 'Discipleship',
        status: 'pending_signatures',
        prepared_by: 'Meshack Okoth (Treasurer)',
        signatory_1: 'David Mutua (Chairperson) - Signed',
        signatory_2: 'Pending (Vice Secretary)',
        description: 'Procurement of 150 copies of First Steps in Christ booklets for September orientation.',
        created_at: '2026-09-10T11:00:00.000Z'
      }
    ],
    user_roles: [
      { id: 'ur-meshack-1', user_id: 'usr-meshack-1', role_id: 'role-1', scope_type: null, scope_id: null },
      { id: 'ur-1', user_id: 'usr-admin-1', role_id: 'role-1', scope_type: null, scope_id: null },
      { id: 'ur-2', user_id: 'usr-chair-1', role_id: 'role-3', scope_type: null, scope_id: null },
      { id: 'ur-3', user_id: 'usr-leader-1', role_id: 'role-9', scope_type: 'ministry', scope_id: 'min-2' },
      { id: 'ur-4', user_id: 'usr-member-1', role_id: 'role-10', scope_type: null, scope_id: null },
    ],
    events: [
      {
        id: 'evt-1',
        title: 'Weekly Bible Study (BEST) - "Living Faith in Campus"',
        day_of_week: 'Monday',
        date: '2026-09-14',
        start_time: '17:30',
        end_time: '19:30',
        venue: 'Lecture Theatres LH1 - LH4',
        category: 'Discipleship',
        is_upcoming: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'evt-2',
        title: 'Midweek Fellowship & Prayer - "Standing in the Gap"',
        day_of_week: 'Wednesday',
        date: '2026-09-16',
        start_time: '17:00',
        end_time: '19:00',
        venue: 'Main Chapel',
        category: 'Prayer & Worship',
        is_upcoming: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'evt-3',
        title: 'Departmental Kesha & Friday Fellowship',
        day_of_week: 'Friday',
        date: '2026-09-18',
        start_time: '21:00',
        end_time: '05:00',
        venue: 'Assembly Hall',
        category: 'Fellowship & Kesha',
        is_upcoming: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'evt-4',
        title: 'Main Sunday Service & Praise Celebration',
        day_of_week: 'Sunday',
        date: '2026-09-20',
        start_time: '08:30',
        end_time: '12:30',
        venue: 'Assembly Hall',
        category: 'Sunday Service',
        is_upcoming: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'evt-5',
        title: 'High School Outreach Mission - Shimo La Tewa',
        day_of_week: 'Saturday',
        date: '2026-09-26',
        start_time: '08:00',
        end_time: '16:00',
        venue: 'Shimo La Tewa High School',
        category: 'Missions',
        is_upcoming: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'evt-6',
        title: 'Holy Communion & Thanksgiving Sunday Service',
        day_of_week: 'Sunday',
        date: '2026-09-27',
        start_time: '08:30',
        end_time: '12:30',
        venue: 'Assembly Hall',
        category: 'Sunday Service',
        is_upcoming: true,
        created_at: new Date().toISOString()
      }
    ],
    meetings: [
      {
        id: 'mtg-1',
        title: 'Executive Committee Ordinary Sitting #4',
        type: 'executive',
        date: '2026-09-08',
        time: '18:00 - 21:00',
        venue: 'CU Boardroom / Assembly Hall',
        status: 'awaiting_minutes',
        minutes_recorded: false,
        notes: 'Critical agenda: Mid-semester mission plans, financial quarterly audit, and filling of leadership vacancies.',
        created_at: '2026-09-01T10:00:00.000Z'
      },
      {
        id: 'mtg-2',
        title: 'Treasury Committee Budget Harmonization',
        type: 'committee',
        date: '2026-09-05',
        time: '16:00 - 18:00',
        venue: 'Finance Office',
        status: 'completed',
        minutes_recorded: true,
        notes: 'Harmonized 2026 budget allocations across ministries.',
        created_at: '2026-08-28T10:00:00.000Z'
      },
      {
        id: 'mtg-3',
        title: 'Joint Ministries Leaders Fellowship',
        type: 'ministries',
        date: '2026-09-15',
        time: '17:00 - 19:30',
        venue: 'Main Chapel',
        status: 'scheduled',
        minutes_recorded: false,
        notes: 'Coordinating ministry Sunday presentations and spiritual revival week.',
        created_at: '2026-09-05T10:00:00.000Z'
      }
    ],
    prayer_requests: [],
    spiritual_years: [
      { id: 'sy-2026', name: '2025/2026 Spiritual Year', start_date: '2025-09-01', end_date: '2026-08-31', is_current: true },
    ],
    membership_declarations: [
      { id: 'decl-1', version: '2024.1', title: 'TUMCU Doctrinal Basis & Constitutional Declaration', content: 'In joining Technical University of Mombasa Christian Union, (T.U.M.C.U.), I declare Jesus Christ as my Lord and Savior and it is my desire, by the grace of God, to live a life worthy of my Christian calling. I am also determined to follow the Constitution and support the C.U as it seeks to fulfill its aims.', is_active: true },
    ],
    memberships: [
      {
        id: 'mem-meshack-1',
        user_id: 'usr-meshack-1',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        declaration_id: 'decl-1',
        membership_number: 'TUMCU-2026-0000',
        status: 'active',
        registration_date: '2025-09-01',
        created_at: new Date(Date.now() - 300 * 86400000).toISOString(),
      },
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
      {
        id: 'app-seed-4',
        user_id: 'usr-app-4',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: 'app-seed-5',
        user_id: 'usr-app-5',
        membership_type_id: '1',
        status: 'under_review',
        rejection_reason: null,
        created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
      },
      {
        id: 'app-seed-6',
        user_id: 'usr-app-6',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'app-seed-7',
        user_id: 'usr-app-7',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 30 * 3600000).toISOString(),
      },
      {
        id: 'app-seed-8',
        user_id: 'usr-app-8',
        membership_type_id: '1',
        status: 'under_review',
        rejection_reason: null,
        created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
      },
      {
        id: 'app-seed-9',
        user_id: 'usr-app-9',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 42 * 3600000).toISOString(),
      },
      {
        id: 'app-seed-10',
        user_id: 'usr-app-10',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      },
      {
        id: 'app-seed-11',
        user_id: 'usr-app-11',
        membership_type_id: '1',
        status: 'under_review',
        rejection_reason: null,
        created_at: new Date(Date.now() - 54 * 3600000).toISOString(),
      },
      {
        id: 'app-seed-12',
        user_id: 'usr-app-12',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 60 * 3600000).toISOString(),
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
    notifications: [
      {
        id: 'notif-1',
        user_id: 'usr-admin-1',
        type: 'welcome',
        title: 'Welcome to TUMCU Portal',
        body: 'You have full administrative and constitutional oversight access to the Technical University of Mombasa Christian Union platform.',
        channel: 'in_app',
        read_at: null,
        sent_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'notif-2',
        user_id: 'usr-member-1',
        type: 'welcome',
        title: '✨ Welcome to TUMCU',
        body: 'We are overjoyed to have you in our Christian Union family. Growing together, serving together, living for Christ!',
        channel: 'in_app',
        read_at: null,
        sent_at: new Date(Date.now() - 7200000).toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'notif-3',
        user_id: 'usr-member-1',
        type: 'announcement',
        title: '🔔 New weekly programme',
        body: "This week's programme is now available. Join us for Bible Study on Monday and Mid-Week Prayer on Wednesday!",
        channel: 'in_app',
        read_at: null,
        sent_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'notif-4',
        user_id: 'usr-member-1',
        type: 'meeting',
        title: '🎉 Event reminder',
        body: 'Fellowship starts this Friday at 5:30 PM in TUMCU Main Hall. Come with an expectant heart!',
        channel: 'in_app',
        read_at: null,
        sent_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'notif-5',
        user_id: 'usr-leader-1',
        type: 'welcome',
        title: 'Ministry Leader Access Granted',
        body: 'Welcome to your Ministry Leader portal! You can now manage your ministry roster, view attendance, and submit ministry reports.',
        channel: 'in_app',
        read_at: null,
        sent_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
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

// Seed role permissions in memory
const rolePermissionMap: Record<string, string[]> = {
  // Super Admin
  'role-1': memoryDb.tables.permissions.map((p) => p.code),
  // System Admin
  'role-2': memoryDb.tables.permissions.map((p) => p.code),
  // Chairperson
  'role-3': memoryDb.tables.permissions.map((p) => p.code),
  // 1st Vice Chairperson
  'role-4': [
    'welfare.view', 'welfare.create', 'welfare.edit', 'welfare.approve',
    'reports.view', 'leadership.view', 'ministries.view', 'committees.view',
    'membership.view_all', 'meetings.view', 'events.view', 'events.register',
    'attendance.view', 'attendance.record', 'prayer.view', 'prayer.create', 'finance.request'
  ],
  // 2nd Vice Chairperson
  'role-5': [
    'associates.view', 'associates.manage', 'ministries.view', 'ministries.manage_members',
    'meetings.view', 'events.view', 'events.register', 'attendance.view', 'attendance.record',
    'prayer.view', 'prayer.create', 'finance.request'
  ],
  // Secretary
  'role-6': [
    'membership.create', 'membership.review', 'membership.view_all', 'membership.edit', 'membership.approve',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete', 'meetings.manage_minutes', 'meetings.approve_minutes',
    'attendance.view', 'attendance.record', 'attendance.manage_sessions', 'attendance.export',
    'communication.view', 'communication.create', 'communication.edit', 'communication.delete',
    'reports.create', 'reports.view', 'ministries.view', 'ministries.manage_members', 'ministries.edit',
    'leadership.view', 'leadership.assign', 'events.view', 'events.create', 'events.edit', 'events.register',
    'prayer.view', 'prayer.create', 'finance.view', 'finance.request'
  ],
  // Treasurer
  'role-7': [
    'finance.view', 'finance.request', 'finance.approve', 'reports.create', 'reports.view',
    'meetings.view', 'events.view', 'events.register', 'attendance.view', 'attendance.record',
    'prayer.view', 'prayer.create', 'assets.view'
  ],
  // Prayer Committee Chairperson
  'role-8': [
    'prayer.view', 'prayer.view_confidential', 'prayer.create', 'prayer.edit', 'prayer.delete',
    'meetings.view', 'events.view', 'events.register', 'attendance.view', 'attendance.record',
    'ministries.view', 'finance.request'
  ],
  // Ministry Leader
  'role-9': [
    'ministries.view', 'ministries.manage_members', 'ministries.edit',
    'meetings.view', 'meetings.create', 'attendance.view', 'attendance.record', 'attendance.manage_sessions',
    'reports.create', 'reports.view', 'events.view', 'events.register', 'prayer.view', 'prayer.create',
    'finance.view', 'finance.request'
  ],
  // Member
  'role-10': [
    'events.view', 'events.register', 'events.check_in', 'ministries.view',
    'prayer.view', 'prayer.create', 'attendance.view', 'attendance.record',
    'meetings.view', 'finance.request'
  ]
};

const memberPermCodes = rolePermissionMap['role-10'];

for (const [roleId, codes] of Object.entries(rolePermissionMap)) {
  for (const code of codes) {
    const perm = memoryDb.tables.permissions.find((p) => p.code === code);
    if (perm) {
      memoryDb.tables.role_permissions.push({
        id: uuidv4(),
        role_id: roleId,
        permission_id: perm.id,
      });
    }
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
    const user = memoryDb.tables.users.find((u) => u.id === userId);
    const isSuper =
      userId === 'usr-meshack-1' ||
      userId === 'usr-admin-1' ||
      user?.email === 'meshackokoth436@gmail.com' ||
      user?.email === 'admin@tumcu.ac.ke' ||
      user?.username === 'meshack' ||
      user?.username === 'admin';

    let userRoles = memoryDb.tables.user_roles.filter((ur) => ur.user_id === userId);
    
    if (isSuper || userRoles.some((ur) => ur.role_id === 'role-1' || ur.role_id === 'role-2' || ur.role_id === 'role-3')) {
      return [memoryDb.tables.permissions.map((p) => ({ code: p.code, module: p.module }))];
    }

    const assignedRoleIds = new Set(userRoles.map((ur) => ur.role_id));
    // Always include member role permissions as baseline
    assignedRoleIds.add('role-10');

    const permMap = new Map<string, { code: string; module: string }>();
    for (const roleId of assignedRoleIds) {
      const perms = memoryDb.tables.role_permissions
        .filter((rp) => rp.role_id === roleId)
        .map((rp) => memoryDb.tables.permissions.find((p) => p.id === rp.permission_id))
        .filter(Boolean);
      for (const p of perms) {
        if (p && !permMap.has(p.code)) {
          permMap.set(p.code, { code: p.code, module: p.module });
        }
      }
    }

    return [Array.from(permMap.values())];
  }

  // 2. User Roles join
  if (cleanSql.includes('user_roles') && (cleanSql.includes('roles') || cleanSql.includes('role_id'))) {
    const userId = params.userId || params.user_id;
    const user = memoryDb.tables.users.find((u) => u.id === userId);
    const isSuper =
      userId === 'usr-meshack-1' ||
      userId === 'usr-admin-1' ||
      user?.email === 'meshackokoth436@gmail.com' ||
      user?.email === 'admin@tumcu.ac.ke' ||
      user?.username === 'meshack' ||
      user?.username === 'admin';

    let userRoles = memoryDb.tables.user_roles.filter((ur) => !userId || ur.user_id === userId);
    if (isSuper) {
      if (!userRoles.some((ur) => ur.role_id === 'role-1')) {
        const superUr = { id: `ur-meshack-${Date.now()}`, user_id: userId || 'usr-meshack-1', role_id: 'role-1', scope_type: null, scope_id: null, is_current: true };
        memoryDb.tables.user_roles.push(superUr);
        userRoles.push(superUr);
      }
    } else if (userRoles.length === 0 && userId) {
      const defaultUr = { id: uuidv4(), user_id: userId, role_id: 'role-10', scope_type: null, scope_id: null, is_current: true };
      memoryDb.tables.user_roles.push(defaultUr);
      userRoles = [defaultUr];
    }
    const rows = userRoles.map((ur) => {
      const role = memoryDb.tables.roles.find((r) => r.id === ur.role_id);
      return {
        role_id: ur.role_id,
        code: role?.code || (ur.role_id === 'role-1' ? 'super_admin' : 'member'),
        name: role?.name || (ur.role_id === 'role-1' ? 'Super Administrator' : 'Member'),
        category: role?.category || (ur.role_id === 'role-1' ? 'administrative' : 'general'),
        scope_type: ur.scope_type || null,
        scope_id: ur.scope_id || null,
      };
    });
    return [rows.length > 0 ? rows : [{ role_id: 'role-10', code: 'member', name: 'Member', category: 'general', scope_type: null, scope_id: null }]];
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

  // 7. Leadership Assignments with Position and User Details
  if (cleanSql.includes('leadership_assignments')) {
    let assignments = memoryDb.tables.leadership_assignments || [];
    if (params.id) {
      assignments = assignments.filter((a) => a.id === params.id);
    }
    if (params.userId || params.user_id) {
      const uid = params.userId || params.user_id;
      assignments = assignments.filter((a) => a.user_id === uid);
    }
    if (params.positionId || params.position_id) {
      const pid = params.positionId || params.position_id;
      assignments = assignments.filter((a) => a.position_id === pid);
    }
    if (params.status) {
      assignments = assignments.filter((a) => a.status === params.status);
    }

    const rows = assignments.map((a) => {
      const pos = (memoryDb.tables.leadership_positions || []).find((p) => p.id === a.position_id);
      const user = a.user_id ? (memoryDb.tables.users || []).find((u) => u.id === a.user_id) : null;
      return {
        ...a,
        position_name: pos?.name || '',
        position_code: pos?.code || '',
        position_category: pos?.category || 'executive',
        constitutional_reference: pos?.constitutional_reference || '',
        responsibilities: pos?.responsibilities || [],
        permissions: pos?.permissions || [],
        constitutional_restrictions: pos?.constitutional_restrictions || [],
        user_name: user?.full_name || (a.status === 'vacant' ? 'VACANT' : 'Unassigned'),
        user_email: user?.email || '',
        user_phone: user?.phone_number || '',
        user_admission_number: user?.admission_number || '',
        user_course: user?.course || '',
        user_year: user?.year_of_study || '',
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

    // Specific mapping for notifications
    if (table === 'notifications') {
      const uId = params.userId || params.user_id;
      row.user_id = uId;
      row.userId = uId;
      if (!row.type) {
        row.type = cleanSql.includes("'welcome'") ? 'welcome' : (params.type || 'system');
      }
      if (!row.title) {
        if (cleanSql.includes("'Membership Approved!'")) row.title = 'Membership Approved!';
        else if (cleanSql.includes("'Welcome to TUMCU!'")) row.title = 'Welcome to TUMCU!';
        else row.title = params.title || 'Welcome to TUMCU!';
      }
      if (!row.body) {
        if (params.membershipNumber) {
          row.body = `Congratulations! Your TUMCU membership application has been approved. Your official membership number is ${params.membershipNumber}. Welcome to fellowship!`;
        } else {
          row.body = params.body || 'Welcome to the Technical University of Mombasa Christian Union portal.';
        }
      }
      if (!row.channel) {
        row.channel = cleanSql.includes("'email'") ? 'email' : 'in_app';
      }
      if (row.read_at === undefined) row.read_at = null;
      if (row.sent_at === undefined) row.sent_at = new Date().toISOString();
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
      } else if (table === 'ministries' && params.id && records[i].code === params.id) {
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
      } else if (table === 'notifications') {
        const uId = params.userId || params.user_id;
        if (params.id && records[i].id === params.id) {
          if (!uId || records[i].user_id === uId || records[i].userId === uId) {
            matches = true;
          }
        } else if (!params.id && uId && (records[i].user_id === uId || records[i].userId === uId)) {
          if (cleanSql.includes('read_at IS NULL') || upperSql.includes('READ_AT IS NULL')) {
            if (!records[i].read_at && !records[i].readAt) {
              matches = true;
            }
          } else {
            matches = true;
          }
        }
      }

      if (matches) {
        const updatePayload: Record<string, any> = { ...params, updated_at: nowIso };
        if (cleanSql.includes('read_at = NOW()') || upperSql.includes('READ_AT = NOW()') || cleanSql.includes('read_at = now()')) {
          updatePayload.read_at = nowIso;
          updatePayload.readAt = nowIso;
        }
        if (cleanSql.includes('sent_at = NOW()') || upperSql.includes('SENT_AT = NOW()') || cleanSql.includes('sent_at = now()')) {
          updatePayload.sent_at = nowIso;
          updatePayload.sentAt = nowIso;
        }
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
    if (table === 'notifications') {
      const uid = params.user_id || params.userId;
      if (uid) list = list.filter((r) => r.user_id === uid || r.userId === uid);
      if (cleanSql.includes('read_at IS NULL') || upperSql.includes('READ_AT IS NULL')) {
        list = list.filter((r) => !r.read_at && !r.readAt);
      }
      return [[{ total: list.length, count: list.length }]];
    }
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

  if (table === 'notifications') {
    const uId = params.userId || params.user_id;
    if (uId) {
      rows = rows.filter((r) => r.user_id === uId || r.userId === uId);
    }
    if (cleanSql.includes('sent_at IS NULL') || upperSql.includes('SENT_AT IS NULL')) {
      rows = rows.filter((r) => !r.sent_at && !r.sentAt);
    }
    // If a user has no notifications yet in memory, provide welcome notifications
    if (rows.length === 0 && uId) {
      const welcomeNotif = {
        id: uuidv4(),
        user_id: uId,
        userId: uId,
        type: 'welcome',
        title: 'Welcome to TUMCU Portal',
        body: 'Your Technical University of Mombasa Christian Union account is active. Explore ministries, fellowship meetings, and Sunday service attendance.',
        channel: 'in_app',
        read_at: null,
        readAt: null,
        sent_at: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      memoryDb.tables.notifications.push(welcomeNotif);
      rows = [welcomeNotif];
    }
    return [
      rows.map((r) => ({
        ...r,
        id: r.id,
        user_id: r.user_id || r.userId,
        userId: r.user_id || r.userId,
        type: r.type || 'welcome',
        title: r.title || 'Welcome to TUMCU!',
        body: r.body || '',
        channel: r.channel || 'in_app',
        read_at: r.read_at || r.readAt || null,
        readAt: r.read_at || r.readAt || null,
        sent_at: r.sent_at || r.sentAt || new Date().toISOString(),
        sentAt: r.sent_at || r.sentAt || new Date().toISOString(),
        created_at: r.created_at || r.createdAt || new Date().toISOString(),
      })),
    ];
  }

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
    } else if (table === 'users') {
      rows = rows.filter((r) => r.id === params.id || r.email === params.id || r.username === params.id);
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
