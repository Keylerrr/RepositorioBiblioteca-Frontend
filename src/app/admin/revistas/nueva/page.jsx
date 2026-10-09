"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import JournalForm from "@/features/admin/journals/components/JournalForm";
import { journalService } from "@/features/admin/journals/services/journalService";

function NewJournalPageInner() {
  const searchParams = useSearchParams();
  const journalId = searchParams.get("id");
  const isEdit = Boolean(journalId);

  const [journalData, setJournalData] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit && journalId) {
      setLoading(true);
      journalService
        .getJournalById(journalId)
        .then((data) => {
          setJournalData(data);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEdit, journalId]);

  if (isEdit) {
    if (loading) {
      return (
        <div className="p-16 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium">Cargando datos de la revista para edición...</p>
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

    return <JournalForm initialData={journalData} isEdit={true} />;
  }

  return <JournalForm isEdit={false} />;
}

export default function NewJournalPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium">Cargando formulario de revista...</p>
        </div>
      }
    >
      <NewJournalPageInner />
    </Suspense>
  );
}
