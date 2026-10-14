"use client";

import { useState } from "react";

const FIELD_LABELS = {
  academic_program: "Programa académico",
  academic_programs: "Programas académicos",
  action: "Acción",
  active: "Activo",
  archived_at: "Fecha de archivo",
  created_at: "Fecha de creación",
  created_by: "Creado por",
  date: "Fecha",
  deleted_at: "Fecha de eliminación",
  email: "Correo electrónico",
  enabled: "Habilitado",
  id: "ID",
  is_active: "Activo",
  name: "Nombre",
  permissions: "Administrar permisos",
  role: "Rol",
  status: "Estado",
  updated_at: "Fecha de actualización",
  updated_by: "Actualizado por",
  username: "Usuario",
};

const RESOURCE_LABELS = {
  accounts: "Cuentas",
  "academic-programs": "Programas académicos",
  alerts: "Alertas",
  audit: "Auditoría",
  catalog: "Catálogo",
  databases: "Bases de datos",
  journals: "Revistas",
  logs: "Registros",
  presets: "Presets",
  users: "Usuarios",
};

const ACTION_LABELS = {
  admin: "Administrar",
  create: "Crear",
  delete: "Eliminar",
  destroy: "Eliminar",
  edit: "Actualizar",
  invite: "Invitar",
  manage: "Administrar",
  manage_permissions: "Administrar permisos",
  permissions: "Administrar permisos",
  read: "Ver",
  restore: "Restaurar",
  update: "Actualizar",
  view: "Ver",
};

const DATE_FIELD = /(^|_)(date|at|timestamp|time)$/i;
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function parseStructured(value) {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text.startsWith("{") && !text.startsWith("[")) return value;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : value;
  } catch {
    return value;
  }
}

function pairOf(value) {
  if (Array.isArray(value)) {
    return {
      before: value[0],
      after: value[1],
      beforeExists: value.length > 0,
      afterExists: value.length > 1,
    };
  }
  if (value && typeof value === "object" && hasOwn(value, "before") && hasOwn(value, "after")) {
    return {
      before: value.before,
      after: value.after,
      beforeExists: hasOwn(value, "before"),
      afterExists: hasOwn(value, "after"),
    };
  }
  return { before: undefined, after: value, beforeExists: false, afterExists: true };
}

function valuesEqual(left, right) {
  const a = parseStructured(left);
  const b = parseStructured(right);
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return aKeys.length === bKeys.length
    && aKeys.every((key) => hasOwn(b, key) && valuesEqual(a[key], b[key]));
}

function collectDifferences(before, after, path = [], beforeExists = true, afterExists = true) {
  const normalizedPath = path.flatMap((part) => String(part).split("."));
  if (!beforeExists && !afterExists) return [];
  const left = parseStructured(before);
  const right = parseStructured(after);

  if (beforeExists && afterExists && valuesEqual(left, right)) return [];

  const leftIsContainer = left && typeof left === "object";
  const rightIsContainer = right && typeof right === "object";
  if ((leftIsContainer || !beforeExists) && (rightIsContainer || !afterExists)) {
    const leftKeys = leftIsContainer ? Object.keys(left) : [];
    const rightKeys = rightIsContainer ? Object.keys(right) : [];
    const keys = [...new Set([...leftKeys, ...rightKeys])];
    if (keys.length) {
      return keys.flatMap((key) => collectDifferences(
        leftIsContainer ? left[key] : undefined,
        rightIsContainer ? right[key] : undefined,
        [...normalizedPath, ...String(key).split(".")],
        leftIsContainer && hasOwn(left, key),
        rightIsContainer && hasOwn(right, key),
      ));
    }
  }

  return [{
    path: normalizedPath,
    before: left,
    after: right,
    beforeExists,
    afterExists,
  }];
}

