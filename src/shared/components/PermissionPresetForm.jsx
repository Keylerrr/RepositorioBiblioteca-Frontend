"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import AccountFeedback from "@/shared/components/AccountFeedback";
import { useAccountsApi } from "@/shared/components/AccountsProvider";
import UserPermissionMatrix, { normalizeCatalog, permissionsForCatalog, valueFor, enableRequiredViews, presetPermissionsAreValid } from "@/shared/components/UserPermissionMatrix";

const listUrl = "/admin/usuarios?vista=presets";
const primary = "!h-[42px] !border-[#C8102E] !bg-[#C8102E] hover:!bg-[#A80D27]";
const outline = "!h-[42px] !border-[#C8102E] !text-[#C8102E]";

export default function PermissionPresetForm({ presetId }) {
  const api = useAccountsApi();
  const { me, permissions: getCatalog, preset: getPreset } = api;
  const router = useRouter();
  const editing = Boolean(presetId);
  const [data, setData] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [refresh, setRefresh] = useState(0);

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
        const rights = viewer.effective_permissions?.accounts?.presets;
        if (!viewer.is_superadmin && !(editing ? rights?.view : rights?.create)) throw new Error("Tu cuenta no tiene permiso para acceder a esta vista de presets.");
        const [catalogResponse, preset] = await Promise.all([
          getCatalog(controller.signal), editing ? getPreset(presetId, controller.signal) : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;
        const catalog = normalizeCatalog(catalogResponse);
        if (editing && (!preset || typeof preset.name !== "string" || !presetPermissionsAreValid(preset.permissions, catalog))) throw new Error("El preset contiene datos o permisos que no están disponibles. Actualiza el catálogo antes de editarlo.");
        setData({ viewer, catalog, preset });
        setName(preset?.name || "");
        setPermissions(enableRequiredViews(permissionsForCatalog(preset?.permissions, catalog), catalog));
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
  }, [me, getCatalog, getPreset, presetId, editing, refresh]);

  const editable = Boolean(data && (data.viewer.is_superadmin || data.viewer.effective_permissions?.accounts?.presets?.[editing ? "update" : "create"]));
  const rules = Object.entries(data?.catalog || {}).flatMap(([section, resources]) => Object.entries(resources).flatMap(([resource, actions]) => actions.map((action) => [section, resource, action])));
  const isChecked = (entry) => valueFor(permissions, entry);
  const count = rules.filter(isChecked).length;
  const allSelected = rules.length > 0 && count === rules.length;

  function update(entries, enabled) {
    if (!editable || busy) return;
    setPermissions((current) => {
      const next = structuredClone(current);
      for (const [section, resource, action] of entries) next[section][resource][action] = enabled;
      return enableRequiredViews(next, data.catalog);
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!editable || busy || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body = { name: name.trim(), permissions };
      if (editing) await api.updatePreset(presetId, body);
      else await api.createPreset(body);
      router.push(`${listUrl}&resultado=${editing ? "actualizado" : "creado"}`);
    } catch (error) {
      setError(error);
      setBusy(false);
    }
  }

  return <section className="space-y-3 text-[#1F242E]">
    <header>
      <h1 className="text-[30px] leading-[41px] font-bold">{editing ? "Editar preset" : "Crear preset"}</h1>
      <p className="mt-3 text-[15px] text-[#6B758A]">{editing ? `Define los permisos del preset ${data?.preset?.name || "seleccionado"} para aplicarlos a usuarios administrativos.` : "Asigna un nombre al nuevo preset y selecciona los permisos que incluirá."}</p>
    </header>
    {error && <AccountFeedback error={error} sessionRequired={sessionRequired} retry={!data ? () => setRefresh((value) => value + 1) : undefined} />}
    {loading && <p role="status" className="rounded-lg bg-white p-8 text-center text-sm text-[#6B758A]">Cargando preset y catálogo de permisos…</p>}
    {data && <form onSubmit={save} className="space-y-3" aria-busy={busy}>
      <div className="grid min-h-[92px] grid-cols-[52px_minmax(0,1fr)] items-center gap-3.5 rounded-[10px] bg-white px-[18px] py-4 sm:grid-cols-[52px_minmax(0,1fr)_auto]">
        <span aria-hidden="true" className="flex size-[52px] items-center justify-center rounded-full bg-[#C8102E] font-bold text-white">PR</span>
        <FormField compact id="preset-name" label="Nombre del preset *" placeholder="Escriba el nombre del preset" required value={name} disabled={!editable || busy} onChange={(event) => setName(event.target.value)} />
        <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:items-end sm:flex-col">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${!editing || data.preset?.is_active === false ? "bg-[#EEF0F3] text-[#68707C]" : "bg-[#E8FAF0] text-[#0F8C45]"}`}>{!editing ? "Nuevo" : data.preset.is_active === false ? "Inactivo" : "Activo"}</span>
          <p aria-live="polite" className="text-[13px] font-semibold">{count} de {rules.length} permisos {editing ? "del preset" : "seleccionados"}</p>
        </div>
      </div>
      <UserPermissionMatrix catalog={data.catalog} isChecked={isChecked} isInherited={() => false} disabled={!editable || busy} onChange={(entry, enabled) => update([entry], enabled)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" className={outline} disabled={!editable || busy || !rules.length} onClick={() => update(rules, !allSelected)}>{allSelected ? "Quitar selección" : "Seleccionar todos"}</Button>
        <div className="flex gap-3">
          {busy ? <Button variant="outline" className={outline} disabled>Cancelar</Button> : <Button href={listUrl} variant="outline" className={outline}>Cancelar</Button>}
          <Button type="submit" className={`${primary} min-w-40`} disabled={!editable || busy || !name.trim()}>{busy ? "Guardando…" : editing ? "Guardar preset" : "Crear preset"}</Button>
        </div>
      </div>
      {!editable && <p className="text-sm text-[#6B758A]">Tu cuenta puede consultar este preset, pero no tiene autorización para modificarlo.</p>}
    </form>}
    {!data && !loading && <Button href={listUrl} variant="outline" className={outline}>Volver a presets</Button>}
  </section>;
}
