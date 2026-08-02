# TAJ ERP — Production Readiness Report

**Date:** 2026-08-02  
**Scope:** Authentication, session handling, database indexes, error handling, API security, mobile responsiveness, APK compatibility  
**Constraint:** No new features — hardening and correctness only

---

## Verdict

The app is closer to production as a **HTTPS mobile-responsive web ERP**, but it is **not APK-ready** (no Capacitor/Android project).

Ship only after running the SQL scripts listed under **Deploy checklist**.

---

## What was fixed in this review

| Area | Change | Commit topic |
|------|--------|--------------|
| Session | App requires `erp_session_token` + approved employee before modules render | Gate app shell on session token |
| Indexes | Hot-path indexes SQL added | `supabase/production-indexes.sql` |
| Errors | Attendance check-in/out failures surfaced | Attendance error handling |
| Errors | Task create/status failures surfaced | Tasks error handling |
| Errors | Employee create/delete permission failures surfaced | Employees error handling |
| Errors | Wallet ledger insert failures surfaced | Wallet ledger checks |
| Auth | Client password helper rejects plaintext | password.js bcrypt-only |
| Auth | SQL to reject plaintext in `login_employee` | `supabase/fix-login-bcrypt-only.sql` |
| API security | Selfie storage policies tightened | `supabase/fix-storage.sql` |
| Mobile | Orders stats grid single-column on phones | Orders grid |
| Mobile | Sidebar logout stays reachable | Sidebar footer |
| Mobile / WebView | `viewport-fit=cover`, theme-color, title | `index.html` |

Backups: `backup-*-prod/`

---

## Area-by-area status

### 1. Authentication — Improved / conditional go

**Good**
- Login/register via SECURITY DEFINER RPCs
- Bcrypt hashes in `employee_secrets`
- Env-based Supabase keys

**Still required**
- Run `fix-login-bcrypt-only.sql` (after secure RLS + crypt fix)
- Change default admin password (`EMP001` / `admin123`)
- Confirm `secure-rls.sql` + `fix-crypt-extension.sql` are applied in the live project

**Remaining risk**
- No login rate limiting / lockout

### 2. Session handling — Improved

**Good**
- Opaque `erp_sessions` tokens, 14-day expiry
- `x-erp-token` on every request
- Logout clears token + employee id
- Shell no longer opens on `employee_id` alone

**Remaining risk**
- Token still in `localStorage` (XSS can steal it)
- Prefer HttpOnly cookie / Supabase Auth for stronger production posture later

### 3. Database indexes — Improved (SQL ready)

Run:

```text
supabase/production-indexes.sql
```

Covers attendance, tasks, orders, salary, employees filters, calls, wallet transactions, shopkeepers.

### 4. Error handling — Improved on critical writes

Fixed silent-success paths in Attendance, Tasks, Employees, Wallet ledgers.

**Remaining**
- Some list/fetch pages still treat failures as empty data (Dashboard, Reports, etc.)

### 5. API security — Improved / conditional go

**Good**
- Anon key only in client (correct)
- Session RLS model in place when SQL applied
- Password hashes not readable via Data API (secrets table)

**Still required**
1. Confirm secure RLS is live (not bootstrap `using (true)`)
2. Run `fix-storage.sql`
3. Dashboard → Storage → `employee-selfies` → **Public OFF**

**Remaining risk**
- Any logged-in session can still read broad employee fields under current select policies
- Registration upload remains open (needed until signed uploads exist)
- No CSP / security headers in the SPA itself (set at host)

### 6. Mobile responsiveness — Improved

**Good**
- Viewport meta, responsive grids, mobile sidebar
- Orders phone layout + reachable logout

**Remaining**
- Dense permission toggles / keyboard-over-modal on some Android browsers

### 7. APK compatibility — Not ready

| Check | Status |
|-------|--------|
| Capacitor / Cordova | Missing |
| `android/` project | Missing |
| AndroidManifest camera/location | N/A |
| Secure storage plugin | N/A |
| `vite` `base: './'` for WebView | Not set (correct for normal web hosting) |

This is a **Vite web app**. Camera/QR need **HTTPS**. Treat as mobile web until a native shell is added (that would be new packaging work, not done here).

---

## Deploy checklist (run in order)

1. App code on `main` (already pushed)
2. `supabase/secure-rls.sql` (if not already)
3. `supabase/fix-crypt-extension.sql` (if crypt error appeared)
4. `supabase/fix-login-bcrypt-only.sql`
5. `supabase/production-indexes.sql`
6. `supabase/fix-storage.sql`
7. Storage bucket `employee-selfies` → Public **OFF**
8. Clear browser site data once → log in again
9. Change admin password
10. Host over HTTPS only

---

## Production readiness scorecard

| Area | Score | Notes |
|------|-------|-------|
| Authentication | 7/10 | Bcrypt + RPC; need SQL apply + rate limit later |
| Session handling | 7/10 | Token gate done; localStorage remains |
| Database indexes | 8/10 | Script ready; must be run |
| Error handling | 7/10 | Critical writes fixed; some reads still quiet |
| API security | 6/10 | Depends on RLS/storage SQL applied live |
| Mobile responsiveness | 8/10 | Usable phone layout |
| APK compatibility | 2/10 | Web only — no native project |

**Overall:** Ready for **controlled HTTPS production web deploy** after SQL checklist. **Not ready for Play Store APK.**
