"use client";

import React, { useState, useEffect, useCallback } from "react";
import { journalService } from "../services/journalService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";

export default function LicenseManagerModal({ isOpen, onClose, onLicensesUpdated }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New license input
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit license state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [updating, setUpdating] = useState(false);

  // Delete confirmation
  const [deletingLic, setDeletingLic] = useState(null);
  const [deleteExplanation, setDeleteExplanation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await journalService.getLicenses();
      setLicenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching licenses:", err);
      setError(err.message || "Error al cargar las licencias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLicenses();
      setNewName("");
      setEditingId(null);
      setDeletingLic(null);
      setError(null);
    }
  }, [isOpen, fetchLicenses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("El nombre de la licencia no puede estar vacío.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await journalService.createLicense({ name: trimmed });
      setNewName("");
      showSuccess(`Licencia "${trimmed}" creada exitosamente.`);
      await fetchLicenses();
      onLicensesUpdated?.();
    } catch (err) {
      setError(err.message || "Error al crear la licencia.");
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (lic) => {
    setEditingId(lic.id);
    setEditingName(lic.name || "");
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError("El nombre de la licencia no puede estar vacío.");
      return;
    }

    setUpdating(true);
    setError(null);
    try {
      await journalService.patchLicense(id, { name: trimmed });
      setEditingId(null);
      setEditingName("");
      showSuccess("Licencia actualizada correctamente.");
      await fetchLicenses();
      onLicensesUpdated?.();
    } catch (err) {
      setError(err.message || "Error al actualizar la licencia.");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLic) return;
    const explanation = deleteExplanation.trim();
    if (!explanation) return;
    setDeleting(true);
    setError(null);
    try {
      await journalService.deleteLicense(deletingLic.id, explanation);
      showSuccess(`Licencia "${deletingLic.name}" eliminada.`);
      setDeletingLic(null);
      setDeleteExplanation("");
      await fetchLicenses();
      onLicensesUpdated?.();
    } catch (err) {
      setError(err.message || "Error al eliminar la licencia.");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Gestionar Licencias</h3>
              <p className="text-xs text-gray-500 font-medium">
                Catálogo de licencias de uso para revistas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-700 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Create License Input */}
        <form onSubmit={handleCreate} className="mt-4 shrink-0">
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
            Nueva Licencia
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. CC BY 4.0, CC BY-NC-SA 4.0, Copyright..."
              className="text-xs h-9"
              disabled={creating}
            />
            <Button
              type="submit"
              disabled={creating || !newName.trim()}
              className="bg-[#C8102E] hover:bg-[#A50D25] text-white text-xs h-9 px-4 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Crear</span>
            </Button>
          </div>
        </form>

        {/* Licenses List */}
        <div className="mt-5 flex-1 overflow-y-auto pr-1 space-y-2 min-h-48 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wide px-2">
            <span>Nombre de la Licencia</span>
            <span>Acciones</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C8102E]" />
              <span>Cargando licencias...</span>
            </div>
          ) : licenses.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No hay licencias registradas en el catálogo. Crea una arriba.
            </div>
          ) : (
            licenses.map((lic) => {
              const isEditingThis = editingId === lic.id;
              return (
                <div
                  key={lic.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  {isEditingThis ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="text-xs h-8 bg-white flex-1"
                        autoFocus
                        disabled={updating}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(lic.id)}
                        disabled={updating || !editingName.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-2.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {updating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Guardar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={updating}
                        className="h-8 px-2.5 rounded-lg text-xs cursor-pointer"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {lic.name}
                        </span>
                        <span className="text-[10px] text-gray-400">#{lic.id}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(lic)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer"
                          title="Editar licencia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingLic(lic);
                            setDeleteExplanation("");
                          }}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all cursor-pointer"
                          title="Eliminar licencia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>{licenses.length} licencias disponibles</span>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-gray-300 text-gray-700 text-xs px-4 h-8 hover:bg-gray-50 cursor-pointer"
          >
            Listo
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Sub-Modal */}
      {deletingLic && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-bold text-gray-900 text-sm">¿Eliminar licencia?</h4>
            <p className="text-xs text-gray-600 mt-2">
              ¿Estás seguro de que deseas eliminar la licencia{" "}
              <strong>&ldquo;{deletingLic.name}&rdquo;</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-4 space-y-1.5">
              <label htmlFor="license-delete-explanation" className="text-xs font-semibold text-gray-700">
                Explicación / Motivo de eliminación
              </label>
              <textarea
                id="license-delete-explanation"
                rows={3}
                value={deleteExplanation}
                onChange={(event) => setDeleteExplanation(event.target.value)}
                required
                placeholder="Ej.: Licencia retirada por solicitud institucional..."
                className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeletingLic(null);
                  setDeleteExplanation("");
                }}
                disabled={deleting}
                className="rounded-lg text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={deleting || !deleteExplanation.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs cursor-pointer"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
