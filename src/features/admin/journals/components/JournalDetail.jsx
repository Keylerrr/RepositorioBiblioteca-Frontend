"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { journalService } from "../services/journalService";
import { getUserDisplayName, userService } from "@/shared/services/userService";
import { capitalizeWords } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublishJournalModal from "./PublishJournalModal";
import {
  ArrowLeft,
  Edit3,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  ExternalLink,
  UserCheck,
  Link2,
  Ban,
  Database,
  FileText,
} from "lucide-react";

function renderStatusBadge(journal) {
  if (journal?.active) {
    return (
      <span className="bg-[#E6F8ED] text-[#1E7E44] border border-[#BCECCB] font-semibold text-xs rounded-full px-3.5 py-1 inline-flex items-center gap-1.5 shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Activa
      </span>
    );
  }
  if (journal?.validated_at) {
    return (
      <span className="bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-xs rounded-full px-3.5 py-1 inline-flex items-center gap-1.5 shadow-2xs">
        <Clock className="w-3.5 h-3.5 text-gray-500" />
        Desactivada
      </span>
    );
  }
  return (
    <span className="bg-[#FEF6E6] text-[#B7791F] border border-[#FDE6BA] font-semibold text-xs rounded-full px-3.5 py-1 inline-flex items-center gap-1.5 shadow-2xs">
      <AlertTriangle className="w-3.5 h-3.5" />
      Pendiente
    </span>
  );
}

