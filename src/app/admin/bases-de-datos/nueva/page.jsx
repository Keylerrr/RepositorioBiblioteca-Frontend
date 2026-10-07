"use client";

import React from "react";
import DatabaseForm from "@/features/admin/databases/components/DatabaseForm";

export default function AdminNewDatabasePage() {
  return <DatabaseForm isEdit={false} />;
}