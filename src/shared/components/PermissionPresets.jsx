"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import AccountFeedback from "@/shared/components/AccountFeedback";
import { useAccountsApi } from "@/shared/components/AccountsProvider";
import { normalizeCatalog, valueFor } from "@/shared/components/UserPermissionMatrix";
import { clampPage, sanitizePageValue } from "@/shared/utils/pagination";

const primary = "!border-[#C8102E] !bg-[#C8102E] hover:!bg-[#A80D27]";
const outline = "!border-[#C8102E] !text-[#C8102E]";
const listUrl = "/admin/usuarios?vista=presets";

function DeletePresetDialog({ preset, onClose, onDeleted }) {
  const api = useAccountsApi();
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.deletePreset(preset.id);
      onDeleted(preset);
    } catch (error) {
      setError(error);
      setBusy(false);
    }
  }
  return <dialog ref={dialog} aria-labelledby="delete-preset-title" onCancel={(event) => { if (busy) event.preventDefault(); else onClose(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-[#D1D6E0] bg-white p-6 text-[#1F242E] shadow-xl backdrop:bg-black/40">
    <h2 id="delete-preset-title" className="text-xl font-bold">Eliminar preset</h2>
    <p className="my-4 text-sm text-[#6B758A]">¿Deseas eliminar el preset <strong>{preset.name}</strong>? Dejará de estar disponible para aplicarlo a usuarios.</p>
    {error && <AccountFeedback error={error} />}
    <div className="mt-5 flex justify-end gap-3">
      <Button variant="outline" className={outline} disabled={busy} onClick={onClose} autoFocus>Cancelar</Button>
      <Button className={primary} disabled={busy} onClick={remove}>{busy ? "Eliminando…" : "Eliminar preset"}</Button>
    </div>
  </dialog>;
}

export default function PermissionPresets({ result }) {
  const { me, presets: getPresets, permissions: getCatalog } = useAccountsApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState(result === "creado" ? "El preset se creó correctamente." : result === "actualizado" ? "El preset se guardó correctamente." : "");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setData(null);
      setError(null);
      setSessionRequired(false);
      let authenticated = false;
      try {
        const viewer = await me(controller.signal);
        authenticated = true;
        if (viewer.force_password_change) throw new Error("Debes cambiar tu contraseña provisional desde el inicio de sesión.");
        if (!viewer.is_superadmin && !viewer.effective_permissions?.accounts?.presets?.view) throw new Error("Tu cuenta no tiene permiso para consultar presets.");
        const [presets, catalogResponse] = await Promise.all([getPresets(controller.signal), getCatalog(controller.signal)]);
        if (controller.signal.aborted) return;
        if (!Array.isArray(presets) || presets.some((preset) => !preset || preset.id == null || typeof preset.name !== "string")) throw new Error("El servidor no devolvió una lista de presets válida.");
        const catalog = normalizeCatalog(catalogResponse);
        const rules = Object.entries(catalog).flatMap(([section, resources]) => Object.entries(resources).flatMap(([resource, actions]) => actions.map((action) => [section, resource, action])));
        setData({ viewer, presets, rules });
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(error);
        setSessionRequired(!authenticated && [401, 403].includes(error.status));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [me, getPresets, getCatalog, refresh]);
  const can = (action) => Boolean(data?.viewer.is_superadmin || data?.viewer.effective_permissions?.accounts?.presets?.[action]);
  const term = search.trim().toLocaleLowerCase("es");
  const filtered = (data?.presets || []).filter((preset) => (status === "all" || (preset.is_active !== false) === (status === "active")) && [preset.id, `PR-${String(preset.id).padStart(2, "0")}`, preset.name].some((value) => String(value).toLocaleLowerCase("es").includes(term)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = clampPage(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const [pageInput, setPageInput] = useState(String(currentPage));

  const handlePageSubmit = () => {
    const result = sanitizePageValue(pageInput, totalPages);
    if (!result.valid) {
      setPageInput(String(clampPage(page, totalPages)));
      return;
    }
    const nextPage = result.page;
    if (nextPage !== page) setPage(nextPage);
    setPageInput(String(nextPage));
  };

  return <section className="space-y-3.5 text-[#1F242E]">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-[30px] leading-[41px] font-bold">Presets de permisos</h1><p className="mt-3 text-[15px] text-[#6B758A]">Crea y configura conjuntos de permisos para aplicarlos a usuarios administrativos.</p></div>
      {can("create") && <Button href="/admin/usuarios?vista=crear-preset" className={`${primary} !h-[42px] min-w-40`}>Crear preset</Button>}
    </header>
    <div className="grid gap-3 rounded-[10px] bg-white px-3 py-2.5 sm:grid-cols-[1fr_260px]">
      <FormField compact id="presets-search" label="Buscar" type="search" placeholder="Nombre o identificador del preset" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      <FormField compact id="presets-status" label="Estado" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} options={[{ value: "active", label: "Activos" }, { value: "inactive", label: "Inactivos" }, { value: "all", label: "Todos" }]} />
    </div>
    {notice && <p role="status" className="rounded-lg bg-[#E8FAF0] p-3 text-sm text-[#0F8C45]">{notice}</p>}
    {error && <AccountFeedback error={error} sessionRequired={sessionRequired} retry={() => setRefresh((value) => value + 1)} />}
    <div className="min-h-[388px] rounded-[10px] bg-white px-4" aria-busy={loading}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed text-left text-xs">
          <caption className="sr-only">Presets de permisos del directorio</caption>
          <colgroup>{[6, 15, 25, 16, 16, 7, 15].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
          <thead className="h-[46px] border-b border-[#D1D6E0] bg-[#F2F5FA]"><tr>{["ID", "Permisos", "Nombre del preset", "Creado el", "Creado por", "Estado", "Acciones"].map((label) => <th key={label} scope="col" className="px-2.5 font-semibold">{label}</th>)}</tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} role="status" className="p-10 text-center text-[#6B758A]">Cargando presets…</td></tr>}
            {!loading && data && rows.map((preset) => <tr key={preset.id} className="h-[62px] border-b border-[#D1D6E0]">
              <td className="px-2.5">PR-{String(preset.id).padStart(2, "0")}</td>
              <td className="px-2.5">{preset.permissions ? `${data.rules.filter((entry) => valueFor(preset.permissions, entry)).length} de ${data.rules.length}` : "—"}</td>
              <td className="break-words px-2.5">{preset.name}</td>
              <td className="px-2.5">{preset.created_at ? new Date(preset.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
              <td className="break-words px-2.5">{preset.created_by?.full_name || (typeof preset.created_by === "string" ? preset.created_by : "—")}</td>
              <td className={`px-2.5 font-semibold ${preset.is_active === false ? "text-[#6B758A]" : "text-[#1F8C52]"}`}>{preset.is_active === false ? "Inactivo" : "Activo"}</td>
              <td className="px-1"><div className="flex gap-1.5"><Button size="small" variant="outline" className={outline} href={`/admin/usuarios?vista=editar-preset&preset=${encodeURIComponent(preset.id)}`}>{can("update") ? "Editar" : "Ver"}</Button>{can("delete") && <Button size="sm" className={primary} onClick={() => setSelected(preset)} aria-label={`Eliminar preset ${preset.name}`}>Eliminar</Button>}</div></td>
            </tr>)}
            {!loading && data && !rows.length && <tr><td colSpan={7} className="p-10 text-center text-[#6B758A]">No hay presets que coincidan con los filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      {!loading && data && <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-[#6B758A]">
        <p aria-live="polite">{filtered.length ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)} de ${filtered.length}` : "0"} presets{status === "active" ? " activos" : status === "inactive" ? " inactivos" : ""}</p>
        <div className="flex items-center gap-3"><button className="rounded px-2 py-1 text-[#C8102E] disabled:opacity-30" disabled={currentPage === 1} aria-label="Página anterior" onClick={() => { const nextPage = clampPage(currentPage - 1, totalPages); setPage(nextPage); setPageInput(String(nextPage)); }}>‹</button><label className="flex items-center gap-2 text-[#6B758A]"><span>Página</span><input aria-label="Número de página actual" type="number" min={1} max={totalPages} value={pageInput} onChange={(event) => setPageInput(event.target.value)} onBlur={() => setPageInput(String(clampPage(page, totalPages)))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handlePageSubmit(); } }} className="w-12 rounded border border-[#D1D6E0] bg-white px-1 py-0.5 text-center font-medium text-[#1F242E] outline-none focus:border-[#C8102E]" /><span>de {totalPages}</span></label><button className="rounded px-2 py-1 text-[#C8102E] disabled:opacity-30" disabled={currentPage === totalPages} aria-label="Página siguiente" onClick={() => { const nextPage = clampPage(currentPage + 1, totalPages); setPage(nextPage); setPageInput(String(nextPage)); }}>›</button></div>
      </div>}
    </div>
    <p className="text-xs text-[#6B758A]">Los cambios de un preset se usan al aplicarlo a un usuario. Revisa los permisos antes de guardar.</p>
    {selected && <DeletePresetDialog preset={selected} onClose={() => setSelected(null)} onDeleted={(preset) => { setSelected(null); setNotice(`El preset «${preset.name}» se eliminó correctamente.`); setRefresh((value) => value + 1); }} />}
    <Button variant="outline" className={outline} href="/admin/usuarios">Volver a usuarios</Button>
  </section>;
}
