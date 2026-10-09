"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import Notice from "@/shared/components/Notice";
import { buildSchedule, createSchedule, formatDate, getHarvestSources, getPlatforms, nextBogotaDate, prepareImmediateSchedule } from "@/features/admin/harvesting/harvesting";
import HarvestSourceOption from "./HarvestSourceOption";
import HarvestScheduleRuns from "./HarvestScheduleRuns";

const frequencies = [
  { value: "daily", label: "Diaria" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
];
const panelClasses = "flex flex-col gap-3 rounded-xl border border-[#DCE0E5] bg-white p-5";
const headingClasses = "text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8";
const radioClasses = "size-[13px] accent-[#A90D27] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary";

export default function HarvestForm() {
  const [sources, setSources] = useState([]);
  const [platformId, setPlatformId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sourceError, setSourceError] = useState("");
  const [revision, setRevision] = useState(0);
  const [limit, setLimit] = useState("200");
  const [minutes, setMinutes] = useState("30");
  const [mode, setMode] = useState("scheduled");
  const [startDate, setStartDate] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [executionFeedback, setExecutionFeedback] = useState(null);
  const [canRetryPreparation, setCanRetryPreparation] = useState(false);
  const [runsRevision, setRunsRevision] = useState(0);
  const requestPending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const platforms = await getPlatforms(controller.signal);
        if (!controller.signal.aborted) {
          const available = getHarvestSources(platforms);
          setSources(available);
          setPlatformId((current) => available.some((item) => String(item.id) === current) ? current : String(available[0]?.id || ""));
          setStartDate((current) => current || nextBogotaDate());
          setSourceError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) setSourceError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [revision]);

  async function prepare(schedule) {
    setExecutionFeedback(null);
    setCanRetryPreparation(false);
    try {
      setCreated(await prepareImmediateSchedule(schedule));
      setExecutionFeedback({ variant: "neutral", message: "Programación lista. Pulsa Actualizar ejecuciones para ejecutar las programaciones vencidas y consultar su estado." });
    } catch (error) {
      setExecutionFeedback({ variant: "error", message: `La programación quedó guardada, pero no se pudo ajustar su fecha de inicio. ${error.message}` });
      setCanRetryPreparation(true);
    } finally {
      setRunsRevision((current) => current + 1);
    }
  }

  async function retryPreparation() {
    if (requestPending.current || !created) return;
    requestPending.current = true;
    setSaving(true);
    try {
      await prepare(created);
    } finally {
      requestPending.current = false;
      setSaving(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (requestPending.current || created || loading || sourceError) return;
    setError("");
    try {
      const payload = buildSchedule({ platformId, limit, minutes, mode, startDate, frequency });
      requestPending.current = true;
      setSaving(true);
      const schedule = await createSchedule(payload);
      setCreated(schedule);
      if (mode === "now") await prepare(schedule);
    } catch (error) {
      setError(error.message);
    } finally {
      requestPending.current = false;
      setSaving(false);
    }
  }

  const selectedSource = sources.find((item) => String(item.id) === platformId);

  return (
    <div className="flex-1 bg-[#F7F8FA] font-sans text-sm leading-[22px] text-[#171A1F]">
      <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-5">
        <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.3px] min-[541px]:text-[32px] min-[541px]:leading-10">Nueva cosecha de revistas</h1>
        <p className="text-sm leading-[22px] text-[#68707C] min-[541px]:text-base min-[541px]:leading-[26px]">Selecciona una base de datos de origen y configura su cosecha. Podrás consultar los resultados en las ejecuciones.</p>
        <form className="flex flex-col gap-5" onSubmit={submit} onChange={() => setError("")} aria-busy={saving}>
          <fieldset disabled={saving || Boolean(created) || loading || Boolean(sourceError)} className="flex min-w-0 flex-col gap-5">
            <section className={panelClasses} aria-labelledby="source-title">
              <h2 id="source-title" className={headingClasses}>Base de datos a cosechar</h2>
              {loading && <Notice live>Cargando plataformas…</Notice>}
              {sourceError && <Notice variant="error" live>{sourceError}</Notice>}
              {!loading && !sourceError && !sources.length && <Notice>No hay bases de datos habilitadas para cosecha.</Notice>}
              <div className="grid grid-cols-1 gap-3 min-[541px]:grid-cols-2 min-[901px]:grid-cols-4" role="radiogroup" aria-labelledby="source-title">
                {sources.map((item) => <HarvestSourceOption key={item.id} source={item.name} value={String(item.id)} description="Habilitada para cosecha" checked={platformId === String(item.id)} onChange={() => setPlatformId(String(item.id))} />)}
              </div>
              {sources.length > 0 && <p className="text-xs text-[#68707C]">Se muestran únicamente bases de datos habilitadas para cosecha.</p>}
            </section>
            <section className={panelClasses} aria-labelledby="limits-title">
              <h2 id="limits-title" className={headingClasses}>Límites de ejecución</h2>
              <div className="grid grid-cols-1 gap-4 min-[541px]:grid-cols-2">
                <FormField id="harvest-limit" label="Límite máximo de revistas" type="number" min="1" step="1" value={limit} onChange={(event) => setLimit(event.target.value)} suffix="revistas" />
                <FormField id="harvest-minutes" label="Límite de tiempo" type="number" min="1" step="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} suffix="minutos" />
              </div>
              <p className="text-xs text-[#68707C]">Indica al menos un límite. Si completas ambos, la cosecha se detiene al alcanzar el primero.</p>
            </section>
            <section className={panelClasses} aria-labelledby="schedule-title">
              <h2 id="schedule-title" className={headingClasses}>Programación</h2>
              <div className="flex flex-wrap gap-[18px]" role="radiogroup" aria-labelledby="schedule-title">
                <label className={`flex cursor-pointer items-center gap-[5px] ${mode === "now" ? "text-[#A90D27]" : "text-[#68707C]"}`}><input className={radioClasses} type="radio" name="mode" value="now" checked={mode === "now"} onChange={() => setMode("now")} />Ejecutar una vez ahora</label>
                <label className={`flex cursor-pointer items-center gap-[5px] ${mode === "scheduled" ? "text-[#A90D27]" : "text-[#68707C]"}`}><input className={radioClasses} type="radio" name="mode" value="scheduled" checked={mode === "scheduled"} onChange={() => setMode("scheduled")} />Programar cosecha</label>
              </div>
              <div className="grid grid-cols-1 gap-4 min-[901px]:grid-cols-3">
                <FormField id="harvest-start" label="Fecha y hora inicial" type="datetime-local" required={mode === "scheduled"} disabled={mode === "now"} value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                <FormField id="harvest-frequency" label="Frecuencia" options={frequencies} disabled={mode === "now"} value={frequency} onChange={(event) => setFrequency(event.target.value)} />
                <FormField id="harvest-timezone" label="Zona horaria" value="America/Bogota" readOnly />
              </div>
            </section>
          </fieldset>
          {sourceError && <Button variant="quiet" className="self-start" onClick={() => { setLoading(true); setRevision((current) => current + 1); }}>Reintentar carga</Button>}
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/admin/cosecha" variant="quiet" className="w-full min-w-[140px] min-[541px]:w-auto">{created ? "Ver cosechas" : "Cancelar"}</Button>
            {!created && <Button type="submit" disabled={loading || saving || Boolean(sourceError) || !selectedSource} className="w-full min-w-[210px] min-[541px]:w-auto">{saving ? "Guardando…" : mode === "scheduled" ? "Programar cosecha" : "Guardar cosecha"}</Button>}
            {created && canRetryPreparation && <Button disabled={saving} onClick={retryPreparation}>{saving ? "Preparando…" : "Reintentar preparación"}</Button>}
            {created && <Button disabled={saving} onClick={() => { setCreated(null); setExecutionFeedback(null); setCanRetryPreparation(false); setStartDate(nextBogotaDate()); }} className="w-full min-[541px]:w-auto">Crear otra cosecha</Button>}
          </div>
          {error && <Notice variant="error" live>{error}</Notice>}
          {created && <Notice variant="success" live>Programación #{created.id} guardada. Inicio: {formatDate(created.start_date)} (America/Bogota). {created.frequency === "once" ? "Consulta abajo el estado de la ejecución." : "El backend ejecutará la cosecha en la fecha programada."} Guardar la programación no significa que la cosecha haya terminado.</Notice>}
          {created && saving && <Notice live>Preparando la programación…</Notice>}
          {executionFeedback && <Notice variant={executionFeedback.variant} live>{executionFeedback.message}</Notice>}
        </form>
        {created?.frequency === "once" && <HarvestScheduleRuns key={created.id} scheduleId={created.id} revision={runsRevision} busy={saving || canRetryPreparation} />}
      </div>
    </div>
  );
}
