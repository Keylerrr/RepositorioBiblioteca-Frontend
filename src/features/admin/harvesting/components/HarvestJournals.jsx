"use client";

import { useEffect, useState } from "react";
import AdminTable from "@/shared/components/AdminTable";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import Notice from "@/shared/components/Notice";
import { formatDate, getHarvest, getHarvestJournals } from "@/features/admin/harvesting/harvesting";
import { capitalizeWords } from "@/shared/utils/formatText";

const columns = [
  { key: "title", label: "REVISTA", width: "34%", render: (row) => <span className="break-words font-semibold">{capitalizeWords(row.title)}</span> },
  { key: "issn", label: "ISSN", width: "14%", muted: true, render: (row) => row.issn || "—" },
  { key: "created_at", label: "FECHA DE REGISTRO", width: "22%", muted: true, render: (row) => row.created_at ? formatDate(row.created_at) : "—" },
  { key: "status", label: "ESTADO", width: "14%", render: (row) => (
    <Badge state={row.active ? "success" : row.validated_at ? "info" : "warning"}>
      {row.active ? "Activa" : row.validated_at ? "Desactivada" : "Pendiente"}
    </Badge>
  ) },
  { key: "actions", label: "ACCIONES", width: "16%", render: (row) => (
    <Button href={`/admin/revistas/${row.id}`} variant="quiet" size="small" aria-label={`Ver detalle de ${row.title}`}>
      Ver detalle
    </Button>
  ) },
];

export default function HarvestJournals({ harvestId }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ harvest: null, data: null, loading: true, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [harvest, data] = await Promise.all([
          getHarvest(harvestId, controller.signal),
          getHarvestJournals(harvestId, page, controller.signal),
        ]);
        if (!controller.signal.aborted) setState({ harvest, data, loading: false, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setState((current) => ({ ...current, data: null, loading: false, error: error.message }));
      }
    }
    load();
    return () => controller.abort();
  }, [harvestId, page, revision]);

  function changePage(nextPage) {
    setState((current) => ({ ...current, data: null, loading: true, error: "" }));
    setPage(nextPage);
  }

  function refresh() {
    setState((current) => ({ ...current, data: null, loading: true, error: "" }));
    setRevision((current) => current + 1);
  }

  const { harvest, data, loading, error } = state;
  const totalItems = data?.total_items ?? data?.count ?? data?.results.length ?? 0;
  const totalPages = Math.max(1, data?.total_pages ?? Math.ceil(totalItems / 10));

  return (
    <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-5 text-sm leading-[22px] text-[#171A1F]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.3px] min-[541px]:text-[32px] min-[541px]:leading-10">Revistas de la cosecha #{harvestId}</h1>
        <Button href="/admin/cosecha" variant="quiet">Volver a cosechas</Button>
      </div>
      {harvest && <p className="text-[#68707C]">{harvest.platform_name} · Inicio: {formatDate(harvest.started_at)}</p>}
      <p className="text-[#68707C]">Revistas nuevas creadas por esta ejecución. Las revistas actualizadas no se incluyen.</p>
      <section className="flex flex-col gap-3.5 rounded-xl border border-[#DCE0E5] bg-white p-5" aria-labelledby="harvest-journals-title" aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="harvest-journals-title" className="text-[21px] leading-7 font-semibold">Revistas cosechadas</h2>
          <Button variant="quiet" size="small" disabled={loading} onClick={refresh}>Actualizar</Button>
        </div>
        {loading && <Notice live>Cargando revistas…</Notice>}
        {error && <Notice variant="error" live>
          <p>{error}</p>
          <Button variant="quiet" size="small" className="mt-3" onClick={refresh}>Reintentar</Button>
        </Notice>}
        {data && (data.results.length ? (
          <AdminTable caption={`Revistas nuevas de la cosecha ${harvestId}`} columns={columns} rows={data.results} />
        ) : <Notice live>Esta cosecha no agregó revistas nuevas.</Notice>)}
        {data && <div className="flex flex-wrap items-center justify-between gap-3 text-[#68707C]">
          <p>Mostrando {data.results.length} de {totalItems} revistas</p>
          {totalPages > 1 && <nav aria-label="Paginación de revistas cosechadas" className="flex flex-wrap items-center gap-3">
            <Button variant="quiet" size="small" disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</Button>
            <span>Página {page} de {totalPages}</span>
            <Button variant="quiet" size="small" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>Siguiente</Button>
          </nav>}
        </div>}
      </section>
    </div>
  );
}
