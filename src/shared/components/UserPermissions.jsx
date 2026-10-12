"use client";

import { useEffect, useState } from "react";
import Button from "@/shared/components/Button";
import AccountFeedback from "@/shared/components/AccountFeedback";
import UserPresetSelector from "@/shared/components/UserPresetSelector";
import { hasAccountPermission } from "@/shared/services/apiClient";
import { useAccountsApi } from "@/shared/components/AccountsProvider";

const rule = (section, resource, actions) => actions.map((action) => [section, resource, action]);
const GROUPS = [
  { title: "Contenido y recursos", items: [
    { label: "Gestionar bases de datos", rules: rule("platforms", "platforms", ["view", "create", "update", "delete", "restore"]) },
    { label: "Gestionar revistas", rules: rule("journals", "journals", ["view", "create", "update", "delete", "restore"]) },
    { label: "Aprobar revistas", rules: rule("journals", "journals", ["publish"]) },
    { label: "Editar clasificación y programas", rules: ["knowledge-areas", "academic-programs"].flatMap((resource) => rule("catalog", resource, ["view", "create", "update", "delete", "restore"])) },
  ] },
  { title: "Operación y supervisión", items: [
    { label: "Ejecutar cosechas", rules: rule("harvesting", "schedules", ["view", "create", "update", "delete", "restore", "run_due"]) },
    { label: "Gestionar alertas", rules: rule("platforms", "link-check-logs", ["view"]) },
    { label: "Consultar bitácora", rules: rule("audit", "logs", ["view"]) },
    { label: "Validar enlaces y disponibilidad", rules: rule("platforms", "platforms", ["check_link"]) },
  ] },
  { title: "Usuarios y seguridad", items: [
    { label: "Crear usuarios administrativos", rules: rule("accounts", "users", ["invite"]) },
    { label: "Configurar permisos", rules: rule("accounts", "users", ["manage_permissions"]) },
    { label: "Retirar usuarios administrativos", rules: rule("accounts", "users", ["delete"]) },
  ] },
  { title: "Inteligencia y analítica", items: [
    { label: "Configurar módulo de IA", rules: [] },
    { label: "Consultar analítica de chats", rules: [] },
    { label: "Ver detalle de conversaciones", rules: [] },
  ] },
];

function actionsFor(catalog, section, resource) {
  const entry = catalog?.[section]?.[resource];
  return Array.isArray(entry) ? entry : entry?.actions || [];
}

function valueFor(permissions, [section, resource, action]) {
  return permissions?.[section]?.[resource]?.[action] === true;
}

function enableRequiredViews(permissions, catalog) {
  for (const [section, resources] of Object.entries(permissions)) {
    for (const [resource, actions] of Object.entries(resources)) {
      if (Object.entries(actions).some(([action, value]) => action !== "view" && value === true) && actionsFor(catalog, section, resource).includes("view")) actions.view = true;
    }
  }
  return permissions;
}

function presetPermissionsAreValid(permissions, catalog) {
  const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (!isObject(permissions)) return false;
  for (const [section, resources] of Object.entries(permissions)) {
    if (!isObject(resources)) return false;
    for (const [resource, actions] of Object.entries(resources)) {
      if (!isObject(actions)) return false;
      const availableActions = actionsFor(catalog, section, resource);
      if (Object.entries(actions).some(([action, value]) => typeof value !== "boolean" || !availableActions.includes(action))) return false;
    }
  }
  return true;
}