function propertyLabel(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return String(key)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pathLabel(path) {
  return path.map(propertyLabel).join(" · ") || "Valor";
}

function classifyDifference(difference) {
  const { before, after, beforeExists, afterExists } = difference;
  if (!beforeExists) return "added";
  if (!afterExists) return "removed";
  if (before === false && after === true) return "enabled";
  if (before === true && after === false) return "disabled";
  return "changed";
}

const CHANGE_META = {
  added: { label: "Agregado", style: "bg-emerald-50 text-emerald-800" },
  changed: { label: "Modificado", style: "bg-amber-50 text-amber-800" },
  disabled: { label: "Deshabilitado", style: "bg-red-50 text-red-800" },
  enabled: { label: "Habilitado", style: "bg-emerald-50 text-emerald-800" },
  removed: { label: "Eliminado", style: "bg-red-50 text-red-800" },
};

function formatDateValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ValueView({ value, exists, path = [] }) {
  if (!exists) return <span className="italic text-slate-400">No definido</span>;
  if (value === null) return <span className="italic text-slate-500">Sin valor</span>;
  if (typeof value === "boolean") {
    const display = path[0]?.toLowerCase() === "permissions"
      ? (value ? "Permitido" : "No permitido")
      : (value ? "Sí" : "No");
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${value ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
        {display}
      </span>
    );
  }
  if (typeof value === "number") return <span className="break-all tabular-nums">{value}</span>;
  if (typeof value === "string") {
    const key = path[path.length - 1] ?? "";
    const date = DATE_FIELD.test(key) ? formatDateValue(value) : null;
    const display = date ?? (value === "" ? "Cadena vacía" : value);
    if (display.length > 180) {
      return (
        <details className="min-w-0">
          <summary className="cursor-pointer text-xs font-medium text-slate-600">Ver texto extenso</summary>
          <p className="mt-1 whitespace-pre-wrap break-words">{display}</p>
        </details>
      );
    }
    return <span className="whitespace-pre-wrap break-words">{display}</span>;
  }
  if (typeof value === "object") {
    const entries = Array.isArray(value)
      ? value.map((item, index) => [String(index), item])
      : Object.entries(value);
    if (!entries.length) return <span className="text-slate-500">{Array.isArray(value) ? "Lista vacía" : "Objeto vacío"}</span>;
    return (
      <details className="min-w-0">
        <summary className="cursor-pointer text-xs font-medium text-slate-600">
          {Array.isArray(value) ? `${entries.length} elementos` : `${entries.length} propiedades`}
        </summary>
        <dl className="mt-2 space-y-2 border-l border-slate-200 pl-3">
          {entries.map(([key, item]) => (
            <div key={key} className="grid min-w-0 gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <dt className="break-words text-xs text-slate-500">{propertyLabel(key)}</dt>
              <dd className="min-w-0 text-sm"><ValueView value={item} exists path={[...path, key]} /></dd>
            </div>
          ))}
        </dl>
      </details>
    );
  }
  return <span className="break-words">{String(value)}</span>;
}

function PermissionChanges({ differences }) {
  const grouped = new Map();
  differences.forEach((difference) => {
    const path = difference.path[0]?.toLowerCase() === "permissions"
      ? difference.path.slice(1)
      : difference.path;
    const last = path[path.length - 1] ?? "";
    const actionLabel = ACTION_LABELS[last];
    const modulePath = path.slice(0, -1);
    const groupName = modulePath.length
      ? modulePath.map((part) => RESOURCE_LABELS[part] ?? propertyLabel(part)).join(" · ")
      : "Otros permisos";
    const itemLabel = actionLabel ?? propertyLabel(last);
    if (!grouped.has(groupName)) grouped.set(groupName, []);
    grouped.get(groupName).push({ ...difference, itemLabel });
  });

  return (
    <div className="mt-3 space-y-2">
      {Array.from(grouped, ([groupName, items]) => (
        <details key={groupName} className="rounded-md border border-slate-200">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-800">
            {groupName} <span className="font-normal text-slate-500">({items.length})</span>
          </summary>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {items.map((item) => {
              const kind = classifyDifference(item);
              const meta = CHANGE_META[kind];
              return (
                <div key={item.path.join(".")} className="grid min-w-0 gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{item.itemLabel}</p>
                    <p className="mt-1 break-words text-xs text-slate-500">
                      <ValueView value={item.before} exists={item.beforeExists} path={item.path} />
                      <span className="px-1.5" aria-hidden>→</span>
                      <ValueView value={item.after} exists={item.afterExists} path={item.path} />
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${meta.style}`}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}

function ChangeCard({ field, differences, isPermissions }) {
  return (
    <article className="rounded-lg border border-slate-200 p-3">
      <h4 className="break-words text-sm font-semibold text-slate-800">{propertyLabel(field)}</h4>
      {isPermissions ? (
        <PermissionChanges differences={differences} />
      ) : (
        <div className="mt-3 space-y-2">
          {differences.map((difference) => {
            const kind = classifyDifference(difference);
            const meta = CHANGE_META[kind];
            return (
              <div key={difference.path.join(".")} className="rounded-md bg-slate-50 p-3">
                {difference.path.length > 1 && (
                  <p className="mb-2 break-words text-xs font-medium text-slate-600">{pathLabel(difference.path)}</p>
                )}
                <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
                  <div className="min-w-0 text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Antes</span>
                    <ValueView value={difference.before} exists={difference.beforeExists} path={difference.path} />
                  </div>
                  <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${meta.style}`}>{meta.label}</span>
                  <div className="min-w-0 text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Después</span>
                    <ValueView value={difference.after} exists={difference.afterExists} path={difference.path} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function toOriginalJson(value) {
  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return String(value);
  }
}

export function summarizeAuditValue(value) {
  const parsed = parseStructured(value);
  if (Array.isArray(parsed)) return `Lista (${parsed.length} elementos)`;
  if (parsed && typeof parsed === "object") return `Objeto (${Object.keys(parsed).length} propiedades)`;
  if (parsed === null || parsed === undefined || parsed === "") return "Sin valor";
  if (typeof parsed === "boolean") return parsed ? "Sí" : "No";
  return String(parsed);
}

export default function AuditChangeDetails({ changes, action, objectLabel, additionalData, changesText }) {
  const [copyMessage, setCopyMessage] = useState("");
  const entries = Object.entries(changes ?? {});
  const prepared = entries.map(([field, value]) => ({
    field,
    ...pairOf(value),
  }));
  const permissionDiffs = prepared
    .filter(({ field }) => field.toLowerCase() === "permissions" || field.toLowerCase().endsWith(".permissions"))
    .flatMap(({ field, before, after, beforeExists, afterExists }) =>
      collectDifferences(before, after, [field], beforeExists, afterExists));
  const permissionEnabled = permissionDiffs.filter((difference) => {
    const kind = classifyDifference(difference);
    return kind === "enabled" || (kind === "added" && difference.after === true);
  }).length;
  const permissionDisabled = permissionDiffs.filter((difference) => {
    const kind = classifyDifference(difference);
    return kind === "disabled" || (kind === "removed" && difference.before === true);
  }).length;
  const otherPermissionChanges = permissionDiffs.filter((difference) => {
    const kind = classifyDifference(difference);
    return kind === "changed"
      || (kind === "added" && difference.after !== true)
      || (kind === "removed" && difference.before !== true);
  }).length;
  const changedFields = prepared.map(({ field, before, after, beforeExists, afterExists }) => ({
    field,
    differences: collectDifferences(before, after, [field], beforeExists, afterExists),
  })).filter(({ differences }) => differences.length);
  const changedPermissionCount = permissionDiffs.length;

  let summary;
  if (action === "create") summary = `Se creó ${objectLabel || "el registro"}.`;
  else if (action === "delete") summary = `Se eliminó ${objectLabel || "el registro"}.`;
  else if (action === "archive") summary = `Se archivó ${objectLabel || "el registro"}.`;
  else if (action === "restore") summary = `Se restauró ${objectLabel || "el registro"}.`;
  else if (changedPermissionCount) {
    const parts = [];
    if (permissionEnabled) parts.push(`${permissionEnabled} ${permissionEnabled === 1 ? "habilitado" : "habilitados"}`);
    if (permissionDisabled) parts.push(`${permissionDisabled} ${permissionDisabled === 1 ? "deshabilitado" : "deshabilitados"}`);
    if (otherPermissionChanges) parts.push(`${otherPermissionChanges} otro${otherPermissionChanges === 1 ? "" : "s"} cambio${otherPermissionChanges === 1 ? "" : "s"}`);
    summary = `Se modificaron ${changedPermissionCount} ${changedPermissionCount === 1 ? "permiso" : "permisos"}: ${parts.join(", ")}.`;
  } else if (changedFields.length) {
    summary = `Se modificaron ${changedFields.length} ${changedFields.length === 1 ? "campo" : "campos"}.`;
  } else {
    summary = "No hay diferencias detalladas en este registro.";
  }

  async function copyOriginal() {
    try {
      await navigator.clipboard.writeText(toOriginalJson(changes ?? {}));
      setCopyMessage("JSON copiado.");
    } catch {
      setCopyMessage("No se pudo copiar el JSON desde este navegador.");
    }
  }

  return (
    <div className="space-y-5">
      <section aria-labelledby="summary-title" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 id="summary-title" className="text-sm font-semibold">Resumen de cambios</h3>
        <p className="mt-1 break-words text-sm text-slate-700">{summary}</p>
      </section>

      <section aria-labelledby="change-details-title">
        <h3 id="change-details-title" className="text-sm font-semibold">Detalle de cambios</h3>
        {changedFields.length ? (
          <div className="mt-3 space-y-3">
            {changedFields.map(({ field, differences }) => (
              <ChangeCard
                key={field}
                field={field}
                differences={differences}
                isPermissions={field.toLowerCase() === "permissions" || field.toLowerCase().endsWith(".permissions")}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">{changesText || "Sin cambios registrados."}</p>
        )}
      </section>

      <section className="space-y-2">
        <details className="rounded-md border border-slate-200">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">Consultar JSON original de cambios</summary>
          <pre className="max-h-80 overflow-auto border-t border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
            {toOriginalJson(changes ?? {})}
          </pre>
          <div className="flex items-center gap-3 border-t border-slate-200 px-3 py-2">
            <button type="button" onClick={copyOriginal} className="text-xs font-medium text-[#a50d26] underline">
              Copiar JSON
            </button>
            {copyMessage && <span role="status" className="text-xs text-slate-600">{copyMessage}</span>}
          </div>
        </details>
        {additionalData != null && (
          <details className="rounded-md border border-slate-200">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">Datos adicionales</summary>
            <pre className="max-h-80 overflow-auto border-t border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
              {toOriginalJson(additionalData)}
            </pre>
          </details>
        )}
      </section>
    </div>
  );
}
