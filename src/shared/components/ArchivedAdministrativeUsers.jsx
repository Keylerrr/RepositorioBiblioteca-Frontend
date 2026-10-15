"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Open_Sans } from "next/font/google";
import Button from "@/shared/components/Button";
import AccountFeedback from "@/shared/components/AccountFeedback";
import { useAccountsApi } from "@/shared/components/AccountsProvider";
import { hasAccountPermission } from "@/shared/services/apiClient";
import { getUserDisplayName } from "@/shared/services/userService";

const outlineStyle = "!border-[#C8102E] !text-[#C8102E]";
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

function deletionDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }).replaceAll(" de ", " ").replace("sept", "sep");
}

export default function ArchivedAdministrativeUsers({ overview = false }) {
  const accountsApi = useAccountsApi();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [restoring, setRestoring] = useState(null);
  const [restoreError, setRestoreError] = useState(null);
  const [notice, setNotice] = useState("");
  const pending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      setSessionRequired(false);
      let authenticated = false;
      try {
        const viewer = await accountsApi.me(controller.signal);
        authenticated = true;
        if (viewer.force_password_change) throw new Error("Debes cambiar tu contraseña provisional desde el inicio de sesión.");
        if (!hasAccountPermission(viewer, "view")) throw new Error("Tu cuenta no tiene permiso para consultar usuarios administrativos.");
        const data = await accountsApi.archivedUsers(controller.signal);
        if (!Array.isArray(data)) throw new Error("El servidor no devolvió un listado de usuarios eliminados válido.");

        const actorIds = [...new Set(data.map((user) => user.deleted_by).filter((actor) => typeof actor === "number"))];
        const actors = new Map(await Promise.all(actorIds.map(async (id) => {
          try {
            return [id, await accountsApi.user(id, controller.signal)];
          } catch (error) {
            if (controller.signal.aborted || error.authExpired) throw error;
            return [id, { full_name: `Usuario #${id}` }];
          }
        })));
        if (!controller.signal.aborted) setUsers(data.map((user) => ({ ...user, deleted_by: actors.get(user.deleted_by) || user.deleted_by })));
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

  async function restore(user) {
    if (pending.current) return;
    pending.current = true;
    setRestoring(user.id);
    setRestoreError(null);
    setNotice("");
    try {
      await accountsApi.restoreUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setNotice(`La cuenta de ${getUserDisplayName(user)} fue restaurada correctamente.`);
    } catch (error) {
      setRestoreError(error);
    } finally {
      pending.current = false;
      setRestoring(null);
    }
  }

  const term = search.trim().toLocaleLowerCase("es");
  const filtered = users.filter((user) => [getUserDisplayName(user), user.email, user.collegue_code]
    .some((value) => String(value || "").toLocaleLowerCase("es").includes(term)));
  const count = !loading && !error && <span className="inline-flex h-[34px] min-w-[159px] items-center justify-center rounded-full bg-[#FFF0F2] px-[18px] text-[13px] font-semibold text-[#C8102E]" aria-live="polite">{users.length} {users.length === 1 ? "eliminado" : "eliminados"}</span>;

  if (overview) return (
    <section className={`${openSans.className} text-[#1F242E]`}>
      <p className="text-xs font-semibold text-[#C8102E]">ADMINISTRACIÓN · GOBIERNO</p>
      <header className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] leading-[48px] font-bold">Papelera</h1>
        {count}
      </header>
      <p className="mt-2 text-[15px] text-[#68707C]">Consulta los registros eliminados por tipo y decide cuáles restaurar.</p>
      {loading && <p role="status" className="mt-6 text-sm text-[#68707C]">Cargando papelera…</p>}
      {error && <div className="mt-6"><AccountFeedback error={error} sessionRequired={sessionRequired} retry={() => setRefresh((value) => value + 1)} /></div>}
      {!loading && !error && <Link href="/admin/papelera?vista=usuarios" className="mt-14 flex min-h-[204px] max-w-[352px] flex-col rounded-xl border border-[#D1D6E0] bg-white p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E]">
        <div className="flex items-center justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FFF0F2] text-sm font-bold text-[#C8102E]">UA</span>
          <span className="rounded-full bg-[#F5F6F9] px-3 py-1.5 text-[11px] text-[#68707C]">{users.length} {users.length === 1 ? "borrado" : "borrados"}</span>
        </div>
        <h2 className="mt-4 text-[19px] font-semibold">Usuarios administrativos</h2>
        <p className="mt-2 text-[13px] text-[#68707C]">Cuentas retiradas del acceso administrativo.</p>
        <span className="mt-6 text-sm font-semibold text-[#C8102E]">Ver eliminados →</span>
      </Link>}
    </section>
  );

  return (
    <section className={`${openSans.className} text-[#1F242E]`}>
      <Link href="/admin/papelera" className="inline-flex h-[30px] items-center text-sm font-semibold text-[#C8102E] hover:underline">← Volver a Papelera</Link>
      <h1 className="mt-3 text-[30px] leading-[48px] font-bold">Papelera · Usuarios administrativos</h1>
      <p className="mt-[3px] text-[15px] leading-6 text-[#68707C]">Cuentas retiradas del acceso a administración.</p>
      <div className="mt-11 flex flex-wrap items-center justify-between gap-4">
        <label className="w-full max-w-[560px]">
          <span className="sr-only">Buscar en usuarios administrativos eliminados</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en usuarios administrativos..." className="h-12 w-full rounded-lg border border-[#D1D6E0] bg-white px-4 text-sm outline-none placeholder:text-[#68707C] focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]" />
        </label>
        {count}
      </div>
      {notice && <p role="status" className="mt-4 rounded-lg bg-[#E8FAF0] p-3 text-sm text-[#0F8C45]">{notice}</p>}
      {restoreError && <div className="mt-4"><AccountFeedback error={restoreError} /></div>}
      {error && <div className="mt-4"><AccountFeedback error={error} sessionRequired={sessionRequired} retry={() => setRefresh((value) => value + 1)} /></div>}
      <div className="mt-6 min-h-[342px] overflow-hidden rounded-xl border border-[#D1D6E0] bg-white" aria-busy={loading}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-left">
            <caption className="sr-only">Usuarios administrativos eliminados</caption>
            <colgroup><col className="w-[40%]" /><col className="w-[18.5%]" /><col className="w-[19%]" /><col className="w-[22.5%]" /></colgroup>
            <thead className="h-12 bg-[#F5F6F9] text-xs text-[#68707C]">
              <tr>{["NOMBRE", "ELIMINADO EL", "ELIMINADO POR", "ACCIONES"].map((label) => <th key={label} scope="col" className="px-6 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} role="status" className="p-10 text-center text-sm text-[#68707C]">Cargando usuarios eliminados…</td></tr>}
              {!loading && !error && filtered.map((user) => <tr key={user.id} className="h-20 border-b border-[#D1D6E0]/65 last:border-0">
                <td className="break-words px-6 py-3"><p className="text-sm font-semibold">{getUserDisplayName(user)}</p><p className="mt-1 text-xs text-[#68707C]">Cuenta administrativa</p></td>
                <td className="px-6 text-[13px]">{deletionDate(user.deleted_at)}</td>
                <td className="break-words px-6 text-[13px]">{getUserDisplayName(user.deleted_by)}</td>
                <td className="px-3"><Button variant="outline" size="small" className={`${outlineStyle} !h-[38px] min-w-[105px] !text-[13px]`} disabled={restoring !== null} onClick={() => restore(user)} aria-label={`Restaurar a ${getUserDisplayName(user)}`}>{restoring === user.id ? "Restaurando…" : "Restaurar"}</Button></td>
              </tr>)}
              {!loading && !error && !filtered.length && <tr><td colSpan={4} className="p-10 text-center text-sm text-[#68707C]">{users.length ? "No hay usuarios eliminados que coincidan con la búsqueda." : "No hay usuarios administrativos eliminados."}</td></tr>}
            </tbody>
          </table>
        </div>
        {!loading && !error && <p className="px-6 py-5 text-xs text-[#68707C]" aria-live="polite">Mostrando {filtered.length} de {users.length} registros</p>}
      </div>
    </section>
  );
}
