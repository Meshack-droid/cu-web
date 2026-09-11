import { BaseRepository } from '../../../core/base.repository';
import { Leadership, LeadershipPosition, LeadershipAssignment } from '../interfaces/leadership.interface';
import { query } from '../../../config/database';
import { v4 as uuidv4 } from 'uuid';

export class LeadershipRepository extends BaseRepository<Leadership> {
  constructor() {
    super('executive_terms');
  }

  async findPositions(): Promise<LeadershipPosition[]> {
    const rows = await query<LeadershipPosition[]>(
      'SELECT * FROM leadership_positions ORDER BY display_order ASC'
    );
    return rows;
  }

  async findPositionById(id: string): Promise<LeadershipPosition | null> {
    const rows = await query<LeadershipPosition[]>(
      'SELECT * FROM leadership_positions WHERE id = :id LIMIT 1',
      { id }
    );
    return rows[0] || null;
  }

  async findAssignments(filters: { status?: string; positionId?: string; userId?: string } = {}): Promise<LeadershipAssignment[]> {
    let sql = 'SELECT * FROM leadership_assignments WHERE 1=1';
    const params: Record<string, any> = {};

    if (filters.status) {
      sql += ' AND status = :status';
      params.status = filters.status;
    }
    if (filters.positionId) {
      sql += ' AND position_id = :positionId';
      params.positionId = filters.positionId;
    }
    if (filters.userId) {
      sql += ' AND user_id = :userId';
      params.userId = filters.userId;
    }

    const rows = await query<LeadershipAssignment[]>(sql, params);
    return rows;
  }

  async findAssignmentById(id: string): Promise<LeadershipAssignment | null> {
    const rows = await query<LeadershipAssignment[]>(
      'SELECT * FROM leadership_assignments WHERE id = :id LIMIT 1',
      { id }
    );
    return rows[0] || null;
  }

  async createAssignment(data: Partial<LeadershipAssignment>): Promise<string> {
    const id = data.id || uuidv4();
    await query(
      `INSERT INTO leadership_assignments (id, position_id, user_id, academic_year, assignment_type, start_date, end_date, status, notes)
       VALUES (:id, :position_id, :user_id, :academic_year, :assignment_type, :start_date, :end_date, :status, :notes)`,
      {
        id,
        position_id: data.position_id,
        user_id: data.user_id,
        academic_year: data.academic_year || '2025/2026',
        assignment_type: data.assignment_type || 'permanent',
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        end_date: data.end_date || '2026-08-31',
        status: data.status || 'active',
        notes: data.notes || '',
      }
    );
    return id;
  }

  async updateAssignment(id: string, data: Partial<LeadershipAssignment>): Promise<void> {
    await query(
      `UPDATE leadership_assignments 
       SET status = :status, vacancy_reason = :vacancy_reason, vacancy_date = :vacancy_date, notes = :notes, user_id = :user_id
       WHERE id = :id`,
      {
        id,
        status: data.status,
        vacancy_reason: data.vacancy_reason || null,
        vacancy_date: data.vacancy_date || null,
        notes: data.notes || '',
        user_id: data.user_id !== undefined ? data.user_id : null,
      }
    );
  }

  async deleteAssignment(id: string): Promise<void> {
    await query('DELETE FROM leadership_assignments WHERE id = :id', { id });
  }

  async getCounts() {
    const assignments = await this.findAssignments();
    const active = assignments.filter((a) => a.status === 'active');
    const vacant = assignments.filter((a) => a.status === 'vacant');
    return {
      total: assignments.length,
      active: active.length,
      vacant: vacant.length,
    };
  }
}

