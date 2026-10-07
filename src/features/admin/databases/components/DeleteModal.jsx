"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteModal({ isOpen, onClose, onConfirm, platformName, isDeleting }) {
  const [explanation, setExplanation] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(explanation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Confirmar eliminación</h3>
              <p className="text-xs text-gray-500 font-medium">Plataforma: {platformName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Esta acción realizará una eliminación lógica de la plataforma. Si existen relaciones activas, por favor proporcione un motivo.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="explanation" className="text-xs font-semibold text-gray-700">
              Explicación / Motivo de eliminación
            </Label>
            <textarea
              id="explanation"
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Ej.: Plataforma retirada por finalización de suscripción institucional..."
              className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-xl border-gray-200 text-gray-700 text-xs hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isDeleting}
              className="rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white text-xs font-medium px-4"
            >
              {isDeleting ? "Eliminando..." : "Eliminar Plataforma"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
