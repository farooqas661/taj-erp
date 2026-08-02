# Android Back Button Fix Report

**Date:** 2026-08-02  
**App:** TAJ ERP (Capacitor Android)

---

## Problem

After installing the debug APK, opening modules such as Employees, Wallet, Attendance, or Orders and pressing the **Android hardware Back** button closed the entire application.

---

## Root cause

TAJ ERP does **not** use browser URL routing (no React Router / History API). Module switching is done with React state:

```js
const [active, setActive] = useState("dashboard");
```

On Android, Capacitor’s WebView activity receives the hardware back press. Because there is no in-WebView history stack (`canGoBack` is false), the default behavior finishes the Activity and the app exits.

This is expected Capacitor behavior when the app does not listen for `backButton`.

---

## Fix (no UI changes)

1. Installed `@capacitor/app` (Capacitor 7).
2. In `src/App.jsx`, registered a native `backButton` listener that:

| Current state | Back button action |
|---------------|--------------------|
| Mobile sidebar open | Close sidebar |
| On Login (not logged in) | Exit app |
| On any module except Dashboard | Return to Dashboard |
| Already on Dashboard | Exit app |

Implementation uses refs so the listener always sees the latest `active` / `sidebarOpen` / `employeeId` without changing any screens or styling.

3. Rebuilt web assets (`npm run build`), synced Android (`npx cap sync android`), and produced a new debug APK.

---

## Files changed

| File | Change |
|------|--------|
| `package.json` / lockfile | Added `@capacitor/app` |
| `src/App.jsx` | Capacitor back-button handler |
| `releases/taj-erp-debug.apk` | New debug build |

---

## How to verify on device

1. Install `releases/taj-erp-debug.apk`
2. Log in
3. Open Employees (or Wallet / Attendance / Orders)
4. Press Android Back → should return to **Dashboard** (app stays open)
5. Press Back again on Dashboard → app exits
6. Open the sidebar menu → Back closes the sidebar first

---

## Notes

- Web browser behavior is unchanged (`Capacitor.isNativePlatform()` guard).
- Overlays inside individual pages (e.g. Wallet QR scanner) still unmount when leaving that module via Back-to-Dashboard; that is intentional for this fix scope.
