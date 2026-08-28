import { BaseService } from '../../../core/base.service';
import { query } from '../../../config/database';
import { AttendanceRecord, AttendanceSession, AttendeeRosterItem } from '../interfaces/attendance.interface';
import { AttendanceRepository } from '../repositories/attendance.repository';

export class AttendanceService extends BaseService<AttendanceRecord> {
  constructor(private readonly attendanceRepository: AttendanceRepository = new AttendanceRepository()) {
    super(attendanceRepository);
  }

  listForUser(userId: string, page = 1, pageSize = 20) {
    return this.attendanceRepository.listForUser(userId, page, pageSize);
  }

  listSessions(): Promise<AttendanceSession[]> {
    return this.attendanceRepository.listSessions();
  }

  getSession(idOrCode: string): Promise<AttendanceSession | null> {
    return this.attendanceRepository.getSessionByIdOrCode(idOrCode);
  }

  createSession(data: {
    title: string;
    session_type: string;
    session_date: string;
    start_time: string;
    end_time?: string | null;
    venue: string;
    theme?: string | null;
    preacher?: string | null;
    created_by?: string;
  }): Promise<AttendanceSession> {
    return this.attendanceRepository.createSession(data);
  }

  updateSession(id: string, updates: Partial<AttendanceSession>): Promise<boolean> {
    return this.attendanceRepository.updateSession(id, updates);
  }

  getSessionRoster(sessionId: string): Promise<AttendeeRosterItem[]> {
    return this.attendanceRepository.getSessionRoster(sessionId);
  }

  async checkInMemberOrGuest(data: {
    sessionId: string;
    attendableType?: string;
    userId?: string | null;
    identifier?: string | null; // email or admission number
    fullName?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    category?: string | null;
    visitorType?: string;
    method?: string;
    prayerRequest?: string | null;
    notes?: string | null;
  }) {
    let matchedUserId = data.userId || null;
    let isMember = false;
    let memberDetails: any = null;

    // If identifier or email provided, try matching registered user in DB
    const searchIdentifier = (data.identifier || data.email || '').trim().toLowerCase();
    if (!matchedUserId && searchIdentifier) {
      const users = await query<any[]>(
        `SELECT id, full_name, email, phone_number, admission_number, school FROM users WHERE LOWER(email) = :ident OR LOWER(admission_number) = :ident LIMIT 1`,
        { ident: searchIdentifier }
      );
      if (users && users.length > 0) {
        matchedUserId = users[0].id;
        memberDetails = users[0];
      }
    } else if (matchedUserId) {
      const users = await query<any[]>(
        `SELECT id, full_name, email, phone_number, admission_number, school FROM users WHERE id = :userId LIMIT 1`,
        { userId: matchedUserId }
      );
      if (users && users.length > 0) {
        memberDetails = users[0];
      }
    }

    if (matchedUserId) {
      isMember = true;
      const record = await this.attendanceRepository.recordPublicOrGuestAttendance({
        sessionId: data.sessionId,
        attendableType: data.attendableType || 'sunday_service',
        userId: matchedUserId,
        fullName: memberDetails?.full_name || data.fullName,
        email: memberDetails?.email || data.email,
        phoneNumber: memberDetails?.phone_number || data.phoneNumber,
        category: memberDetails?.school || data.category,
        visitorType: 'none',
        method: data.method || 'qr_code',
        prayerRequest: data.prayerRequest,
        notes: data.notes,
      });

      return {
        success: true,
        is_member: true,
        message: `Welcome ${memberDetails?.full_name || 'Member'}! Your attendance has been successfully recorded.`,
        user: memberDetails,
        record,
        prompt_registration: false,
      };
    }

    // Otherwise, register as visitor / guest
    const visitorType = (data.visitorType || 'first_time') as any;
    const record = await this.attendanceRepository.recordPublicOrGuestAttendance({
      sessionId: data.sessionId,
      attendableType: data.attendableType || 'sunday_service',
      userId: null,
      fullName: data.fullName || 'Anonymous Visitor',
      email: data.email || null,
      phoneNumber: data.phoneNumber || null,
      category: data.category || 'Guest / Visitor',
      visitorType,
      method: data.method || 'qr_code',
      prayerRequest: data.prayerRequest,
      notes: data.notes,
    });

    return {
      success: true,
      is_member: false,
      message: `Welcome to TUMCU, ${data.fullName || 'Guest'}! Your attendance has been confirmed.`,
      guest: {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        visitorType,
      },
      record,
      prompt_registration: true, // Prompts non-members to become full registered members
    };
  }

  async generateRosterCsv(sessionId: string): Promise<{ filename: string; csv: string }> {
    const session = await this.attendanceRepository.getSessionByIdOrCode(sessionId);
    const roster = await this.attendanceRepository.getSessionRoster(sessionId);

    const safeTitle = (session?.title || 'Attendance_Records').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeDate = (session?.session_date || new Date().toISOString().substring(0, 10));
    const filename = `TUMCU_Attendance_${safeTitle}_${safeDate}.csv`;

    const headers = [
      'No',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Attendee Type',
      'Admission / Student ID',
      'Membership Number',
      'Status',
      'Check-in Method',
      'Check-in Time',
      'School / Faculty',
      'Prayer Request / Notes',
    ];

    const rows = roster.map((item, index) => {
      const typeLabel = item.is_member
        ? 'Full Member'
        : item.visitor_type === 'first_time'
        ? 'First-Time Visitor'
        : item.visitor_type === 'returning'
        ? 'Returning Guest'
        : 'Guest';

      const escapeField = (val?: string | number | null) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      return [
        index + 1,
        escapeField(item.full_name),
        escapeField(item.email),
        escapeField(item.phone_number),
        escapeField(typeLabel),
        escapeField(item.admission_number || 'N/A'),
        escapeField(item.membership_number || 'N/A'),
        escapeField(item.status),
        escapeField(item.method),
        escapeField(new Date(item.checked_in_at).toLocaleString('en-KE')),
        escapeField(item.school_faculty || ''),
        escapeField(item.prayer_request || item.notes || ''),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    return { filename, csv: csvContent };
  }

  recordAttendance(data: {
    attendableType: string;
    attendableId: string;
    userId: string;
    status: string;
    method: string;
    visitorType: string;
  }) {
    return this.attendanceRepository.recordAttendance(data);
  }
}

