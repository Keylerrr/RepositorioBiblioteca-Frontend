"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function ApprovalActions({ journalId, status, onApprove, onReject }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200/80">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
        <Clock className="w-4 h-4 text-amber-500" />
        <span>Flujo de Aprobación de Revistas</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject && onReject(journalId)}
          className="rounded-lg text-xs text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1"
        >
          <XCircle className="w-3.5 h-3.5" />
          Rechazar
        </Button>

        <Button
          size="sm"
          onClick={() => onApprove && onApprove(journalId)}
          className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Aprobar
        </Button>
      </div>
    </div>
  );
}
