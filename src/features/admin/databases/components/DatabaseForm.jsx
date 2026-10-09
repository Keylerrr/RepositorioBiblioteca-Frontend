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
  });
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Form State (strictly fields of Platform model)
  const [formData, setFormData] = useState({
    name: "",
    public_url: "",
    is_harvestable: false,
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
  });

  const [clearApiKey, setClearApiKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

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
            public_url: initialData.public_url || initialData.url || (initialData.link_logs && initialData.link_logs[0]?.url) || "",
            is_harvestable: Boolean(initialData.is_harvestable),
            base_api_url: initialData.base_api_url || "",
            api_key: "", // Write-only, never returned by backend
            url_image: initialData.url_image || "",
            start_period: String(initialData.start_period || "").slice(0, 10),
            finish_period: String(initialData.finish_period || "").slice(0, 10),
            requires_registration: Boolean(initialData.requires_registration),
            has_access_text: Boolean(initialData.has_access_text),
            valid_sintaxis: initialData.valid_sintaxis?.id || initialData.valid_sintaxis || "",
            institutions: extractIds(initialData.institutions),
            languages: extractIds(initialData.languages),
            countries: extractIds(initialData.countries),
            material_types: extractIds(initialData.material_types),
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            valid_sintaxis: catData.sintaxis[0]?.id || 1,
            institutions: catData.institutions.length > 0 ? [catData.institutions[0].id] : [1],
            languages: catData.languages.length > 0 ? [catData.languages[0].id] : [1],
            countries: catData.countries.length > 0 ? [catData.countries[0].id] : [1],
            material_types: catData.materialTypes.length > 0 ? [catData.materialTypes[0].id] : [1],
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
    setFieldErrors({});

    if (!formData.name.trim()) {
      setFormError("El nombre de la base de datos es obligatorio.");
      return;
    }

    if (!formData.public_url.trim()) {
      setFormError("La URL pública de acceso es obligatoria.");
      setFieldErrors({ public_url: "La URL pública es requerida." });
      return;
    }

    const hasBaseApiUrl = Boolean(formData.base_api_url && formData.base_api_url.trim());
    const hasApiKeyInput = Boolean(formData.api_key && formData.api_key.trim());

    // Si es cosechable, la URL base de API es obligatoria
    if (formData.is_harvestable && !hasBaseApiUrl) {
      setFormError("Si la base de datos es cosechable, la URL Base de API es obligatoria.");
      setFieldErrors({ base_api_url: "Obligatoria cuando 'Cosechable vía API' está activado." });
      return;
    }

    if (hasApiKeyInput && !hasBaseApiUrl) {
      setFormError("Combinación inválida: No se puede enviar una API Key sin haber especificado la URL base de API (base_api_url).");
      setFieldErrors({ base_api_url: "URL base de API requerida si especifica una API Key." });
      return;
    }

    if (!formData.valid_sintaxis) {
      setFormError("Debe seleccionar una sintaxis de búsqueda admitida (valid_sintaxis).");
      return;
    }

    setSubmitting(true);

    try {
      // Build clean payload. public_url is sent natively for the backend to handle.
      const payload = {
        name: formData.name.trim(),
        public_url: formData.public_url.trim(),
        is_harvestable: formData.is_harvestable,
        // Si no es cosechable, enviar null para evitar HTTP 400 del backend
        base_api_url: formData.is_harvestable && formData.base_api_url ? formData.base_api_url.trim() : null,
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
      };

      // Handle api_key logic:
      // If not harvestable → always null
      // If harvestable + clearApiKey checked → null
      // If harvestable + new text → send the text
      // If harvestable + untouched in edit → omit from PATCH (don't overwrite)
      if (!formData.is_harvestable || clearApiKey) {
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

      const redirectId = savedPlatform?.id || initialData?.id;

      if (actionType === "publish" && redirectId) {
        try {
          await platformService.publishPlatform(redirectId);
        } catch (pubErr) {
          console.warn("Error en la publicación:", pubErr);
        }
      }

      // Redirigir al detalle si es edición; a la lista si es creación nueva
      if (isEdit && redirectId) {
        router.push(`/admin/bases-de-datos/${redirectId}`);
      } else {
        router.push("/admin/bases-de-datos");
      }
    } catch (err) {
      console.error("Form submit error:", err);
      if (err.data && typeof err.data === "object") {
        setFieldErrors(err.data);
      }
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
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
              }}
              placeholder="Nombre de la base de datos (Ej. SciELO)"
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 font-semibold text-gray-900"
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {Array.isArray(fieldErrors.name) ? fieldErrors.name.join(", ") : fieldErrors.name}
              </p>
            )}
          </div>

          {/* URL de imagen */}
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

          {/* URL Pública (Obligatoria) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1 md:col-span-3">
            <Label htmlFor="public_url" className="text-[11px] font-medium text-gray-500 block">
              URL Pública de Acceso *
            </Label>
            <Input
              id="public_url"
              type="url"
              required
              value={formData.public_url}
              onChange={(e) => {
                setFormData({ ...formData, public_url: e.target.value });
                if (fieldErrors.public_url) setFieldErrors((prev) => ({ ...prev, public_url: null }));
              }}
              placeholder="https://www.scielo.org (Obligatoria)"
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-900 font-semibold"
            />
            {fieldErrors.public_url && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {Array.isArray(fieldErrors.public_url) ? fieldErrors.public_url.join(", ") : fieldErrors.public_url}
              </p>
            )}
          </div>

          {/* is_harvestable */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
            <Label htmlFor="is_harvestable" className="text-[11px] font-medium text-gray-500 block">
              Cosechable vía API
            </Label>
            <select
              id="is_harvestable"
              value={formData.is_harvestable ? "true" : "false"}
              onChange={(e) => {
                const val = e.target.value === "true";
                setFormData((prev) => ({
                  ...prev,
                  is_harvestable: val,
                  // Limpiar campos de API si se desactiva la cosecha
                  ...(val === false ? { base_api_url: "", api_key: "" } : {}),
                }));
              }}
              className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent h-6 cursor-pointer"
            >
              <option value="false">No (Solo acceso manual)</option>
              <option value="true">Sí (Cosechable vía API)</option>
            </select>
          </div>

          {/* base_api_url (Obligatoria si is_harvestable) */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1 md:col-span-2">
            <Label htmlFor="base_api_url" className="text-[11px] font-medium text-gray-500 block">
              URL Base API de cosecha {formData.is_harvestable ? "*" : "(opcional)"}
            </Label>
            <Input
              id="base_api_url"
              type="url"
              required={formData.is_harvestable}
              disabled={!formData.is_harvestable}
              value={formData.base_api_url}
              onChange={(e) => {
                setFormData({ ...formData, base_api_url: e.target.value });
                if (fieldErrors.base_api_url) setFieldErrors((prev) => ({ ...prev, base_api_url: null }));
              }}
              placeholder={formData.is_harvestable ? "https://api.scielo.org/v1/oai (obligatoria)" : "Activar cosecha para habilitar"}
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {fieldErrors.base_api_url && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {Array.isArray(fieldErrors.base_api_url) ? fieldErrors.base_api_url.join(", ") : fieldErrors.base_api_url}
              </p>
            )}
          </div>

          {/* API Key (solo si is_harvestable) */}
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
                if (fieldErrors.api_key) setFieldErrors((prev) => ({ ...prev, api_key: null }));
              }}
              disabled={clearApiKey || !formData.is_harvestable}
              placeholder={
                !formData.is_harvestable
                  ? "Activar cosecha para habilitar"
                  : clearApiKey
                  ? "Clave eliminada (se enviará null al guardar)"
                  : isEdit
                  ? "Clave sin configurar / Escriba para cambiar"
                  : "Sin configurar"
              }
              className="border-0 p-0 text-xs shadow-none focus-visible:ring-0 h-6 text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {fieldErrors.api_key && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {Array.isArray(fieldErrors.api_key) ? fieldErrors.api_key.join(", ") : fieldErrors.api_key}
              </p>
            )}
            {isEdit && formData.is_harvestable && (
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
        </div>
      </div>
    </form>
  );
}
