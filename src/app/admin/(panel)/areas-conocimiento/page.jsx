"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ───────────── Cliente del API (todas las rutas terminan en "/") ───────────── */
const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const CATALOG = "/api/catalog";
const RES = { areas: "knowledge-areas", programs: "academic-programs" };
const MAX_PAGES = 50;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// DRF responde { campo: ["mensaje"] }, { detail: "..." } o texto plano
const textOf = (data) =>
  typeof data === "string"
    ? data
    : data && typeof data === "object"
    ? Object.values(data).flat().filter((v) => typeof v === "string").join(" ")
    : "";

function errorMessage(data, status) {
  const text = textOf(data);
  if (text) return text;
  if (status === 404) return "El registro no existe o fue eliminado.";
  if (status >= 500) return "El servidor tuvo un problema. Intenta de nuevo en unos minutos.";
  return "No se pudo completar la solicitud.";
}

async function request(path, options = {}) {
  if (!BASE) throw new ApiError(0, "Falta configurar NEXT_PUBLIC_API_URL.");
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, res.status));
  return data ?? {};
}

// Los listados vienen paginados (10 por página): se recorren todas las páginas
async function listAll(path) {
  const items = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await request(`${path}?ordering=name&page=${page}`);
    if (Array.isArray(data)) return data;
    items.push(...(data?.results ?? []));
    if (!data?.next) break;
  }
  return items;
}

// El campo puede llegar como [1, 2] o como [{ id: 1, ... }]
const areaIdsOf = (p) => (p.knowledge_areas ?? []).map((a) => (typeof a === "object" ? a.id : a));

async function fetchCatalog() {
  const [areas, programs, areasDel, programsDel] = await Promise.all([
    listAll(`${CATALOG}/${RES.areas}/`),
    listAll(`${CATALOG}/${RES.programs}/`),
    listAll(`${CATALOG}/${RES.areas}/archived/`),
    listAll(`${CATALOG}/${RES.programs}/archived/`),
  ]);
  return { areas, programs, areasDel, programsDel };
}

const createItem = (res, body) =>
  request(`${CATALOG}/${res}/`, { method: "POST", body: JSON.stringify(body) });
const updateItem = (res, id, body) =>
  request(`${CATALOG}/${res}/${id}/`, { method: "PATCH", body: JSON.stringify(body) });
const deleteItem = (res, id, explanation) =>
  request(`${CATALOG}/${res}/${id}/`, { method: "DELETE", body: JSON.stringify({ delete_explanation: explanation }) });
const restoreItem = (res, id) => request(`${CATALOG}/${res}/${id}/restore/`, { method: "POST" });

/* ───────────── Utilidades y estilos ───────────── */
// El API guarda los nombres en minúsculas y sin espacios en los extremos
const normalize = (s) => (s ?? "").trim().toLowerCase();
const label = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "");

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8102e]";
const control = `w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ${focus}`;
const primary = `rounded-md bg-[#c8102e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a50d26] disabled:opacity-50 ${focus}`;
const secondary = `rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${focus}`;
const danger = `rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 ${focus}`;
const linkBtn = `rounded px-1 text-sm font-medium text-[#c8102e] hover:underline disabled:opacity-50 ${focus}`;

const TEXT = {
  areas: { one: "área", create: "Nueva área", rel: "Programas UFPS", noRel: "Sin programas vinculados", onlyEmpty: "Solo áreas sin programas" },
  programs: { one: "programa", create: "Nuevo programa", rel: "Áreas de conocimiento", noRel: "Sin áreas vinculadas", onlyEmpty: "Solo programas sin áreas" },
};

