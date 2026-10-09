"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, X, CheckCircle2 } from "lucide-react";

export default function LinkCheckModal({ isOpen, onClose, onConfirm, platform, isChecking }) {
  const [url, setUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(url ? url.trim() : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Verificar URL Pública</h3>
              <p className="text-xs text-gray-500 font-medium">{platform?.name}</p>
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
            Registra una nueva URL pública para verificar o deja el campo vacío para reutilizar y revalidar la última URL registrada en el backend.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="public_url" className="text-xs font-semibold text-gray-700">
              URL Pública de Acceso
            </Label>
            <Input
              id="public_url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.scielo.org (opcional si ya existe)"
              className="rounded-xl border-gray-200 text-xs h-10 focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
            />
            <p className="text-[11px] text-gray-400">
              * Nota: `base_api_url` es para la API de cosecha. La URL pública se registra en LinkCheckLog.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isChecking}
              className="rounded-xl border-gray-200 text-gray-700 text-xs hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isChecking}
              className="rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white text-xs font-medium px-4 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isChecking ? "Verificando..." : "Ejecutar Check"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
