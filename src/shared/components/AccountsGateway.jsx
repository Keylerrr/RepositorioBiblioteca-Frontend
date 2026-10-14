import "server-only";
import { cookies, headers } from "next/headers";
import AccountsProvider from "@/shared/components/AccountsProvider";
import HarvestingProvider from "@/features/admin/harvesting/components/HarvestingProvider";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://repositorio-biblioteca-backend.onrender.com").replace(/\/+$/, "");
const ALLOWED_ACCOUNT_MUTATIONS = [
  ["POST", /^presets\/$/],
  ["PATCH", /^presets\/\d+\/$/],
  ["DELETE", /^presets\/\d+\/$/],
  ["POST", /^auth\/(login|logout)\/$/],
  ["POST", /^password\/(change|forgot)\/$/],
  ["POST", /^users\/invite\/$/],
  ["POST", /^users\/\d+\/restore\/$/],
  ["PATCH", /^users\/\d+\/$/],
  ["DELETE", /^users\/\d+\/$/],
  ["PUT", /^users\/\d+\/permissions\/$/],
];

const PUBLIC_MUTATIONS = ["/api/accounts/auth/login/", "/api/accounts/password/forgot/"];

const ALLOWED_HARVEST_MUTATIONS = [
  ["POST", /^\/api\/harvesting\/schedules\/$/],
  ["POST", /^\/api\/harvesting\/schedules\/run-due\/$/],
  ["PATCH", /^\/api\/harvesting\/schedules\/\d+\/$/],
  ["DELETE", /^\/api\/harvesting\/schedules\/\d+\/$/],
  ["POST", /^\/api\/harvesting\/harvests\/\d+\/(pause|resume)\/$/],
  ["POST", /^\/api\/platforms\/\d+\/check-link\/$/],
];

async function responseData(response) {
  if (response.status === 204) return null;
  if (response.headers.get("content-type")?.includes("application/json")) {
    return response.json().catch(() => ({ detail: "El servidor devolvió una respuesta inválida." }));
  }
  return { detail: response.status === 403
    ? "El servidor rechazó la verificación de seguridad de la solicitud."
    : `El servidor devolvió una respuesta inesperada (${response.status}). Intenta nuevamente.` };
}

function transferCookies(response, store, jar, secure) {
  for (const raw of response.headers.getSetCookie()) {
    const [entry, ...attributes] = raw.split(";");
    const separator = entry.indexOf("=");
    const name = entry.slice(0, separator).trim();
    if (!["sessionid", "csrftoken"].includes(name)) continue;
    const value = entry.slice(separator + 1);
    const options = { path: "/", secure, sameSite: "lax", httpOnly: name === "sessionid" };
    for (const attribute of attributes) {
      const [key, ...parts] = attribute.trim().split("=");
      const content = parts.join("=");
      if (key.toLowerCase() === "httponly") options.httpOnly = true;
      if (key.toLowerCase() === "samesite" && content.toLowerCase() === "strict") options.sameSite = "strict";
      if (key.toLowerCase() === "max-age" && /^-?\d+$/.test(content)) options.maxAge = Number(content);
      if (key.toLowerCase() === "expires") {
        const expires = new Date(content);
        if (!Number.isNaN(expires.getTime())) options.expires = expires;
      }
    }
    // The browser talks to Next.js, so cookies belong to the frontend host and
    // protocol, rather than the external API's Domain, Path or Secure settings.
    store.set(name, value, options);
    jar.set(name, value);
  }
}

async function mutateBackend(path, method, body, timeoutMs = 90000) {
  if (body !== undefined && (!body || typeof body !== "object" || Array.isArray(body))) {
    return { status: 400, data: { detail: "Los datos de la solicitud no son válidos." } };
  }

  const store = await cookies();
  const incomingHeaders = await headers();
  const secure = incomingHeaders.get("x-forwarded-proto")?.split(",")[0].trim() === "https"
    || incomingHeaders.get("origin")?.startsWith("https://") === true;
  const jar = new Map(["sessionid", "csrftoken"].flatMap((name) => {
    const cookie = store.get(name);
    return cookie ? [[name, cookie.value]] : [];
  }));
  if (!PUBLIC_MUTATIONS.includes(path) && !jar.get("sessionid")) {
    return { status: 401, data: { detail: "Inicia sesión para realizar esta operación." } };
  }
  const cookieHeader = () => [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
  // Next.js verifies the browser's Origin against this app's Host for every
  // Server Action. The backend then validates its own origin, CSRF and session;
  // browser Origin/X-Forwarded-* headers are not relayed across these hosts.
  const backendHeaders = {
    Accept: "application/json",
    Origin: new URL(API_URL).origin,
    Referer: `${API_URL}/api/accounts/`,
  };
  try {
    const csrf = await fetch(`${API_URL}/api/accounts/auth/csrf/`, {
      headers: { ...backendHeaders, Cookie: cookieHeader() },
      cache: "no-store", signal: AbortSignal.timeout(60000), redirect: "error",
    });
    transferCookies(csrf, store, jar, secure);
    if (!csrf.ok) return { status: csrf.status, data: await responseData(csrf) };
    if (!jar.get("csrftoken")) return { status: 502, data: { detail: "No se pudo obtener el token de seguridad del servidor." } };

    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...backendHeaders, Cookie: cookieHeader(), "X-CSRFToken": jar.get("csrftoken"),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store", ...(timeoutMs === null ? {} : { signal: AbortSignal.timeout(timeoutMs) }), redirect: "error",
    });
    transferCookies(response, store, jar, secure);
    const data = await responseData(response);
    if (process.env.NODE_ENV === "development" && path === "/api/accounts/users/invite/" && !response.ok) {
      const safeData = JSON.stringify(data, (key, value) =>
        /password|token|secret|cookie|authorization/i.test(key) ? "[REDACTADO]" : value,
      );
      console.error(`[accounts/users/invite] HTTP ${response.status}: ${safeData}`);
    }
    return { status: response.status, data };
  } catch {
    return { status: 502, data: { detail: "No se pudo completar la solicitud al servidor. Comprueba el estado de la operación antes de repetirla." } };
  }
}

export default function AccountsGateway({ children }) {
  async function mutateAccount(path, method, body) {
    "use server";

    if (typeof path !== "string" || !ALLOWED_ACCOUNT_MUTATIONS.some(([verb, pattern]) => verb === method && pattern.test(path))) {
      return { status: 400, data: { detail: "La operación de cuentas solicitada no es válida." } };
    }
    return mutateBackend(`/api/accounts/${path}`, method, body);
  }

  async function mutateHarvest(path, method, body) {
    "use server";

    if (typeof path !== "string" || !ALLOWED_HARVEST_MUTATIONS.some(([verb, pattern]) => verb === method && pattern.test(path))) {
      return { status: 400, data: { detail: "La operación de cosecha solicitada no es válida." } };
    }
    const longRunning = path === "/api/harvesting/schedules/run-due/" || path.endsWith("/resume/");
    return mutateBackend(path, method, body, longRunning ? null : 90000);
  }

  return <AccountsProvider mutateAction={mutateAccount}>
    <HarvestingProvider mutateAction={mutateHarvest}>{children}</HarvestingProvider>
  </AccountsProvider>;
}
