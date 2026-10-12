"use client";

import { useEffect, useState } from "react";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import AccountFeedback from "@/shared/components/AccountFeedback";
import { hasAccountPermission } from "@/shared/services/apiClient";
import { useAccountsApi } from "@/shared/components/AccountsProvider";

const outline = "!h-[42px] !border-[#C8102E] !text-[#C8102E]";
const primary = "!h-[42px] !border-[#C8102E] !bg-[#C8102E] hover:!bg-[#A80D27]";

export default function AdministrativeUserForm() {
  const accountsApi = useAccountsApi();
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [createdUser, setCreatedUser] = useState(null);
  const [form, setForm] = useState({ collegue_code: "", full_name: "", email: "" });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      setSessionRequired(false);
      setViewer(null);
      try {
        const current = await accountsApi.me(controller.signal);
        if (current.force_password_change) throw new Error("Debes cambiar tu contraseña provisional desde el inicio de sesión.");
        setViewer(current);
        if (!hasAccountPermission(current, "invite")) throw new Error("Tu cuenta no tiene autorización para crear usuarios administrativos.");
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(error);
        setSessionRequired([401, 403].includes(error.status));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [accountsApi, refresh]);

  const canInvite = hasAccountPermission(viewer, "invite");
  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!canInvite || busy || createdUser) return;
    setBusy(true);
    setError(null);
    try {
      const user = await accountsApi.invite({
        email: form.email.trim(), full_name: form.full_name.trim(), collegue_code: form.collegue_code.trim(),
      });
      setCreatedUser(user);
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="text-[#1F242E]">
      <h1 className="text-[30px] leading-[41px] font-bold">Crear usuario administrativo</h1>
      <p className="mt-2 text-[13px] text-[#68707C]">Estado inicial: Activo · El alta y los cambios posteriores quedarán registrados en la bitácora.</p>
      {loading && <p role="status" className="mt-6 rounded-lg bg-white p-6 text-sm text-[#6B758A]">Verificando acceso…</p>}
      {error && <div className="mt-5"><AccountFeedback error={error} sessionRequired={sessionRequired} retry={!viewer ? () => setRefresh((value) => value + 1) : undefined} /></div>}
      {createdUser ? <div className="mt-8 space-y-5 rounded-[10px] bg-white p-6">
        <p role="status" className="rounded-lg bg-[#E8FAF0] p-4 text-sm text-[#0F8C45]">Se creó la cuenta de {createdUser.full_name || createdUser.email}. La contraseña provisional fue enviada a {createdUser.email}.</p>
        <p className="text-sm text-[#6B758A]">La cuenta no tiene permisos todavía. Deberá cambiar su contraseña al iniciar sesión por primera vez.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className={outline} href="/admin/usuarios">Volver a usuarios</Button>
          {hasAccountPermission(viewer, "manage_permissions") && hasAccountPermission(viewer, "view") && <Button className={primary} href={`/admin/usuarios?vista=permisos&usuario=${encodeURIComponent(createdUser.id)}`}>Configurar permisos</Button>}
        </div>
      </div> : <form onSubmit={submit} className="mt-7 space-y-7" aria-busy={busy}>
        <fieldset disabled={loading || busy || !canInvite}>
          <legend className="mb-2 text-base font-semibold">Datos personales</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField compact id="user-code" label="Código institucional" name="collegue_code" placeholder="Ej. 10584" value={form.collegue_code} onChange={update} />
            <FormField compact id="user-name" label="Nombre completo" name="full_name" autoComplete="name" placeholder="Nombres y apellidos" value={form.full_name} onChange={update} />
            <FormField compact id="user-document" label="Documento de identidad" disabled placeholder="No disponible" aria-describedby="unsupported-fields" />
            <FormField compact id="user-email" label="Correo institucional *" name="email" type="email" autoComplete="email" required placeholder="usuario@ufps.edu.co" value={form.email} onChange={update} />
            <FormField compact id="user-department" label="Cargo o dependencia" disabled placeholder="No disponible" aria-describedby="unsupported-fields" />
            <FormField compact id="user-phone" label="Teléfono" disabled placeholder="No disponible" aria-describedby="unsupported-fields" />
          </div>
          <p id="unsupported-fields" className="mt-2 text-xs text-[#6B758A]">El registro de cuentas admite correo, nombre y código. Documento, dependencia y teléfono aún no están disponibles.</p>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-base font-semibold">Acceso</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField compact id="user-password" label="Contraseña provisional" value="Se genera y envía por correo" readOnly />
            <FormField compact id="user-initial-status" label="Estado inicial" value="Activo" readOnly />
            <FormField compact id="user-notification" label="Notificar por correo" value="Sí, al crear la cuenta" readOnly />
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-base font-semibold">Trazabilidad</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField compact id="user-creator" label="Creado por" value={viewer?.full_name || viewer?.email || "Administrador actual"} readOnly />
            <FormField compact id="user-created-at" label="Fecha de creación" value="Se asignará al guardar" readOnly />
          </div>
        </fieldset>
        <div>
          <h2 className="text-base font-semibold">Permisos individuales</h2>
          <p className="mt-2 text-xs text-[#6B758A]">Los permisos se asignan por usuario y podrán configurarse después del alta. La cuenta se crea sin permisos.</p>
          <Button variant="outline" className={`${outline} mt-4`} disabled aria-describedby="permissions-after-create">Configurar permisos</Button>
          <p id="permissions-after-create" className="mt-2 text-xs text-[#6B758A]">Disponible después de crear el usuario, si tienes autorización para configurar permisos.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button href="/admin/usuarios" variant="outline" className={outline}>Cancelar</Button>
          <Button type="submit" className={`${primary} min-w-40`} disabled={loading || busy || !canInvite}>{busy ? "Creando usuario…" : "Crear usuario"}</Button>
        </div>
      </form>}
    </section>
  );
}
