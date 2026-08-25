import { BaseRepository, PaginationParams } from './base.repository';

/**
 * Generic service. Modules with real business rules (workflow transitions,
 * notifications, cross-table writes) should extend this and override methods
 * rather than putting logic in the controller or repository (Chapter 64).
 */
export class BaseService<T extends { id: string }> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  list(filters: Record<string, unknown> = {}, pagination: PaginationParams = {}) {
    return this.repository.findAll(filters, pagination);
  }

  getById(id: string) {
    return this.repository.findById(id);
  }

  create(data: Partial<T>) {
    return this.repository.create(data);
  }

  update(id: string, data: Partial<T>) {
    return this.repository.update(id, data);
  }

  remove(id: string) {
    return this.repository.remove(id);
  }
}
