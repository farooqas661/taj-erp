# TAJ ERP — Secure RLS Final Report

**Date:** 2026-08-02  
**Scope:** All Supabase application tables used by TAJ ERP  
**Constraint honored:** No UI changes; existing login/register flows preserved

---

## Executive summary

Open `using (true)` RLS policies were replaced with a **session-token + role/permission** model.

Because the app uses the Supabase **anon key** (not Supabase Auth `auth.uid()`), secure RLS is enforced with:

1. `login_employee` / `register_employee` / `logout_employee` RPCs  
2. `erp_sessions` tokens sent as `x-erp-token`  
3. Permission helpers (`has_app_permission`, `is_non_worker`, etc.)  
4. Password hashes moved to `employee_secrets` (deny-all RLS)

---

## Tables reviewed

| Table | Previous policy | New policy summary |
|-------|-----------------|--------------------|
| `employees` | open all | Session required to read; write requires `employees` permission |
| `employee_permissions` | open all | Own row readable; writes require `employees` permission |
| `attendance` | open all | Own rows, or non-worker / attendance staff |
| `tasks` | open all | Assignee or tasks-capable / non-worker staff |
| `stock` | open all | `stock` permission (reports can read) |
| `salary_payments` | open all | Own rows readable; writes need `salary` permission |
| `orders` | open all | `orders` permission (assignee can read; reports can read) |
| `app_settings` | open all | Any valid session can read; writes need `settings` |
| `calls` | open all | Participants or `calls` permission |
| `wallets` | open all | Own wallet or `wallet` permission/role bypass |
| `shopkeepers` | open all | `wallet` permission/role bypass |
| `wallet_transactions` | open all | Own txns or `wallet` permission/role bypass |
| `erp_sessions` | *(new)* | Deny all direct client access |
| `employee_secrets` | *(new)* | Deny all direct client access |

Storage bucket `employee-selfies` left unchanged (registration selfie uploads).

---

## App wiring (no UI changes)

| File | Change |
|------|--------|
| `src/lib/supabase.js` | Sends `x-erp-token` on every request |
| `src/pages/Login.jsx` | Uses `login_employee` RPC; stores session token |
| `src/pages/Register.jsx` | Uses `register_employee` RPC |
| `src/App.jsx` | Clears token + employee id together |
| `src/components/Sidebar.jsx` | Calls `logout_employee` on logout |

---

## Required deployment step

**You must run this SQL in Supabase → SQL Editor:**

```text
supabase/secure-rls.sql
```

Deploy/refresh the app **with the latest code**, then run the SQL (or run SQL immediately after deploying so old clients are not left against locked tables).

After RLS is applied:

1. Log out / clear site data once (old `employee_id`-only sessions have no token)
2. Log in again with the same credentials (e.g. `EMP001` / `admin123`)
3. Confirm dashboard, attendance, and a permission-gated module load

---

## Security gains

- Anonymous anon-key clients can no longer read/write business tables without a valid session
- Password hashes are not readable via `employees` selects (`REDACTED` + locked `employee_secrets`)
- Login/register go through `SECURITY DEFINER` RPCs
- Module writes follow app permission flags (admins still have full access)
- Workers are scoped to own attendance/tasks/salary where applicable

## Remaining limitations (honest)

- Session tokens live in `localStorage` (XSS can steal them); mitigate with CSP / dependency hygiene
- Custom header sessions are weaker than Supabase Auth JWTs; migrating to Supabase Auth is the next hardening step
- Storage selfie bucket policies remain broadly open for registration uploads
- Token theft within the 14-day TTL allows API access as that employee until logout/expiry

---

## Git commits in this workstream

1. `Add secure session-based RLS policies for all ERP tables.`
2. `Send ERP session token on every Supabase request.`
3. `Switch login to secure login_employee RPC with session tokens.`
4. `Route employee registration through register_employee RPC.`
5. `Clear ERP session token when the app session ends.`
6. `Invalidate server session on logout.`
7. `Store password hashes in locked employee_secrets table.`
8. `Update password migration script for service-role and secrets sync.`
9. `Point full schema bootstrap to secure RLS follow-up script.`
10. *(this report)*

---

## Backups

Local backups were created under `backup-*-rls` / timestamped `backup-*` folders before edits.
