const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://repositorio-biblioteca-backend.onrender.com").replace(/\/+$/, "");
export const MAX_HARVEST_LIMIT = 2147483647;
export const IMMEDIATE_HARVEST_ENABLED = false;

const FIELD_NAMES = {
  platforms: "Plataformas",
  frequency: "Frecuencia",
  start_date: "Fecha inicial",
  max_quantity: "Límite de revistas",
  stop_after_minutes: "Límite de tiempo",
  url: "URL",
  non_field_errors: "Validación",
};

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function errorMessage(payload, status) {
  if (payload?.detail) return String(payload.detail);
  if (payload && typeof payload === "object") {
    const messages = Object.entries(payload).map(([field, value]) =>
      `${FIELD_NAMES[field] || field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`,
    );
    if (messages.length) return messages.join(" · ");
  }
  return `La API respondió con un error (${status}). Intenta nuevamente.`;
}

async function request(path, { method = "GET", body, signal, timeoutMs = method === "GET" ? 30000 : 90000, expectJson = true } = {}) {
  const timeoutSignal = timeoutMs === null ? null : AbortSignal.timeout(timeoutMs);
  const signals = [signal, timeoutSignal].filter(Boolean);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body === undefined ? { Accept: "application/json" } : {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: signals.length ? AbortSignal.any(signals) : undefined,
      cache: "no-store",
    });
    if (response.ok && !expectJson) return;
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(errorMessage(payload, response.status), response.status, payload);
    if (payload === null) throw new Error("La API devolvió una respuesta que no se pudo leer.");
    return payload;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeoutSignal?.aborted) throw new Error("La API tardó demasiado en responder. Actualiza la vista antes de repetir una acción para comprobar si se guardó.");
    if (error instanceof TypeError) throw new Error("No se pudo conectar con la API. Revisa tu conexión e intenta nuevamente.");
    throw error;
  }
}

async function list(path, query = {}, signal) {
  const page = await request(`${path}?${new URLSearchParams(query)}`, { signal });
  if (!Array.isArray(page.results)) throw new Error("La API no devolvió un listado válido.");
  return page;
}

async function listAll(path, query, signal) {
  const items = [];
  let pageNumber = 1;
  let page;
  do {
    page = await list(path, { ...query, page: pageNumber, page_size: 100 }, signal);
    items.push(...page.results);
    pageNumber += 1;
  } while (page.next && pageNumber <= page.total_pages);
  return items;
}

export function getPlatforms(signal) {
  return listAll("/api/platforms/", { ordering: "name" }, signal);
}

export function getHarvests(page, signal) {
  return list("/api/harvesting/harvests/", { page, page_size: 10, ordering: "-created_at" }, signal);
}

export function getScheduleHarvests(scheduleId, signal) {
  return listAll("/api/harvesting/harvests/", { schedule: scheduleId, ordering: "-created_at" }, signal);
}

export async function getUpcomingSchedules(signal) {
  const [schedules, events] = await Promise.all([
    listAll("/api/harvesting/schedules/", { ordering: "-created_at" }, signal),
    listAll("/api/harvesting/events/", { ordering: "-scheduled_for" }, signal),
  ]);
  const executedOnceSchedules = new Set(events.map((event) => event.schedule));
  return schedules.filter((schedule) => schedule.frequency !== "once" || !executedOnceSchedules.has(schedule.id));
}

export function getLinkChecks(signal) {
  return listAll("/api/platforms/link-check-logs/", { ordering: "-last_check" }, signal);
}

export function getHarvestSources(platforms) {
  return platforms.filter((platform) => platform.is_harvestable === true);
}

export function getLatestLinkChecks(platforms, logs) {
  const latest = new Map();
  for (const log of logs) {
    const previous = latest.get(log.platform);
    const date = Date.parse(log.last_check || log.created_at) || 0;
    const previousDate = previous ? Date.parse(previous.last_check || previous.created_at) || 0 : -1;
    if (!previous || date > previousDate || (date === previousDate && log.id > previous.id)) {
      latest.set(log.platform, log);
    }
  }
  return platforms.flatMap((platform) => {
    const log = latest.get(platform.id);
    return log ? [{ ...log, resource: platform.name }] : [];
  }).sort((a, b) => b.fail_count - a.fail_count);
}

export function checkPlatformLink(platformId, url) {
  return request(`/api/platforms/${platformId}/check-link/`, {
    method: "POST",
    body: url === undefined ? {} : { url },
  });
}

export function createSchedule(payload) {
  return request("/api/harvesting/schedules/", { method: "POST", body: payload });
}

export function buildImmediateScheduleUpdate(schedule) {
  if (!schedule?.created_at || !Number.isFinite(Date.parse(schedule.created_at))) {
    throw new Error("La API no devolvió una fecha de creación válida. Actualiza la programación antes de reintentar su inicio.");
  }
  // Use the backend's own timestamp so browser clock drift cannot postpone an immediate run.
  return { start_date: schedule.created_at };
}

export function prepareImmediateSchedule(schedule) {
  return request(`/api/harvesting/schedules/${schedule.id}/`, {
    method: "PATCH",
    body: buildImmediateScheduleUpdate(schedule),
  });
}

export function runDueSchedules() {
  // Accept successful responses without a body; execution state comes from GET /harvests/.
  return request("/api/harvesting/schedules/run-due/", { method: "POST", timeoutMs: null, expectJson: false });
}

export function pauseHarvest(id) {
  return request(`/api/harvesting/harvests/${id}/pause/`, { method: "POST" });
}

export function resumeHarvest(id) {
  return request(`/api/harvesting/harvests/${id}/resume/`, { method: "POST", timeoutMs: null });
}

export function buildSchedule({ platformId, limit, minutes, mode, startDate, frequency }, now = new Date()) {
  const maxQuantity = limit === "" ? null : Number(limit);
  const stopAfterMinutes = minutes === "" ? null : Number(minutes);
  for (const value of [maxQuantity, stopAfterMinutes]) {
    if (value !== null && (!Number.isSafeInteger(value) || value <= 0)) {
      throw new Error("Los límites deben ser números enteros mayores que cero.");
    }
    if (value !== null && value > MAX_HARVEST_LIMIT) {
      throw new Error(`Los límites no pueden superar ${MAX_HARVEST_LIMIT} (máximo permitido por la API).`);
    }
  }
  if (maxQuantity === null && stopAfterMinutes === null) throw new Error("Indica al menos un límite: revistas o tiempo.");
  if (!Number.isSafeInteger(Number(platformId)) || Number(platformId) <= 0) throw new Error("Selecciona una plataforma de origen.");
  const start = mode === "now" ? now : new Date(`${startDate}:00-05:00`);
  if (!Number.isFinite(start.getTime())) throw new Error("Indica una fecha y hora inicial válidas.");
  if (mode !== "now" && start <= now) throw new Error("La fecha inicial debe ser posterior al momento actual (America/Bogota).");
  return {
    platforms: [Number(platformId)],
    frequency: mode === "now" ? "once" : frequency,
    start_date: start.toISOString(),
    max_quantity: maxQuantity,
    stop_after_minutes: stopAfterMinutes,
  };
}

export function nextBogotaDate(now = new Date()) {
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  return new Date(nextHour.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function formatDate(value) {
  if (!value) return "Sin iniciar";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