export default function JournalDetail({ journalId }) {
  const router = useRouter();
  const [journal, setJournal] = useState(null);
  const [catalogs, setCatalogs] = useState({
    academicPrograms: [],
    languages: [],
    countries: [],
    materialTypes: [],
    editorials: [],
    knowledgeAreas: [],
    publishedPlatforms: [],
    licenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [userNames, setUserNames] = useState({});

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, catData, kaData, licData] = await Promise.all([
        journalService.getJournalById(journalId),
        journalService.loadFormCatalogs(),
        journalService.getCatalogData("/api/catalog/knowledge-areas/"),
        journalService.getLicenses().catch(() => []),
      ]);

      const auditUserIds = [...new Set(
        ["created_by", "updated_by", "validated_by", "deleted_by"]
          .map((field) => data[field])
          .filter((value) => value !== null && value !== undefined && value !== "" && typeof value !== "object")
      )];
      const resolvedUsers = await Promise.all(
        auditUserIds.map(async (id) => {
          try {
            return [String(id), getUserDisplayName(await userService.getUserById(id))];
          } catch {
            return [String(id), "—"];
          }
        })
      );

      setJournal(data);
      setUserNames(Object.fromEntries(resolvedUsers));
      setCatalogs({
        ...catData,
        knowledgeAreas: kaData,
        licenses: Array.isArray(licData) ? licData : [],
      });
    } catch (err) {
      console.error("Error loading journal detail:", err);
      setError(err.message || "No se pudo cargar la información de la revista.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (journalId) {
      loadDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId]);

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDeactivate = async () => {
    setActionBusy(true);
    try {
      await journalService.deactivateJournal(journalId);
      showToast("La revista ha sido desactivada.");
      await loadDetail();
    } catch (err) {
      alert(`Error al desactivar: ${err.message}`);
    } finally {
      setActionBusy(false);
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

  const formatSimpleDate = (dateStr) => {
    if (!dateStr) return "Sin definir";
    try {
      const parts = String(dateStr).slice(0, 10).split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

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

  const resolvePlatformName = (entry) => {
    if (!entry) return "Plataforma";
    if (typeof entry.platform === "object" && entry.platform !== null) {
      return capitalizeWords(entry.platform.name || entry.platform.nombre) || `ID #${entry.platform.id}`;
    }
    if (entry.platform_name) return capitalizeWords(entry.platform_name);
    if (entry.name) return capitalizeWords(entry.name);
    return formatItemName(entry.platform, catalogs.publishedPlatforms);
  };

  const resolvePlatformId = (entry) => {
    if (typeof entry?.platform === "object") return entry.platform.id;
    return entry?.platform ?? "—";
  };

  const resolvePlatformPublicUrl = (entry) => {
    if (entry?.public_url) return entry.public_url;
    if (typeof entry?.platform === "object" && entry.platform?.public_url) {
      return entry.platform.public_url;
    }
    const platId = resolvePlatformId(entry);
    const found = catalogs.publishedPlatforms.find((p) => String(p.id) === String(platId));
    return found?.public_url || null;
  };

  const resolveLicenseName = (lic) => {
    if (!lic) return "";
    if (typeof lic === "object" && lic !== null) {
      return lic.name || `ID #${lic.id}`;
    }
    const idNum = Number(lic);
    const found = (catalogs.licenses || []).find((l) => l.id === idNum);
    return found?.name || `Licencia #${idNum}`;
  };

  const resolveUserName = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return typeof value === "object" ? getUserDisplayName(value) : userNames[String(value)] || "—";
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-500">
        <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-medium">Cargando detalles de la revista...</p>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 max-w-xl mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Error al cargar la revista</h2>
        <p className="text-xs text-gray-500">{error || "No se encontró el recurso solicitado."}</p>
        <button
          onClick={() => router.push("/admin/revistas")}
          className="bg-[#C8102E] text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
        >
          Volver a Revistas
        </button>
      </div>
    );
  }

  const associatedPlatforms = Array.isArray(journal.platforms) ? journal.platforms : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/revistas")}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {capitalizeWords(journal.title)}
              </h1>
              {renderStatusBadge(journal)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">ISSN: {journal.issn || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/admin/revistas/nueva?id=${journal.id}`}>
            <Button
              variant="outline"
              className="rounded-xl border-gray-200 text-xs gap-1.5 hover:bg-gray-50 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-600" />
              Editar
            </Button>
          </Link>

          {!journal.active && (
            <Button
              onClick={() => setPublishModalOpen(true)}
              disabled={actionBusy}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Publicar
            </Button>
          )}

          {journal.active && (
            <>
              <Button
                onClick={() => setPublishModalOpen(true)}
                disabled={actionBusy}
                variant="outline"
                className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-medium gap-1.5 cursor-pointer"
                title="Actualizar las licencias asignadas a esta revista"
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                Actualizar Licencias
              </Button>

              <Button
                onClick={handleDeactivate}
                disabled={actionBusy}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                Desactivar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C8102E]" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                    Título
                  </span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">
                      {capitalizeWords(journal.title)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">ISSN</span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">
                      {journal.issn || "—"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                    Fecha de publicación
                  </span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">
                      {formatSimpleDate(journal.publication_date)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                    Editorial
                  </span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">
                      {journal.editorial
                        ? formatItemName(journal.editorial, catalogs.editorials)
                        : "Sin editorial"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">APC</span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                        journal.has_apc
                          ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                      }`}
                    >
                      {journal.has_apc ? "Sí" : "No"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                    Licencias
                  </span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    {Array.isArray(journal.licenses) && journal.licenses.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {journal.licenses.map((lic, i) => (
                          <span
                            key={i}
                            className="bg-purple-50 text-purple-800 border border-purple-200/60 font-semibold px-2.5 py-0.5 rounded-md text-xs flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-purple-600" />
                            <span>{resolveLicenseName(lic)}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Sin licencias asignadas</span>
                    )}
                  </div>
                </div>

                {journal.url_image && (
                  <div className="sm:col-span-2">
                    <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                      URL de imagen
                    </span>
                    <div className="mt-1.5 p-3 bg-blue-50 border border-blue-200/80 rounded-lg flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                      <a
                        href={journal.url_image}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-700 hover:underline text-[14px] sm:text-[15px] break-all flex items-center gap-1.5"
                      >
                        {journal.url_image}
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Indexación / Bases de datos */}
          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#C8102E]" />
                Indexación / Bases de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {associatedPlatforms.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs">
                  Sin plataformas asociadas.
                </div>
              ) : (
                <div className="space-y-4">
                  {associatedPlatforms.map((entry, idx) => {
                    const publicUrl = resolvePlatformPublicUrl(entry);

                    return (
                      <div
                        key={entry.id || idx}
                        className="p-4 rounded-xl border border-gray-100 bg-slate-50 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                              Plataforma ID #{resolvePlatformId(entry)}
                            </p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">
                              {resolvePlatformName(entry)}
                            </p>
                          </div>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                              entry.has_full_text
                                ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {entry.has_full_text ? "Texto completo" : "Sin texto completo"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500 font-semibold uppercase tracking-wide block">
                              Fecha de vinculación con la plataforma
                            </span>
                            <span className="text-slate-900 font-semibold">
                              {entry.start_period || "Sin definir"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 font-semibold uppercase tracking-wide block">
                              Fecha de finalización de la vinculación
                            </span>
                            <span className="text-slate-900 font-semibold">
                              {entry.finish_period || "Indefinida"}
                            </span>
                          </div>
                        </div>

                        {/* URL contextual de la revista */}
                        {entry.journal_url && (
                          <div>
                            <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                              URL de la revista (contextual)
                            </span>
                            <div className="mt-1.5 p-3 bg-blue-50 border border-blue-200/80 rounded-lg flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="font-semibold text-blue-700 text-xs truncate">
                                  {entry.journal_url}
                                </span>
                              </div>
                              <a
                                href={entry.journal_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 shrink-0 p-1 hover:bg-blue-100 rounded"
                                title="Abrir URL de revista"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* URL general de la plataforma (solo lectura) */}
                        {publicUrl && (
                          <div>
                            <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                              URL general de la plataforma (pública)
                            </span>
                            <div className="mt-1.5 p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="font-medium text-slate-700 text-xs truncate">
                                  {publicUrl}
                                </span>
                              </div>
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-600 hover:text-slate-900 shrink-0 p-1 hover:bg-slate-200 rounded"
                                title="Abrir URL pública de plataforma"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Clasificación y Relaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                  Áreas de Conocimiento
                </span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {journal.knowledge_areas && journal.knowledge_areas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {journal.knowledge_areas.map((ka, i) => {
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
                    <span className="text-slate-400 italic text-xs">—</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                  Programas Académicos
                </span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {journal.academic_programs && journal.academic_programs.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside text-slate-900 font-semibold text-[14px]">
                      {journal.academic_programs.map((ap, i) => (
                        <li key={i}>{formatItemName(ap, catalogs.academicPrograms)}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin programas asociados</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                  Idiomas
                </span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {journal.languages && journal.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {journal.languages.map((lang, i) => (
                        <span
                          key={i}
                          className="bg-slate-200/80 text-slate-800 font-semibold px-2.5 py-0.5 rounded-md text-xs"
                        >
                          {formatItemName(lang, catalogs.languages)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin idiomas especificados</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Países</span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {journal.countries && journal.countries.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {journal.countries.map((country, i) => (
                        <span
                          key={i}
                          className="bg-slate-200/80 text-slate-800 font-semibold px-2.5 py-0.5 rounded-md text-xs"
                        >
                          {formatItemName(country, catalogs.countries)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin países especificados</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                  Tipos de material
                </span>
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {journal.material_types && journal.material_types.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {journal.material_types.map((mat, i) => (
                        <span
                          key={i}
                          className="bg-slate-200/80 text-slate-800 font-semibold px-2.5 py-0.5 rounded-md text-xs"
                        >
                          {formatItemName(mat, catalogs.materialTypes)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin tipos de material</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                Auditoría y Trazabilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                  Validada en
                </span>
                <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="font-semibold text-slate-900 text-xs block">
                    {journal.validated_at ? formatDate(journal.validated_at) : "Aún no validada"}
                  </span>
                </div>
              </div>

              {journal.validated_by != null && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Validado por</span>
                  <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="font-semibold text-slate-900 text-xs block">{resolveUserName(journal.validated_by)}</span>
                  </div>
                </div>
              )}

              {journal.deleted_by != null && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">Eliminado por</span>
                  <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="font-semibold text-slate-900 text-xs block">{resolveUserName(journal.deleted_by)}</span>
                    {journal.deleted_at && <span className="text-[10px] text-gray-400 block">{formatDate(journal.deleted_at)}</span>}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                  Creado por
                </span>
                <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="font-semibold text-slate-900 text-xs block">
                    {resolveUserName(journal.created_by)}
                  </span>
                  <span className="text-[10px] text-gray-400 block">{formatDate(journal.created_at)}</span>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                  Última actualización
                </span>
                <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="font-semibold text-slate-900 text-xs block">
                    {resolveUserName(journal.updated_by)}
                  </span>
                  <span className="text-[10px] text-gray-400 block">{formatDate(journal.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal para publicar con selección de licencias */}
      <PublishJournalModal
        journal={journal}
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          loadDetail();
        }}
      />
    </div>
  );
}
