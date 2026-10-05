"use client";

import { useState } from "react";
import AdminTable from "@/shared/components/AdminTable";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import Notice from "@/shared/components/Notice";

const alerts = [
  { id: "redalyc", resource: "Redalyc", status: "503 temporal", failures: 3, lastCheck: "Hoy · 09:20", action: "Verificar" },
  { id: "cepal", resource: "Repositorio CEPAL", status: "404 no encontrado", failures: 5, lastCheck: "Hoy · 09:18", action: "Corregir URL" },
  { id: "bdm", resource: "Biblioteca Digital Mundial", status: "Tiempo agotado", failures: 2, lastCheck: "Hoy · 09:15", action: "Reintentar" },
  { id: "clacso", resource: "CLACSO Repositorio", status: "Certificado SSL", failures: 2, lastCheck: "Ayer · 23:40", action: "Revisar" },
];

export default function LinkAlerts() {
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [editing, setEditing] = useState(null);
  const [url, setUrl] = useState("");
  const [correctedUrls, setCorrectedUrls] = useState({});

  function toggleSelection(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setFeedback("");
  }

  function handleAction(row) {
    if (row.action === "Corregir URL") {
      setEditing(row);
      setUrl(correctedUrls[row.id] || "");
      setFeedback("");
      return;
    }
    setEditing(null);
    setFeedback(`Simulación: revisión solicitada para ${row.resource}. La disponibilidad real del enlace se comprobará cuando se conecte la API.`);
  }

  function saveUrl(event) {
    event.preventDefault();
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      setFeedback("Introduce una URL válida que comience por http:// o https://.");
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      setFeedback("Introduce una URL que comience por http:// o https://.");
      return;
    }
    setCorrectedUrls((current) => ({ ...current, [editing.id]: parsed.href }));
    setFeedback(`Simulación: URL de ${editing.resource} actualizada en esta vista a ${parsed.href}. El cambio no se guarda en el servidor.`);
    setEditing(null);
  }

  const columns = [
    { key: "resource", label: "RECURSO", width: "25%", render: (row) => (
      <button type="button" className={`cursor-pointer border-0 bg-transparent p-0 text-left hover:text-[#A90D27] hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary ${selected.includes(row.id) ? "font-semibold text-[#174C92]" : "text-inherit"}`} aria-pressed={selected.includes(row.id)} aria-label={`Seleccionar ${row.resource}`} title="Seleccionar para revisión" onClick={() => toggleSelection(row.id)}>
        {row.resource}
      </button>
    ) },
    { key: "status", label: "ESTADO HTTP", width: "18%", render: (row) => <Badge state="error">{row.status}</Badge> },
    { key: "failures", label: "FALLOS", width: "11.5%" },
    { key: "lastCheck", label: "ÚLTIMO CHEQUEO", width: "21%", muted: true },
    { key: "action", label: "ACCIÓN", width: "24.5%", render: (row) => <Button variant="secondary" size="small" aria-label={`${row.action}: ${row.resource}`} onClick={() => handleAction(row)}>{row.action}</Button> },
  ];

  return (
    <main className="min-h-screen flex-1 bg-[#F7F8FA] px-4 py-5 font-sans text-sm leading-[22px] text-[#171A1F] min-[541px]:p-6 min-[901px]:p-8">
      <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-5">
        <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.3px] min-[541px]:text-[32px] min-[541px]:leading-10">Disponibilidad de enlaces</h1>
        <Notice variant="error">6 enlaces requieren revisión · 2 fallos consecutivos o más</Notice>
        <div className="min-h-[500px] overflow-hidden rounded-xl border border-[#DCE0E5] bg-white">
          <AdminTable caption="Alertas de disponibilidad. Selecciona los recursos por su nombre para revisarlos." variant="alerts" columns={columns} rows={alerts} rowClassName={(row) => selected.includes(row.id) ? "bg-[#DFECFF]" : ""} />
        </div>
        <div>
          <Button className="min-w-[260px]" onClick={() => {
            setEditing(null);
            setFeedback(selected.length
              ? `Simulación: revisión solicitada para ${selected.length} ${selected.length === 1 ? "enlace" : "enlaces"}: ${alerts.filter((row) => selected.includes(row.id)).map((row) => row.resource).join(", ")}. La comprobación real requiere la API.`
              : "Selecciona al menos un recurso por su nombre antes de solicitar la revisión.");
          }}>Revisar enlaces seleccionados</Button>
        </div>
        <p className="text-xs leading-[18px] text-[#68707C]">Selecciona los recursos por su nombre. {selected.length > 0 && `${selected.length} ${selected.length === 1 ? "seleccionado" : "seleccionados"}.`}</p>
        {editing && (
          <form className="flex flex-col gap-5 rounded-xl border border-[#DCE0E5] bg-white p-5" onSubmit={saveUrl} aria-labelledby="correct-url-title">
            <h2 id="correct-url-title" className="text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8">Corregir URL · {editing.resource}</h2>
            <FormField id="resource-url" label="URL del recurso" type="url" placeholder="https://…" required value={url} onChange={(event) => setUrl(event.target.value)} />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="quiet" className="w-full min-w-[140px] min-[541px]:w-auto" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button type="submit" className="w-full min-w-[210px] min-[541px]:w-auto">Guardar URL</Button>
            </div>
          </form>
        )}
        {feedback && <Notice live>{feedback}</Notice>}
      </div>
    </main>
  );
}
