import { BaseService } from '../../../core/base.service';
import { Meeting } from '../interfaces/meetings.interface';
import {
  AgendaRepository,
  AttendanceConfirmationRepository,
  MeetingsRepository,
  MinutesRepository,
  ResolutionRepository,
} from '../repositories/meetings.repository';
import { BusinessRuleError } from '../../../utils/errors';

/**
 * Meeting lifecycle (Chapter 10):
 *   Create -> Assign Organizer -> Prepare Agenda -> Notify Members ->
 *   Confirm Attendance -> Conduct Meeting -> Record Minutes ->
 *   Pass Resolutions -> Assign Action Items -> Archive
 */
export class MeetingsService extends BaseService<Meeting> {
  constructor(
    repository: MeetingsRepository = new MeetingsRepository(),
    private readonly agenda: AgendaRepository = new AgendaRepository(),
    private readonly resolutions: ResolutionRepository = new ResolutionRepository(),
    private readonly minutes: MinutesRepository = new MinutesRepository(),
    private readonly attendance: AttendanceConfirmationRepository = new AttendanceConfirmationRepository()
  ) {
    super(repository);
  }

  async getAgenda(meetingId: string) {
    return this.agenda.listForMeeting(meetingId);
  }

  async addAgendaItem(meetingId: string, data: Parameters<AgendaRepository['add']>[1]) {
    const meeting = await this.getById(meetingId);
    if (['held', 'archived', 'cancelled'].includes(meeting.status)) {
      throw new BusinessRuleError(`Cannot edit agenda for a meeting that is ${meeting.status}`);
    }
    return this.agenda.add(meetingId, data);
  }

  async reorderAgenda(meetingId: string, orderedIds: string[]) {
    return this.agenda.reorder(meetingId, orderedIds);
  }

  async confirmAttendance(meetingId: string, userId: string, method: string, isVisitor = false) {
    return this.attendance.confirm(meetingId, userId, method, isVisitor);
  }

  async listAttendance(meetingId: string) {
    return this.attendance.listForMeeting(meetingId);
  }

  async recordMinutes(meetingId: string, recordedBy: string, content: string) {
    const meeting = await this.getById(meetingId);
    if (meeting.status === 'archived') {
      throw new BusinessRuleError('Cannot edit minutes for an archived meeting');
    }
    return this.minutes.upsert(meetingId, recordedBy, content);
  }

  async getMinutes(meetingId: string) {
    return this.minutes.findForMeeting(meetingId);
  }

  async approveMinutes(meetingId: string, approvedBy: string) {
    return this.minutes.approve(meetingId, approvedBy);
  }

  async listResolutions(meetingId: string) {
    return this.resolutions.listForMeeting(meetingId);
  }

  async passResolution(meetingId: string, data: Parameters<ResolutionRepository['create']>[1]) {
    return this.resolutions.create(meetingId, data);
  }

  async updateResolutionStatus(resolutionId: string, status: 'pending' | 'in_progress' | 'completed') {
    return this.resolutions.updateStatus(resolutionId, status);
  }

  /** Conduct -> archive transition. Minutes must exist and be approved first. */
  async archive(meetingId: string) {
    const minutes = await this.minutes.findForMeeting(meetingId);
    if (!minutes || !minutes.approved_at) {
      throw new BusinessRuleError('Minutes must be recorded and approved before archiving a meeting');
    }
    return this.update(meetingId, { status: 'archived' } as never);
  }
}
