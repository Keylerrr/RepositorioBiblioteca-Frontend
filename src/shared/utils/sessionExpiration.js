export const SESSION_EXPIRED_EVENT = "library:session-expired";

let expiredNotificationShown = false;

export function shouldSkipSessionExpiredAlert(endpoint = "", route = typeof window !== "undefined" ? window.location.pathname : "") {
  const normalizedEndpoint = String(endpoint || "").toLowerCase();
  const normalizedRoute = String(route || "").toLowerCase();

  if (normalizedRoute.startsWith("/admin/login")) return true;

  return [
    "/auth/login/",
    "/auth/csrf/",
    "/auth/logout/",
    "/password/forgot/",
    "/password/reset/",
  ].some((candidate) => normalizedEndpoint.includes(candidate));
}

export function notifySessionExpired(reason = "Las credenciales de autenticación ya no son válidas.", details = {}) {
  if (typeof window === "undefined" || expiredNotificationShown) return;

  expiredNotificationShown = true;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
    detail: { reason, ...details },
  }));
}

export function clearSessionExpiredNotice() {
  expiredNotificationShown = false;
}
