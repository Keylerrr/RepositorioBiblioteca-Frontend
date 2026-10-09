"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { journalService } from "../services/journalService";
import { capitalizeWords } from "@/lib/utils";
import DeleteModal from "@/features/admin/databases/components/DeleteModal";
import {
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Archive,
  Trash2,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Loader2,
} from "lucide-react";

function renderStatusBadge(journal) {
  if (journal?.active) {
    return (
      <span className="bg-[#E6F8ED] text-[#1E7E44] border border-[#BCECCB] font-semibold text-xs rounded-full px-3 py-0.5 inline-flex items-center gap-1">
        Activa
      </span>
    );
  }
  if (journal?.validated_at) {
    return (
      <span className="bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-xs rounded-full px-3 py-0.5 inline-flex items-center gap-1">
        Desactivada
      </span>
    );
  }
  return (
    <span className="bg-[#FEF6E6] text-[#B7791F] border border-[#FDE6BA] font-semibold text-xs rounded-full px-3 py-0.5 inline-flex items-center gap-1">
      Pendiente
    </span>
  );
}

export default function JournalTable() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowActionId, setRowActionId] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchJournals = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const params = { page };
      if (debouncedSearch) params.search = debouncedSearch;

      const data = await journalService.getJournals(params);

      if (Array.isArray(data)) {
        setJournals(data);
        setTotalItems(data.length);
        setTotalPages(1);
      } else if (data && Array.isArray(data.results)) {
        setJournals(data.results);
        setTotalItems(data.total_items || data.count || data.results.length);
        setTotalPages(
          data.total_pages ||
            Math.ceil((data.total_items || data.results.length) / (data.page_size || 10)) ||
            1
        );
      } else {
        setJournals([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching journals:", err);
      if (!silent) {
        setError(err.message || "Error al cargar las revistas del servidor.");
        setJournals([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleLifecycleToggle = async (journal) => {
    if (rowActionId) return;
    setRowActionId(journal.id);
    try {
      if (journal.active === true) {
        await journalService.deactivateJournal(journal.id);
        showSuccess(`Revista "${journal.title}" desactivada.`);
      } else {
        await journalService.publishJournal(journal.id);
        showSuccess(`Revista "${journal.title}" publicada.`);
      }
      await fetchJournals({ silent: true });
    } catch (err) {
      alert(`Error al cambiar el estado: ${err.message}`);
    } finally {
      setRowActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!selectedJournal) return;
    setIsDeleting(true);
    try {
      await journalService.deleteJournal(selectedJournal.id);
      showSuccess(`Revista "${selectedJournal.title}" eliminada.`);
      setDeleteModalOpen(false);
      setSelectedJournal(null);
      fetchJournals();
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Revistas</h1>
        </div>
        <Link href="/admin/revistas/nueva">
          <button className="bg-[#C8102E] hover:bg-[#A50D25] text-white font-medium text-sm rounded-lg px-4 py-2.5 flex items-center gap-2 shadow-xs transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>+ Nueva revista</span>
          </button>
        </Link>
      </div>

      <div className="bg-[#EFEFEF]/60 p-1 rounded-xl inline-flex items-center gap-1 border border-gray-200/50">
        <Link href="/admin/bases-de-datos">
          <button className="text-gray-500 hover:text-gray-800 font-medium text-xs px-5 py-2 rounded-lg transition-all hover:bg-white/50">
            Bases de datos
          </button>
        </Link>
        <button className="bg-white text-[#C8102E] font-semibold text-xs px-5 py-2 rounded-lg shadow-2xs transition-all border border-gray-200/60">
          Revistas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-2.5 shadow-2xs flex flex-col justify-center focus-within:border-gray-400">
          <label className="text-[10px] text-gray-400 font-medium tracking-wide uppercase block">Buscar</label>
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Título o ISSN"
              className="w-full text-xs text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/60">
                <th className="py-3 px-6">Título</th>
                <th className="py-3 px-6">ISSN</th>
                <th className="py-3 px-6">Estado</th>
                <th className="py-3 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="h-6 bg-gray-200 rounded w-28 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-8 px-6 text-center text-rose-600 bg-rose-50/30">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                    <p className="font-semibold text-sm">{error}</p>
                    <button
                      onClick={fetchJournals}
                      className="mt-3 text-xs bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors cursor-pointer"
                    >
                      Reintentar conexión
                    </button>
                  </td>
                </tr>
              ) : journals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-6 text-center text-gray-500">
                    <Archive className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-sm text-gray-700">No se encontraron revistas</p>
                    <p className="text-xs text-gray-400 mt-1">Prueba a cambiar la búsqueda o agregar una nueva revista.</p>
                  </td>
                </tr>
              ) : (
                journals.map((journal) => (
                  <tr key={journal.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      <span className="block font-semibold text-gray-900">
                        {capitalizeWords(journal.title)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-medium font-mono">
                      {journal.issn || "—"}
                    </td>
                    <td className="py-4 px-6">{renderStatusBadge(journal)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/admin/revistas/${journal.id}`}>
                          <button
                            title="Ver detalle de la revista"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E] transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>

                        <Link href={`/admin/revistas/nueva?id=${journal.id}`}>
                          <button
                            title="Editar información de la revista"
                            className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E] transition-all cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </Link>

                        {journal.active === true ? (
                          <button
                            onClick={() => handleLifecycleToggle(journal)}
                            disabled={rowActionId === journal.id}
                            title="Desactivar revista"
                            className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rowActionId === journal.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLifecycleToggle(journal)}
                            disabled={rowActionId === journal.id}
                            title="Publicar revista"
                            className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rowActionId === journal.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedJournal(journal);
                            setDeleteModalOpen(true);
                          }}
                          title="Eliminar revista"
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && journals.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Mostrando <span className="font-semibold text-gray-800">{journals.length}</span> de{" "}
              <span className="font-semibold text-gray-800">{totalItems}</span> recursos
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedJournal(null);
        }}
        onConfirm={confirmDelete}
        platformName={selectedJournal?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
}
