# TUMCU Final QA & Local Testing

## Database recovery

The migration set is now linear and safe for both fresh and older local databases:

- `001_core_schema.sql`
- `002_operational_modules.sql`
- `003_event_schema_repair.sql`
- `004_security_schema_repair.sql`

`004_security_schema_repair.sql` is idempotent and repairs installations that previously missed the login security columns (`failed_login_attempts`, `locked_until`, `password_changed_at`) or `security_events`.

Run from `backend`:

```bash
npm run migrate
npm run seed
npm run create:admin -- --email admin@example.com --name "TUMCU Administrator"
```

## Authentication

- Registration creates a pending account and membership application.
- Pending applicants cannot log in until approval.
- Approval activates the account and automatically assigns the baseline `member` role.
- Login accepts email, admission number or phone number.
- Access tokens refresh automatically.
- Refresh-token reuse revokes all sessions for the user.
- Five consecutive password failures trigger a temporary lockout.
- `/auth/me` returns effective permissions and active role assignments.

## Ministry experience

- Every public ministry card opens a dedicated ministry page.
- The detail page shows ministry purpose, active member count and published trainings.
- An authenticated active/admitted member can join a ministry directly.
- Members can leave a ministry unless they are currently a leader/deputy.
- Ministry Leader role assignments remain scoped to their assigned ministry.
- Ministry Leaders can edit their assigned ministry details through the scoped `ministries.manage_details` permission.

## Role/RBAC behavior

- Roles and permissions are database-driven.
- Active members receive the `member` role on approval.
- Leadership roles are additive and can be scoped to ministries or committees.
- Chairperson and Secretary can access the membership application queue; only roles with `membership.approve` see approval/rejection actions.
- Technical administrator roles remain protected by server-side role-assignment rules.
- Frontend navigation is only a convenience; backend permissions remain authoritative.

## Local QA order

1. `npm install` in `backend` and `frontend`.
2. `npm run typecheck` in `backend`.
3. `npm run build` in `backend`.
4. `npm run migrate` and `npm run seed`.
5. Create the admin account.
6. `npm run dev` in backend.
7. `npm run build` in frontend.
8. `npm run dev` in frontend.
9. Test registration -> application -> admin approval -> member login.
10. Test ministry card -> ministry detail -> Join Ministry as an approved member.
11. Test role assignment and scoped Ministry Leader access.
12. Test the application from two devices on the same LAN; both clients must use the same backend and MySQL database.
