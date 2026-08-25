# TUMCU Authentication Fixes

## Why registration said "Please enter a valid email address"

The browser-side email regex in `frontend/src/pages/RegisterPage.tsx` was incorrectly escaped. It used `\\s` inside a regex literal instead of `\s`, so legitimate addresses containing the letter `s` could be rejected by the client before they reached the API.

The regex is now:

`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

The backend already uses Zod's standards-based `.email()` validation, so the browser and API now agree.

## Why an admin can get "Login failed"

The login endpoint only allows accounts whose `users.account_status` is active. Normal registration deliberately creates `pending_approval` accounts. Those accounts cannot log in until approved.

For a real first administrator, use the backend bootstrap command rather than registering through the public form:

`npm run create:admin -- --email admin@example.com --name "Site Administrator" --password "A-Strong-Password-Here"`

That command sets the account to `active`, verifies the email, clears lockout fields, and grants the `super_admin` role.

If an admin was already created, verify the account with this SQL in MySQL:

```sql
SELECT id, email, account_status, email_verified_at, failed_login_attempts, locked_until, deleted_at
FROM users
WHERE LOWER(email) = LOWER('admin@example.com');
```

Then verify the role:

```sql
SELECT u.email, r.code AS role_code, ur.is_current
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE LOWER(u.email) = LOWER('admin@example.com');
```

Do not put the password hash or JWT secrets in the frontend.
