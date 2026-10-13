"use client";

// Presentation translations only. Categories, resources and actions are always
// supplied by the API; new keys are displayed using the generic fallback.
const LABELS = {
  audit: "Auditoría", catalog: "Catálogo", journals: "Revistas",
  platforms: "Plataformas", harvesting: "Cosecha", accounts: "Cuentas",
  logs: "Registros de auditoría", institutions: "Instituciones", languages: "Idiomas",
  countries: "Países", "material-types": "Tipos de material", editorials: "Editoriales",
  "knowledge-areas": "Áreas de conocimiento", "academic-programs": "Programas académicos",
  "valid-sintaxis": "Sintaxis válidas", "link-check-logs": "Registros de verificación de enlaces",
  schedules: "Programaciones", events: "Eventos", harvests: "Cosechas",
  users: "Usuarios", presets: "Presets", permissions: "Permisos",
  view: "Ver", create: "Crear", update: "Editar", delete: "Eliminar", restore: "Restaurar",
  publish: "Publicar", deactivate: "Desactivar", mark_obsolete: "Marcar obsoleta",
  reactivate: "Reactivar", check_link: "Verificar enlace", run_due: "Ejecutar pendientes",
  pause: "Pausar", resume: "Reanudar", invite: "Invitar", manage_permissions: "Gestionar permisos",
};

export function labelFor(key) {
  if (Object.hasOwn(LABELS, key)) return LABELS[key];
  const words = key.replace(/[-_]+/g, " ");
  return words.charAt(0).toLocaleUpperCase("es") + words.slice(1);
}

function actionsFor(catalog, section, resource) {
  const entry = catalog?.[section]?.[resource];
  return Array.isArray(entry) ? entry : entry?.actions || [];
}

export function normalizeCatalog(response) {
  const source = response?.permissions ?? response;
  const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (!isObject(source)) throw new Error("El servidor no devolvió un catálogo de permisos válido.");
  return Object.fromEntries(Object.entries(source).map(([section, resources]) => {
    if (!isObject(resources)) throw new Error("El catálogo contiene una categoría inválida.");
    return [section, Object.fromEntries(Object.entries(resources).map(([resource, entry]) => {
      const actions = Array.isArray(entry) ? entry : entry?.actions;
      if (!Array.isArray(actions) || actions.some((action) => typeof action !== "string" || !action)) {
        throw new Error("El catálogo contiene acciones inválidas.");
      }
      return [resource, [...new Set(actions)]];
    }))];
  }));
}

export function permissionsForCatalog(permissions, catalog) {
  return Object.fromEntries(Object.entries(catalog).map(([section, resources]) => [
    section, Object.fromEntries(Object.entries(resources).map(([resource, actions]) => [
      resource, Object.fromEntries(actions.map((action) => [action, permissions?.[section]?.[resource]?.[action] === true])),
    ])),
  ]));
}

export function valueFor(permissions, [section, resource, action]) {
  return permissions?.[section]?.[resource]?.[action] === true;
}

export function enableRequiredViews(permissions, catalog) {
  for (const [section, resources] of Object.entries(permissions)) {
    for (const [resource, actions] of Object.entries(resources)) {
      if (Object.entries(actions).some(([action, value]) => action !== "view" && value === true) && actionsFor(catalog, section, resource).includes("view")) actions.view = true;
    }
  }
  return permissions;
}

export function presetPermissionsAreValid(permissions, catalog) {
  const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (!isObject(permissions)) return false;
  for (const [section, resources] of Object.entries(permissions)) {
    if (!isObject(resources) || !Object.hasOwn(catalog, section)) return false;
    for (const [resource, actions] of Object.entries(resources)) {
      if (!isObject(actions) || !Object.hasOwn(catalog[section], resource)) return false;
      const availableActions = actionsFor(catalog, section, resource);
      if (Object.entries(actions).some(([action, value]) => typeof value !== "boolean" || !availableActions.includes(action))) return false;
    }
  }
  return true;
}

export default function UserPermissionMatrix({ catalog, isChecked, isInherited, disabled, onChange }) {
  const sections = Object.entries(catalog);
  const midpoint = Math.ceil(sections.length / 2);
  const columns = [sections.slice(0, midpoint), sections.slice(midpoint)];
  if (!sections.length) return <p className="rounded-lg border border-[#CCD4E0] bg-white p-6 text-sm text-[#68707C]">No hay permisos disponibles en el catálogo.</p>;

  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      {columns.filter((column) => column.length).map((column, index) => <div key={index} className="min-w-0 space-y-3">
        {column.map(([section, resources]) => {
          const sectionRules = Object.entries(resources).flatMap(([resource, actions]) => actions.map((action) => [section, resource, action]));
          return <section key={section} aria-label={labelFor(section)} className="min-w-0 space-y-2 rounded-[10px] border border-[#CCD4E0] bg-white p-3">
            <header className="flex min-h-6 items-center justify-between gap-3">
              <h2 className="text-sm leading-6 font-semibold">{labelFor(section)}</h2>
              <span className="shrink-0 text-xs text-[#68707C]">{sectionRules.filter(isChecked).length} / {sectionRules.length}</span>
            </header>
            {Object.entries(resources).map(([resource, actions]) => {
              const resourceRules = actions.map((action) => [section, resource, action]);
              const selected = resourceRules.filter(isChecked).length;
              return <details key={resource} className="group min-w-0">
                <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-md bg-[#F7F8FA] px-2 py-1 text-[13px] leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E] [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 break-words font-semibold">{labelFor(resource)}</span>
                  <span className="shrink-0 text-xs text-[#68707C]">{selected} / {actions.length}</span>
                  <span aria-hidden="true" className="flex w-4 shrink-0 items-center justify-center text-lg leading-5 transition-transform group-open:rotate-90">›</span>
                </summary>
                <fieldset className="mt-1 grid min-w-0 grid-cols-2 gap-x-3">
                  <legend className="sr-only">{labelFor(section)}: {labelFor(resource)}</legend>
                  {actions.map((action) => {
                    const entry = [section, resource, action];
                    const inherited = isInherited(entry);
                    const required = action === "view" && resourceRules.some((other) => other[2] !== "view" && isChecked(other));
                    return <label key={action} className="flex min-h-7 min-w-0 items-center gap-2 py-1 text-[13px] leading-5">
                      <span className="relative flex size-5 shrink-0">
                        <input type="checkbox" checked={isChecked(entry)} disabled={disabled || inherited || required} onChange={(event) => onChange(entry, event.target.checked)} className="peer size-5 cursor-pointer appearance-none rounded border border-[#CCD4E0] bg-white checked:border-[#C8102E] checked:bg-[#C8102E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E] disabled:cursor-default disabled:opacity-60" />
                        <span aria-hidden="true" className="pointer-events-none absolute inset-0 hidden items-center justify-center text-xs font-semibold leading-none text-white peer-checked:flex">✓</span>
                      </span>
                      <span className="min-w-0 break-words">{labelFor(action)}{inherited && <span className="ml-1 text-[11px] text-[#68707C]">· heredado</span>}{required && !inherited && <span className="ml-1 text-[11px] text-[#68707C]">· necesario</span>}</span>
                    </label>;
                  })}
                  {!actions.length && <p className="col-span-2 py-2 text-xs text-[#68707C]">Sin acciones disponibles.</p>}
                </fieldset>
              </details>;
            })}
          </section>;
        })}
      </div>)}
    </div>
  );
}
