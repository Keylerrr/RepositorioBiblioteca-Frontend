"use client";

import { useState } from "react";

export default function HomeSearch() {
  const [activeType, setActiveType] = useState("bases");

  return (
    <div className="mt-8 max-w-2xl rounded-xl border border-line bg-white p-4 shadow-[0_12px_36px_rgba(54,35,28,0.08)] sm:p-5">
      <div className="mb-4 flex border-b border-line" role="group" aria-label="Tipo de recurso">
        <button
          type="button"
          aria-pressed={activeType === "bases"}
          onClick={() => setActiveType("bases")}
          className={`min-h-11 border-b-2 px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4 ${
            activeType === "bases"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Bases de datos
        </button>
        <button
          type="button"
          aria-pressed={activeType === "revistas"}
          onClick={() => setActiveType("revistas")}
          className={`min-h-11 border-b-2 px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4 ${
            activeType === "revistas"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
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
          className="min-h-12 min-w-0 flex-1 rounded-md border border-line bg-background px-4 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          placeholder="¿Qué estás buscando?"
        />
        <button
          className="min-h-12 rounded-md bg-primary px-6 text-sm font-bold text-white transition hover:bg-wine-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="submit"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
