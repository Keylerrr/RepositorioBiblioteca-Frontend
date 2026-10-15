"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { journalService } from "../services/journalService";
import { capitalizeWords } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  Globe,
  ExternalLink,
} from "lucide-react";

function extractIds(list) {
  if (!list || !Array.isArray(list) || list.length === 0) return [];
  return list
    .map((item) => {
      if (item == null) return null;
      if (typeof item === "object") return item.id ?? null;
      const parsed = Number(item);
      return Number.isNaN(parsed) ? null : parsed;
    })
    .filter((id) => id !== null && id !== undefined && id !== "");
}

function extractSingleId(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "object") return value.id ?? "";
  return Number(value);
}

function emptyPlatformRow() {
  return {
    _key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    platform: "",
    journal_url: "",
    has_full_text: true,
  };
}

const platformFieldClass =
  "w-full h-9 px-3 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg shadow-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-500/20";

export default function JournalForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [catalogs, setCatalogs] = useState({
    languages: [],
    countries: [],
    materialTypes: [],
    academicPrograms: [],
    editorials: [],
    publishedPlatforms: [],
  });
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    issn: "",
    publication_date: "",
    url_image: "",
    has_apc: false,
    languages: [],
    countries: [],
    material_types: [],
    academic_programs: [],
    editorial: "",
    platforms: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    async function loadData() {
      setLoadingCatalogs(true);
      try {
        const catData = await journalService.loadFormCatalogs();
        setCatalogs(catData);

        if (initialData) {
          setFormData({
            title: initialData.title || "",
            issn: initialData.issn || "",
            publication_date: String(initialData.publication_date || "").slice(0, 10),
            url_image: initialData.url_image || "",
            has_apc: Boolean(initialData.has_apc),
            languages: extractIds(initialData.languages),
            countries: extractIds(initialData.countries),
            material_types: extractIds(initialData.material_types),
            academic_programs: extractIds(initialData.academic_programs),
            editorial: extractSingleId(initialData.editorial),
            platforms: (initialData.platforms || []).map((p, index) => ({
              _key: `existing-${p.id ?? index}`,
              platform:
                typeof p.platform === "object" && p.platform !== null ? p.platform.id : p.platform,
              journal_url: p.journal_url || "",
              start_period: String(p.start_period || "").slice(0, 10),
              finish_period: String(p.finish_period || "").slice(0, 10),
              has_full_text: Boolean(p.has_full_text),
            })),
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            languages: catData.languages.length > 0 ? [catData.languages[0].id] : [],
            countries: catData.countries.length > 0 ? [catData.countries[0].id] : [],
            material_types: catData.materialTypes.length > 0 ? [catData.materialTypes[0].id] : [],
            academic_programs:
              catData.academicPrograms.length > 0 ? [catData.academicPrograms[0].id] : [],
            editorial: catData.editorials[0]?.id || "",
            platforms: [emptyPlatformRow()],
          }));
        }
      } catch (err) {
        console.error("Error loading catalogs:", err);
      } finally {
        setLoadingCatalogs(false);
      }
    }
    loadData();
  }, [initialData]);

  const handleMultiSelectToggle = (field, id) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const numId = Number(id);
      if (current.includes(numId)) {
        return { ...prev, [field]: current.filter((item) => item !== numId) };
      }
      return { ...prev, [field]: [...current, numId] };
    });
  };

  const updatePlatformRow = (index, patch) => {
    setFormData((prev) => {
      const next = [...prev.platforms];
      next[index] = { ...next[index], ...patch };
      return { ...prev, platforms: next };
    });
    if (fieldErrors.platforms) {
      setFieldErrors((prev) => ({ ...prev, platforms: null }));
    }
  };

  const addPlatformRow = () => {
    setFormData((prev) => ({
      ...prev,
      platforms: [...prev.platforms, emptyPlatformRow()],
    }));
  };

  const removePlatformRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!formData.title.trim()) {
      setFormError("El título de la revista es obligatorio.");
      setFieldErrors({ title: "El título es requerido." });
      return;
    }

    if (!formData.issn.trim()) {
      setFormError("El ISSN de la revista es obligatorio.");
      setFieldErrors({ issn: "El ISSN es requerido." });
      return;
    }

    if (!formData.publication_date) {
      setFormError("La fecha de publicación u origen es obligatoria.");
      setFieldErrors({ publication_date: "La fecha de publicación es requerida." });
      return;
    }

    if (!formData.editorial) {
      setFormError("Debe seleccionar una editorial.");
      setFieldErrors({ editorial: "La editorial es requerida." });
      return;
    }

    // Al crear una revista nueva, se exige al menos una plataforma vinculada
    if (!isEdit && formData.platforms.length === 0) {
      setFormError("Debe vincular al menos una plataforma a la revista.");
      setFieldErrors({
        platforms: "La selección de al menos una plataforma es obligatoria al crear una revista.",
      });
      return;
    }

    // Validar cada plataforma vinculada
    for (let i = 0; i < formData.platforms.length; i++) {
      const row = formData.platforms[i];
      if (!row.platform) {
        setFormError(`La plataforma en la fila #${i + 1} es obligatoria.`);
        setFieldErrors({ platforms: `Seleccione una plataforma en la fila ${i + 1}.` });
        return;
      }
      if (!row.journal_url || !row.journal_url.trim()) {
        setFormError(`La URL de la revista en la plataforma #${i + 1} es obligatoria.`);
        setFieldErrors({
          platforms: `La URL específica de la revista es requerida en la fila ${i + 1}.`,
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        issn: formData.issn.trim(),
        publication_date: formData.publication_date,
        url_image: formData.url_image ? formData.url_image.trim() : null,
        has_apc: Boolean(formData.has_apc),
        languages: formData.languages,
        countries: formData.countries,
        material_types: formData.material_types,
        academic_programs: formData.academic_programs,
        editorial: Number(formData.editorial),
        platforms: formData.platforms.map((row) => ({
          platform: Number(row.platform),
          journal_url: row.journal_url.trim(),
          has_full_text: Boolean(row.has_full_text),
        })),
      };

      let savedJournal;
      if (isEdit && initialData?.id) {
        savedJournal = await journalService.patchJournal(initialData.id, payload);
      } else {
        savedJournal = await journalService.createJournal(payload);
      }

      const redirectId = savedJournal?.id || initialData?.id;
      if (redirectId) {
        router.push(`/admin/revistas/${redirectId}`);
      } else {
        router.push("/admin/revistas");
      }
    } catch (err) {
      console.error("Form submit error:", err);
      if (err.data && typeof err.data === "object") {
        setFieldErrors(err.data);
      }
      setFormError(err.message || "Error al guardar la revista.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldError = (name) => {
    const err = fieldErrors[name];
    if (!err) return null;
    return (
      <p className="text-[11px] text-rose-600 font-medium mt-1">
        {Array.isArray(err) ? err.join(", ") : typeof err === "string" ? err : JSON.stringify(err)}
      </p>
    );
  };

  if (loadingCatalogs) {
    return (
      <div className="p-16 text-center text-gray-500">
        <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-medium">Cargando catálogos del sistema...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEdit ? "Editar revista" : "Crear revista"}
          </h1>
        </div>
        <p className="text-xs font-medium text-[#C8102E] mt-1">
          {isEdit
            ? `Estado: ${initialData?.active ? "Activa" : initialData?.validated_at ? "Desactivada" : "Pendiente de validación"}`
            : "Estado inicial: Pendiente · Requiere publicación bibliotecaria"}
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Atención en el formulario</p>
            <p className="mt-0.5 leading-relaxed">{formError}</p>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: Identificación */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900">Identificación</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1 md:col-span-2">
            <Label htmlFor="title" className="text-[11px] font-medium text-gray-500 uppercase block">
              Título *
            </Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: null }));
              }}
              placeholder="Nombre de la revista"
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 font-semibold text-gray-900"
            />
            {renderFieldError("title")}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="issn" className="text-[11px] font-medium text-gray-500 uppercase block">
              ISSN *
            </Label>
            <Input
              id="issn"
              required
              value={formData.issn}
              onChange={(e) => {
                setFormData({ ...formData, issn: e.target.value });
                if (fieldErrors.issn) setFieldErrors((prev) => ({ ...prev, issn: null }));
              }}
              placeholder="Ej. 1234-5678"
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 font-semibold text-gray-900"
            />
            {renderFieldError("issn")}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label
              htmlFor="publication_date"
              className="text-[11px] font-medium text-gray-500 uppercase block"
            >
              Fecha de publicación *
            </Label>
            <Input
              id="publication_date"
              type="date"
              required
              value={formData.publication_date}
              onChange={(e) => {
                setFormData({ ...formData, publication_date: e.target.value });
                if (fieldErrors.publication_date)
                  setFieldErrors((prev) => ({ ...prev, publication_date: null }));
              }}
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-900 font-medium"
            />
            {renderFieldError("publication_date")}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="has_apc" className="text-[11px] font-medium text-gray-500 uppercase block">
              ¿Tiene APC? *
            </Label>
            <select
              id="has_apc"
              value={formData.has_apc ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, has_apc: e.target.value === "true" })}
              className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent h-6 cursor-pointer"
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
            {renderFieldError("has_apc")}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label
              htmlFor="url_image"
              className="text-[11px] font-medium text-gray-500 uppercase block"
            >
              URL de imagen (opcional)
            </Label>
            <Input
              id="url_image"
              type="url"
              value={formData.url_image}
              onChange={(e) => setFormData({ ...formData, url_image: e.target.value })}
              placeholder="https://.../portada.png"
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-800"
            />
            {renderFieldError("url_image")}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Cobertura y Clasificación (Rediseño visual responsivo) */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-gray-900">Cobertura y Clasificación</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Idiomas */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Idiomas *
              </Label>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                {formData.languages.length} seleccionados
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
              {catalogs.languages.map((lang) => {
                const isSelected = formData.languages.includes(lang.id);
                const titleName = capitalizeWords(lang.name);
                return (
                  <div
                    key={lang.id}
                    onClick={() => handleMultiSelectToggle("languages", lang.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-rose-50/70 border-[#C8102E] text-gray-900 font-semibold shadow-2xs"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <span className="truncate pr-1">
                      {lang.abbreviation
                        ? `${lang.abbreviation.toUpperCase()} - ${titleName}`
                        : titleName}
                    </span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isSelected
                          ? "bg-[#C8102E] border-[#C8102E] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {renderFieldError("languages")}
          </div>

          {/* Países */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                País *
              </Label>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                {formData.countries.length} seleccionados
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
              {catalogs.countries.map((country) => {
                const isSelected = formData.countries.includes(country.id);
                const titleName = country.emoji_flag
                  ? `${country.emoji_flag} ${capitalizeWords(country.name)}`
                  : capitalizeWords(country.name);
                return (
                  <div
                    key={country.id}
                    onClick={() => handleMultiSelectToggle("countries", country.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-rose-50/70 border-[#C8102E] text-gray-900 font-semibold shadow-2xs"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <span className="truncate pr-1">{titleName}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isSelected
                          ? "bg-[#C8102E] border-[#C8102E] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {renderFieldError("countries")}
          </div>

          {/* Tipos de material */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Tipo de material *
              </Label>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                {formData.material_types.length} seleccionados
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
              {catalogs.materialTypes.map((mat) => {
                const isSelected = formData.material_types.includes(mat.id);
                const titleName = capitalizeWords(mat.name);
                return (
                  <div
                    key={mat.id}
                    onClick={() => handleMultiSelectToggle("material_types", mat.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-rose-50/70 border-[#C8102E] text-gray-900 font-semibold shadow-2xs"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <span className="truncate pr-1">{titleName}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isSelected
                          ? "bg-[#C8102E] border-[#C8102E] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {renderFieldError("material_types")}
          </div>

          {/* Programas académicos */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Programas académicos *
              </Label>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                {formData.academic_programs.length} seleccionados
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
              {catalogs.academicPrograms.map((prog) => {
                const isSelected = formData.academic_programs.includes(prog.id);
                const titleName = capitalizeWords(prog.name);
                return (
                  <div
                    key={prog.id}
                    onClick={() => handleMultiSelectToggle("academic_programs", prog.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-rose-50/70 border-[#C8102E] text-gray-900 font-semibold shadow-2xs"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <span className="truncate pr-1">{titleName}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isSelected
                          ? "bg-[#C8102E] border-[#C8102E] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {renderFieldError("academic_programs")}
          </div>

          {/* Editorial */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1 md:col-span-2">
            <Label
              htmlFor="editorial"
              className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block"
            >
              Editorial *
            </Label>
            <select
              id="editorial"
              value={formData.editorial}
              onChange={(e) => {
                setFormData({ ...formData, editorial: e.target.value });
                if (fieldErrors.editorial) setFieldErrors((prev) => ({ ...prev, editorial: null }));
              }}
              className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent h-6 cursor-pointer"
            >
              <option value="">Seleccione una editorial ▾</option>
              {catalogs.editorials.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {capitalizeWords(ed.name || ed.nombre)}
                </option>
              ))}
            </select>
            {renderFieldError("editorial")}
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Indexación / Bases de datos */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Indexación / Bases de datos</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {!isEdit && "Obligatorio asociar al menos una plataforma publicada al crear la revista."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addPlatformRow}
            className="rounded-xl border-[#C8102E] text-[#C8102E] text-xs px-3 py-1.5 font-medium hover:bg-[#C8102E]/5 cursor-pointer gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir Plataforma
          </Button>
        </div>

        {renderFieldError("platforms")}

        {formData.platforms.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500 space-y-2">
            <p>No hay plataformas vinculadas.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPlatformRow}
              className="text-xs border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E]/5 cursor-pointer"
            >
              + Vincular primera plataforma
            </Button>
          </div>
        ) : (
          <div>
            {formData.platforms.map((row, index) => {
              const selectedPlatform = catalogs.publishedPlatforms.find(
                (p) => String(p.id) === String(row.platform)
              );

              return (
                <div
                  key={row._key}
                  className="bg-white border-2 border-slate-200 rounded-xl p-5 mb-4 shadow-xs relative"
                >
                  <div className="flex items-center justify-between pr-12 mb-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Plataforma #{index + 1}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePlatformRow(index)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all cursor-pointer"
                    title="Eliminar esta plataforma"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Selector de plataforma */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                        Plataforma *
                      </Label>
                      <select
                        value={row.platform ?? ""}
                        onChange={(e) => updatePlatformRow(index, { platform: e.target.value })}
                        className={`${platformFieldClass} cursor-pointer`}
                      >
                        <option value="">Seleccione una plataforma publicada ▾</option>
                        {catalogs.publishedPlatforms.map((p) => (
                          <option key={p.id} value={p.id}>
                            {capitalizeWords(p.name)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* URL de la revista en la plataforma (obligatorio) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                        URL de la revista en esta plataforma *
                      </Label>
                      <Input
                        type="url"
                        required
                        value={row.journal_url}
                        onChange={(e) => updatePlatformRow(index, { journal_url: e.target.value })}
                        placeholder="https://plataforma.org/revistas/mi-revista"
                        className={platformFieldClass}
                      />
                    </div>

                    {/* URL pública de la plataforma (solo lectura) */}
                    {selectedPlatform?.public_url && (
                      <div className="md:col-span-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-blue-900 truncate">
                          <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-blue-800 shrink-0">
                            URL pública (plataforma):
                          </span>
                          <span className="text-blue-700 truncate">
                            {selectedPlatform.public_url}
                          </span>
                        </div>
                        <a
                          href={selectedPlatform.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 shrink-0 flex items-center gap-1 font-medium hover:underline cursor-pointer"
                        >
                          <span>Visitar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Fechas de vinculación administradas por el backend (solo edición). */}
                    {isEdit && (row.start_period || row.finish_period) && (
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                            Fecha de vinculación con la plataforma
                          </Label>
                          <p className={`${platformFieldClass} flex items-center bg-slate-100 text-slate-600`}>
                            {row.start_period || "Sin definir"}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                            Fecha de finalización de la vinculación
                          </Label>
                          <p className={`${platformFieldClass} flex items-center bg-slate-100 text-slate-600`}>
                            {row.finish_period || "Indefinida"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Texto completo */}
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                        ¿Texto completo?
                      </Label>
                      <select
                        value={row.has_full_text ? "true" : "false"}
                        onChange={(e) =>
                          updatePlatformRow(index, { has_full_text: e.target.value === "true" })
                        }
                        className={`${platformFieldClass} cursor-pointer`}
                      >
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 flex-wrap pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
            className="rounded-xl border-gray-300 text-gray-700 text-xs px-5 py-2 font-medium hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white text-xs px-5 py-2 font-medium cursor-pointer"
          >
            {submitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear revista"}
          </Button>
        </div>
      </div>
    </form>
  );
}
