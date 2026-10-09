"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AdminTable from "@/shared/components/AdminTable";
import Button from "@/shared/components/Button";
import MetricCard from "@/shared/components/MetricCard";
import Notice from "@/shared/components/Notice";
import { formatDate, getHarvests, getHarvestSourceCount, getUpcomingSchedules, runDueSchedules } from "@/features/admin/harvesting/harvesting";
import HarvestExecutions from "./HarvestExecutions";

const FREQUENCIES = { once: "Única", daily: "Diaria", weekly: "Semanal", monthly: "Mensual" };
const SCHEDULE_PAGE_SIZE = 10;

const scheduleColumns = [
  { key: "platforms", label: "FUENTES", width: "30%", render: (row) => row.platform_names?.join(", ") || row.platforms.map((id) => `Plataforma ${id}`).join(", ") },
  { key: "frequency", label: "FRECUENCIA", width: "15%", render: (row) => FREQUENCIES[row.frequency] || row.frequency },
  { key: "start_date", label: "FECHA INICIAL", width: "25%", muted: true, render: (row) => formatDate(row.start_date) },
  { key: "limits", label: "LÍMITES POR FUENTE", width: "30%", render: (row) => [
    row.max_quantity == null ? null : `${row.max_quantity} revistas`,
    row.stop_after_minutes == null ? null : `${row.stop_after_minutes} minutos`,
  ].filter(Boolean).join(" · ") },
];

function useHarvestData(loadData, intervalMs = null) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [revision, setRevision] = useState(0);
  const loadRef = useRef(null);
  const pollingInterval = typeof intervalMs === "function" ? intervalMs(state.data) : intervalMs;

  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;
    async function load() {
      if (fetching) return;
      fetching = true;
      try {
        const data = await loadData(controller.signal);
        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: "" });
        }
      } catch (error) {
        if (!controller.signal.aborted) setState((current) => ({ ...current, loading: false, error: error.message }));
      } finally {
        fetching = false;
      }
    }
    loadRef.current = load;
    load();
    return () => { controller.abort(); loadRef.current = null; };
  }, [loadData, revision]);

  // Changing the polling cadence must not restart the request or fetch immediately.
  useEffect(() => {
    if (pollingInterval === null) return;
    const timer = setInterval(() => { if (!document.hidden) loadRef.current?.(); }, pollingInterval);
    return () => clearInterval(timer);
  }, [pollingInterval]);

  const refresh = useCallback(() => {
    setState((current) => ({ ...current, loading: true }));
    setRevision((current) => current + 1);
  }, []);

  return { ...state, refresh };
}

