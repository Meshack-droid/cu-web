import { BaseService } from '../../../core/base.service';
import { Leadership, LeadershipPosition, LeadershipAssignment, LeaderResponsibilitiesView } from '../interfaces/leadership.interface';
import { LeadershipRepository } from '../repositories/leadership.repository';
import { query } from '../../../config/database';
import { BusinessRuleError, NotFoundError } from '../../../utils/errors';

export class LeadershipService extends BaseService<Leadership> {
  private readonly leadershipRepo: LeadershipRepository;

  constructor(repository: LeadershipRepository = new LeadershipRepository()) {
    super(repository);
    this.leadershipRepo = repository;
  }

  async listPositions(): Promise<LeadershipPosition[]> {
    return this.leadershipRepo.findPositions();
  }

  async listAssignments(filters?: { status?: string; positionId?: string; userId?: string }): Promise<LeadershipAssignment[]> {
    return this.leadershipRepo.findAssignments(filters);
  }

  async assignLeader(params: {
    positionId: string;
    userId: string;
    assignmentType: 'permanent' | 'acting' | 'co-opted' | 'temporary';
    academicYear?: string;
    notes?: string;
  }): Promise<{ id: string }> {
    const position = await this.leadershipRepo.findPositionById(params.positionId);
    if (!position) {
      throw new NotFoundError('Leadership Position');
    }

    // Check if user exists
    const users = await query<any[]>('SELECT * FROM users WHERE id = :id LIMIT 1', { id: params.userId });
    if (!users || users.length === 0) {
      throw new NotFoundError('User');
    }

    // Find if there is an existing active assignment for this position
    const existing = await this.leadershipRepo.findAssignments({ positionId: params.positionId, status: 'active' });
    if (existing.length > 0) {
      // Mark current assignment as ended or replaced
      await this.leadershipRepo.updateAssignment(existing[0].id, {
        status: 'ended',
        notes: `Replaced by ${users[0].full_name} (${params.assignmentType})`,
      });
    }

    const id = await this.leadershipRepo.createAssignment({
      position_id: params.positionId,
      user_id: params.userId,
      assignment_type: params.assignmentType,
      academic_year: params.academicYear || '2025/2026',
      status: 'active',
      notes: params.notes || `Appointed as ${position.name} (${params.assignmentType})`,
    });

    return { id };
  }

  async appointReplacement(positionId: string, params: {
    userId: string;
    assignmentType: 'permanent' | 'acting' | 'co-opted' | 'temporary';
    notes?: string;
  }): Promise<{ id: string }> {
    // Find vacant assignment for this position
    const vacantAssignments = await this.leadershipRepo.findAssignments({ positionId, status: 'vacant' });
    if (vacantAssignments.length > 0) {
      // Update this vacant assignment
      await this.leadershipRepo.updateAssignment(vacantAssignments[0].id, {
        user_id: params.userId,
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: params.notes || `Appointed replacement under Article 9 (${params.assignmentType})`,
      });
      return { id: vacantAssignments[0].id };
    }

    return this.assignLeader({
      positionId,
      userId: params.userId,
      assignmentType: params.assignmentType,
      notes: params.notes,
    });
  }

  async updateAssignment(id: string, data: Partial<LeadershipAssignment>): Promise<void> {
    const existing = await this.leadershipRepo.findAssignmentById(id);
    if (!existing) {
      throw new NotFoundError('Leadership Assignment');
    }
    await this.leadershipRepo.updateAssignment(id, data);
  }

  async revokeAssignment(id: string, reason?: string): Promise<void> {
    const existing = await this.leadershipRepo.findAssignmentById(id);
    if (!existing) {
      throw new NotFoundError('Leadership Assignment');
    }
    await this.leadershipRepo.updateAssignment(id, {
      status: 'vacant',
      user_id: null,
      vacancy_reason: reason || 'Relieved of responsibility / Vacancy declared pursuant to Constitution Article 9',
      vacancy_date: new Date().toISOString().split('T')[0],
    });
  }

  async getMyResponsibilities(userId: string): Promise<LeaderResponsibilitiesView> {
    const users = await query<any[]>('SELECT * FROM users WHERE id = :id LIMIT 1', { id: userId });
    const user = users[0] || {
      id: userId,
      full_name: 'CU Leader',
      email: '',
      phone_number: '',
      admission_number: '',
    };

    const assignments = await this.leadershipRepo.findAssignments({ userId, status: 'active' });

    // Collect all responsibilities, permissions, and constitutional restrictions
    const allDuties: string[] = [];
    const allPerms: string[] = [];
    const allRestrictions: string[] = [];

    for (const a of assignments) {
      if (a.responsibilities) allDuties.push(...a.responsibilities);
      if (a.permissions) allPerms.push(...a.permissions);
      if (a.constitutional_restrictions) allRestrictions.push(...a.constitutional_restrictions);
    }

    // Attention items
    const applications = await query<any[]>('SELECT * FROM membership_applications WHERE status IN (\'submitted\', \'under_review\')');
    const vacancies = await this.leadershipRepo.findAssignments({ status: 'vacant' });
    const meetings = await query<any[]>('SELECT * FROM meetings WHERE status = \'awaiting_minutes\'');
    const financeResolutions = await query<any[]>('SELECT * FROM finance_resolutions WHERE status = \'pending_signatures\'');

    return {
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
        admission_number: user.admission_number,
      },
      positions: assignments,
      all_responsibilities: Array.from(new Set(allDuties)),
      permissions: Array.from(new Set(allPerms)),
      constitutional_restrictions: Array.from(new Set(allRestrictions)),
      pending_attention: {
        membership_applications: applications.length,
        leadership_vacancies: vacancies.length,
        meetings_awaiting_minutes: meetings.length,
        finance_awaiting_action: financeResolutions.length,
      },
    };
  }

  async getOverview() {
    const counts = await this.leadershipRepo.getCounts();
    const positions = await this.leadershipRepo.findPositions();
    const vacancies = await this.leadershipRepo.findAssignments({ status: 'vacant' });
    return {
      ...counts,
      positions_count: positions.length,
      vacancies,
      tenure_academic_year: '2025/2026',
      completion_percentage: 78,
    };
  }
}

