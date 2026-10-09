"use client";

import { useEffect, useState } from "react";
import Filters from "@/features/public/directory/components/Filters";
import ResourceCard from "@/features/public/directory/components/ResourceCard";
import SearchBar from "@/features/public/directory/components/SearchBar";
import { getPage as getDatabasesPage } from "@/shared/services/databaseService";
import { getPage as getJournalsPage } from "@/shared/services/journalService";

const emptyFilters = { knowledge_area: "", language: "", country: "", material_type: "", academic_program: "" };
const pageSize = 10;
const emptyPagination = { current_page: 1, total_pages: 1, page_size: pageSize, total_items: 0, next: null, previous: null };

export default function DirectoryExplorer({ initialQuery = "", initialType = "database" }) {
  const [activeType, setActiveType] = useState(initialType === "revistas" ? "journal" : "database");
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const fetchPage = activeType === "database" ? getDatabasesPage : getJournalsPage;

  useEffect(() => {
    let isCurrentRequest = true;
    fetchPage({ page, page_size: pageSize, search: query, ...filters })
      .then((result) => {
        if (!isCurrentRequest) return;
        setResources(result.results);
        setPagination(result);
      })
      .catch((requestError) => {
        if (!isCurrentRequest) return;
        setResources([]);
        setPagination(emptyPagination);
        setError(requestError.message || "No se pudieron cargar los recursos.");
      })
      .finally(() => {
        if (isCurrentRequest) setLoading(false);
    });
    return () => { isCurrentRequest = false; };
  }, [fetchPage, filters, page, query, retryCount]);

  function updateFilter(key, value) {
    setLoading(true);
    setError("");
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function changeType(type) {
    if (type === activeType) return;
    setLoading(true);
    setError("");
    setActiveType(type);
    setFilters(emptyFilters);
    setPage(1);
  }

  function submitSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setQuery(searchInput.trim());
    setPage(1);
    setRetryCount((current) => current + 1);
  }

  function changePage(nextPage) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  function clearFilters() {
    setLoading(true);
    setError("");
    setFilters(emptyFilters);
    setPage(1);
    setRetryCount((current) => current + 1);
  }

  return (
    <>
      <section className="border-b border-[#e2dcd7] bg-[#efedeb]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7f1218]">Biblioteca / Recursos</p>
          <h1 className="mt-3 text-4xl font-bold text-[#1f1a1a] sm:text-5xl">Directorio de recursos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5c5252] sm:text-base">Encuentra fuentes académicas para explorar una disciplina, preparar tus clases o avanzar en tu investigación.</p>
          <form className="mt-7 flex flex-col gap-3 sm:flex-row" onSubmit={submitSearch}>
            <SearchBar onChange={setSearchInput} value={searchInput} />
            <button className="min-h-12 rounded-md bg-[#a3141c] px-6 text-sm font-semibold text-white transition hover:bg-[#8a1018] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c] disabled:opacity-60" disabled={loading} type="submit">Buscar</button>
          </form>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl flex-1 px-5 pb-14 sm:px-8">
        <div className="mt-6 flex border-b border-[#e2dcd7]" role="tablist" aria-label="Tipo de recurso">
          {[["database", "Bases de datos"], ["journal", "Revistas"]].map(([type, label]) => (
            <button aria-selected={activeType === type} className={`relative min-h-12 px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c] sm:px-6 ${activeType === type ? "text-[#7f1218] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[3px] after:bg-[#a3141c]" : "text-[#5c5252] hover:text-[#1f1a1a]"}`} key={type} onClick={() => changeType(type)} role="tab" type="button">{label}</button>
          ))}
          <span className="ml-auto self-center text-xs text-[#8a807b]">{pagination.total_items} recursos</span>
        </div>
        <div className="mt-4">
          <Filters disabled={loading} onChange={updateFilter} onClear={clearFilters} resources={resources} values={filters} />
        </div>
        {loading ? (
          <div aria-label="Cargando recursos" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status">
            {[1, 2, 3].map((item) => <div className="h-64 animate-pulse border border-[#e7dfd9] bg-[#efedeb]" key={item} />)}
            <span className="sr-only">Cargando recursos...</span>
          </div>
        ) : error ? (
          <div aria-live="polite" className="mt-6 border border-[#e3b9b8] bg-[#fff7f6] px-5 py-8 text-center" role="alert">
            <p className="text-2xl font-bold text-[#7f1218]">No se pudo cargar el directorio</p>
            <p className="mt-2 text-sm text-[#5c5252]">{error}</p>
            <button className="mt-5 rounded-md bg-[#a3141c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8a1018] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]" onClick={() => { setLoading(true); setError(""); setRetryCount((current) => current + 1); }} type="button">Reintentar</button>
          </div>
        ) : resources.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => <ResourceCard key={`${activeType}-${resource.id}`} resource={resource} type={activeType} />)}
          </div>
        ) : (
          <div className="mt-6 border border-dashed border-[#e2dcd7] px-5 py-14 text-center">
            <p className="text-2xl font-bold text-[#1f1a1a]">No encontramos resultados</p>
            <p className="mt-2 text-sm text-[#5c5252]">Prueba con otra búsqueda o limpia los filtros seleccionados.</p>
          </div>
        )}
        {!loading && !error && pagination.total_items > 0 && (
          <nav aria-label="Paginación" className="mt-8 flex items-center justify-center gap-4">
            <button className="min-h-10 rounded-md border border-[#e2dcd7] px-4 text-sm font-semibold text-[#5c5252] transition hover:border-[#c9a45c] hover:text-[#7f1218] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c] disabled:cursor-not-allowed disabled:opacity-40" disabled={!pagination.previous || loading} onClick={() => changePage(pagination.current_page - 1)} type="button">← Anterior</button>
            <span className="text-sm text-[#5c5252]">Página {pagination.current_page} de {pagination.total_pages}</span>
            <button className="min-h-10 rounded-md border border-[#e2dcd7] px-4 text-sm font-semibold text-[#5c5252] transition hover:border-[#c9a45c] hover:text-[#7f1218] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c] disabled:cursor-not-allowed disabled:opacity-40" disabled={!pagination.next || loading} onClick={() => changePage(pagination.current_page + 1)} type="button">Siguiente →</button>
          </nav>
        )}
      </section>
    </>
  );
}