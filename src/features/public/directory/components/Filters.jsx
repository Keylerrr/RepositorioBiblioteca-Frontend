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
    <section className="border-b border-[#e0e5dc] pb-4">
      <div className="flex items-center justify-between">
        <button
          aria-expanded={isOpen}
          className="flex items-center gap-2 py-2 text-sm font-semibold text-[#34463a]"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true">☷</span> Filtros
          {activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#385b3b] px-1 text-xs text-white">{activeCount}</span>}
          <span aria-hidden="true" className="text-xs">{isOpen ? "▲" : "▼"}</span>
        </button>
        {activeCount > 0 && <button className="text-xs font-semibold text-[#8d3038] underline underline-offset-2" onClick={onClear} type="button">Limpiar filtros</button>}
      </div>
      {isOpen && (
        <div className="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-5">
          {filterFields.map(([key, source, label]) => {
            const options = new Map();
            resources.flatMap((resource) => resource[source] ?? []).forEach((item) => {
              if (item?.id !== undefined && item?.name) options.set(String(item.id), item.name);
            });
            return (
              <label className="grid gap-1.5 text-xs font-medium text-[#657166]" key={key}>
                {label}
                <select className="min-h-10 rounded-md border border-[#d9dfd5] bg-white px-3 text-sm text-[#26342a] outline-none focus:border-[#577550]" disabled={disabled} onChange={(event) => onChange(key, event.target.value)} value={values[key]}>
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