export default function HarvestDashboard() {
  const [page, setPage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const [executing, setExecuting] = useState(false);
  const [executionFeedback, setExecutionFeedback] = useState(null);
  const requestPending = useRef(false);

  const loadHarvests = useCallback((signal) => getHarvests(page, signal), [page]);
  const harvests = useHarvestData(loadHarvests, (data) => (
    executing || data?.results.some((row) => ["pending", "running", "pausing"].includes(row.state)) ? 5000 : 30000
  ));

  const loadSchedules = useCallback(async (signal) => {
    const schedules = await getUpcomingSchedules(signal);
    if (!signal.aborted) {
      setSchedulePage((current) => Math.min(current, Math.max(1, Math.ceil(schedules.length / SCHEDULE_PAGE_SIZE))));
    }
    return schedules;
  }, []);
  const upcomingSchedules = useHarvestData(loadSchedules, 30000);
  const sources = useHarvestData(getHarvestSourceCount);

  function refresh() {
    harvests.refresh();
    upcomingSchedules.refresh();
    sources.refresh();
  }

  async function executeDue() {
    if (requestPending.current || harvests.loading || upcomingSchedules.loading) return;
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
      harvests.refresh();
      upcomingSchedules.refresh();
    }
  }

  function changePage(nextPage, schedules = false) {
    if (schedules) setSchedulePage(nextPage);
    else {
      setPage(nextPage);
      harvests.refresh();
    }
  }

  const runs = harvests.data?.results || [];
  const scheduleCount = upcomingSchedules.data?.length || 0;
  const schedulePages = Math.max(1, Math.ceil(scheduleCount / SCHEDULE_PAGE_SIZE));
  const schedules = upcomingSchedules.data?.slice((schedulePage - 1) * SCHEDULE_PAGE_SIZE, schedulePage * SCHEDULE_PAGE_SIZE) || [];
  const totals = runs.reduce((sum, row) => ({
    added: sum.added + row.records_added, updated: sum.updated + row.records_updated, failed: sum.failed + row.records_failed,
  }), { added: 0, updated: 0, failed: 0 });
  const showHarvests = Boolean(harvests.data);

  return (
    <div className="flex-1 bg-[#F7F8FA] font-sans text-sm leading-[22px] text-[#171A1F]">
      <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-5">
        <div className="flex min-h-12 flex-col items-start justify-between gap-5 min-[901px]:flex-row min-[901px]:items-center">
          <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.3px] min-[541px]:text-[32px] min-[541px]:leading-10">Cosecha y actualización automática</h1>
          <Button href="/admin/revistas?estado=pendiente" variant="quiet" className="w-[220px] shrink-0">Ver revistas pendientes</Button>
        </div>
        <p className="text-sm leading-[22px] text-[#68707C] min-[541px]:text-base min-[541px]:leading-[26px]">Supervisa conectores, ejecuciones y registros modificados.</p>
        <div className="grid grid-cols-2 gap-3 min-[541px]:gap-4 min-[901px]:grid-cols-4">
          <MetricCard value={sources.data ?? "—"} label="Fuentes habilitadas para cosecha" />
          <MetricCard value={showHarvests ? totals.added + totals.updated + totals.failed : "—"} label="Registros contabilizados" />
          <MetricCard value={showHarvests ? totals.updated : "—"} label="Actualizados" />
          <MetricCard value={showHarvests ? totals.failed : "—"} label="Registros fallidos" />
        </div>
        <p className="text-xs text-[#68707C]">Los indicadores de registros corresponden a las ejecuciones de esta página. Fechas en America/Bogota. Ejecuciones actualizadas cada 30 segundos; cada 5 segundos durante ejecuciones activas. Programaciones actualizadas cada 30 segundos.</p>
        {sources.error && <Notice variant="error" live>Fuentes habilitadas para cosecha: {sources.error}</Notice>}
        <section className="flex min-h-[330px] flex-col gap-3.5 rounded-xl border border-[#DCE0E5] bg-white p-5" aria-labelledby="runs-title" aria-busy={harvests.loading}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="runs-title" className="text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8">Ejecuciones recientes</h2>
            <Button variant="quiet" size="small" disabled={harvests.loading || upcomingSchedules.loading || sources.loading} onClick={refresh}>Actualizar</Button>
          </div>
          {harvests.loading && <Notice live>Cargando ejecuciones…</Notice>}
          {harvests.error && <Notice variant="error" live>{harvests.error}</Notice>}
          {showHarvests && <HarvestExecutions rows={runs} onRefresh={harvests.refresh} busy={harvests.loading || Boolean(harvests.error)} />}
          {showHarvests && harvests.data.total_pages > 1 && <div className="flex flex-wrap items-center gap-3">
            <Button variant="quiet" size="small" disabled={harvests.loading || page <= 1} onClick={() => changePage(page - 1)}>Anterior</Button>
            <span>Página {page} de {harvests.data.total_pages} · {harvests.data.total_items} ejecuciones</span>
            <Button variant="quiet" size="small" disabled={harvests.loading || page >= harvests.data.total_pages} onClick={() => changePage(page + 1)}>Siguiente</Button>
          </div>}
          <Button href="/admin/cosecha/nueva" className="mt-auto w-[220px] self-start">Nueva cosecha</Button>
        </section>
        <section className="flex flex-col gap-3.5 rounded-xl border border-[#DCE0E5] bg-white p-5" aria-labelledby="schedules-title" aria-busy={upcomingSchedules.loading}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="schedules-title" className="text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8">Programaciones</h2>
            <Button size="small" disabled={harvests.loading || upcomingSchedules.loading || executing} onClick={executeDue}>{executing ? "Ejecutando…" : "Ejecutar cosechas manualmente"}</Button>
          </div>
          <p className="text-xs text-[#68707C]">Se muestran las programaciones únicas que todavía no se han lanzado y las recurrentes para sus próximas ejecuciones.</p>
          <p className="text-xs text-[#68707C]">Inicia ahora todas las programaciones activas cuya fecha ya venció, incluidas las de otras páginas. Las programaciones futuras conservan su fecha.</p>
          {executionFeedback && <Notice variant={executionFeedback.variant} live>{executionFeedback.message}</Notice>}
          {upcomingSchedules.loading && <Notice live>Cargando programaciones…</Notice>}
          {upcomingSchedules.error && <Notice variant="error" live>{upcomingSchedules.error}</Notice>}
          {upcomingSchedules.data && (schedules.length ? <AdminTable caption="Programaciones de cosecha pendientes y recurrentes" columns={scheduleColumns} rows={schedules} /> : <Notice>No hay programaciones pendientes de cosecha.</Notice>)}
          {upcomingSchedules.data && schedulePages > 1 && <div className="flex flex-wrap items-center gap-3">
            <Button variant="quiet" size="small" disabled={upcomingSchedules.loading || schedulePage <= 1} onClick={() => changePage(schedulePage - 1, true)}>Anterior</Button>
            <span>Página {schedulePage} de {schedulePages} · {scheduleCount} programaciones</span>
            <Button variant="quiet" size="small" disabled={upcomingSchedules.loading || schedulePage >= schedulePages} onClick={() => changePage(schedulePage + 1, true)}>Siguiente</Button>
          </div>}
        </section>
      </div>
    </div>
  );
}