/* ───────────── Componentes ───────────── */
function Modal({ title, subtitle, onClose, busy, side, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    (el?.querySelector("input,textarea,select") ?? el?.querySelector("button"))?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex ${side ? "justify-end" : "items-center justify-center p-4"}`}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={() => !busy && onClose()} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={
          side
            ? "relative flex h-full w-full max-w-xl flex-col bg-white shadow-xl"
            : "relative flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
        }
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="modal-title" className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className={`rounded-md px-2 py-1 text-xl leading-none text-slate-600 hover:bg-slate-100 disabled:opacity-50 ${focus}`}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Footer({ busy, error, submit, busyLabel, onClose, tone }) {
  return (
    <div className="border-t border-slate-200 px-6 py-4">
      {error && (
        <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className={tone === "danger" ? danger : primary}>
          {busy ? busyLabel : submit}
        </button>
        <button type="button" onClick={onClose} disabled={busy} className={secondary}>Cancelar</button>
      </div>
    </div>
  );
}

/* Campo de etiquetas: Enter o coma agregan, Backspace quita la última */
function TagInput({ id, value, onChange }) {
  const [text, setText] = useState("");
  function add() {
    const t = normalize(text);
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  }
  return (
    <div className="flex flex-wrap gap-1.5 rounded-md border border-slate-300 bg-white p-2 focus-within:outline focus-within:outline-2 focus-within:outline-[#c8102e]">
      {value.map((p) => (
        <span key={p} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs text-slate-700">
          {label(p)}
          <button
            type="button"
            aria-label={`Quitar ${label(p)}`}
            onClick={() => onChange(value.filter((v) => v !== p))}
            className="rounded-full px-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        list="programas-existentes"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={value.length ? "Agregar otro…" : "Escribe un programa y presiona Enter"}
        className="min-w-[10rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
      />
    </div>
  );
}

/* Crear o editar un área / programa */
function ItemDialog({ kind, item, areas, onClose, onDone }) {
  const isProgram = kind === "programs";
  const [name, setName] = useState(item ? label(item.name) : "");
  const [ids, setIds] = useState(item?.areaIds ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Escribe un nombre.");
    if (isProgram && ids.length === 0) return setError("Selecciona al menos un área.");

    const body = {};
    if (!item) {
      body.name = name.trim();
      if (isProgram) body.knowledge_areas = ids;
    } else {
      if (normalize(name) !== normalize(item.name)) body.name = name.trim();
      if (isProgram && !sameSet(ids, item.areaIds)) body.knowledge_areas = ids;
      if (!Object.keys(body).length) return onClose();
    }

    setBusy(true);
    setError("");
    try {
      if (item) await updateItem(RES[kind], item.id, body);
      else await createItem(RES[kind], body);
      await onDone(item ? "Cambios guardados." : "Creado correctamente.");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`${item ? "Editar" : "Nuevo"} ${TEXT[kind].one}`} onClose={onClose} busy={busy}>
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <label className="block text-sm font-medium">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} className={`${control} mt-2`} />
          </label>
          {isProgram && (
            <fieldset disabled={busy}>
              <legend className="text-sm font-medium">Áreas de conocimiento</legend>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                {areas.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={ids.includes(a.id)}
                      onChange={(e) => setIds(e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id))}
                    />
                    {label(a.name)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
        <Footer busy={busy} error={error} submit="Guardar" busyLabel="Guardando…" onClose={onClose} />
      </form>
    </Modal>
  );
}

/* Eliminar: el API exige una explicación */
function DeleteDialog({ kind, item, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!reason.trim()) return setError("Escribe la explicación de la eliminación.");
    setBusy(true);
    setError("");
    try {
      const data = await deleteItem(RES[kind], item.id, reason.trim());
      // 204: eliminado del todo. 200: tenía relaciones, quedó desactivado y se puede restaurar
      await onDone(data ? data.detail || data.message || "Tenía relaciones: quedó desactivado y puede restaurarse." : "Eliminado.");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Eliminar ${TEXT[kind].one}`} onClose={onClose} busy={busy}
      subtitle={`«${label(item.name)}». Si no tiene relaciones se elimina de forma permanente; si otros elementos dependen de él, queda desactivado y puede restaurarse.`}>
      <form onSubmit={submit} noValidate>
        <div className="px-6 py-5">
          <label className="block text-sm font-medium">
            Explicación
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
              rows={3}
              className={`${control} mt-2`}
            />
          </label>
        </div>
        <Footer busy={busy} error={error} submit="Eliminar" busyLabel="Eliminando…" onClose={onClose} tone="danger" />
      </form>
    </Modal>
  );
}

