"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { platformService } from "../services/platformService";
import { capitalizeWords } from "@/lib/utils";
import DeleteModal from "./DeleteModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  History,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Link2
} from "lucide-react";

export default function DatabaseDetail({ platformId }) {
  const router = useRouter();
  const [platform, setPlatform] = useState(null);
  const [linkLogs, setLinkLogs] = useState([]);
  const [catalogs, setCatalogs] = useState({
    academicPrograms: [],
    institutions: [],
    languages: [],
    countries: [],
    materialTypes: [],
    knowledgeAreas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Re-check loading state
  const [isRechecking, setIsRechecking] = useState(false);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Detail Data & Catalogs
  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, catData, kaData] = await Promise.all([
        platformService.getPlatformById(platformId),
        platformService.loadFormCatalogs(),
        platformService.getCatalogData("/api/catalog/knowledge-areas/"),
      ]);

      setPlatform(data);
      setCatalogs({ ...catData, knowledgeAreas: kaData });

      // Load link check logs history
      try {
        const logsData = await platformService.getLinkCheckLogs({ platform: platformId });
        setLinkLogs(Array.isArray(logsData) ? logsData : logsData.results || []);
      } catch {
        setLinkLogs([]);
      }
    } catch (err) {
      console.error("Error loading platform detail:", err);
      setError(err.message || "No se pudo cargar la información de la plataforma.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (platformId) {
      loadDetail();
    }
  }, [platformId]);

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Direct Re-check handler (does NOT open modal, sends empty body payload {})
  const handleDirectRecheck = async () => {
    setIsRechecking(true);
    try {
      await platformService.checkLink(platformId, null);
      showToast("Re-verificación ejecutada exitosamente.");
      loadDetail();
    } catch (err) {
      alert(`Error al re-verificar URL: ${err.message}`);
    } finally {
      setIsRechecking(false);
    }
  };

  // Action Handlers
  const handlePublish = async () => {
    try {
      await platformService.publishPlatform(platformId);
      showToast("La plataforma ha sido publicada exitosamente.");
      loadDetail();
    } catch (err) {
      alert(`Error al publicar: ${err.message}`);
    }
  };

  const handleMarkObsolete = async () => {
    try {
      await platformService.markObsoletePlatform(platformId);
      showToast("La plataforma ha sido marcada como obsoleta.");
      loadDetail();
    } catch (err) {
      alert(`Error al marcar como obsoleta: ${err.message}`);
    }
  };

  const handleReactivate = async () => {
    try {
      await platformService.reactivatePlatform(platformId);
      showToast("La plataforma ha sido reactivada a estado borrador.");
      loadDetail();
    } catch (err) {
      alert(`Error al reactivar: ${err.message}`);
    }
  };

  const confirmDelete = async (explanation) => {
    setIsDeleting(true);
    try {
      await platformService.deletePlatform(platformId, explanation);
      setDeleteModalOpen(false);
      router.push("/admin/bases-de-datos");
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to format item names from catalog ID or Object
  const formatItemName = (item, catalogList = []) => {
    if (!item) return "";
    if (typeof item === "object" && item !== null) {
      return capitalizeWords(item.name || item.nombre);
    }
    const found = catalogList.find((c) => c.id === Number(item));
    if (found) {
      return capitalizeWords(found.name || found.nombre);
    }
    return `ID #${item}`;
  };

  const renderStatusBadge = (status) => {
    const s = (status || "BORRADOR").toUpperCase();
    if (s === "PUBLICADO") {
      return (
        <span className="bg-[#E6F8ED] text-[#1E7E44] border border-[#BCECCB] font-semibold text-xs rounded-full px-3.5 py-1 inline-flex items-center gap-1.5 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Publicado
        </span>
      );
    }
    if (s === "OBSOLETO") {
      return (
        <span className="bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-xs rounded-full px-3.5 py-1 inline-flex items-center gap-1.5 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          Obsoleto
        </span>
      );
    }
    return (
      <span className="bg-[#FEF6E6] text-[#B7791F] border border-[#FDE6BA] font-semibold text-xs rounded-full px-3.5 py-1 inline-flex items-center gap-1.5 shadow-2xs">
        <AlertTriangle className="w-3.5 h-3.5" />
        Borrador (Pendiente)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-500">
        <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-medium">Cargando detalles de la plataforma...</p>
      </div>
    );
  }

  if (error || !platform) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 max-w-xl mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Error al cargar la plataforma</h2>
        <p className="text-xs text-gray-500">{error || "No se encontró el recurso solicitado."}</p>
        <button
          onClick={() => router.push("/admin/bases-de-datos")}
          className="bg-[#C8102E] text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
        >
          Volver a Bases de datos
        </button>
      </div>
    );
  }

  const currentStatus = (platform.status || "BORRADOR").toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Top Bar Navigation & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/bases-de-datos")}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{capitalizeWords(platform.name)}</h1>
              {renderStatusBadge(platform.status)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">ID Recurso: #{platform.id}</p>
          </div>
        </div>

        {/* Action buttons (Editar, Publicar, Obsoleto, Reactivar, Eliminar) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/admin/bases-de-datos/${platform.id}?edit=true`}>
            <Button variant="outline" className="rounded-xl border-gray-200 text-xs gap-1.5 hover:bg-gray-50 cursor-pointer">
              <Edit3 className="w-3.5 h-3.5 text-gray-600" />
              Editar
            </Button>
          </Link>

          {currentStatus === "BORRADOR" && (
            <Button
              onClick={handlePublish}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Publicar
            </Button>
          )}

          {currentStatus === "PUBLICADO" && (
            <Button
              onClick={handleMarkObsolete}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              Marcar Obsoleto
            </Button>
          )}

          {currentStatus === "OBSOLETO" && (
            <Button
              onClick={handleReactivate}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Reactivar a Borrador
            </Button>
          )}

          <Button
            onClick={() => setDeleteModalOpen(true)}
            className="rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white text-xs font-medium gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Información General Card */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C8102E]" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* URL Pública de Acceso — campo destacado */}
                <div className="sm:col-span-2">
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">URL Pública de Acceso</span>
                  <div className="mt-1.5 p-3 bg-blue-50 border border-blue-200/80 rounded-lg flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                    {platform.public_url ? (
                      <a
                        href={platform.public_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-700 hover:underline text-[14px] sm:text-[15px] break-all flex items-center gap-1.5"
                      >
                        {platform.public_url}
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-[14px]">Sin URL pública registrada</span>
                    )}
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Nombre</span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">{capitalizeWords(platform.name)}</span>
                  </div>
                </div>

                {/* Requiere Registro */}
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Requiere Registro</span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${platform.requires_registration ? "bg-amber-50 text-amber-800 border border-amber-200/60" : "bg-emerald-50 text-emerald-800 border border-emerald-200/60"}`}>
                      {platform.requires_registration ? "Sí (Registro obligatorio)" : "No (Acceso libre)"}
                    </span>
                  </div>
                </div>

                {/* Acceso a Texto Completo */}
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Acceso a Texto Completo</span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${platform.has_access_text ? "bg-blue-50 text-blue-700 border border-blue-200/60" : "bg-gray-100 text-gray-700 border border-gray-200"}`}>
                      {platform.has_access_text ? "Sí disponible" : "Únicamente resúmenes / citas"}
                    </span>
                  </div>
                </div>

                {/* Sintaxis Válida */}
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Sintaxis Válida</span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">
                      {platform.valid_sintaxis
                        ? typeof platform.valid_sintaxis === "object"
                          ? capitalizeWords(platform.valid_sintaxis.name)
                          : capitalizeWords(catalogs.sintaxis?.find(s => s.id === Number(platform.valid_sintaxis))?.name || "Sintaxis estándar")
                        : "Sintaxis estándar"}
                    </span>
                  </div>
                </div>

                {/* Periodo Inicial */}
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Periodo Inicial</span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">{platform.start_period || "Sin definir"}</span>
                  </div>
                </div>

                {/* Periodo Final */}
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Periodo Final</span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">{platform.finish_period || "Indefinido"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de API & Cosecha Card */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-600" />
                Configuración de Cosecha
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* is_harvestable */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  platform.is_harvestable
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}>
                  {platform.is_harvestable ? "Cosechable vía API" : "Solo acceso manual"}
                </span>
              </div>

              {/* URL Base de API */}
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">URL Base de API de cosecha</span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {platform.base_api_url ? (
                    <a
                      href={platform.base_api_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-blue-600 hover:underline flex items-center gap-1.5 text-[14px] sm:text-[15px] break-all font-semibold"
                    >
                      {platform.base_api_url}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic text-[14px]">Sin URL de API configurada</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Verificaciones de URL (LinkCheckLog) Card */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  Historial de Verificaciones de URL
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Registros de disponibilidad y verificación de la URL pública
                </CardDescription>
              </div>

              <Button
                size="sm"
                disabled={isRechecking}
                onClick={handleDirectRecheck}
                className="rounded-xl text-xs bg-[#C8102E] hover:bg-[#A50D25] text-white font-medium gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? "animate-spin" : ""}`} />
                <span>{isRechecking ? "Verificando..." : "Re-verificar URL"}</span>
              </Button>
            </CardHeader>

            <CardContent className="pt-4">
              {linkLogs.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs">
                  No hay registros de verificación de enlace aún.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {linkLogs.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-gray-800 block truncate font-semibold">{log.url || log.link}</span>
                        <span className="text-[10px] text-gray-400">{formatDate(log.created_at || log.checked_at)}</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          log.is_valid || log.status_code === 200
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {log.is_valid || log.status_code === 200 ? "Válido" : "Error"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Cards (1 Col) */}
        <div className="space-y-6">
          {/* Clasificación y Relaciones Card */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Clasificación y Relaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Áreas de Conocimiento (Derivadas) */}
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Áreas de Conocimiento (Derivadas)</span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {platform.knowledge_areas && platform.knowledge_areas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {platform.knowledge_areas.map((ka, i) => {
                        const name = formatItemName(ka, catalogs.knowledgeAreas);
                        return (
                          <span
                            key={i}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold px-2.5 py-0.5 rounded-md text-xs"
                          >
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin áreas derivadas</span>
                  )}
                </div>
              </div>

              {/* Programas Académicos */}
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Programas Académicos</span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {platform.academic_programs && platform.academic_programs.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside text-slate-900 font-semibold text-[14px]">
                      {platform.academic_programs.map((ap, i) => (
                        <li key={i}>{formatItemName(ap, catalogs.academicPrograms)}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin programas asociados</span>
                  )}
                </div>
              </div>

              {/* Instituciones */}
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Instituciones</span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {platform.institutions && platform.institutions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {platform.institutions.map((inst, i) => (
                        <span key={i} className="bg-slate-200/80 text-slate-800 font-semibold px-2.5 py-0.5 rounded-md text-xs">
                          {formatItemName(inst, catalogs.institutions)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin instituciones especificadas</span>
                  )}
                </div>
              </div>

              {/* Países */}
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Países</span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {platform.countries && platform.countries.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {platform.countries.map((country, i) => (
                        <span key={i} className="bg-slate-200/80 text-slate-800 font-semibold px-2.5 py-0.5 rounded-md text-xs">
                          {formatItemName(country, catalogs.countries)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin países especificados</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auditoría y Trazabilidad Card */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                Auditoría y Trazabilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Creado por</span>
                <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="font-semibold text-slate-900 text-xs block">{platform.created_by || "Sistema"}</span>
                  <span className="text-[10px] text-gray-400 block">{formatDate(platform.created_at)}</span>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Última actualización</span>
                <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="font-semibold text-slate-900 text-xs block">{platform.updated_by || "Sistema"}</span>
                  <span className="text-[10px] text-gray-400 block">{formatDate(platform.updated_at)}</span>
                </div>
              </div>

              {platform.delete_explanation && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <span className="font-bold block uppercase text-[10px]">Motivo de eliminación:</span>
                  <span className="mt-0.5 block font-semibold">{platform.delete_explanation}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        platformName={platform.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}

