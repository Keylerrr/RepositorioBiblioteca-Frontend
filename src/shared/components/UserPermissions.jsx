"use client";

import { useEffect, useState } from "react";
import Button from "@/shared/components/Button";
import AccountFeedback from "@/shared/components/AccountFeedback";
import UserPresetSelector from "@/shared/components/UserPresetSelector";
import UserPermissionMatrix, { normalizeCatalog, permissionsForCatalog, valueFor, enableRequiredViews, presetPermissionsAreValid } from "@/shared/components/UserPermissionMatrix";
import { hasAccountPermission } from "@/shared/services/apiClient";
import { useAccountsApi } from "@/shared/components/AccountsProvider";

function inheritedPermissions(user) {
  const result = {};
  for (const preset of user.presets || []) {
    for (const [section, resources] of Object.entries(preset?.permissions || {})) {
      for (const [resource, actions] of Object.entries(resources)) {
        for (const [action, enabled] of Object.entries(actions)) {
          if (enabled === true) {
            result[section] ||= {};
            result[section][resource] ||= {};
            result[section][resource][action] = true;
          }
        }
      }
    }
  }
  // The effective response is authoritative, including presets returned as IDs.
  for (const [section, resources] of Object.entries(user.effective_permissions || {})) {
    for (const [resource, actions] of Object.entries(resources)) {
      for (const [action, enabled] of Object.entries(actions)) {
        if (enabled === true && !valueFor(user.permissions, [section, resource, action])) {
          result[section] ||= {};
          result[section][resource] ||= {};
          result[section][resource][action] = true;
        }
      }
    }
  }
  return result;
}

