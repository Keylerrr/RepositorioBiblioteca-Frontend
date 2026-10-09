"use client";

import { useEffect, useState } from "react";
import Button from "@/shared/components/Button";
import Notice from "@/shared/components/Notice";
import { getScheduleHarvests } from "@/features/admin/harvesting/harvesting";
import HarvestExecutions from "./HarvestExecutions";

export default function HarvestScheduleRuns({ scheduleId, revision, busy }) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;
    async function load() {
      if (fetching) return;
      fetching = true;
      try {
        const harvests = await getScheduleHarvests(scheduleId, controller.signal);
        if (!controller.signal.aborted) {
          setRows(harvests);
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
    const timer = setInterval(() => { if (!document.hidden) load(); }, 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [scheduleId, revision, refreshCount]);

  function refresh() {
    setLoading(true);
    setRefreshCount((current) => current + 1);
  }

  return (
    <section className="flex flex-col gap-3.5 rounded-xl border border-[#DCE0E5] bg-white p-5" aria-labelledby="created-runs-title" aria-busy={loading || busy}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="created-runs-title" className="text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8">Ejecuciones de la programación #{scheduleId}</h2>
        <Button variant="quiet" size="small" disabled={loading} onClick={refresh}>Actualizar ejecuciones</Button>
      </div>
      <p className="text-xs text-[#68707C]">Estado actualizado cada 5 segundos. Aquí se muestran únicamente las ejecuciones de esta programación.</p>
      {loading && <Notice live>Cargando ejecuciones…</Notice>}
      {error && <Notice variant="error" live>{error}</Notice>}
      {rows && <HarvestExecutions rows={rows} onRefresh={refresh} busy={loading || Boolean(error)} caption={`Ejecuciones de la programación ${scheduleId}`} />}
    </section>
  );
}
