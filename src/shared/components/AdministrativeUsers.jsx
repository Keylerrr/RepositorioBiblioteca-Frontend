"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import AccountFeedback from "@/shared/components/AccountFeedback";
import { hasAccountPermission } from "@/shared/services/apiClient";
import { useAccountsApi } from "@/shared/components/AccountsProvider";
import { clampPage, sanitizePageValue } from "@/shared/utils/pagination";

const PAGE_SIZE = 10;
const buttonStyle = "!border-[#C8102E] !text-[#C8102E]";
const primaryStyle = "!border-[#C8102E] !bg-[#C8102E] hover:!bg-[#A80D27]";

function DeactivateDialog({ user, onClose, onDeleted }) {
  const accountsApi = useAccountsApi();
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  async function deactivate() {
    setBusy(true);
    setError(null);
    try {
      await accountsApi.deactivate(user.id);
      onDeleted(user);
    } catch (error) {
      setError(error);
      setBusy(false);
    }
  }
  return (
    <dialog ref={dialog} aria-labelledby="deactivate-title" onCancel={(event) => { if (busy) event.preventDefault(); else onClose(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-[#D1D6E0] bg-white p-6 text-[#1F242E] shadow-xl backdrop:bg-black/40">
      <h2 id="deactivate-title" className="text-xl font-bold">Eliminar usuario administrativo</h2>
      <p className="my-4 text-sm text-[#6B758A]">Se desactivará la cuenta de <strong>{user.full_name || user.email}</strong> y se cerrará su sesión. Sus registros se conservarán.</p>
      {error && <AccountFeedback error={error} />}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="outline" className={buttonStyle} disabled={busy} onClick={onClose} autoFocus>Cancelar</Button>
        <Button className={primaryStyle} disabled={busy} onClick={deactivate}>{busy ? "Eliminando…" : "Eliminar usuario"}</Button>
      </div>
    </dialog>
  );
}

export default function AdministrativeUsers() {
  const accountsApi = useAccountsApi();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      setSessionRequired(false);
      setViewer(null);
      let authenticated = false;
      try {
        const current = await accountsApi.me(controller.signal);
        authenticated = true;
        if (current.force_password_change) throw new Error("Debes cambiar tu contraseña provisional desde el inicio de sesión.");
        setViewer(current);
        if (!hasAccountPermission(current, "view")) throw new Error("Tu cuenta no tiene permiso para consultar usuarios administrativos.");
        const data = await accountsApi.users(controller.signal);
        if (!Array.isArray(data)) throw new Error("El servidor no devolvió un listado de usuarios válido.");
        setUsers(data);
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
  }, [accountsApi, refresh]);

  const term = search.trim().toLocaleLowerCase("es");
  const filtered = users.filter((user) =>
    (status === "all" || Boolean(user.is_active) === (status === "active")) &&
    [user.collegue_code, user.full_name, user.email].some((value) => String(value || "").toLocaleLowerCase("es").includes(term)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = clampPage(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
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

  return (
    <section className="space-y-3.5 text-[#1F242E]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-[41px] font-bold">Usuarios administrativos</h1>
          <p className="mt-3 text-[15px] text-[#6B758A]">Consulta el personal administrativo autorizado para gestionar y curar el directorio.</p>
        </div>
        <div className="flex flex-wrap gap-3">
        {(viewer?.is_superadmin || viewer?.effective_permissions?.accounts?.presets?.view) && <Button variant="outline" className={buttonStyle} href="/admin/usuarios?vista=presets">Presets de permisos</Button>}
        {hasAccountPermission(viewer, "invite") && <Button href="/admin/usuarios?vista=crear" className={`${primaryStyle} !h-[42px] min-w-40`}>Crear usuario</Button>}
        </div>
      </header>
      <div className="grid gap-3 rounded-[10px] bg-white px-3 py-2.5 sm:grid-cols-[1fr_260px]">
        <FormField compact id="users-search" label="Buscar" type="search" placeholder="Código institucional, nombre o correo" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        <FormField compact id="users-status" label="Estado" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} options={[{ value: "active", label: "Activos" }, { value: "inactive", label: "Inactivos" }, { value: "all", label: "Todos" }]} />
      </div>
      {notice && <p role="status" className="rounded-lg bg-[#E8FAF0] p-3 text-sm text-[#0F8C45]">{notice}</p>}
      {error && <AccountFeedback error={error} sessionRequired={sessionRequired} retry={() => setRefresh((value) => value + 1)} />}
      <div className="min-h-[388px] rounded-[10px] bg-white px-4" aria-busy={loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed text-left text-xs">
            <caption className="sr-only">Usuarios administrativos del directorio</caption>
            <colgroup>{[6, 10, 22, 13, 15, 7, 27].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
            <thead className="h-[46px] border-b border-[#D1D6E0] bg-[#F2F5FA]">
              <tr>{["ID", "Código", "Nombre completo", "Creado el", "Creado por", "Estado", "Acciones"].map((label) => <th scope="col" key={label} className="px-2.5 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-10 text-center text-[#6B758A]" role="status">Cargando usuarios…</td></tr>}
              {!loading && !error && rows.map((user) => (
                <tr key={user.id} className="h-[62px] border-b border-[#D1D6E0]">
                  <td className="px-2.5">#{user.id}</td>
                  <td className="break-words px-2.5">{user.collegue_code || "—"}</td>
                  <td className="break-words px-2.5">{user.full_name || user.email}{user.is_superadmin && <span className="block text-[11px] text-[#6B758A]">Superadministrador</span>}</td>
                  <td className="px-2.5">{user.created_at ? new Date(user.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                  <td className="px-2.5">{user.created_by?.full_name || (typeof user.created_by === "string" ? user.created_by : "—")}</td>
                  <td className={`px-2.5 font-semibold ${user.is_active ? "text-[#1F8C52]" : "text-[#6B758A]"}`}>{user.is_active ? "Activo" : "Inactivo"}</td>
                  <td className="px-1"><div className="flex gap-1.5">
                    {hasAccountPermission(viewer, "update") && <Button size="small" variant="outline" href={`/admin/usuarios?vista=editar&usuario=${encodeURIComponent(user.id)}`} className={buttonStyle} aria-label={`Editar a ${user.full_name || user.email}`}>Editar</Button>}
                    <Button size="small" variant="outline" href={`/admin/usuarios?vista=permisos&usuario=${encodeURIComponent(user.id)}`} className={buttonStyle}>Permisos</Button>
                    {hasAccountPermission(viewer, "delete") && <Button size="sm" className={primaryStyle} disabled={user.is_superadmin || !user.is_active} onClick={() => setSelected(user)} aria-label={`Eliminar a ${user.full_name || user.email}`}>Eliminar</Button>}
                  </div></td>
                </tr>
              ))}
              {!loading && !error && !rows.length && <tr><td colSpan={7} className="p-10 text-center text-[#6B758A]">No hay usuarios que coincidan con los filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        {!loading && !error && <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-[#6B758A]">
          <p aria-live="polite">{filtered.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} de ${filtered.length}` : "0"} usuarios{status === "active" ? " activos" : status === "inactive" ? " inactivos" : ""}</p>
          <div className="flex items-center gap-3">
            <button className="rounded px-2 py-1 text-[#C8102E] disabled:opacity-30" disabled={currentPage === 1} aria-label="Página anterior" onClick={() => {
              const nextPage = clampPage(currentPage - 1, totalPages);
              setPage(nextPage);
              setPageInput(String(nextPage));
            }}>‹</button>
            <label className="flex items-center gap-2 text-[#6B758A]">
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
                    handlePageSubmit();
                  }
                }}
                className="w-12 rounded border border-[#D1D6E0] bg-white px-1 py-0.5 text-center font-medium text-[#1F242E] outline-none focus:border-[#C8102E]"
              />
              <span>de {totalPages}</span>
            </label>
            <button className="rounded px-2 py-1 text-[#C8102E] disabled:opacity-30" disabled={currentPage === totalPages} aria-label="Página siguiente" onClick={() => {
              const nextPage = clampPage(currentPage + 1, totalPages);
              setPage(nextPage);
              setPageInput(String(nextPage));
            }}>›</button>
          </div>
        </div>}
      </div>
      {hasAccountPermission(viewer, "view") && <Button variant="outline" className={buttonStyle} href="/admin/papelera?vista=usuarios">Recuperar cuentas eliminadas</Button>}
      <p className="text-xs text-[#6B758A]">Las altas, cambios y retiros de administrativos pueden consultarse en la bitácora de cambios.</p>
      {selected && <DeactivateDialog user={selected} onClose={() => setSelected(null)} onDeleted={(user) => {
        setUsers((current) => current.map((item) => item.id === user.id ? { ...item, is_active: false } : item));
        setSelected(null);
        setNotice(`La cuenta de ${user.full_name || user.email} fue desactivada.`);
        if (user.id === viewer.id) router.replace("/admin/login");
      }} />}
    </section>
  );
}
