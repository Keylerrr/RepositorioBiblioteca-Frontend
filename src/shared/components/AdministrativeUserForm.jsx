"use client";

import { useEffect, useState } from "react";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import AccountFeedback from "@/shared/components/AccountFeedback";
import { hasAccountPermission } from "@/shared/services/apiClient";
import { useAccountsApi } from "@/shared/components/AccountsProvider";

const outline = "!h-[42px] !border-[#C8102E] !text-[#C8102E]";
const primary = "!h-[42px] !border-[#C8102E] !bg-[#C8102E] hover:!bg-[#A80D27]";

export default function AdministrativeUserForm({ userId }) {
  const accountsApi = useAccountsApi();
  const { me: getViewer, user: getUser } = accountsApi;
  const editing = Boolean(userId);
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [createdUser, setCreatedUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [form, setForm] = useState({ collegue_code: "", full_name: "", email: "", is_active: "true" });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      setSessionRequired(false);
      setViewer(null);
      setOriginalUser(null);
      let authenticated = false;
      try {
        const current = await getViewer(controller.signal);
        authenticated = true;
        if (current.force_password_change) throw new Error("Debes cambiar tu contraseña provisional desde el inicio de sesión.");
        setViewer(current);
        if (!hasAccountPermission(current, editing ? "update" : "invite")) throw new Error(`Tu cuenta no tiene autorización para ${editing ? "editar" : "crear"} usuarios administrativos.`);
        if (editing) {
          if (!hasAccountPermission(current, "view")) throw new Error("Tu cuenta no tiene permiso para consultar usuarios administrativos.");
          const user = await getUser(userId, controller.signal);
          if (controller.signal.aborted) return;
          setOriginalUser(user);
          setForm({ collegue_code: user.collegue_code || "", full_name: user.full_name || "", email: user.email || "", is_active: String(user.is_active !== false) });
        }
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
  }, [getViewer, getUser, editing, userId, refresh]);

  const canSubmit = hasAccountPermission(viewer, editing ? "update" : "invite") && (!editing || Boolean(originalUser));
  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!canSubmit || loading || busy || createdUser) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        ...(editing ? { is_active: form.is_active === "true" } : { email: form.email.trim() }), full_name: form.full_name.trim(), collegue_code: form.collegue_code.trim(),
      };
      const user = editing ? await accountsApi.updateUser(userId, body) : await accountsApi.invite(body);
      setCreatedUser(editing ? { ...originalUser, ...body, ...user } : user);
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="text-[#1F242E]">
      <h1 className="text-[30px] leading-[41px] font-bold">{editing ? "Editar" : "Crear"} usuario administrativo</h1>
      <p className="mt-2 text-[13px] text-[#68707C]">{editing ? `${originalUser?.full_name || originalUser?.email || "Usuario administrativo"} · Código ${originalUser?.collegue_code || "—"} · Los cambios quedarán registrados en la bitácora.` : "Estado inicial: Activo · El alta y los cambios posteriores quedarán registrados en la bitácora."}</p>
      {loading && <p role="status" className="mt-6 rounded-lg bg-white p-6 text-sm text-[#6B758A]">Verificando acceso…</p>}
      {error && <div className="mt-5"><AccountFeedback error={error} sessionRequired={sessionRequired} retry={!viewer || (editing && !originalUser) ? () => setRefresh((value) => value + 1) : undefined} /></div>}
      {createdUser ? <div className="mt-8 space-y-5 rounded-[10px] bg-white p-6">
        <p role="status" className="rounded-lg bg-[#E8FAF0] p-4 text-sm text-[#0F8C45]">{editing ? `Se guardaron los cambios de ${createdUser.full_name || createdUser.email}.` : `Se creó la cuenta de ${createdUser.full_name || createdUser.email}. La contraseña provisional fue enviada a ${createdUser.email}.`}</p>
        {!editing && <p className="text-sm text-[#6B758A]">La cuenta no tiene permisos todavía. Deberá cambiar su contraseña al iniciar sesión por primera vez.</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className={outline} href="/admin/usuarios">Volver a usuarios</Button>
          {hasAccountPermission(viewer, "manage_permissions") && hasAccountPermission(viewer, "view") && <Button className={primary} href={`/admin/usuarios?vista=permisos&usuario=${encodeURIComponent(createdUser.id)}`}>Configurar permisos</Button>}
        </div>
      </div> : <form onSubmit={submit} className="mt-7 space-y-7" aria-busy={busy}>
        <fieldset disabled={loading || busy || !canSubmit}>
          <legend className="mb-2 text-base font-semibold">Datos personales</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField compact id="user-code" label="Código institucional" name="collegue_code" placeholder="Ej. 10584" value={form.collegue_code} onChange={update} />
            <FormField compact id="user-name" label="Nombre completo" name="full_name" autoComplete="name" placeholder="Nombres y apellidos" value={form.full_name} onChange={update} />
            <FormField compact id="user-email" label={editing ? "Correo institucional" : "Correo institucional *"} name="email" type="email" autoComplete="email" required={!editing} disabled={editing} placeholder="usuario@ufps.edu.co" value={form.email} onChange={update} />
          </div>
        </fieldset>
        {editing && <fieldset disabled={loading || busy || !canSubmit}>
          <legend className="mb-2 text-base font-semibold">Acceso</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField compact id="user-status" label="Estado" name="is_active" value={form.is_active} onChange={update} options={[{ value: "true", label: "Activo" }, { value: "false", label: "Inactivo" }]} />
          </div>
        </fieldset>}
        {editing && originalUser && hasAccountPermission(viewer, "manage_permissions") && <div>
          <h2 className="text-base font-semibold">Permisos individuales</h2>
          <p className="mt-2 text-xs text-[#6B758A]">Los permisos se configuran por usuario. Los cambios de datos y accesos quedarán registrados en la bitácora.</p>
          <Button variant="outline" className={`${outline} mt-4`} href={`/admin/usuarios?vista=permisos&usuario=${encodeURIComponent(userId)}`}>Configurar permisos</Button>
        </div>}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button href="/admin/usuarios" variant="outline" className={outline}>Cancelar</Button>
          <Button type="submit" className={`${primary} min-w-40`} disabled={loading || busy || !canSubmit}>{busy ? editing ? "Guardando cambios…" : "Creando usuario…" : editing ? "Guardar cambios" : "Crear usuario"}</Button>
        </div>
      </form>}
    </section>
  );
}
