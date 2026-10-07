"use client";

import React from "react";
import Link from "next/link";
import ApprovalActions from "@/features/admin/journals/components/ApprovalActions";
import { BookOpen, Plus, Clock } from "lucide-react";

export default function AdminRevistasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Revistas</h1>
          <p className="text-xs text-gray-500 mt-1">Módulo administrativo preparado para gestión de revistas institucionales.</p>
        </div>
        <button className="bg-[#C8102E] opacity-50 cursor-not-allowed text-white font-medium text-sm rounded-lg px-4 py-2.5 flex items-center gap-2 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>+ Nueva revista</span>
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-[#EFEFEF]/60 p-1 rounded-xl inline-flex items-center gap-1 border border-gray-200/50">
        <Link href="/admin/bases-de-datos">
          <button className="text-gray-500 hover:text-gray-800 font-medium text-xs px-5 py-2 rounded-lg transition-all hover:bg-white/50">
            Bases de datos
          </button>
        </Link>
        <button className="bg-white text-[#C8102E] font-semibold text-xs px-5 py-2 rounded-lg shadow-xs transition-all border border-gray-200/60">
          Revistas
        </button>
      </div>

      {/* Prepared Architecture Placeholder Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Módulo de Revistas Preparado</h2>
        <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
          La arquitectura de carpetas y componentes (`src/features/admin/journals`) ha sido estructurada correctamente para la posterior implementación de este módulo.
        </p>

        <div className="pt-4 max-w-md mx-auto text-left">
          <ApprovalActions status="PENDIENTE" />
        </div>
      </div>
    </div>
  );
}