"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/shared/services/apiClient";
import { clampPage, sanitizePageValue } from "@/shared/utils/pagination";
import AuditChangeDetails, { summarizeAuditValue } from "./AuditChangeDetails";

/* ───────────── Cliente del API de auditoría (solo lectura) ───────────── */
const AUDIT = "/api/audit/logs";

async function request(path, options = {}) {
  const { signal, ...rest } = options;
  return apiClient.get(path, {}, { signal, ...rest });
}

/* ───────────── Utilidades y estilos ───────────── */
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const pad = (n) => String(n).padStart(2, "0");
const label = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function fmtDate(iso, withSeconds = false) {
  const d = new Date(iso);
  if (isNaN(d)) return iso ?? "";
  const base = `${pad(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return withSeconds ? `${base}:${pad(d.getSeconds())}` : base;
}

const pairOf = (v) => (Array.isArray(v) ? v : ["", v]);

function fmtVal(v) {
  if (v === "" || v == null) return "—";
  return summarizeAuditValue(v);
}

function actionMeta(log) {
  if (log.is_soft_delete) return { text: "ARCHIVAR", cls: "text-red-700" };
  if (log.is_restore) return { text: "RESTAURAR", cls: "text-sky-700" };
  return (
    {
      create: { text: "CREAR", cls: "text-emerald-700" },
      update: { text: "ACTUALIZAR", cls: "text-amber-700" },
      delete: { text: "ELIMINAR", cls: "text-red-700" },
      access: { text: "ACCEDER", cls: "text-slate-600" },
    }[log.action_name] ?? { text: (log.action_display || "").toUpperCase(), cls: "text-slate-600" }
  );
}

function describe(log) {
  const repr = log.object_repr ? `“${log.object_repr}”` : `#${log.object_id}`;
  if (log.is_soft_delete) return `Archivó ${repr}`;
  if (log.is_restore) return `Restauró ${repr}`;
  if (log.action_name === "create") return `Registró ${repr}`;
  if (log.action_name === "delete") return `Eliminó ${repr}`;
  if (log.action_name === "access") return `Accedió a ${repr}`;
  const entries = Object.entries(log.changes ?? {});
  if (!entries.length) return `Actualizó ${repr}`;
  const [field, value] = entries[0];
  const [before, after] = pairOf(value);
  const more = entries.length > 1 ? ` (+${entries.length - 1} más)` : "";
  return `${repr} · ${field}: ${fmtVal(before)} → ${fmtVal(after)}${more}`;
}

const RANGES = [
  ["today", "Hoy"],
  ["7d", "Últimos 7 días"],
  ["30d", "Últimos 30 días"],
  ["90d", "Últimos 90 días"],
  ["all", "Todo el historial"],
  ["custom", "Personalizado"],
];

function rangeParams(range, from, to) {
  const start = (days) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };
  if (range === "today") return { from_date: start(0) };
  if (range === "7d") return { from_date: start(7) };
  if (range === "30d") return { from_date: start(30) };
  if (range === "90d") return { from_date: start(90) };
  if (range === "custom") {
    const p = {};
    if (from) p.from_date = new Date(`${from}T00:00:00`).toISOString();
    if (to) p.to_date = new Date(`${to}T23:59:59.999`).toISOString();
    return p;
  }
  return {};
}

const FALLBACK_ACTIONS = [
  { action: 0, name: "create", label: "Creación" },
  { action: 1, name: "update", label: "Actualización" },
  { action: 2, name: "delete", label: "Eliminación" },
  { action: 3, name: "access", label: "Acceso" },
];

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8102e]";
const control = `w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ${focus}`;
const primary = `rounded-md bg-[#c8102e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a50d26] disabled:opacity-50 ${focus}`;
const secondary = `rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${focus}`;

const EMPTY_FILTERS = { search: "", action: "", resource: "", actor: "", objectId: "", range: "30d", from: "", to: "" };
const PAGE_SIZE = 10;

