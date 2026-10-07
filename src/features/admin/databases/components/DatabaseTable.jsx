"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { platformService } from "../services/platformService";
import { capitalizeWords } from "@/lib/utils";
import DeleteModal from "./DeleteModal";
import LinkCheckModal from "./LinkCheckModal";
import { 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Archive, 
  Link2, 
  Trash2, 
  Eye, 
  Edit3,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Clock,
  RefreshCw,
  RotateCcw
} from "lucide-react";

export default function DatabaseTable() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Pagination metadata
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search input state with Debounce
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters state
  const [statusFilter, setStatusFilter] = useState("all");
  const [registrationFilter, setRegistrationFilter] = useState("");
  const [accessTextFilter, setAccessTextFilter] = useState("");
  const [ordering, setOrdering] = useState("-updated_at");

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(false);

  // Debounce handler (400ms delay) to prevent firing fetch on every keypress
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch platforms from backend using debouncedSearch
  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (statusFilter === "archived") {
        data = await platformService.getArchivedPlatforms({
          search: debouncedSearch,
          page,
          ordering,
        });
      } else {
        const params = {
          page,
          ordering,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter && statusFilter !== "all") params.status = statusFilter;
        if (registrationFilter) params.requires_registration = registrationFilter;
        if (accessTextFilter) params.has_access_text = accessTextFilter;

        data = await platformService.getPlatforms(params);
      }

      if (Array.isArray(data)) {
        setPlatforms(data);
        setTotalItems(data.length);
        setTotalPages(1);
      } else if (data && Array.isArray(data.results)) {
        setPlatforms(data.results);
        setTotalItems(data.total_items || data.count || data.results.length);
        setTotalPages(data.total_pages || Math.ceil((data.total_items || data.results.length) / (data.page_size || 10)) || 1);
      } else {
        setPlatforms([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching platforms:", err);
      setError(err.message || "Error al cargar las plataformas del servidor.");
      setPlatforms([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, registrationFilter, accessTextFilter, ordering]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // State Transitions
  const handlePublish = async (id, name) => {
    try {
      await platformService.publishPlatform(id);
      showSuccess(`Plataforma "${name}" publicada con éxito.`);
      fetchPlatforms();
    } catch (err) {
      alert(`Error al publicar: ${err.message}`);
    }
  };

  const handleMarkObsolete = async (id, name) => {
    try {
      await platformService.markObsoletePlatform(id);
      showSuccess(`Plataforma "${name}" marcada como obsoleta.`);
      fetchPlatforms();
    } catch (err) {
      alert(`Error al marcar como obsoleta: ${err.message}`);
    }
  };

  const handleReactivate = async (id, name) => {
    try {
      await platformService.reactivatePlatform(id);
      showSuccess(`Plataforma "${name}" reactivada a borrador.`);
      fetchPlatforms();
    } catch (err) {
      alert(`Error al reactivar: ${err.message}`);
    }
  };

  const handleRestore = async (id, name) => {
    try {
      await platformService.restorePlatform(id);
      showSuccess(`Plataforma "${name}" restaurada desde archivadas.`);
      fetchPlatforms();
    } catch (err) {
      alert(`Error al restaurar: ${err.message}`);
    }
  };

  const confirmDelete = async (explanation) => {
    if (!selectedPlatform) return;
    setIsDeleting(true);
    try {
      await platformService.deletePlatform(selectedPlatform.id, explanation);
      showSuccess(`Plataforma "${selectedPlatform.name}" eliminada.`);
      setDeleteModalOpen(false);
      setSelectedPlatform(null);
      fetchPlatforms();
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmCheckLink = async (url) => {
    if (!selectedPlatform) return;
    setIsCheckingLink(true);
    try {
      await platformService.checkLink(selectedPlatform.id, url);
      showSuccess(`Verificación de URL completada para "${selectedPlatform.name}".`);
      setLinkModalOpen(false);
      setSelectedPlatform(null);
      fetchPlatforms();
    } catch (err) {
      alert(`Error al verificar la URL: ${err.message}`);
    } finally {
      setIsCheckingLink(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status) => {
    const s = (status || "BORRADOR").toUpperCase();
    if (s === "PUBLICADO") {
      return (
        <span className="bg-[#E6F8ED] text-[#1E7E44] border border-[#BCECCB] font-semibold text-xs rounded-full px-3 py-0.5 inline-flex items-center gap-1">
          Publicado
        </span>
      );
    }
    if (s === "OBSOLETO") {
      return (
        <span className="bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-xs rounded-full px-3 py-0.5 inline-flex items-center gap-1">
          Obsoleto
        </span>
      );
    }
    if (s === "ARCHIVADO" || statusFilter === "archived") {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-xs rounded-full px-3 py-0.5 inline-flex items-center gap-1">
          Archivado
        </span>
      );
    }
    return (
      <span className="bg-[#FEF6E6] text-[#B7791F] border border-[#FDE6BA] font-semibold text-xs rounded-full px-3 py-0.5 inline-flex items-center gap-1">
        Pendiente
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-semibold cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bases de datos</h1>
        </div>
        <Link href="/admin/bases-de-datos/nueva">
          <button className="bg-[#C8102E] hover:bg-[#A50D25] text-white font-medium text-sm rounded-lg px-4 py-2.5 flex items-center gap-2 shadow-xs transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>+ Nuevo recurso</span>
          </button>
        </Link>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-[#EFEFEF]/60 p-1 rounded-xl inline-flex items-center gap-1 border border-gray-200/50">
        <button className="bg-white text-[#C8102E] font-semibold text-xs px-5 py-2 rounded-lg shadow-2xs transition-all border border-gray-200/60">
          Bases de datos
        </button>
        <Link href="/admin/revistas">
          <button className="text-gray-500 hover:text-gray-800 font-medium text-xs px-5 py-2 rounded-lg transition-all hover:bg-white/50">
            Revistas
          </button>
        </Link>
      </div>

      {/* Filters Bar with Debounced Search Input */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Buscar con Debounce 400ms */}
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-2xs flex flex-col justify-center focus-within:border-gray-400">
          <label className="text-[10px] text-gray-400 font-medium tracking-wide uppercase block">Buscar</label>
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nombre, institución o URL"
              className="w-full text-xs text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Registro */}
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-2xs flex flex-col justify-center">
          <label className="text-[10px] text-gray-400 font-medium tracking-wide uppercase block">Registro</label>
          <select
            value={registrationFilter}
            onChange={(e) => {
              setRegistrationFilter(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs text-gray-700 outline-none bg-transparent cursor-pointer font-medium"
          >
            <option value="">Todas las instituciones ▾</option>
            <option value="true">Requiere registro</option>
            <option value="false">Acceso libre</option>
          </select>
        </div>

        {/* Tipo de acceso */}
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-2xs flex flex-col justify-center">
          <label className="text-[10px] text-gray-400 font-medium tracking-wide uppercase block">Tipo de acceso</label>
          <select
            value={accessTextFilter}
            onChange={(e) => {
              setAccessTextFilter(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs text-gray-700 outline-none bg-transparent cursor-pointer font-medium"
          >
            <option value="">Cualquier acceso ▾</option>
            <option value="true">Con texto completo</option>
            <option value="false">Sin texto completo</option>
          </select>
        </div>

        {/* Estado */}
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-2xs flex flex-col justify-center">
          <label className="text-[10px] text-gray-400 font-medium tracking-wide uppercase block">Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs text-gray-700 outline-none bg-transparent cursor-pointer font-medium"
          >
            <option value="all">Todos los estados ▾</option>
            <option value="BORRADOR">Pendientes (Borrador)</option>
            <option value="PUBLICADO">Publicados</option>
            <option value="OBSOLETO">Obsoletos</option>
            <option value="archived">Archivadas (Eliminadas)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/60">
                <th className="py-3 px-6">RECURSO</th>
                <th className="py-3 px-6">TIPO</th>
                <th className="py-3 px-6">ESTADO</th>
                <th className="py-3 px-6">ÚLTIMA REVISIÓN</th>
                <th className="py-3 px-6 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="py-4 px-6 text-center"><div className="h-6 bg-gray-200 rounded w-28 mx-auto"></div></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-8 px-6 text-center text-rose-600 bg-rose-50/30">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                    <p className="font-semibold text-sm">{error}</p>
                    <button
                      onClick={fetchPlatforms}
                      className="mt-3 text-xs bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors cursor-pointer"
                    >
                      Reintentar conexión
                    </button>
                  </td>
                </tr>
              ) : platforms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center text-gray-500">
                    <Archive className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-sm text-gray-700">No se encontraron plataformas</p>
                    <p className="text-xs text-gray-400 mt-1">Prueba a cambiar los filtros o agregar un nuevo recurso.</p>
                  </td>
                </tr>
              ) : (
                platforms.map((platform) => {
                  const currentStatus = (platform.status || "BORRADOR").toUpperCase();

                  return (
                    <tr key={platform.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Recurso (No img preview) */}
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        <div>
                          <span className="block font-semibold text-gray-900">{capitalizeWords(platform.name)}</span>
                          {platform.base_api_url && (
                            <span className="text-[10px] text-gray-400 block font-mono truncate max-w-[220px]">
                              {platform.base_api_url}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-4 px-6 text-gray-600 font-medium">Base de datos</td>

                      {/* Estado */}
                      <td className="py-4 px-6">{renderStatusBadge(platform.status)}</td>

                      {/* Última revisión */}
                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {formatDate(platform.updated_at || platform.created_at)}
                      </td>

                      {/* Acciones con ICONOS */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ver (Ojo) */}
                          <Link href={`/admin/bases-de-datos/${platform.id}`}>
                            <button
                              title="Ver detalle de la plataforma"
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E] transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {/* Editar (Lápiz) */}
                          <Link href={`/admin/bases-de-datos/${platform.id}?edit=true`}>
                            <button
                              title="Editar información de la plataforma"
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E] transition-all cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </Link>

                          {/* Verificar Link (Enlace) */}
                          {statusFilter !== "archived" && (
                            <button
                              onClick={() => {
                                setSelectedPlatform(platform);
                                setLinkModalOpen(true);
                              }}
                              title="Verificar URL pública"
                              className="p-1.5 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Acciones según Estado */}
                          {statusFilter === "archived" ? (
                            <button
                              onClick={() => handleRestore(platform.id, platform.name)}
                              title="Restaurar plataforma"
                              className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              {currentStatus === "BORRADOR" && (
                                <button
                                  onClick={() => handlePublish(platform.id, platform.name)}
                                  title="Publicar plataforma"
                                  className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all cursor-pointer"
                                >
                                  <UploadCloud className="w-4 h-4" />
                                </button>
                              )}

                              {currentStatus === "PUBLICADO" && (
                                <button
                                  onClick={() => handleMarkObsolete(platform.id, platform.name)}
                                  title="Marcar como obsoleta"
                                  className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all cursor-pointer"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
                              )}

                              {currentStatus === "OBSOLETO" && (
                                <button
                                  onClick={() => handleReactivate(platform.id, platform.name)}
                                  title="Reactivar plataforma a borrador"
                                  className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-pointer"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}

                              {/* Eliminar (Caneca) */}
                              <button
                                onClick={() => {
                                  setSelectedPlatform(platform);
                                  setDeleteModalOpen(true);
                                }}
                                title="Eliminar plataforma"
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && platforms.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Mostrando <span className="font-semibold text-gray-800">{platforms.length}</span> de{" "}
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

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedPlatform(null);
        }}
        onConfirm={confirmDelete}
        platformName={selectedPlatform?.name}
        isDeleting={isDeleting}
      />

      {/* Link Check Modal */}
      <LinkCheckModal
        isOpen={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          setSelectedPlatform(null);
        }}
        onConfirm={confirmCheckLink}
        platform={selectedPlatform}
        isChecking={isCheckingLink}
      />
    </div>
  );
}