export default function UserPermissions({ userId, initialUser, onDone }) {
  const accountsApi = useAccountsApi();
  const { me: getViewer, user: getUser, permissions: getCatalog, presets: getPresets } = accountsApi;
  const [data, setData] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetsError, setPresetsError] = useState(null);
  const [presetsRefresh, setPresetsRefresh] = useState(0);
  const [notice, setNotice] = useState(initialUser ? "Usuario creado. La invitación con la contraseña provisional fue enviada a su correo." : "");

  useEffect(() => {
    const controller = new AbortController();
    let authenticated = false;
    async function load() {
      setLoading(true);
      setError(null);
      setData(null);
      setSessionRequired(false);
      try {
        const viewer = await getViewer(controller.signal);
        authenticated = true;
        if (!hasAccountPermission(viewer, "view")) throw new Error("Tu cuenta no tiene permiso para consultar usuarios.");
        const [user, catalogResponse] = await Promise.all([
          getUser(userId, controller.signal), getCatalog(controller.signal),
        ]);
        const catalog = normalizeCatalog(catalogResponse);
        setData({ viewer, user, catalog, inherited: inheritedPermissions(user) });
        setPermissions(enableRequiredViews(permissionsForCatalog(user.permissions, catalog), catalog));
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
  }, [getViewer, getUser, getCatalog, userId, refresh]);

  const viewer = data?.viewer;
  useEffect(() => {
    if (!viewer) return;
    const controller = new AbortController();
    async function loadPresets() {
      setPresetsLoading(true);
      setPresetsError(null);
      setPresets([]);
      setSelectedPreset("");
      try {
        if (!viewer.is_superadmin && !viewer.effective_permissions?.accounts?.presets?.view) {
          throw new Error("Tu cuenta no tiene permiso para consultar presets.");
        }
        const availablePresets = await getPresets(controller.signal);
        if (!Array.isArray(availablePresets) || availablePresets.some((preset) => !preset || preset.id == null || typeof preset.name !== "string")) {
          throw new Error("El servidor no devolvió una lista de presets válida.");
        }
        setPresets(availablePresets);
      } catch (error) {
        if (controller.signal.aborted) return;
        setPresetsError(error);
      } finally {
        if (!controller.signal.aborted) setPresetsLoading(false);
      }
    }
    loadPresets();
    return () => controller.abort();
  }, [getPresets, viewer, presetsRefresh]);

  const editable = data && hasAccountPermission(data.viewer, "manage_permissions") && !data.user.is_superadmin;
  const rules = Object.entries(data?.catalog || {}).flatMap(([section, resources]) =>
    Object.entries(resources).flatMap(([resource, actions]) => actions.map((action) => [section, resource, action])),
  );
  const isChecked = (entry) => Boolean(data?.user.is_superadmin || valueFor(permissions, entry) || valueFor(data?.inherited, entry));
  const isInherited = (entry) => valueFor(data?.inherited, entry);
  const selectedCount = rules.filter(isChecked).length;
  const editableRules = rules.filter((entry) => !isInherited(entry));
  const allSelected = editableRules.length > 0 && editableRules.every(isChecked);

  function updateRules(entries, enabled) {
    setPermissions((current) => {
      const next = structuredClone(current);
      for (const [section, resource, action] of entries) {
        next[section] ||= {};
        next[section][resource] ||= {};
        next[section][resource][action] = enabled;
      }
      return enableRequiredViews(next, data.catalog);
    });
    setNotice("");
  }

  function applyPreset() {
    if (!editable || busy || presetsLoading) return;
    const preset = presets.find((item) => String(item.id) === selectedPreset);
    if (!preset) return;
    const next = structuredClone(preset.permissions ?? {});
    if (!presetPermissionsAreValid(next, data.catalog)) {
      setError(new Error("El preset contiene permisos que no están disponibles. Actualiza los presets o selecciona otro."));
      return;
    }
    setPermissions(enableRequiredViews(permissionsForCatalog(next, data.catalog), data.catalog));
    setError(null);
    setNotice(`Preset «${preset.name}» aplicado. Revisa los permisos y pulsa Guardar permisos para confirmarlos.`);
  }

  async function save(event) {
    event.preventDefault();
    if (!editable || busy) return;
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      const user = await accountsApi.savePermissions(userId, permissions);
      setPermissions(permissionsForCatalog(user.permissions, data.catalog));
      setData((current) => ({ ...current, user, inherited: inheritedPermissions(user) }));
      setNotice("Los permisos se guardaron correctamente.");
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }

  const user = data?.user || initialUser;
  const displayName = user?.full_name || user?.email || "este usuario";
  const initials = displayName.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  return (
    <section className="space-y-3 text-[#1F242E]">
      <header>
        <h1 className="text-[30px] leading-[41px] font-bold">Permisos de usuario</h1>
        <p className="mt-3 text-[15px] text-[#6B758A]">Configura los accesos individuales de {displayName} según sus responsabilidades.</p>
      </header>
      {notice && <p role="status" className="rounded-lg bg-[#E8FAF0] p-3 text-sm text-[#0F8C45]">{notice}</p>}
      {error && <AccountFeedback error={error} sessionRequired={sessionRequired} retry={!data ? () => setRefresh((value) => value + 1) : undefined} />}
      {loading && <p role="status" className="rounded-lg bg-white p-8 text-center text-sm text-[#6B758A]">Cargando usuario y catálogo de permisos…</p>}
      {data && <form onSubmit={save} className="space-y-3" aria-busy={busy}>
        <div className="grid min-h-[92px] grid-cols-[52px_minmax(0,1fr)] items-center gap-3.5 rounded-[10px] bg-white px-[18px] py-[11px] sm:grid-cols-[52px_minmax(0,1fr)_auto] xl:grid-cols-[52px_minmax(0,1fr)_410px_auto]">
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#C8102E] font-bold text-white" aria-hidden="true">{initials}</span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold">{displayName}</h2>
            <p className="mt-0.5 break-words text-[13px] text-[#6B758A]">Código {user.collegue_code || "sin asignar"} · {user.email}</p>
          </div>
          <UserPresetSelector className="order-4 col-span-2 sm:col-span-3 xl:order-3 xl:col-span-1" presets={presets} value={selectedPreset} onChange={setSelectedPreset} onApply={applyPreset} disabled={!editable || busy} loading={presetsLoading} />
          <div className="order-3 col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-end xl:order-4 xl:w-60">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? "bg-[#E8FAF0] text-[#0F8C45]" : "bg-gray-100 text-gray-600"}`}>{user.is_active ? "Activo" : "Inactivo"}</span>
            <p className="mt-1 text-[13px] font-semibold" aria-live="polite">{selectedCount} de {rules.length} permisos asignados</p>
          </div>
        </div>
        {presetsError && <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F2F5FA] px-4 py-3 text-xs text-[#6B758A]">
          <p>{presetsError.message} Puedes seguir revisando los permisos individuales.</p>
          {(viewer.is_superadmin || viewer.effective_permissions?.accounts?.presets?.view) && <Button size="small" variant="outline" disabled={busy || presetsLoading} onClick={() => setPresetsRefresh((current) => current + 1)}>Reintentar presets</Button>}
        </div>}
        <UserPermissionMatrix catalog={data.catalog} isChecked={isChecked} isInherited={isInherited} disabled={!editable || busy} onChange={(entry, enabled) => updateRules([entry], enabled)} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="!h-[42px] !border-[#C8102E] !text-[#C8102E]" disabled={!editable || busy || !editableRules.length} onClick={() => updateRules(editableRules, !allSelected)}>{allSelected ? "Quitar selección" : "Seleccionar todos"}</Button>
          <div className="flex gap-3">
            {onDone ? <Button variant="outline" disabled={busy} onClick={onDone}>Volver a usuarios</Button> : <Button variant="outline" className="!h-[42px] !border-[#C8102E] !text-[#C8102E]" href="/admin/usuarios">Cancelar</Button>}
            <Button type="submit" className="!h-[42px] !border-[#C8102E] !bg-[#C8102E] hover:!bg-[#A80D27]" disabled={!editable || busy || !rules.length}>{busy ? "Guardando…" : "Guardar permisos"}</Button>
          </div>
        </div>
        <p className="text-xs text-[#6B758A]">Los permisos heredados de presets se conservan. Activar una acción también habilita el acceso de lectura cuando corresponde.</p>
        {!editable && <p className="text-sm text-[#6B758A]">{user.is_superadmin ? "El superadministrador tiene todos los permisos; su acceso no se modifica desde esta vista." : "Tu cuenta puede consultar estos permisos, pero no tiene autorización para modificarlos."}</p>}
      </form>}
      {!data && !loading && <Button href="/admin/usuarios" variant="outline">Volver a usuarios</Button>}
    </section>
  );
}
