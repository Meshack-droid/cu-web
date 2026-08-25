import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { BaseRepository } from '../../../core/base.repository';
import { AgendaItem, Meeting, MeetingMinutes, Resolution } from '../interfaces/meetings.interface';
import { toMySQLDateTime } from '../../../utils/datetime';

export class MeetingsRepository extends BaseRepository<Meeting> {
  constructor() {
    super('meetings');
  }
}

export class AgendaRepository {
  async listForMeeting(meetingId: string): Promise<AgendaItem[]> {
    return query<AgendaItem[]>(
      `SELECT * FROM meeting_agenda_items WHERE meeting_id = :meetingId ORDER BY display_order ASC`,
      { meetingId }
    );
  }

  async add(meetingId: string, data: Partial<AgendaItem>): Promise<AgendaItem> {
    const id = uuidv4();
    const countRows = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM meeting_agenda_items WHERE meeting_id = :meetingId`,
      { meetingId }
    );
    const displayOrder = data.display_order ?? countRows[0]?.count ?? 0;

    await query(
      `INSERT INTO meeting_agenda_items
         (id, meeting_id, title, description, is_voting_item, presenter_id, time_allocated_minutes, display_order)
       VALUES
         (:id, :meetingId, :title, :description, :isVotingItem, :presenterId, :timeAllocated, :displayOrder)`,
      {
        id,
        meetingId,
        title: data.title,
        description: data.description ?? null,
        isVotingItem: data.is_voting_item ?? false,
        presenterId: data.presenter_id ?? null,
        timeAllocated: data.time_allocated_minutes ?? null,
        displayOrder,
      }
    );
    const rows = await query<AgendaItem[]>(`SELECT * FROM meeting_agenda_items WHERE id = :id`, { id });
    return rows[0];
  }

  async reorder(meetingId: string, orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        query(
          `UPDATE meeting_agenda_items SET display_order = :index WHERE id = :id AND meeting_id = :meetingId`,
          { index, id, meetingId }
        )
      )
    );
  }
}

export class ResolutionRepository {
  async listForMeeting(meetingId: string): Promise<Resolution[]> {
    return query<Resolution[]>(`SELECT * FROM meeting_resolutions WHERE meeting_id = :meetingId`, {
      meetingId,
    });
  }

  async create(meetingId: string, data: Partial<Resolution>): Promise<Resolution> {
    const id = uuidv4();
    const countRows = await query<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM meeting_resolutions`
    );
    const resolutionNumber = data.resolution_number ?? `RES-${(countRows[0]?.count ?? 0) + 1}`;

    await query(
      `INSERT INTO meeting_resolutions
         (id, meeting_id, resolution_number, description, motion, mover_id, seconder_id,
          votes_for, votes_against, votes_abstain, status, responsible_user_id, due_date)
       VALUES
         (:id, :meetingId, :resolutionNumber, :description, :motion, :moverId, :seconderId,
          :votesFor, :votesAgainst, :votesAbstain, 'pending', :responsibleUserId, :dueDate)`,
      {
        id,
        meetingId,
        resolutionNumber,
        description: data.description,
        motion: data.motion ?? null,
        moverId: data.mover_id ?? null,
        seconderId: data.seconder_id ?? null,
        votesFor: data.votes_for ?? 0,
        votesAgainst: data.votes_against ?? 0,
        votesAbstain: data.votes_abstain ?? 0,
        responsibleUserId: data.responsible_user_id ?? null,
        dueDate: data.due_date ?? null,
      }
    );
    const rows = await query<Resolution[]>(`SELECT * FROM meeting_resolutions WHERE id = :id`, { id });
    return rows[0];
  }

  async updateStatus(id: string, status: Resolution['status']): Promise<void> {
    await query(`UPDATE meeting_resolutions SET status = :status WHERE id = :id`, { id, status });
  }
}

export class MinutesRepository {
  async findForMeeting(meetingId: string): Promise<MeetingMinutes | null> {
    const rows = await query<MeetingMinutes[]>(
      `SELECT * FROM meeting_minutes WHERE meeting_id = :meetingId LIMIT 1`,
      { meetingId }
    );
    return rows[0] ?? null;
  }

  async upsert(meetingId: string, recordedBy: string, content: string): Promise<MeetingMinutes> {
    const existing = await this.findForMeeting(meetingId);
    if (existing) {
      await query(`UPDATE meeting_minutes SET content = :content WHERE id = :id`, {
        id: existing.id,
        content,
      });
      return { ...existing, content };
    }

    const id = uuidv4();
    await query(
      `INSERT INTO meeting_minutes (id, meeting_id, recorded_by, content)
       VALUES (:id, :meetingId, :recordedBy, :content)`,
      { id, meetingId, recordedBy, content }
    );
    const rows = await query<MeetingMinutes[]>(`SELECT * FROM meeting_minutes WHERE id = :id`, { id });
    return rows[0];
  }

  async approve(meetingId: string, approvedBy: string): Promise<MeetingMinutes> {
    const existing = await this.findForMeeting(meetingId);
    if (!existing) throw new Error('Minutes have not been recorded yet');
    await query(
      `UPDATE meeting_minutes SET approved_at = NOW(), approved_by = :approvedBy WHERE id = :id`,
      { id: existing.id, approvedBy }
    );
    return { ...existing, approved_by: approvedBy, approved_at: toMySQLDateTime() };
  }
}

export class AttendanceConfirmationRepository {
  async confirm(meetingId: string, userId: string, method: string, isVisitor = false) {
    await query(
      `INSERT INTO meeting_attendance_confirmations (id, meeting_id, user_id, confirmed_at, method, is_visitor)
       VALUES (UUID(), :meetingId, :userId, NOW(), :method, :isVisitor)
       ON DUPLICATE KEY UPDATE confirmed_at = NOW(), method = :method`,
      { meetingId, userId, method, isVisitor }
    );
  }

  async listForMeeting(meetingId: string) {
    return query(
      `SELECT mac.*, u.full_name FROM meeting_attendance_confirmations mac
         JOIN users u ON u.id = mac.user_id
        WHERE mac.meeting_id = :meetingId`,
      { meetingId }
    );
  }
}
