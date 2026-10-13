"use client";

import React, { useState, useEffect, useCallback } from "react";
import { journalService } from "../services/journalService";
import { Button } from "@/components/ui/button";
import LicenseManagerModal from "./LicenseManagerModal";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Check,
  Settings,
} from "lucide-react";

export default function PublishJournalModal({ journal, isOpen, onClose, onSuccess }) {
  const [licenses, setLicenses] = useState([]);
  const [selectedLicenses, setSelectedLicenses] = useState([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);

  const fetchLicenses = useCallback(async () => {
    setLoadingLicenses(true);
    setError(null);
    try {
      const data = await journalService.getLicenses();
      setLicenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading licenses for publishing:", err);
      setError(err.message || "Error al cargar las licencias disponibles.");
    } finally {
      setLoadingLicenses(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLicenses();
      // Pre-select any licenses already on the journal if available
      const initial = Array.isArray(journal?.licenses)
        ? journal.licenses.map((l) => (typeof l === "object" ? l.id : Number(l))).filter(Boolean)
        : [];
      setSelectedLicenses(initial);
      setError(null);
    }
  }, [isOpen, journal, fetchLicenses]);

  const toggleLicense = (id) => {
    const numId = Number(id);
    setSelectedLicenses((prev) =>
      prev.includes(numId) ? prev.filter((item) => item !== numId) : [...prev, numId]
    );
  };

  const selectAll = () => {
    setSelectedLicenses(licenses.map((l) => l.id));
  };

  const deselectAll = () => {
    setSelectedLicenses([]);
  };

  const isAlreadyActive = Boolean(journal?.active);

  const handleConfirmPublish = async () => {
    if (!journal) return;
    setPublishing(true);
    setError(null);
    try {
      await journalService.publishJournal(journal.id, selectedLicenses);
      onSuccess?.(
        isAlreadyActive
          ? `Licencias de "${journal.title}" actualizadas exitosamente.`
          : `Revista "${journal.title}" publicada exitosamente.`
      );
      onClose();
    } catch (err) {
      console.error("Error publishing journal:", err);
      setError(err.message || "Error al procesar las licencias de la revista.");
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen || !journal) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isAlreadyActive
                    ? "bg-purple-100 text-purple-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isAlreadyActive ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {isAlreadyActive ? "Actualizar Licencias" : "Publicar Revista"}
                </h3>
                <p className="text-xs text-gray-500 font-medium truncate max-w-xs">
                  {journal.title} {isAlreadyActive && "· Publicada"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={publishing}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="mt-4 shrink-0">
            <p className="text-xs text-gray-600 leading-relaxed">
              {isAlreadyActive
                ? "Esta revista se encuentra activa en el repositorio. Modifique las licencias de uso asociadas; la revista permanecerá publicada con esta configuración:"
                : "Al publicar la revista, estará activa y visible en el repositorio. Seleccione las licencias de uso que aplican para esta revista:"}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* License Selection Header */}
          <div className="mt-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Licencias disponibles ({selectedLicenses.length} seleccionadas)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="text-[11px] text-[#C8102E] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Gestionar licencias</span>
            </button>
          </div>

          {/* Selection shortcuts */}
          {licenses.length > 0 && !loadingLicenses && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 shrink-0">
              <button
                type="button"
                onClick={selectAll}
                className="hover:text-gray-900 font-medium underline-offset-2 hover:underline cursor-pointer"
              >
                Seleccionar todas
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={deselectAll}
                className="hover:text-gray-900 font-medium underline-offset-2 hover:underline cursor-pointer"
              >
                Deseleccionar todas
              </button>
            </div>
          )}

          {/* Licenses List Container */}
          <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2 min-h-40 border border-gray-100 rounded-xl p-2 bg-gray-50/40">
            {loadingLicenses ? (
              <div className="py-10 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#C8102E]" />
                <span>Cargando licencias...</span>
              </div>
            ) : licenses.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs space-y-2">
                <p>No hay licencias registradas en el catálogo.</p>
                <button
                  type="button"
                  onClick={() => setManagerOpen(true)}
                  className="text-xs font-semibold text-[#C8102E] underline cursor-pointer"
                >
                  Crear una nueva licencia ahora
                </button>
              </div>
            ) : (
              licenses.map((lic) => {
                const isSelected = selectedLicenses.includes(lic.id);
                return (
                  <div
                    key={lic.id}
                    onClick={() => toggleLicense(lic.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-purple-50/80 border-purple-300 text-gray-900 font-semibold shadow-2xs"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <span className="truncate pr-2">{lic.name}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isSelected
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={publishing}
              className="rounded-xl border-gray-300 text-gray-700 text-xs px-4 h-9 hover:bg-gray-50 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPublish}
              disabled={publishing}
              className={`rounded-xl text-white text-xs px-5 h-9 font-medium flex items-center gap-1.5 cursor-pointer ${
                isAlreadyActive
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {publishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isAlreadyActive ? "Guardando..." : "Publicando..."}</span>
                </>
              ) : isAlreadyActive ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Licencias</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Publicación</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-modal to manage licenses if opened */}
      <LicenseManagerModal
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        onLicensesUpdated={fetchLicenses}
      />
    </>
  );
}
