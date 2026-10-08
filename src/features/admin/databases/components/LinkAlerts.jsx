"use client";

import { useEffect, useRef, useState } from "react";
import AdminTable from "@/shared/components/AdminTable";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import FormField from "@/shared/components/FormField";
import Notice from "@/shared/components/Notice";
import { checkPlatformLink, formatDate, getLatestLinkChecks, getLinkChecks, getPlatforms } from "@/features/admin/harvesting/harvesting";

const PAGE_SIZE = 10;

function httpStatus(row) {
  return row.http_status_code == null ? "Sin respuesta HTTP" : `HTTP ${row.http_status_code}`;
}

export default function LinkAlerts() {
  const [links, setLinks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [editing, setEditing] = useState(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const requestPending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [platforms, logs] = await Promise.all([getPlatforms(controller.signal), getLinkChecks(controller.signal)]);
        if (!controller.signal.aborted) {
          const currentLinks = getLatestLinkChecks(platforms, logs);
          setLinks(currentLinks);
          setSelected((current) => current.filter((id) => currentLinks.some((item) => item.platform === id)));
          setPage((current) => Math.min(current, Math.max(1, Math.ceil(currentLinks.length / PAGE_SIZE))));
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [revision]);

  function refresh() {
    setLoading(true);
    setEditing(null);
    setRevision((current) => current + 1);
  }

  function toggleSelection(platformId) {
    setSelected((current) => current.includes(platformId) ? current.filter((id) => id !== platformId) : [...current, platformId]);
    setFeedback(null);
  }

  function editUrl(row) {
    setEditing(row);
    setUrl(row.url);
    setFeedback(null);
  }

  async function verify(rows) {
    if (requestPending.current || loading) return;
    if (!rows.length) {
      setFeedback({ variant: "neutral", text: "Selecciona al menos un recurso por su nombre antes de solicitar la revisión." });
      return;
    }
    requestPending.current = true;
    setBusy(true);
    setEditing(null);
    setFeedback(null);
    try {
      const results = await Promise.allSettled(rows.map((row) => checkPlatformLink(row.platform)));
      const succeeded = results.filter((result) => result.status === "fulfilled").length;
      const failures = results.flatMap((result, index) => result.status === "rejected" ? [`${rows[index].resource}: ${result.reason.message}`] : []);
      const details = results.flatMap((result, index) => result.status === "fulfilled" ? [`${rows[index].resource}: ${httpStatus(result.value)}`] : []);
      setFeedback({
        variant: failures.length ? "error" : "success",
        text: [`${succeeded} verificaciones registradas.`, ...details, ...failures].join(" · "),
      });
      setSelected([]);
      refresh();
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }

  async function saveUrl(event) {
    event.preventDefault();
    if (requestPending.current || loading) return;
    setFeedback(null);
    let parsed;
    try {
      parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      setFeedback({ variant: "error", text: "Introduce una URL válida que comience por http:// o https://." });
      return;
    }
    requestPending.current = true;
    setBusy(true);
    try {
      const result = await checkPlatformLink(editing.platform, parsed.href);
      setFeedback({ variant: result.is_active ? "success" : "neutral", text: `URL registrada y verificada para ${editing.resource}: ${httpStatus(result)}. ${result.is_active ? "El enlace está disponible." : "El enlace sigue sin estar disponible."}` });
      refresh();
    } catch (error) {
      setFeedback({ variant: "error", text: error.message });
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }

  const columns = [
    { key: "resource", label: "RECURSO", width: "26%", render: (row) => (
      <div>
        <button type="button" disabled={busy || loading} className={`cursor-pointer border-0 bg-transparent p-0 text-left break-words hover:text-[#A90D27] hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary disabled:cursor-default ${selected.includes(row.platform) ? "font-semibold text-[#174C92]" : "text-inherit"}`} aria-pressed={selected.includes(row.platform)} aria-label={`Seleccionar ${row.resource}`} onClick={() => toggleSelection(row.platform)}>{row.resource}</button>
        <p className="mt-1 text-xs break-all text-[#68707C]">{row.url}</p>
      </div>
    ) },
    { key: "status", label: "ESTADO HTTP", width: "17%", render: (row) => <Badge state={row.is_active ? "success" : row.fail_count >= 2 ? "error" : "warning"}>{row.is_active ? `Disponible · ${httpStatus(row)}` : httpStatus(row)}</Badge> },
    { key: "fail_count", label: "FALLOS", width: "9%" },
    { key: "last_check", label: "ÚLTIMO CHEQUEO", width: "22%", muted: true, render: (row) => formatDate(row.last_check) },
    { key: "action", label: "ACCIÓN", width: "26%", render: (row) => (
      <div className="flex flex-wrap gap-2">
        {row.http_status_code !== 404 && <Button variant="secondary" size="small" disabled={busy || loading} aria-label={`Verificar: ${row.resource}`} onClick={() => verify([row])}>Verificar</Button>}
        <Button variant="secondary" size="small" disabled={busy || loading} aria-label={`Corregir URL: ${row.resource}`} onClick={() => editUrl(row)}>Corregir URL</Button>
      </div>
    ) },
  ];
  const requiringReview = links.filter((row) => row.fail_count >= 2).length;
  const totalPages = Math.max(1, Math.ceil(links.length / PAGE_SIZE));
  const rows = links.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex-1 bg-[#F7F8FA] font-sans text-sm leading-[22px] text-[#171A1F]">
      <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.3px] min-[541px]:text-[32px] min-[541px]:leading-10">Disponibilidad de enlaces</h1>
          <Button variant="quiet" size="small" disabled={loading || busy} onClick={refresh}>Actualizar</Button>
        </div>
        {loading ? <Notice live>Cargando verificaciones de enlaces…</Notice> : error ? <Notice variant="error" live>{error}</Notice> : <Notice variant={requiringReview ? "error" : "success"} live>{requiringReview ? `${requiringReview} ${requiringReview === 1 ? "enlace requiere" : "enlaces requieren"} revisión · 2 fallos consecutivos o más` : "No hay enlaces con dos o más fallos consecutivos en su última verificación."}</Notice>}
        <div className="min-h-[300px] overflow-hidden rounded-xl border border-[#DCE0E5] bg-white" aria-busy={loading || busy}>
          {!loading && !error && (links.length ? <AdminTable caption="Disponibilidad de enlaces. Selecciona los recursos por su nombre para revisarlos." variant="alerts" columns={columns} rows={rows} rowClassName={(row) => selected.includes(row.platform) ? "bg-[#DFECFF]" : ""} /> : <p className="p-5 text-[#68707C]">Todavía no hay verificaciones de enlaces registradas.</p>)}
        </div>
        {!loading && !error && totalPages > 1 && <div className="flex flex-wrap items-center gap-3">
          <Button variant="quiet" size="small" disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page} de {totalPages}</span>
          <Button variant="quiet" size="small" disabled={page >= totalPages || busy} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>}
        <div><Button className="min-w-[260px]" disabled={loading || busy || Boolean(error) || !selected.length} onClick={() => verify(links.filter((row) => selected.includes(row.platform)))}>{busy ? "Verificando…" : "Revisar enlaces seleccionados"}</Button></div>
        <p className="text-xs leading-[18px] text-[#68707C]">Se muestra la última verificación de cada plataforma, incluidos los enlaces disponibles. Selecciona los recursos por su nombre. {selected.length > 0 && `${selected.length} ${selected.length === 1 ? "seleccionado" : "seleccionados"}.`} Fechas en America/Bogota.</p>
        {editing && (
          <form className="flex flex-col gap-5 rounded-xl border border-[#DCE0E5] bg-white p-5" onSubmit={saveUrl} aria-labelledby="correct-url-title" aria-busy={busy}>
            <h2 id="correct-url-title" className="text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8">Corregir URL · {editing.resource}</h2>
            <FormField id="resource-url" label="URL pública del recurso" type="url" placeholder="https://…" required disabled={busy} value={url} onChange={(event) => setUrl(event.target.value)} />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="quiet" disabled={busy} className="w-full min-w-[140px] min-[541px]:w-auto" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button type="submit" disabled={busy} className="w-full min-w-[210px] min-[541px]:w-auto">{busy ? "Guardando…" : "Guardar y verificar URL"}</Button>
            </div>
          </form>
        )}
        {feedback && <Notice variant={feedback.variant} live>{feedback.text}</Notice>}
      </div>
    </div>
  );
}