/* ───────────── Componentes ───────────── */
function Modal({ title, subtitle, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.querySelector("button")?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-1 break-words text-sm text-slate-600">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={`rounded-md px-2 py-1 text-xl leading-none text-slate-600 hover:bg-slate-100 ${focus}`}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ name, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-sm text-slate-600">{name}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

/* Detalle de un registro: GET /api/audit/logs/{id}/ */
function DetailDrawer({ row, onClose, onHistory }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctl = new AbortController();
    setDetail(null);
    setError("");
    request(`${AUDIT}/${row.id}/`, { signal: ctl.signal })
      .then(setDetail)
      .catch((err) => err.name !== "AbortError" && setError(err.message));
    return () => ctl.abort();
  }, [row.id]);

  const log = detail ?? row; // se muestra lo del listado mientras llega el detalle
  const meta = actionMeta(log);
  const actor = detail?.actor_detail;

  return (
    <Modal title={`Registro #${log.id}`} subtitle={describe(log)} onClose={onClose}>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {!detail && !error && <p className="text-sm text-slate-600" aria-live="polite">Cargando detalle…</p>}
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            No se pudo cargar el detalle completo. {error}
          </p>
        )}

        <dl className="space-y-3">
          <Field name="Número del registro">#{log.id}</Field>
          <Field name="Fecha y hora">{fmtDate(log.timestamp, true)}</Field>
          <Field name="Acción"><span className={`font-semibold ${meta.cls}`}>{meta.text}</span></Field>
          <Field name="Entidad">{label(log.resource_display || log.resource)}</Field>
          <Field name="ID del objeto">#{log.object_id}</Field>
          <Field name="Objeto">{log.object_repr || "—"}</Field>
          <Field name="Administrador responsable">
            {log.actor_name ? (
              <>
                {log.actor_name}
                {actor && (
                  <span className="block text-slate-600">
                    {actor.email} · código {actor.code}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-600">Anónimo (sin usuario autenticado)</span>
            )}
          </Field>
          <Field name="Dirección IP">{log.remote_addr || "—"}</Field>
          {(log.is_soft_delete || log.is_restore) && (
            <Field name="Tipo">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {log.is_soft_delete ? "Borrado lógico (archivado)" : "Restauración de un registro archivado"}
              </span>
            </Field>
          )}
        </dl>

        <AuditChangeDetails
          changes={log.changes}
          action={log.is_soft_delete ? "archive" : log.is_restore ? "restore" : log.action_name}
          objectLabel={log.object_repr}
          additionalData={detail?.additional_data}
          changesText={detail?.changes_text}
        />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-slate-200 px-6 py-4">
        <button type="button" onClick={() => onHistory(log)} className={primary}>
          Ver historial de este registro
        </button>
        <button type="button" onClick={onClose} className={secondary}>Cerrar</button>
      </div>
    </Modal>
  );
}

