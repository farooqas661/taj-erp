# Android Back Navigation History Report

**Date:** 2026-08-02  
**App:** TAJ ERP

---

## Problem

The first back-button fix always sent users to **Dashboard** from any module. That ignored in-app history (for example Employee details → Employees).

---

## Desired behavior

| Action | Result |
|--------|--------|
| Employee details open → Back | Close details, stay on Employees |
| Employees → Back | Dashboard |
| Dashboard → Back | Exit app |
| Sidebar open → Back | Close sidebar |

---

## Cause of the old behavior

`App.jsx` treated any non-dashboard screen as “go to dashboard”:

```js
if (active !== "dashboard") setActive("dashboard");
```

There was no navigation stack and no overlay registry.

---

## Solution (no UI changes)

### 1. `src/lib/navHistory.js`

Lightweight in-app history:

- **Page stack** — e.g. `["dashboard", "employees"]`
- **Overlay closers** — functions registered while modals/details are open
- **`navigateTo(page)`** — updates the stack (opening Dashboard resets stack to `["dashboard"]`)
- **`goBack()`** — closes top overlay first, else pops a page, else signals exit
- **`pushOverlayCloser(fn)`** — pages register temporary back handlers

### 2. `src/App.jsx`

- Sidebar navigation uses `navigateTo` / `openPage` instead of raw `setActive`
- Android `backButton` calls `goBack()`:
  1. Close sidebar if open  
  2. Close overlay if any  
  3. Pop previous page  
  4. Exit only when stack is only Dashboard  

### 3. `src/pages/Employees.jsx`

When employee permission details open, registers:

```js
pushOverlayCloser(() => {
  setSelectedEmployee(null);
  setPermissions(null);
});
```

Closing via ✕ still clears state; the effect cleanup removes the closer so the stack stays correct.

---

## Flow example

1. Open app → stack `[dashboard]`
2. Open Employees → `[dashboard, employees]`
3. Open employee details → overlay closer registered
4. Back → overlay closes → still on Employees  
5. Back → stack `[dashboard]` → Dashboard  
6. Back → exit  

---

## Build

- `npm run build`
- `npx cap sync android`
- `gradlew assembleDebug`
- APK: `releases/taj-erp-debug.apk`

---

## Files changed

| File | Purpose |
|------|---------|
| `src/lib/navHistory.js` | History + overlay stack |
| `src/App.jsx` | Wire back button + sidebar nav |
| `src/pages/Employees.jsx` | Register employee-details closer |
| `releases/taj-erp-debug.apk` | New debug build |
| `ANDROID_BACK_NAVIGATION_REPORT.md` | This report |