/* Editar correspondencias: programas vinculados a cada área */
function LinksDrawer({ areas, programs, onClose, onDone }) {
  const [draft, setDraft] = useState(() => areas.map((a) => ({ id: a.id, name: a.name, programas: [...a.rel] })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const desired = new Map();
    draft.forEach((a) =>
      a.programas.forEach((n) => {
        if (!desired.has(n)) desired.set(n, new Set());
        desired.get(n).add(a.id);
      })
    );
    const existing = new Map(programs.map((p) => [normalize(p.name), p]));
    const ops = [];
    for (const p of programs) {
      const want = [...(desired.get(normalize(p.name)) ?? [])];
      if (!sameSet(want, areaIdsOf(p))) ops.push(() => updateItem(RES.programs, p.id, { knowledge_areas: want }));
    }
    for (const [name, ids] of desired) {
      if (!existing.has(name)) ops.push(() => createItem(RES.programs, { name, knowledge_areas: [...ids] }));
    }
    if (!ops.length) return onClose();

    setBusy(true);
    setError("");
    try {
      for (const op of ops) await op();
      await onDone("Correspondencias guardadas.");
    } catch (err) {
      await onDone(null); // refresca lo que ya se aplicó antes del error
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal side title="Editar correspondencias" onClose={onClose} busy={busy}
      subtitle="Escribe un programa y presiona Enter. Si no existe, se crea y se vincula al área.">
      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {draft.map((a) => (
            <fieldset key={a.id} disabled={busy} className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-semibold">{label(a.name)}</legend>
              <label htmlFor={`prog-${a.id}`} className="text-sm text-slate-700">Programas vinculados</label>
              <TagInput
                id={`prog-${a.id}`}
                value={a.programas}
                onChange={(v) => setDraft((cur) => cur.map((x) => (x.id === a.id ? { ...x, programas: v } : x)))}
              />
            </fieldset>
          ))}
        </div>
        <Footer busy={busy} error={error} submit="Guardar cambios" busyLabel="Guardando…" onClose={onClose} />
      </form>
    </Modal>
  );
}

/* ───────────── Página ───────────── */
export default function Page() {
  const [data, setData] = useState({ areas: [], programs: [], areasDel: [], programsDel: [] });
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");

  const [tab, setTab] = useState("areas");
  const [search, setSearch] = useState("");
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [desc, setDesc] = useState(false);

  const [dialog, setDialog] = useState(null); // { type: "item" | "delete" | "links", kind?, item? }
  const [toast, setToast] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus("loading");
    try {
      setData(await fetchCatalog());
      setLoadError("");
      setStatus("ready");
    } catch (err) {
      if (!silent) {
        setLoadError(err.message);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const closeDialog = useCallback(() => setDialog(null), []);

  async function afterChange(message) {
    await load({ silent: true });
    if (message) {
      setDialog(null);
      setToast(message);
    }
  }

  async function restore(kind, row) {
    try {
      await restoreItem(RES[kind], row.id);
      await afterChange("Restaurado.");
    } catch (err) {
      setToast(err.message);
    }
  }

  // Vistas con sus relaciones ya resueltas
  const areasView = useMemo(
    () =>
      data.areas.map((a) => ({
        id: a.id,
        name: a.name,
        rel: data.programs
          .filter((p) => areaIdsOf(p).includes(a.id))
          .map((p) => p.name)
          .sort((x, y) => x.localeCompare(y, "es")),
      })),
    [data]
  );

  const programsView = useMemo(() => {
    const names = new Map(data.areas.map((a) => [a.id, a.name]));
    return data.programs.map((p) => {
      const areaIds = areaIdsOf(p);
      return {
        id: p.id,
        name: p.name,
        areaIds,
        rel: areaIds.map((id) => names.get(id)).filter(Boolean).sort((x, y) => x.localeCompare(y, "es")),
      };
    });
  }, [data]);

  const archivedView = (list) =>
    list.map((r) => ({ id: r.id, name: r.name, rel: [], note: r.delete_explanation, when: r.deleted_at }));

  const text = TEXT[tab];
  const source = showArchived
    ? archivedView(tab === "areas" ? data.areasDel : data.programsDel)
    : tab === "areas"
    ? areasView
    : programsView;

  const q = normalize(search);
  const rows = source
    .filter(
      (r) =>
        (!q || normalize(r.name).includes(q) || r.rel.some((n) => normalize(n).includes(q))) &&
        (!onlyEmpty || showArchived || r.rel.length === 0)
    )
    .sort((a, b) => a.name.localeCompare(b.name, "es") * (desc ? -1 : 1));

  const ready = status === "ready";
  const sinProgramas = areasView.filter((a) => a.rel.length === 0).length;
  const archivedCount = (tab === "areas" ? data.areasDel : data.programsDel).length;
  const hasFilters = search || onlyEmpty;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <nav aria-label="Ruta" className="text-sm text-slate-600">
          Administración <span aria-hidden>/</span> <span className="font-medium text-slate-900">Clasificación</span>
        </nav>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Clasificación y programas académicos</h1>
            <p className="mt-2 text-sm text-slate-600">
              Esquema adoptado: OCDE Fields of Science and Technology (FOS), versión 2020.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {tab === "areas" && (
              <button type="button" disabled={!ready} onClick={() => setDialog({ type: "links" })} className={secondary}>
                Editar correspondencias
              </button>
            )}
            <button type="button" disabled={!ready} onClick={() => setDialog({ type: "item", kind: tab })} className={primary}>
              {text.create}
            </button>
          </div>
        </header>

        {status === "error" && (
          <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p>{loadError}</p>
            <button type="button" onClick={() => load()} className={secondary}>Reintentar</button>
          </div>
        )}

        <dl className="mt-7 grid divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["Áreas de conocimiento", data.areas.length],
            ["Programas académicos", data.programs.length],
            ["Áreas sin programas", sinProgramas],
          ].map(([name, value], i) => (
            <div key={name} className="px-5 py-4">
              <dt className="text-sm text-slate-600">{name}</dt>
              <dd className={`mt-1 text-2xl font-semibold tabular-nums ${i === 2 && ready && value ? "text-amber-700" : ""}`}>
                {ready ? value : "—"}
              </dd>
            </div>
          ))}
        </dl>

        {/* Pestañas */}
        <div role="tablist" aria-label="Recurso" className="mt-7 flex gap-1 border-b border-slate-200">
          {[["areas", "Áreas de conocimiento"], ["programs", "Programas académicos"]].map(([key, name]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setOnlyEmpty(false);
              }}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${focus} ${
                tab === key ? "border-[#c8102e] text-[#c8102e]" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Búsqueda y filtros */}
        <section aria-label="Filtros" className="mt-5 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${text.one} o ${tab === "areas" ? "programa" : "área"}…`}
            aria-label="Buscar"
            className={`${control} max-w-xs`}
          />
          <button
            type="button"
            aria-pressed={showArchived}
            disabled={!ready}
            onClick={() => setShowArchived((v) => !v)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${focus} ${
              showArchived ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Ver eliminados ({archivedCount})
          </button>
          {!showArchived && (
            <button
              type="button"
              aria-pressed={onlyEmpty}
              disabled={!ready}
              onClick={() => setOnlyEmpty((v) => !v)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${focus} ${
                onlyEmpty ? "border-amber-400 bg-amber-50 text-amber-900" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {text.onlyEmpty}
            </button>
          )}
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setOnlyEmpty(false);
              }}
              className={`text-sm text-slate-600 underline-offset-2 hover:underline ${focus}`}
            >
              Limpiar filtros
            </button>
          )}
        </section>

        {/* Tabla */}
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">
              {showArchived ? "Registros eliminados" : tab === "areas" ? "Áreas y programas vinculados" : "Programas y áreas vinculadas"}
            </caption>
            <thead className="bg-slate-100 text-xs font-semibold text-slate-700">
              <tr>
                <th scope="col" className="px-5 py-3.5" aria-sort={desc ? "descending" : "ascending"}>
                  <button type="button" onClick={() => setDesc((v) => !v)} className={`rounded font-semibold ${focus}`}>
                    {tab === "areas" ? "Área estándar" : "Programa"} {desc ? "↓" : "↑"}
                  </button>
                </th>
                <th scope="col" className="px-5 py-3.5">{showArchived ? "Motivo de eliminación" : text.rel}</th>
                <th scope="col" className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {status === "loading" && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-slate-600" aria-live="polite">
                    <p>Cargando áreas y programas…</p>
                    <p className="mt-1 text-xs">Si el servidor estaba inactivo, puede tardar hasta un minuto.</p>
                  </td>
                </tr>
              )}

              {ready &&
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <th scope="row" className="px-5 py-4 align-top font-medium">{label(row.name)}</th>
                    <td className="px-5 py-4">
                      {showArchived ? (
                        <span className="text-slate-600">
                          {row.note || "Sin explicación"}
                          {row.when && <span className="ml-2 text-xs text-slate-500">({fmtDate(row.when)})</span>}
                        </span>
                      ) : row.rel.length ? (
                        <ul className="flex flex-wrap gap-1.5">
                          {row.rel.map((n) => (
                            <li key={n} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{label(n)}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500">{text.noRel}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      {showArchived ? (
                        <button type="button" onClick={() => restore(tab, row)} className={linkBtn}>Restaurar</button>
                      ) : (
                        <span className="space-x-3">
                          <button type="button" onClick={() => setDialog({ type: "item", kind: tab, item: row })} className={linkBtn}>Editar</button>
                          <button type="button" onClick={() => setDialog({ type: "delete", kind: tab, item: row })} className={`${linkBtn} !text-red-700`}>Eliminar</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

              {ready && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-slate-600">
                    {showArchived && !hasFilters
                      ? "No hay registros eliminados."
                      : hasFilters
                      ? "Nada coincide con los filtros."
                      : `Aún no hay ${tab === "areas" ? "áreas" : "programas"} registrados.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <datalist id="programas-existentes">
        {data.programs.map((p) => <option key={p.id} value={label(p.name)} />)}
      </datalist>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
        {toast && <p className="pointer-events-auto max-w-md rounded-md bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">{toast}</p>}
      </div>

      {dialog?.type === "item" && (
        <ItemDialog kind={dialog.kind} item={dialog.item} areas={data.areas} onClose={closeDialog} onDone={afterChange} />
      )}
      {dialog?.type === "delete" && (
        <DeleteDialog kind={dialog.kind} item={dialog.item} onClose={closeDialog} onDone={afterChange} />
      )}
      {dialog?.type === "links" && (
        <LinksDrawer areas={areasView} programs={data.programs} onClose={closeDialog} onDone={afterChange} />
      )}
    </div>
  );
}