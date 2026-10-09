"use client";

import React, { use } from "react";
import JournalDetail from "@/features/admin/journals/components/JournalDetail";

export default function AdminJournalDetailPage({ params }) {
  const resolvedParams = params && typeof params.then === "function" ? use(params) : params;
  const journalId = resolvedParams?.id;

  return <JournalDetail journalId={journalId} />;
}
