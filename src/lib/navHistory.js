/**
 * In-app navigation history for Android back handling.
 * No UI — modules and overlays register here.
 */

const overlayClosers = [];
const listeners = new Set();

let stack = ["dashboard"];

const notify = () => {
  listeners.forEach((fn) => fn(getSnapshot()));
};

export const getSnapshot = () => ({
  stack: [...stack],
  current: stack[stack.length - 1] || "dashboard",
  canGoBack: overlayClosers.length > 0 || stack.length > 1,
});

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Navigate to a module page and update history. */
export const navigateTo = (page) => {
  if (!page) return getSnapshot().current;

  if (page === "dashboard") {
    stack = ["dashboard"];
    notify();
    return "dashboard";
  }

  const current = stack[stack.length - 1];
  if (current === page) {
    return page;
  }

  const existing = stack.lastIndexOf(page);
  if (existing >= 0) {
    stack = stack.slice(0, existing + 1);
  } else {
    stack = [...stack, page];
  }

  notify();
  return page;
};

/** Register an overlay/modal closer. Returns unregister fn. */
export const pushOverlayCloser = (closeFn) => {
  overlayClosers.push(closeFn);
  notify();

  return () => {
    const index = overlayClosers.lastIndexOf(closeFn);
    if (index >= 0) {
      overlayClosers.splice(index, 1);
      notify();
    }
  };
};

/**
 * Handle one back step.
 * @returns {"overlay"|"page"|"exit"}
 */
export const goBack = () => {
  if (overlayClosers.length > 0) {
    const closer = overlayClosers.pop();
    notify();
    closer();
    return "overlay";
  }

  if (stack.length > 1) {
    stack = stack.slice(0, -1);
    notify();
    return "page";
  }

  return "exit";
};

export const resetNavigation = () => {
  stack = ["dashboard"];
  overlayClosers.length = 0;
  notify();
};
