import { BaseService } from '../../../core/base.service';
import { Event, EventRegistration } from '../interfaces/events.interface';
import { EventRegistrationsRepository, EventsRepository } from '../repositories/events.repository';
import { BusinessRuleError, NotFoundError } from '../../../utils/errors';

/**
 * Event workflow (Chapter 13):
 *   Create -> Budget -> Approval -> Registration -> QR Ticket -> Attendance -> Reports -> Archive
 */
export class EventsService extends BaseService<Event> {
  constructor(
    private readonly eventsRepository: EventsRepository = new EventsRepository(),
    private readonly registrations: EventRegistrationsRepository = new EventRegistrationsRepository()
  ) {
    super(eventsRepository);
  }

  listPublic(page: number, pageSize: number) {
    return this.eventsRepository.listPublic(page, pageSize);
  }

  async approve(eventId: string) {
    const event = await this.getById(eventId);
    if (event.status !== 'budgeted') {
      throw new BusinessRuleError('An event must be budgeted before it can be approved');
    }
    return this.update(eventId, { status: 'approved' } as never);
  }

  async openRegistration(eventId: string) {
    const event = await this.getById(eventId);
    if (event.status !== 'approved') {
      throw new BusinessRuleError('An event must be approved before registration can open');
    }
    return this.update(eventId, { status: 'registration_open' } as never);
  }

  /** Online/walk-in registration with capacity-aware waitlisting and QR ticket issuance. */
  async register(eventId: string, params: { userId?: string; walkInName?: string }) {
    const event = await this.getById(eventId);
    if (event.status !== 'registration_open') {
      throw new BusinessRuleError('Registration is not currently open for this event');
    }
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      throw new BusinessRuleError('The registration deadline for this event has passed');
    }

    let status: EventRegistration['status'] = 'registered';
    if (event.capacity != null) {
      const confirmedCount = await this.registrations.countByStatus(eventId, 'registered');
      if (confirmedCount >= event.capacity) status = 'waitlisted';
    }

    return this.registrations.create({
      eventId,
      userId: params.userId ?? null,
      walkInName: params.walkInName ?? null,
      registrationType: params.userId ? 'online' : 'walk_in',
      status,
    });
  }

  async checkIn(qrCode: string) {
    const registration = await this.registrations.findByQrCode(qrCode);
    if (!registration) throw new NotFoundError('Registration');
    if (registration.status === 'attended') {
      throw new BusinessRuleError('This ticket has already been used to check in');
    }
    if (registration.status === 'cancelled') {
      throw new BusinessRuleError('This registration has been cancelled');
    }
    await this.registrations.markAttended(registration.id);
    return { ...registration, status: 'attended' as const };
  }

  async cancelRegistration(registrationId: string) {
    return this.registrations.cancel(registrationId);
  }

  async listRegistrations(eventId: string) {
    return this.registrations.listForEvent(eventId);
  }

  async archive(eventId: string) {
    const event = await this.getById(eventId);
    if (!['completed'].includes(event.status)) {
      throw new BusinessRuleError('Only a completed event can be archived');
    }
    return this.update(eventId, { status: 'archived' } as never);
  }
}
