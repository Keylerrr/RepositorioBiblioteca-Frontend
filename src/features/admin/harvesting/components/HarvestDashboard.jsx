"use client";

import { useEffect, useRef, useState } from "react";
import AdminTable from "@/shared/components/AdminTable";
import Button from "@/shared/components/Button";
import MetricCard from "@/shared/components/MetricCard";
import Notice from "@/shared/components/Notice";
import { formatDate, getHarvests, getHarvestSources, getPlatforms, getSchedules, runDueSchedules } from "@/features/admin/harvesting/harvesting";
import HarvestExecutions from "./HarvestExecutions";

const FREQUENCIES = { once: "Única", daily: "Diaria", weekly: "Semanal", monthly: "Mensual" };

const scheduleColumns = [
  { key: "platforms", label: "FUENTES", width: "30%", render: (row) => row.platform_names?.join(", ") || row.platforms.map((id) => `Plataforma ${id}`).join(", ") },
  { key: "frequency", label: "FRECUENCIA", width: "15%", render: (row) => FREQUENCIES[row.frequency] || row.frequency },
  { key: "start_date", label: "FECHA INICIAL", width: "25%", muted: true, render: (row) => formatDate(row.start_date) },
  { key: "limits", label: "LÍMITES POR FUENTE", width: "30%", render: (row) => [
    row.max_quantity == null ? null : `${row.max_quantity} revistas`,
    row.stop_after_minutes == null ? null : `${row.stop_after_minutes} minutos`,
  ].filter(Boolean).join(" · ") },
];

