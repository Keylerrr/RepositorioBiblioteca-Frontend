"use client";

import { useState } from "react";

const filterFields = [
  ["knowledge_area", "knowledge_areas", "Área temática"],
  ["language", "languages", "Idioma"],
  ["country", "countries", "País"],
  ["material_type", "material_types", "Tipo de material"],
  ["academic_program", "academic_programs", "Programa académico"],
];

export default function Filters({ resources, values, onChange, onClear, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <section className="border-b border-[#e7dfd9] pb-4">
      <div className="flex items-center justify-between">
        <button
          aria-expanded={isOpen}
          className="flex items-center gap-2 rounded-sm py-2 text-sm font-semibold text-[#1f1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true">☷</span> Filtros
          {activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#f4e9e9] px-1 text-xs font-bold text-[#7f1218]">{activeCount}</span>}
          <span aria-hidden="true" className="text-xs">{isOpen ? "▲" : "▼"}</span>
        </button>
        {activeCount > 0 && <button className="rounded-sm text-xs font-semibold text-[#7f1218] underline underline-offset-2 hover:text-[#a3141c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]" onClick={onClear} type="button">Limpiar filtros</button>}
      </div>
      {isOpen && (
        <div className="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-5">
          {filterFields.map(([key, source, label]) => {
            const options = new Map();
            resources.flatMap((resource) => resource[source] ?? []).forEach((item) => {
              if (item?.id !== undefined && item?.name) options.set(String(item.id), item.name);
            });
            return (
              <label className="grid gap-1.5 text-xs font-medium text-[#5c5252]" key={key}>
                {label}
                <select className="min-h-10 rounded-md border border-[#e2dcd7] bg-white px-3 text-sm text-[#1f1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c] disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} onChange={(event) => onChange(key, event.target.value)} value={values[key]}>
                  <option value="">Todos</option>
                  {[...options].sort((first, second) => first[1].localeCompare(second[1], "es")).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}