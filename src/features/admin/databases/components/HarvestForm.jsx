"use client";

import { useState } from "react";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import Notice from "@/shared/components/Notice";
import HarvestSourceOption from "./HarvestSourceOption";

const sources = [
  { source: "SciELO", description: "Revistas de América Latina" },
  { source: "DOAJ", description: "Directorio internacional" },
  { source: "Redalyc", description: "Red de revistas iberoamericanas" },
  { source: "Dialnet", description: "Producción científica hispana" },
];
const frequencies = [
  { value: "daily", label: "Diaria" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
];

const panelClasses = "flex flex-col gap-3 rounded-xl border border-[#DCE0E5] bg-white p-5";
const headingClasses = "text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8";
const radioClasses = "size-[13px] accent-[#A90D27] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary";

export default function HarvestForm() {
  const [source, setSource] = useState("SciELO");
  const [limit, setLimit] = useState("200");
  const [minutes, setMinutes] = useState("30");
  const [mode, setMode] = useState("scheduled");
  const [startDate, setStartDate] = useState("2026-09-04T02:00");
  const [frequency, setFrequency] = useState("weekly");
  const [feedback, setFeedback] = useState("");

  function submit(event) {
    event.preventDefault();
    const schedule = mode === "scheduled"
      ? `Inicio: ${startDate.replace("T", " · ")}, frecuencia ${frequencies.find((item) => item.value === frequency).label.toLowerCase()} (America/Bogota).`
      : "Ejecución única inmediata.";
    setFeedback(`Simulación: cosecha de ${source} configurada para un máximo de ${limit} revistas y ${minutes} minutos. ${schedule} La ejecución real estará disponible cuando se conecte la API.`);
  }

  return (
    <main className="min-h-screen flex-1 bg-[#F7F8FA] px-4 py-5 font-sans text-sm leading-[22px] text-[#171A1F] min-[541px]:p-6 min-[901px]:p-8">
      <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-5">
        <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.3px] min-[541px]:text-[32px] min-[541px]:leading-10">Nueva cosecha de revistas</h1>
        <p className="text-sm leading-[22px] text-[#68707C] min-[541px]:text-base min-[541px]:leading-[26px]">Selecciona una base de datos de origen. Las revistas recuperadas se enviarán a Recursos pendientes para su revisión.</p>
        <form className="flex flex-col gap-5" onSubmit={submit} onChange={() => setFeedback("")}>
          <section className={`min-h-[190px] ${panelClasses}`} aria-labelledby="source-title">
            <h2 id="source-title" className={headingClasses}>Base de datos a cosechar</h2>
            <div className="grid grid-cols-2 gap-3 min-[901px]:grid-cols-4" role="radiogroup" aria-labelledby="source-title">
              {sources.map((item) => <HarvestSourceOption key={item.source} {...item} checked={source === item.source} onChange={() => setSource(item.source)} />)}
            </div>
          </section>
          <section className={panelClasses} aria-labelledby="limits-title">
            <h2 id="limits-title" className={headingClasses}>Límites de ejecución</h2>
            <div className="grid grid-cols-1 gap-4 min-[541px]:grid-cols-2">
              <FormField id="harvest-limit" label="Límite máximo de revistas" type="number" min="1" step="1" required value={limit} onChange={(event) => setLimit(event.target.value)} suffix="revistas" />
              <FormField id="harvest-minutes" label="Límite de tiempo" type="number" min="1" step="1" required value={minutes} onChange={(event) => setMinutes(event.target.value)} suffix="minutos" />
            </div>
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
          <Notice>Se cosecharán hasta {limit || "0"} revistas desde {source} y pasarán a Pendientes.</Notice>
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/admin/cosecha" variant="quiet" className="w-full min-w-[140px] min-[541px]:w-auto">Cancelar</Button>
            <Button type="submit" className="w-full min-w-[210px] min-[541px]:w-auto">{mode === "scheduled" ? "Programar cosecha" : "Ejecutar cosecha"}</Button>
          </div>
          {feedback && <Notice variant="success" live>{feedback}</Notice>}
        </form>
      </div>
    </main>
  );
}
