import { BaseService } from '../../../core/base.service';
import { AttendanceRecord } from '../interfaces/attendance.interface';
import { AttendanceRepository } from '../repositories/attendance.repository';

export class AttendanceService extends BaseService<AttendanceRecord> {
  constructor(private readonly attendanceRepository: AttendanceRepository = new AttendanceRepository()) {
    super(attendanceRepository);
  }

  listForUser(userId: string, page = 1, pageSize = 20) {
    return this.attendanceRepository.listForUser(userId, page, pageSize);
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
