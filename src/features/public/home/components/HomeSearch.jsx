"use client";

import { useState } from "react";

export default function HomeSearch() {
  const [activeType, setActiveType] = useState("bases");
  const tabBaseClass =
    "min-h-11 border-b-2 px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c] sm:px-4";

  return (
    <div className="mt-8 max-w-2xl rounded-xl border border-[#e7dfd9] bg-white p-4 shadow-[0_12px_36px_rgba(54,35,28,0.08)] sm:p-5">
      <div className="mb-4 flex border-b border-[#e7dfd9]" role="group" aria-label="Tipo de recurso">
        <button
          type="button"
          aria-pressed={activeType === "bases"}
          onClick={() => setActiveType("bases")}
          className={`${tabBaseClass} ${
            activeType === "bases"
              ? "border-[#a3141c] text-[#a3141c]"
              : "border-transparent text-[#5c5252] hover:text-[#1f1a1a]"
          }`}
        >
          Bases de datos
        </button>
        <button
          type="button"
          aria-pressed={activeType === "revistas"}
          onClick={() => setActiveType("revistas")}
          className={`${tabBaseClass} ${
            activeType === "revistas"
              ? "border-[#a3141c] text-[#a3141c]"
              : "border-transparent text-[#5c5252] hover:text-[#1f1a1a]"
          }`}
        >
          Revistas
        </button>
      </div>
      <form action="/directorio" method="get" className="flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="tipo" value={activeType} />
        <label className="sr-only" htmlFor="home-search">
          Buscar recursos
        </label>
        <input
          id="home-search"
          name="q"
          className="min-h-12 min-w-0 flex-1 rounded-md border border-[#e7dfd9] bg-[#faf7f4] px-4 text-sm text-[#1f1a1a] placeholder:text-[#5c5252] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#a3141c]"
          placeholder="¿Qué estás buscando?"
        />
        <button
          className="min-h-12 rounded-md bg-[#a3141c] px-6 text-sm font-bold text-white transition hover:bg-[#8a1018] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]"
          type="submit"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
