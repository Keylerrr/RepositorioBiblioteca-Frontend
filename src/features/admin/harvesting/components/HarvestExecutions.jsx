"use client";

import { useRef, useState } from "react";
import AdminTable from "@/shared/components/AdminTable";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import Notice from "@/shared/components/Notice";
import { formatDate, pauseHarvest, resumeHarvest } from "@/features/admin/harvesting/harvesting";

const STATES = {
  pending: { label: "Pendiente", badge: "info" },
  running: { label: "En ejecución", badge: "info" },
  pausing: { label: "Pausando", badge: "warning" },
  paused: { label: "Pausada", badge: "warning" },
  completed: { label: "Completada", badge: "success" },
  failed: { label: "Fallida", badge: "error" },
  cancelled: { label: "Cancelada", badge: "warning" },
};

export default function HarvestExecutions({ rows, onRefresh, busy = false, caption = "Ejecuciones recientes de cosecha" }) {
  const [action, setAction] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const requestPending = useRef(false);

  async function control(row, resume) {
    if (busy || requestPending.current) return;
    requestPending.current = true;
    setAction({ id: row.id, resume });
    setFeedback(null);
    try {
      const harvest = await (resume ? resumeHarvest(row.id) : pauseHarvest(row.id));
      setFeedback({
        variant: "neutral",
        message: harvest.state === "pausing"
          ? `Pausa solicitada para ${row.platform_name}. Terminará la página en curso antes de quedar pausada.`
          : resume ? `Reanudación procesada para ${row.platform_name}. Consulta su estado actualizado.` : `Cosecha de ${row.platform_name} pausada.`,
      });
    } catch (error) {
      setFeedback({ variant: "error", message: error.message });
    } finally {
      // Also refresh on errors: a timeout or incompatible state can follow a server-side change.
      onRefresh();
      requestPending.current = false;
      setAction(null);
    }
  }

  const columns = [
    { key: "platform_name", label: "FUENTE", width: "17%" },
    { key: "state", label: "ESTADO", width: "17%", render: (row) => {
      const state = STATES[row.state] || { label: row.state, badge: "info" };
      return <Badge state={row.state === "completed" && row.records_failed > 0 ? "warning" : state.badge}>{state.label}</Badge>;
    } },
    { key: "started_at", label: "INICIO", width: "20%", muted: true, render: (row) => formatDate(row.started_at) },
    { key: "result", label: "RESULTADO", width: "30%", render: (row) => (
      <div>
        <span>{row.records_added} nuevas · {row.records_updated} actualizadas · {row.records_failed} fallidas</span>
        {row.error_message && <p className="mt-1 break-words text-xs text-[#820A1F]">{row.error_message}</p>}
      </div>
    ) },
    { key: "actions", label: "ACCIONES", width: "16%", render: (row) => {
      if (row.state === "pausing") return <span className="text-xs text-[#68707C]">Esperando pausa…</span>;
      const resume = row.state === "paused";
      if (!resume && row.state !== "pending" && row.state !== "running") return <span className="text-[#68707C]">—</span>;
      const pending = action?.id === row.id;
      return <Button variant="quiet" size="small" disabled={busy || Boolean(action)} aria-label={`${resume ? "Reanudar" : "Pausar"} cosecha de ${row.platform_name} (#${row.id})`} onClick={() => control(row, resume)}>
        {pending ? action.resume ? "Reanudando…" : "Solicitando…" : resume ? "Reanudar" : "Pausar"}
      </Button>;
    } },
  ];

  return (
    <>
      {feedback && <Notice variant={feedback.variant} live>{feedback.message}</Notice>}
      {rows.length ? <AdminTable caption={caption} columns={columns} rows={rows} /> : <Notice>Todavía no hay ejecuciones de cosecha.</Notice>}
      <p className="text-xs text-[#68707C]">La pausa espera a que termine la página en curso. Reanudar continúa desde el punto guardado; el tiempo pausado no consume el límite de ejecución.</p>
    </>
  );
}
