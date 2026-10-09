"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { journalService } from "../services/journalService";
import { capitalizeWords } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, catData, kaData] = await Promise.all([
        journalService.getJournalById(journalId),
        journalService.loadFormCatalogs(),
        journalService.getCatalogData("/api/catalog/knowledge-areas/"),
      ]);

      setJournal(data);
      setCatalogs({ ...catData, knowledgeAreas: kaData });
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

  const handlePublish = async () => {
    setActionBusy(true);
    try {
      await journalService.publishJournal(journalId);
      showToast("La revista ha sido publicada exitosamente.");
      await loadDetail();
    } catch (err) {
      alert(`Error al publicar: ${err.message}`);
    } finally {
      setActionBusy(false);
    }
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
            <p className="text-xs text-gray-500 mt-0.5 font-mono">ISSN: {journal.issn || "—"}</p>
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
              onClick={handlePublish}
              disabled={actionBusy}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Publicar
            </Button>
          )}

          {journal.active && (
            <Button
              onClick={handleDeactivate}
              disabled={actionBusy}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium gap-1.5 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              Desactivar
            </Button>
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
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900 font-mono">
                      {journal.issn || "—"}
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
                    Licencia
                  </span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">
                      {journal.license || "Sin definir"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                    Periodo Inicial
                  </span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">
                      {journal.start_period || "Sin definir"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                    Periodo Final
                  </span>
                  <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900">
                      {journal.finish_period || "Indefinido"}
                    </span>
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
                <div className="space-y-3">
                  {associatedPlatforms.map((entry, idx) => (
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
                            Cobertura
                          </span>
                          <span className="text-slate-900 font-semibold">
                            {entry.start_period || "Sin inicio"} — {entry.finish_period || "Indefinido"}
                          </span>
                        </div>
                      </div>

                      {entry.journal_url && (
                        <div>
                          <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                            URL de la revista
                          </span>
                          <div className="mt-1.5 p-3 bg-blue-50 border border-blue-200/80 rounded-lg flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <a
                              href={entry.journal_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-blue-700 hover:underline text-[14px] break-all flex items-center gap-1.5"
                            >
                              {entry.journal_url}
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      )}

                      {entry.public_url && (
                        <div>
                          <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                            URL pública
                          </span>
                          <div className="mt-1.5 p-3 bg-blue-50 border border-blue-200/80 rounded-lg flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <a
                              href={entry.public_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-blue-700 hover:underline text-[14px] break-all flex items-center gap-1.5"
                            >
                              {entry.public_url}
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                  Áreas de Conocimiento (Derivadas)
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
                    <span className="text-slate-400 italic text-xs">Sin áreas derivadas</span>
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

              <div>
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold block">
                  Creado por
                </span>
                <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="font-semibold text-slate-900 text-xs block">
                    {journal.created_by || "Sistema"}
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
                    {journal.updated_by || "Sistema"}
                  </span>
                  <span className="text-[10px] text-gray-400 block">{formatDate(journal.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