export default function HarvestDashboard() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [executing, setExecuting] = useState(false);
  const [executionFeedback, setExecutionFeedback] = useState(null);
  const requestPending = useRef(false);
  const active = executing || Boolean(data?.harvests.results.some((row) => ["pending", "running", "pausing"].includes(row.state)));

  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;
    async function load() {
      if (fetching) return;
      fetching = true;
      try {
        const [harvests, schedules, platforms] = await Promise.all([
          getHarvests(page, controller.signal), getSchedules(schedulePage, controller.signal), getPlatforms(controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setData({ harvests, schedules, platforms });
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        fetching = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, active ? 5000 : 30000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [page, schedulePage, revision, active]);

  function refresh() {
    setLoading(true);
    setRevision((current) => current + 1);
  }

  async function executeDue() {
    if (requestPending.current || loading) return;
    requestPending.current = true;
    setExecuting(true);
    setExecutionFeedback(null);
    try {
      await runDueSchedules();
      setExecutionFeedback({ variant: "neutral", message: "Solicitud de ejecución procesada. Consulta el estado actualizado en las ejecuciones." });
    } catch (error) {
      setExecutionFeedback({ variant: "error", message: error.message });
    } finally {
      requestPending.current = false;
      setExecuting(false);
      // The result may be uncertain after a timeout; always read the current state.
      setPage(1);
      refresh();
    }
  }

  function changePage(nextPage, schedules = false) {
    setLoading(true);
    if (schedules) setSchedulePage(nextPage);
    else setPage(nextPage);
  }

  const runs = data?.harvests.results || [];
  const totals = runs.reduce((sum, row) => ({
    added: sum.added + row.records_added, updated: sum.updated + row.records_updated, failed: sum.failed + row.records_failed,
  }), { added: 0, updated: 0, failed: 0 });
  const showData = Boolean(data);

  return (
    <div className="flex-1 bg-[#F7F8FA] font-sans text-sm leading-[22px] text-[#171A1F]">
      <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-5">
        <div className="flex min-h-12 flex-col items-start justify-between gap-5 min-[901px]:flex-row min-[901px]:items-center">
          <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.3px] min-[541px]:text-[32px] min-[541px]:leading-10">Cosecha y actualización automática</h1>
          <Button href="/admin/revistas?estado=pendiente" variant="quiet" className="w-[220px] shrink-0">Ver revistas pendientes</Button>
        </div>
        <p className="text-sm leading-[22px] text-[#68707C] min-[541px]:text-base min-[541px]:leading-[26px]">Supervisa conectores, ejecuciones y registros modificados.</p>
        <div className="grid grid-cols-2 gap-3 min-[541px]:gap-4 min-[901px]:grid-cols-4">
          <MetricCard value={showData ? getHarvestSources(data.platforms).length : "—"} label="Fuentes habilitadas para cosecha" />
          <MetricCard value={showData ? totals.added + totals.updated + totals.failed : "—"} label="Registros contabilizados" />
          <MetricCard value={showData ? totals.updated : "—"} label="Actualizados" />
          <MetricCard value={showData ? totals.failed : "—"} label="Registros fallidos" />
        </div>
        <p className="text-xs text-[#68707C]">Los indicadores de registros corresponden a las ejecuciones de esta página. Fechas en America/Bogota. Actualización automática cada 30 segundos; cada 5 segundos durante ejecuciones activas.</p>
        {loading && <Notice live>Cargando cosechas y programaciones…</Notice>}
        {error && <Notice variant="error" live>{error}</Notice>}
        <section className="flex min-h-[330px] flex-col gap-3.5 rounded-xl border border-[#DCE0E5] bg-white p-5" aria-labelledby="runs-title" aria-busy={loading}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="runs-title" className="text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8">Ejecuciones recientes</h2>
            <Button variant="quiet" size="small" disabled={loading} onClick={refresh}>Actualizar</Button>
          </div>
          {showData && <HarvestExecutions rows={runs} onRefresh={refresh} busy={loading || Boolean(error)} />}
          {showData && data.harvests.total_pages > 1 && <div className="flex flex-wrap items-center gap-3">
            <Button variant="quiet" size="small" disabled={loading || page <= 1} onClick={() => changePage(page - 1)}>Anterior</Button>
            <span>Página {page} de {data.harvests.total_pages} · {data.harvests.total_items} ejecuciones</span>
            <Button variant="quiet" size="small" disabled={loading || page >= data.harvests.total_pages} onClick={() => changePage(page + 1)}>Siguiente</Button>
          </div>}
          <Button href="/admin/cosecha/nueva" className="mt-auto w-[220px] self-start">Nueva cosecha</Button>
        </section>
        <section className="flex flex-col gap-3.5 rounded-xl border border-[#DCE0E5] bg-white p-5" aria-labelledby="schedules-title" aria-busy={loading}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="schedules-title" className="text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8">Programaciones</h2>
            <Button size="small" disabled={loading || executing} onClick={executeDue}>{executing ? "Ejecutando…" : "Ejecutar programaciones vencidas"}</Button>
          </div>
          <p className="text-xs text-[#68707C]">Inicia ahora todas las programaciones activas cuya fecha ya venció, incluidas las de otras páginas. Las programaciones futuras conservan su fecha.</p>
          {executionFeedback && <Notice variant={executionFeedback.variant} live>{executionFeedback.message}</Notice>}
          {showData && (data.schedules.results.length ? <AdminTable caption="Programaciones de cosecha" columns={scheduleColumns} rows={data.schedules.results} /> : <Notice>Todavía no hay programaciones de cosecha.</Notice>)}
          {showData && data.schedules.total_pages > 1 && <div className="flex flex-wrap items-center gap-3">
            <Button variant="quiet" size="small" disabled={loading || schedulePage <= 1} onClick={() => changePage(schedulePage - 1, true)}>Anterior</Button>
            <span>Página {schedulePage} de {data.schedules.total_pages} · {data.schedules.total_items} programaciones</span>
            <Button variant="quiet" size="small" disabled={loading || schedulePage >= data.schedules.total_pages} onClick={() => changePage(schedulePage + 1, true)}>Siguiente</Button>
          </div>}
        </section>
      </div>
    </div>
  );
}
