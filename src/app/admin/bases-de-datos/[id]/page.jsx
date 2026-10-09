"use client";

import React, { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import DatabaseDetail from "@/features/admin/databases/components/DatabaseDetail";
import DatabaseForm from "@/features/admin/databases/components/DatabaseForm";
import { platformService } from "@/features/admin/databases/services/platformService";

export default function AdminDatabaseDetailPage({ params, searchParams }) {
  // Safe unwrap of params for Next.js 15/16 App Router
  const resolvedParams = params && typeof params.then === "function" ? use(params) : params;
  const platformId = resolvedParams?.id;

  const searchParamsObj = useSearchParams();
  const isEditMode = searchParamsObj.get("edit") === "true";

  const [platformData, setPlatformData] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode && platformId) {
      setLoading(true);
      platformService
        .getPlatformById(platformId)
        .then((data) => {
          setPlatformData(data);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEditMode, platformId]);

  if (isEditMode) {
    if (loading) {
      return (
        <div className="p-16 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium">Cargando datos de la plataforma para edición...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center text-rose-600 bg-white rounded-2xl border border-gray-200">
          <p className="font-semibold text-sm">Error al cargar para edición: {error}</p>
        </div>
      );
    }

    return <DatabaseForm initialData={platformData} isEdit={true} />;
  }

  return <DatabaseDetail platformId={platformId} />;
}