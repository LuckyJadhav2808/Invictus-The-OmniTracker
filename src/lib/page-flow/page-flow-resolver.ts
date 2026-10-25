/**
 * Page Flow & Hierarchical Navigation Resolver
 * Provides deterministic subroute classification and Android hardware backstack action resolution.
 */

export interface SubrouteInfo {
  parentHref: string;
  parentLabel: string;
}

/**
 * Maps a given pathname to its parent route and human-readable breadcrumb label.
 * Returns null if the pathname is a root-level primary space.
 */
export function getSubrouteInfo(pathname: string): SubrouteInfo | null {
  if (pathname.startsWith("/study/") && pathname !== "/study") {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 2) {
      return { parentHref: `/study/${parts[1]}`, parentLabel: "Subject" };
    }
    return { parentHref: "/study", parentLabel: "Study" };
  }

  if (pathname.startsWith("/goals/") && pathname !== "/goals") {
    return { parentHref: "/goals", parentLabel: "Habits" };
  }

  if (pathname === "/settings" || pathname === "/admin" || pathname === "/profile") {
    return { parentHref: "/today", parentLabel: "Today" };
  }

  return null;
}

export type BackAction =
  | { type: "close_modal" }
  | { type: "navigate_back" }
  | { type: "navigate_today" }
  | { type: "exit_app" }
  | { type: "show_exit_toast" };

/**
 * Resolves the appropriate action to take when the user invokes the back action
 * (via Android hardware button, edge-swipe, or Esc key).
 *
 * Priority 1: Dismiss active modal / drawer
 * Priority 2: Pop subroute / secondary detail view
 * Priority 3: Return non-today root space to /today
 * Priority 4: Double-tap-to-exit guard on /today
 */
export function resolveBackAction(
  currentPath: string,
  hasOpenModal: boolean,
  lastBackPressTime: number,
  currentTime: number = Date.now()
): BackAction {
  if (hasOpenModal) {
    return { type: "close_modal" };
  }

  const isSubroute =
    currentPath !== "/today" &&
    (currentPath.includes("[") ||
      currentPath.split("/").filter(Boolean).length > 1 ||
      currentPath.startsWith("/settings") ||
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/profile"));

  if (isSubroute) {
    return { type: "navigate_back" };
  }

  if (currentPath !== "/today") {
    return { type: "navigate_today" };
  }

  if (currentTime - lastBackPressTime < 2000) {
    return { type: "exit_app" };
  }

  return { type: "show_exit_toast" };
}
