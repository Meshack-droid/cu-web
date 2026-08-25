import { PrayerRequestsRepository } from '../repositories/prayer-requests.repository';
import { PrayerPrivacyLevel } from '../interfaces/prayer-requests.interface';

export class PrayerRequestsService {
  constructor(private readonly repository: PrayerRequestsRepository = new PrayerRequestsRepository()) {}

  list(userId: string, canViewConfidential: boolean, page = 1, pageSize = 20) {
    return this.repository.listVisibleTo(userId, canViewConfidential, page, pageSize);
  }

  getById(id: string, userId: string, canViewConfidential: boolean) {
    return this.repository.findByIdVisibleTo(id, userId, canViewConfidential);
  }

  /**
   * `anonymous: true` means the request is submitted by an authenticated
   * member (still required, to prevent spam) but requested_by is stored as
   * NULL — true anonymity, not just "hidden in the UI". There is no way to
   * later trace an anonymous request back to its author from this record.
   */
  create(params: {
    userId: string;
    title: string;
    details: string;
    privacyLevel: PrayerPrivacyLevel;
    anonymous: boolean;
  }) {
    return this.repository.create({
      requestedBy: params.anonymous ? null : params.userId,
      title: params.title,
      details: params.details,
      privacyLevel: params.privacyLevel,
    });
  }

  update(
    id: string,
    userId: string,
    canViewConfidential: boolean,
    data: Partial<{ status: string; title: string; details: string; privacy_level: string }>
  ) {
    return this.repository.updateIfAllowed(id, userId, canViewConfidential, data as never);
  }
}
