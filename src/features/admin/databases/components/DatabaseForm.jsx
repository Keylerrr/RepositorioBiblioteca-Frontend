"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { platformService } from "../services/platformService";
import { capitalizeWords } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  AlertCircle, 
  Info,
  Check
} from "lucide-react";

export default function DatabaseForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  // Catalogs state
  const [catalogs, setCatalogs] = useState({
    sintaxis: [],
    institutions: [],
    languages: [],
    countries: [],
    materialTypes: [],
    academicPrograms: [],
  });
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Form State (strictly fields of Platform model)
  const [formData, setFormData] = useState({
    name: "",
    base_api_url: "",
    api_key: "",
    url_image: "",
    start_period: "",
    finish_period: "",
    requires_registration: false,
    has_access_text: true,
    valid_sintaxis: "",
    institutions: [],
    languages: [],
    countries: [],
    material_types: [],
    academic_programs: [],
  });

  const [clearApiKey, setClearApiKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Load catalogs on mount & prefill form if editing
  useEffect(() => {
    async function loadData() {
      setLoadingCatalogs(true);
      try {
        const catData = await platformService.loadFormCatalogs();
        setCatalogs(catData);

        if (initialData) {
          setFormData({
            name: initialData.name || "",
            base_api_url: initialData.base_api_url || "",
            api_key: "", // Write-only, never returned by backend
            url_image: initialData.url_image || "",
            start_period: initialData.start_period || "",
            finish_period: initialData.finish_period || "",
            requires_registration: Boolean(initialData.requires_registration),
            has_access_text: Boolean(initialData.has_access_text),
            valid_sintaxis: typeof initialData.valid_sintaxis === "object" 
              ? initialData.valid_sintaxis.id 
              : initialData.valid_sintaxis || (catData.sintaxis[0]?.id || ""),
            institutions: extractIds(initialData.institutions, catData.institutions),
            languages: extractIds(initialData.languages, catData.languages),
            countries: extractIds(initialData.countries, catData.countries),
            material_types: extractIds(initialData.material_types, catData.materialTypes),
            academic_programs: extractIds(initialData.academic_programs, catData.academicPrograms),
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            valid_sintaxis: catData.sintaxis[0]?.id || 1,
            institutions: catData.institutions.length > 0 ? [catData.institutions[0].id] : [1],
            languages: catData.languages.length > 0 ? [catData.languages[0].id] : [1],
            countries: catData.countries.length > 0 ? [catData.countries[0].id] : [1],
            material_types: catData.materialTypes.length > 0 ? [catData.materialTypes[0].id] : [1],
            academic_programs: catData.academicPrograms.length > 0 ? [catData.academicPrograms[0].id] : [1],
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

  function extractIds(list, catalog) {
    if (!list || !Array.isArray(list)) {
      return catalog.length > 0 ? [catalog[0].id] : [];
    }
    return list.map((item) => (typeof item === "object" ? item.id : Number(item)));
  }

  // Multi-select toggle handler
  const handleMultiSelectToggle = (field, id) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const numId = Number(id);
      if (current.includes(numId)) {
        return { ...prev, [field]: current.filter((item) => item !== numId) };
      } else {
        return { ...prev, [field]: [...current, numId] };
      }
    });
  };

  const handleSubmit = async (e, actionType = "save") => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("El nombre de la base de datos es obligatorio.");
      return;
    }

    const hasBaseApiUrl = Boolean(formData.base_api_url && formData.base_api_url.trim());
    const hasApiKeyInput = Boolean(formData.api_key && formData.api_key.trim());

    if (hasApiKeyInput && !hasBaseApiUrl) {
      setFormError("Combinación inválida: No se puede enviar una API Key sin haber especificado la URL base de API (base_api_url).");
      return;
    }

    if (!formData.valid_sintaxis) {
      setFormError("Debe seleccionar una sintaxis de búsqueda admitida (valid_sintaxis).");
      return;
    }

    setSubmitting(true);

    try {
      // Build clean payload according to API_de_platforms.docx.txt spec
      const payload = {
        name: formData.name.trim(),
        base_api_url: formData.base_api_url ? formData.base_api_url.trim() : null,
        url_image: formData.url_image ? formData.url_image.trim() : null,
        start_period: formData.start_period || null,
        finish_period: formData.finish_period || null,
        requires_registration: formData.requires_registration,
        has_access_text: formData.has_access_text,
        valid_sintaxis: Number(formData.valid_sintaxis),
        institutions: formData.institutions,
        languages: formData.languages,
        countries: formData.countries,
        material_types: formData.material_types,
        academic_programs: formData.academic_programs,
      };

      // Handle api_key UX logic:
      // If checkbox clearApiKey is checked, explicitly send api_key: null
      // If not checked and input has text, send api_key string
      // If untouched, omit api_key from PATCH
      if (clearApiKey) {
        payload.api_key = null;
      } else if (hasApiKeyInput) {
        payload.api_key = formData.api_key.trim();
      }

      let savedPlatform;
      if (isEdit && initialData?.id) {
        savedPlatform = await platformService.patchPlatform(initialData.id, payload);
      } else {
        savedPlatform = await platformService.createPlatform(payload);
      }

      const platformId = savedPlatform?.id || initialData?.id;

      if (actionType === "publish" && platformId) {
        try {
          await platformService.publishPlatform(platformId);
        } catch (pubErr) {
          console.warn("Error en la publicación:", pubErr);
        }
      }

      router.push("/admin/bases-de-datos");
    } catch (err) {
      console.error("Form submit error:", err);
      setFormError(err.message || "Error al guardar la plataforma.");
    } finally {
      setSubmitting(false);
    }
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
    <form onSubmit={(e) => handleSubmit(e, "save")} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
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
            {isEdit ? "Editar plataforma" : "Crear base de datos"}
          </h1>
        </div>
        <p className="text-xs font-medium text-[#C8102E] mt-1">
          {isEdit
            ? `Estado: ${initialData?.status || "Pendiente de validación bibliotecaria"}`
            : "Estado inicial: Borrador · Requiere validación bibliotecaria antes de publicar"}
        </p>
      </div>

      {/* Error Banner */}
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
          {/* Nombre * */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1 md:col-span-2">
            <Label htmlFor="name" className="text-[11px] font-medium text-gray-500 block">
              Nombre *
            </Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre de la base de datos (Ej. SciELO)"
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 font-semibold text-gray-900"
            />
          </div>

          {/* URL de imagen (Strictly text input, NO <img /> render) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="url_image" className="text-[11px] font-medium text-gray-500 block">
              URL de imagen (Texto)
            </Label>
            <Input
              id="url_image"
              type="url"
              value={formData.url_image}
              onChange={(e) => setFormData({ ...formData, url_image: e.target.value })}
              placeholder="https://.../logo.png"
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-800"
            />
          </div>

          {/* base_api_url (Opcional) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1 md:col-span-2">
            <Label htmlFor="base_api_url" className="text-[11px] font-medium text-gray-500 block">
              URL Base API de cosecha (opcional)
            </Label>
            <Input
              id="base_api_url"
              type="url"
              value={formData.base_api_url}
              onChange={(e) => setFormData({ ...formData, base_api_url: e.target.value })}
              placeholder="https://api.scielo.org/v1/oai (si aplica)"
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-800"
            />
          </div>

          {/* API Key (Disabled if clearApiKey is checked) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="api_key" className="text-[11px] font-medium text-gray-500 block">
              API Key (opcional)
            </Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => {
                setClearApiKey(false);
                setFormData({ ...formData, api_key: e.target.value });
              }}
              disabled={clearApiKey}
              placeholder={
                clearApiKey
                  ? "Clave eliminada (se enviará null al guardar)"
                  : isEdit
                  ? "Clave sin configurar / Escriba para cambiar"
                  : "Sin configurar"
              }
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
            {isEdit && (
              <label className="flex items-center gap-1.5 text-[10px] text-rose-600 cursor-pointer pt-1 font-medium">
                <input
                  type="checkbox"
                  checked={clearApiKey}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setClearApiKey(isChecked);
                    if (isChecked) {
                      setFormData((prev) => ({ ...prev, api_key: "" }));
                    }
                  }}
                  className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span>Eliminar clave (enviará null)</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Cobertura & Clasificación */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-gray-900">Cobertura y Clasificación</h2>

        {/* Cobertura temática (Mensaje informativo fijo) */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Cobertura temática (Áreas de conocimiento):</strong> Se calculará automáticamente al guardar a partir de los programas académicos seleccionados.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Institución responsable (Multi-Selección) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2">
            <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Institución responsable * (Selección múltiple)
            </Label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {catalogs.institutions.map((inst) => {
                const isSelected = formData.institutions.includes(inst.id);
                const titleName = capitalizeWords(inst.name);
                return (
                  <div
                    key={inst.id}
                    onClick={() => handleMultiSelectToggle("institutions", inst.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-[#C8102E]/5 border-[#C8102E] text-gray-900 font-semibold"
                        : "bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{titleName}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? "bg-[#C8102E] border-[#C8102E] text-white" : "border-gray-300 bg-white"}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* País (Multi-Selección) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2">
            <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              País * (Selección múltiple)
            </Label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {catalogs.countries.map((country) => {
                const isSelected = formData.countries.includes(country.id);
                const titleName = country.emoji_flag 
                  ? `${country.emoji_flag} ${capitalizeWords(country.name)}`
                  : capitalizeWords(country.name);
                return (
                  <div
                    key={country.id}
                    onClick={() => handleMultiSelectToggle("countries", country.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-[#C8102E]/5 border-[#C8102E] text-gray-900 font-semibold"
                        : "bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{titleName}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? "bg-[#C8102E] border-[#C8102E] text-white" : "border-gray-300 bg-white"}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tipo de material (Multi-Selección) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2">
            <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Tipo de material * (Selección múltiple)
            </Label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {catalogs.materialTypes.map((mat) => {
                const isSelected = formData.material_types.includes(mat.id);
                const titleName = capitalizeWords(mat.name);
                return (
                  <div
                    key={mat.id}
                    onClick={() => handleMultiSelectToggle("material_types", mat.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-[#C8102E]/5 border-[#C8102E] text-gray-900 font-semibold"
                        : "bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{titleName}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? "bg-[#C8102E] border-[#C8102E] text-white" : "border-gray-300 bg-white"}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Idiomas (Multi-Selección) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2">
            <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Idiomas * (Selección múltiple)
            </Label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {catalogs.languages.map((lang) => {
                const isSelected = formData.languages.includes(lang.id);
                const titleName = capitalizeWords(lang.name);
                return (
                  <div
                    key={lang.id}
                    onClick={() => handleMultiSelectToggle("languages", lang.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-[#C8102E]/5 border-[#C8102E] text-gray-900 font-semibold"
                        : "bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{lang.abbreviation ? `${lang.abbreviation.toUpperCase()} - ${titleName}` : titleName}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? "bg-[#C8102E] border-[#C8102E] text-white" : "border-gray-300 bg-white"}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Programas Académicos (Multi-Selección) */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Programas académicos vinculados
            </Label>
            <span className="text-[10px] text-[#C8102E] font-medium bg-[#C8102E]/10 px-2 py-0.5 rounded-full">
              Selección múltiple
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
            {catalogs.academicPrograms.map((prog) => {
              const isSelected = formData.academic_programs.includes(prog.id);
              const titleName = capitalizeWords(prog.name);
              return (
                <div
                  key={prog.id}
                  onClick={() => handleMultiSelectToggle("academic_programs", prog.id)}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                    isSelected
                      ? "bg-[#C8102E]/5 border-[#C8102E] text-gray-900 font-semibold"
                      : "bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{titleName}</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${isSelected ? "bg-[#C8102E] border-[#C8102E] text-white" : "border-gray-300 bg-white"}`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Periodo cubierto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="start_period" className="text-[11px] font-medium text-gray-500 block">
              Periodo inicio *
            </Label>
            <Input
              id="start_period"
              type="date"
              value={formData.start_period}
              onChange={(e) => setFormData({ ...formData, start_period: e.target.value })}
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-900 font-medium"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="finish_period" className="text-[11px] font-medium text-gray-500 block">
              Periodo fin (Opcional)
            </Label>
            <Input
              id="finish_period"
              type="date"
              value={formData.finish_period}
              onChange={(e) => setFormData({ ...formData, finish_period: e.target.value })}
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-900 font-medium"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Acceso y búsqueda */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-gray-900">Acceso y búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ¿Exige registro previo? * */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="requires_registration" className="text-[11px] font-medium text-gray-500 block">
              ¿Exige registro previo? *
            </Label>
            <select
              id="requires_registration"
              value={formData.requires_registration ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, requires_registration: e.target.value === "true" })}
              className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent h-6 cursor-pointer"
            >
              <option value="false">No (Acceso libre)</option>
              <option value="true">Sí (Exige registro)</option>
            </select>
          </div>

          {/* ¿Texto completo disponible? * */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="has_access_text" className="text-[11px] font-medium text-gray-500 block">
              ¿Texto completo disponible? *
            </Label>
            <select
              id="has_access_text"
              value={formData.has_access_text ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, has_access_text: e.target.value === "true" })}
              className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent h-6 cursor-pointer"
            >
              <option value="true">Sí (Texto completo)</option>
              <option value="false">No (Solo resúmenes / citas)</option>
            </select>
          </div>

          {/* Selector dinámico para valid_sintaxis (GET /api/platforms/valid-sintaxis/) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1 md:col-span-2">
            <Label htmlFor="valid_sintaxis" className="text-[11px] font-medium text-gray-500 block">
              Sintaxis de búsqueda admitida
            </Label>
            <select
              id="valid_sintaxis"
              value={formData.valid_sintaxis}
              onChange={(e) => setFormData({ ...formData, valid_sintaxis: e.target.value })}
              className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent h-6 cursor-pointer"
            >
              {catalogs.sintaxis.map((s) => (
                <option key={s.id} value={s.id}>
                  {capitalizeWords(s.name)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: Flujo de curaduría & Botones de Acción */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-gray-900">Flujo de curaduría</h2>
          <p className="text-[11px] text-gray-400 font-mono">
            Borrador → Pendiente de validación → Publicado → Obsoleto
          </p>
        </div>

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
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, "save")}
            disabled={submitting}
            className="rounded-xl border-[#C8102E] text-[#C8102E] text-xs px-5 py-2 font-medium hover:bg-[#C8102E]/5 cursor-pointer"
          >
            Guardar borrador
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white text-xs font-medium px-6 py-2 shadow-xs cursor-pointer"
          >
            {submitting
              ? "Guardando..."
              : isEdit
              ? "Publicar"
              : "Enviar a validación"}
          </Button>
        </div>
      </div>
    </form>
  );
}