/* ───────────── Página ───────────── */
export default function Page() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchText, setSearchText] = useState("");
  const [ordering, setOrdering] = useState("-timestamp");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [refresh, setRefresh] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [resources, setResources] = useState([]);
  const [actions, setActions] = useState(FALLBACK_ACTIONS);
  const [actors, setActors] = useState([]);
  const [selected, setSelected] = useState(null);

  // Catálogos para los filtros
  useEffect(() => {
    request(`${AUDIT}/resources/`).then(setResources).catch(() => {});
    request(`${AUDIT}/actions/`).then((a) => Array.isArray(a) && a.length && setActions(a)).catch(() => {});
  }, []);

  // Búsqueda con retardo para no consultar en cada tecla
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchText ? f : { ...f, search: searchText }));
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchText]);

  function setFilter(patch) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }

  const dates = useMemo(
    () => rangeParams(filters.range, filters.from, filters.to),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.range, filters.from, filters.to, refresh]
  );

  const query = useMemo(() => {
    const qs = new URLSearchParams({ ordering, page: String(page), page_size: String(PAGE_SIZE) });
    if (filters.search.trim()) qs.set("search", filters.search.trim());
    if (filters.action) qs.set("action_name", filters.action);
    if (filters.resource) qs.set("resource", filters.resource);
    if (filters.objectId) qs.set("object_id", filters.objectId);
    if (filters.actor === "anon") qs.set("is_anonymous", "true");
    else if (filters.actor === "user") qs.set("is_anonymous", "false");
    else if (filters.actor) qs.set("actor", filters.actor);
    Object.entries(dates).forEach(([k, v]) => qs.set(k, v));
    return qs.toString();
  }, [filters, dates, ordering, page]);

  // Listado paginado en el servidor
  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setError("");
    request(`${AUDIT}/?${query}`, { signal: ctl.signal })
      .then((d) => {
        setData(d);
        // No hay endpoint de usuarios: las opciones de responsable se arman con los que han aparecido
        setActors((cur) => {
          const map = new Map(cur.map((a) => [a.id, a.name]));
          (d.results ?? []).forEach((r) => r.actor != null && map.set(r.actor, r.actor_name || `Usuario ${r.actor}`));
          return [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "es"));
        });
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });
    return () => ctl.abort();
  }, [query, refresh]);

  const closeDetail = useCallback(() => setSelected(null), []);

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setSearchText("");
    setPage(1);
  }

  function showHistory(log) {
    setSelected(null);
    setSearchText("");
    setFilters({ ...EMPTY_FILTERS, range: "all", resource: log.resource, objectId: String(log.object_id) });
    setPage(1);
  }

  function toggleSort(field) {
    setOrdering((cur) => (cur === `-${field}` ? field : `-${field}`));
    setPage(1);
  }

  const sortMark = (field) => (ordering === field ? "↑" : ordering === `-${field}` ? "↓" : "");
  const ariaSort = (field) => (ordering === field ? "ascending" : ordering === `-${field}` ? "descending" : "none");

  const rows = data?.results ?? [];
  const totalItems = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const firstItem = rows[0]?.item_number ?? 0;

  function submitPageNumber() {
    const result = sanitizePageValue(pageInput, totalPages);
    if (!result.valid) {
      setPageInput(String(clampPage(page, totalPages)));
      return;
    }
    const nextPage = result.page;
    if (nextPage !== page) setPage(nextPage);
    setPageInput(String(nextPage));
  }
  const lastItem = rows.length ? (rows[rows.length - 1].item_number ?? firstItem + rows.length - 1) : 0;

  const filtersActive =
    filters.search || filters.action || filters.resource || filters.actor || filters.objectId || filters.range !== "30d";

  return (
    <div className="font-sans text-slate-900">
      <main>
        <nav aria-label="Ruta" className="text-sm text-slate-600">
          Administración <span aria-hidden>/</span> <span className="font-medium text-slate-900">Bitácora</span>
        </nav>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bitácora de cambios</h1>
            <p className="mt-2 text-sm text-slate-600">
              Registro trazable de altas, actualizaciones y retiros realizados por administradores. Solo lectura: los registros son inmutables.
            </p>
          </div>
          <button type="button" onClick={() => setRefresh((n) => n + 1)} disabled={loading} className={secondary}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </header>

        {/* Filtros */}
        <section aria-label="Filtros" className="mt-7 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-sm font-medium sm:col-span-2">
              Buscar
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Entidad, ID, usuario o descripción"
                className={`${control} mt-2`}
              />
            </label>
            <label className="text-sm font-medium">
              Acción
              <select className={`${control} mt-2`} value={filters.action} onChange={(e) => setFilter({ action: e.target.value })}>
                <option value="">Todas</option>
                {actions.map((a) => (
                  <option key={a.name} value={a.name}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Entidad
              <select className={`${control} mt-2`} value={filters.resource} onChange={(e) => setFilter({ resource: e.target.value, objectId: "" })}>
                <option value="">Todas</option>
                {resources.map((r) => (
                  <option key={r.resource} value={r.resource}>{label(r.label)}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Responsable
              <select className={`${control} mt-2`} value={filters.actor} onChange={(e) => setFilter({ actor: e.target.value })}>
                <option value="">Todos</option>
                <option value="user">Con usuario</option>
                <option value="anon">Anónimo (sin usuario)</option>
                {actors.length > 0 && (
                  <optgroup label="Usuarios">
                    {actors.map((a) => (
                      <option key={a.id} value={String(a.id)}>{a.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <label className="text-sm font-medium">
              Fecha
              <select className={`${control} mt-2`} value={filters.range} onChange={(e) => setFilter({ range: e.target.value })}>
                {RANGES.map(([value, name]) => (
                  <option key={value} value={value}>{name}</option>
                ))}
              </select>
            </label>
          </div>

          {filters.range === "custom" && (
            <div className="mt-4 grid max-w-md gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Desde
                <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter({ from: e.target.value })} className={`${control} mt-2`} />
              </label>
              <label className="text-sm font-medium">
                Hasta
                <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter({ to: e.target.value })} className={`${control} mt-2`} />
              </label>
            </div>
          )}

          {(filters.objectId || filtersActive) && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {filters.objectId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs text-slate-700">
                  Registro: {label(filters.resource)} #{filters.objectId}
                  <button
                    type="button"
                    aria-label="Quitar filtro de registro"
                    onClick={() => setFilter({ objectId: "" })}
                    className="rounded-full px-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {filtersActive && (
                <button type="button" onClick={clearFilters} className={`text-sm text-slate-600 underline-offset-2 hover:underline ${focus}`}>
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </section>

        {error && (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p>{error}</p>
            <button type="button" onClick={() => setRefresh((n) => n + 1)} className={secondary}>Reintentar</button>
          </div>
        )}

        {/* Tabla */}
        <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white" aria-busy={loading}>
          <table className={`w-full min-w-[900px] text-left text-sm transition-opacity ${loading && data ? "opacity-60" : ""}`}>
            <caption className="sr-only">Registros de auditoría del sistema</caption>
            <thead className="bg-slate-100 text-xs font-semibold text-slate-700">
              <tr>
                <th scope="col" className="px-5 py-3.5" aria-sort={ariaSort("timestamp")}>
                  <button type="button" onClick={() => toggleSort("timestamp")} className={`rounded font-semibold ${focus}`}>
                    Fecha y hora {sortMark("timestamp")}
                  </button>
                </th>
                <th scope="col" className="px-5 py-3.5" aria-sort={ariaSort("action")}>
                  <button type="button" onClick={() => toggleSort("action")} className={`rounded font-semibold ${focus}`}>
                    Acción {sortMark("action")}
                  </button>
                </th>
                <th scope="col" className="px-5 py-3.5">Entidad</th>
                <th scope="col" className="px-5 py-3.5">ID</th>
                <th scope="col" className="px-5 py-3.5">Responsable</th>
                <th scope="col" className="px-5 py-3.5">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!data && loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-600" aria-live="polite">
                    <p>Cargando registros…</p>
                    <p className="mt-1 text-xs">Si el servidor estaba inactivo, puede tardar hasta un minuto.</p>
                  </td>
                </tr>
              )}

              {rows.map((log) => {
                const meta = actionMeta(log);
                return (
                  <tr key={log.id} onClick={() => setSelected(log)} className="cursor-pointer hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 align-top">
                      <button type="button" aria-label={`Ver detalle del registro ${log.id}`} className={`rounded text-left ${focus}`}>
                        {fmtDate(log.timestamp)}
                      </button>
                    </td>
                    <td className={`whitespace-nowrap px-5 py-4 align-top text-xs font-bold tracking-wide ${meta.cls}`}>{meta.text}</td>
                    <td className="px-5 py-4 align-top">{label(log.resource_display || log.resource)}</td>
                    <td className="whitespace-nowrap px-5 py-4 align-top tabular-nums">#{log.object_id}</td>
                    <td className="px-5 py-4 align-top">
                      {log.actor_name ?? <span className="text-slate-500">Anónimo</span>}
                    </td>
                    <td className="max-w-md px-5 py-4 align-top text-slate-700">
                      <span className="line-clamp-2 break-words">{describe(log)}</span>
                    </td>
                  </tr>
                );
              })}

              {data && !loading && rows.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-600">
                    <p>No hay registros que coincidan con los filtros.</p>
                    {filtersActive && (
                      <button type="button" onClick={clearFilters} className={`mt-3 ${secondary}`}>Limpiar filtros</button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p aria-live="polite">
              {totalItems ? `Mostrando ${firstItem}–${lastItem} de ${totalItems}` : "Sin resultados"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => {
                const nextPage = clampPage(page - 1, totalPages);
                setPage(nextPage);
                setPageInput(String(nextPage));
              }} disabled={loading || !data.previous} className={secondary}>
                Anterior
              </button>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span>Página</span>
                <input
                  aria-label="Número de página actual"
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  onBlur={() => setPageInput(String(clampPage(page, totalPages)))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitPageNumber();
                    }
                  }}
                  className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm font-medium text-slate-900 outline-none focus:border-[#c8102e]"
                />
                <span>de {totalPages}</span>
              </label>
              <button type="button" onClick={() => {
                const nextPage = clampPage(page + 1, totalPages);
                setPage(nextPage);
                setPageInput(String(nextPage));
              }} disabled={loading || !data.next} className={secondary}>
                Siguiente
              </button>
            </div>
          </div>
        )}
      </main>

      {selected && <DetailDrawer row={selected} onClose={closeDetail} onHistory={showHistory} />}
    </div>
  );
}