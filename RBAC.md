# TECUMP / TUMCU RBAC

The platform uses database-driven role-based access control with scoped roles.

## System administration

| Role | Scope | Responsibility |
|---|---|---|
| Super Administrator | Global | Unrestricted platform access; receives every permission |
| System Administrator | Global | Roles, permissions, settings, backups, academic years, recovery and leadership administration |
| IT Administrator | Global | Technical settings, backups, recovery, audit/security visibility and system maintenance |

## Executive leadership

| Role | Scope | Responsibility |
|---|---|---|
| Chairperson | Global | Governance, coordination and institutional oversight |
| 1st Vice Chairperson | Global | Welfare and executive support |
| 2nd Vice Chairperson | Global | Associates/finalists and assigned ministry logistics |
| Secretary | Global | Records, correspondence, meetings, membership and ministry coordination |
| Vice Secretary | Global | Secretary support and hospitality |
| Treasurer | Global | Finance, payment and financial records |

## Committee leadership

Committee chair roles are assigned to a specific committee:

- Prayer Committee Chairperson
- Worship Committee Chairperson
- Missions Committee Chairperson
- Discipleship Committee Chairperson
- Assets Committee Chairperson
- Non-Residents Committee Chairperson
- Publicity Committee Chairperson

## Ministry leadership

These roles are always assigned to a specific ministry:

- Ministry Leader
- Ministry Secretary
- Ministry Treasurer

A ministry-scoped role can only manage the ministry in its `user_roles.scope_id`, unless the account also has an explicit all-members bypass permission.

## Advisory and member roles

- Patron — advisory/pastoral oversight without technical administration.
- Member — ordinary member self-service access.

## Administration UI

`/dashboard/admin/roles` includes:

1. Live role catalog grouped by category.
2. Permission chips loaded directly from the database.
3. Role descriptions and scope requirements.
4. Member search and role assignment.
5. Current role assignments and role termination.
6. Ministry/committee scope selection for scoped roles.

## Security model

The server remains the source of truth. Hiding a UI link never grants access. Every protected API route checks the authenticated user's database-derived permissions.

System administrators can manage roles through `system.manage_roles`. Constitutional leaders with `leadership.assign` can also perform leadership role assignments.
