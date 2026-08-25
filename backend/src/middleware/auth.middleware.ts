import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { query } from '../config/database';

export interface AccessTokenPayload {
  sub: string; // user id
  username: string;
}

export interface ScopedAccess {
  ministryIds: Set<string>;
  committeeIds: Set<string>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      permissions?: Set<string>;
      scopedAccess?: ScopedAccess;
    }
  }
}

/** Verifies the JWT access token and attaches the decoded user to req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.user = payload;
    next();
  } catch {
    throw new AuthenticationError('Invalid or expired access token');
  }
}

/**
 * Database-driven RBAC/PBAC: loads the effective permission set for the
 * authenticated user (across all currently-held roles) and attaches it to
 * the request. Permissions are never hardcoded — see Chapter 3 of the SRS.
 *
 * Also loads *scoped* access: the specific ministry/committee IDs a role
 * like Ministry Leader is tied to (user_roles.scope_type/scope_id). Holding
 * the 'ministries.manage_members' permission doesn't by itself mean "every
 * ministry" — see enforceScope() below, which checks req.scopedAccess
 * against the ministry/committee a request actually targets.
 */
export async function loadPermissions(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new AuthenticationError();

  const [permissionRows, scopeRows] = await Promise.all([
    query<{ code: string }[]>(
      `SELECT DISTINCT p.code
         FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE`,
      { userId: req.user.sub }
    ),
    query<{ scope_type: string; scope_id: string }[]>(
      `SELECT scope_type, scope_id
         FROM user_roles
        WHERE user_id = :userId
          AND is_current = TRUE
          AND scope_type IN ('ministry', 'committee')
          AND scope_id IS NOT NULL`,
      { userId: req.user.sub }
    ),
  ]);

  req.permissions = new Set(permissionRows.map((r) => r.code));
  req.scopedAccess = {
    ministryIds: new Set(scopeRows.filter((r) => r.scope_type === 'ministry').map((r) => r.scope_id)),
    committeeIds: new Set(scopeRows.filter((r) => r.scope_type === 'committee').map((r) => r.scope_id)),
  };
  next();
}

/** Route guard factory: requires the caller to hold a specific permission code. */
export function requirePermission(permissionCode: string) {
  return requireAnyPermission(permissionCode);
}

/**
 * Route guard factory: passes if the caller holds ANY of the given
 * permission codes. Needed for scoped resources, where both the narrow
 * permission (e.g. 'ministries.manage_members', scope-checked afterward
 * by enforceScope) and the bypass permission (e.g.
 * 'ministries.manage_all_members', held by Secretary/Chairperson/Super
 * Admin) must each be enough to pass the base gate on their own.
 */
export function requireAnyPermission(...permissionCodes: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const held = permissionCodes.some((code) => req.permissions?.has(code));
    if (!held) {
      // Fire-and-forget: never let audit logging block or fail the request.
      if (req.user) {
        query(
          `INSERT INTO security_events (id, user_id, event_type, ip_address, user_agent, metadata)
           VALUES (UUID(), :userId, 'permission_denied', :ip, :ua, :metadata)`,
          {
            userId: req.user.sub,
            ip: req.ip ?? null,
            ua: req.headers['user-agent'] ?? null,
            metadata: JSON.stringify({ permissions: permissionCodes, path: req.originalUrl }),
          }
        ).catch(() => undefined);
      }
      throw new AuthorizationError(`Missing required permission: ${permissionCodes.join(' or ')}`);
    }
    next();
  };
}

/**
 * Route guard factory for ministry/committee-scoped resources (Ministry
 * Leader, Ministry Secretary, Ministry Treasurer, and their committee
 * equivalents). A holder of e.g. 'ministries.manage_members' can still only
 * touch the specific ministry their role is scoped to — UNLESS they also
 * hold `${resourceType}s.manage_all_${resourceType === 'ministry' ? 'members' : 'members'}`
 * equivalent bypass permission (Secretary, Chairperson, Super Admin).
 *
 * `getResourceId` extracts the ministry_id/committee_id the request targets
 * — from the request body on create, or from a pre-loaded record on
 * update/delete. Returning null means "can't determine yet, let the
 * handler 404 naturally" rather than blocking the request outright.
 */
export function enforceScope(
  resourceType: 'ministry' | 'committee',
  bypassPermission: string,
  getResourceId: (req: Request) => string | null | undefined
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.permissions?.has(bypassPermission)) return next();

    const resourceId = getResourceId(req);
    if (!resourceId) return next(); // let the handler's own not-found logic handle it

    const scopedIds =
      resourceType === 'ministry' ? req.scopedAccess?.ministryIds : req.scopedAccess?.committeeIds;

    if (!scopedIds?.has(resourceId)) {
      throw new AuthorizationError(
        `You can only manage the ${resourceType} you are assigned to lead`
      );
    }
    next();
  };
}