function inheritedPermissions(user) {
  const result = {};
  for (const preset of user.presets || []) {
    for (const [section, resources] of Object.entries(preset.permissions || {})) {
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
        const catalog = catalogResponse.permissions || catalogResponse;
        if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) throw new Error("El servidor no devolvió un catálogo de permisos válido.");
        setData({ viewer, user, catalog, inherited: inheritedPermissions(user) });
        setPermissions(structuredClone(user.permissions || {}));
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
  const groups = GROUPS.map((group) => ({ ...group, items: group.items.map((item) => ({
    ...item,
    available: item.rules.length > 0 && item.rules.every(([section, resource, action]) => actionsFor(data?.catalog, section, resource).includes(action)),
  })) }));
  const isChecked = (item) => item.rules.length > 0 && item.rules.every((entry) => data?.user.is_superadmin || valueFor(permissions, entry) || valueFor(data?.inherited, entry));
  const selectedCount = groups.flatMap((group) => group.items).filter(isChecked).length;
  const availableItems = groups.flatMap((group) => group.items).filter((item) => item.available);
  const allSelected = availableItems.length > 0 && availableItems.every(isChecked);

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
    setPermissions(enableRequiredViews(next, data.catalog));
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
      setPermissions(structuredClone(user.permissions || {}));
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
            <p className="mt-1 text-[13px] font-semibold" aria-live="polite">{selectedCount} de 14 permisos asignados</p>
          </div>
        </div>
        {presetsError && <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F2F5FA] px-4 py-3 text-xs text-[#6B758A]">
          <p>{presetsError.message} Puedes seguir revisando los permisos individuales.</p>
          {(viewer.is_superadmin || viewer.effective_permissions?.accounts?.presets?.view) && <Button size="small" variant="outline" disabled={busy || presetsLoading} onClick={() => setPresetsRefresh((current) => current + 1)}>Reintentar presets</Button>}
        </div>}
        <div className="grid gap-3 lg:grid-cols-2">
          {groups.map((group) => <fieldset key={group.title} className="min-h-[174px] rounded-[10px] border border-[#CCD4E0] bg-white px-3 py-2.5">
            <legend className="sr-only">{group.title}</legend>
            <h2 aria-hidden="true" className="mb-1 text-sm leading-6 font-semibold">{group.title}</h2>
            {group.items.map((item) => {
              const inherited = item.rules.some((entry) => valueFor(data.inherited, entry));
              const entirelyInherited = item.rules.length > 0 && item.rules.every((entry) => valueFor(data.inherited, entry));
              const checked = isChecked(item);
              const partial = !checked && item.rules.some((entry) => valueFor(permissions, entry) || valueFor(data.inherited, entry));
              return <label key={item.label} className={`flex min-h-8 items-center gap-2.5 text-[13px] ${!item.available ? "text-[#6B758A]" : ""}`}>
                <input type="checkbox" className="size-5 shrink-0 rounded accent-[#C8102E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E]" checked={checked} ref={(element) => { if (element) element.indeterminate = partial; }} disabled={!editable || busy || !item.available || entirelyInherited} onChange={(event) => updateRules(item.rules, event.target.checked)} />
                <span>{item.label}{!item.available && <span className="ml-1 text-[11px]">(no disponible)</span>}{inherited && <span className="ml-1 text-[11px] text-[#6B758A]">· preset</span>}</span>
              </label>;
            })}
          </fieldset>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="!h-[42px] !border-[#C8102E] !text-[#C8102E]" disabled={!editable || busy || !availableItems.length} onClick={() => updateRules(availableItems.flatMap((item) => item.rules).filter((entry) => !valueFor(data.inherited, entry)), !allSelected)}>{allSelected ? "Quitar selección" : "Seleccionar todos"}</Button>
          <div className="flex gap-3">
            {onDone ? <Button variant="outline" disabled={busy} onClick={onDone}>Volver a usuarios</Button> : <Button variant="outline" className="!h-[42px] !border-[#C8102E] !text-[#C8102E]" href="/admin/usuarios">Cancelar</Button>}
            <Button type="submit" className="!h-[42px] !border-[#C8102E] !bg-[#C8102E] hover:!bg-[#A80D27]" disabled={!editable || busy}>{busy ? "Guardando…" : "Guardar permisos"}</Button>
          </div>
        </div>
        <p className="text-xs text-[#6B758A]">Los permisos heredados de presets se conservan. Las opciones no disponibles no están expuestas por el catálogo de la API.</p>
        {!editable && <p className="text-sm text-[#6B758A]">{user.is_superadmin ? "El superadministrador tiene todos los permisos; su acceso no se modifica desde esta vista." : "Tu cuenta puede consultar estos permisos, pero no tiene autorización para modificarlos."}</p>}
      </form>}
      {!data && !loading && <Button href="/admin/usuarios" variant="outline">Volver a usuarios</Button>}
    </section>
  );
}
