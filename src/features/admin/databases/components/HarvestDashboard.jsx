import AdminTable from "@/shared/components/AdminTable";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import MetricCard from "@/shared/components/MetricCard";

const runs = [
  { id: "opendoar", source: "OpenDOAR", status: "Completada", state: "success", lastRun: "02 sep · 08:00", result: "64 revistas procesadas · 7 nuevas" },
  { id: "doaj", source: "DOAJ API", status: "Completada", state: "success", lastRun: "02 sep · 06:00", result: "52 revistas procesadas · 9 nuevas" },
  { id: "la-referencia", source: "LA Referencia", status: "Con observaciones", state: "warning", lastRun: "01 sep · 23:30", result: "12 revistas procesadas · 2 requieren revisión" },
];

const columns = [
  { key: "source", label: "FUENTE", width: "21%" },
  { key: "status", label: "ESTADO", width: "18%", render: (row) => <Badge state={row.state}>{row.status}</Badge> },
  { key: "lastRun", label: "ÚLTIMA EJECUCIÓN", width: "18%", muted: true },
  { key: "result", label: "RESULTADO", width: "43%" },
];

export default function HarvestDashboard() {
  return (
    <main className="min-h-screen flex-1 bg-[#F7F8FA] px-4 py-5 font-sans text-sm leading-[22px] text-[#171A1F] min-[541px]:p-6 min-[901px]:p-8">
      <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-5">
        <div className="flex min-h-12 flex-col items-start justify-between gap-5 min-[901px]:flex-row min-[901px]:items-center">
          <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.3px] min-[541px]:text-[32px] min-[541px]:leading-10">Cosecha y actualización automática</h1>
          <Button href="/admin/revistas?estado=pendiente" variant="quiet" className="w-[220px] shrink-0">Ver revistas pendientes</Button>
        </div>
        <p className="text-sm leading-[22px] text-[#68707C] min-[541px]:text-base min-[541px]:leading-[26px]">Supervisa conectores, ejecuciones y registros modificados.</p>
        <div className="grid grid-cols-2 gap-3 min-[541px]:gap-4 min-[901px]:grid-cols-4">
          <MetricCard value="3" label="Fuentes conectadas" />
          <MetricCard value="128" label="Registros procesados" />
          <MetricCard value="18" label="Actualizados" />
          <MetricCard value="2" label="Con observaciones" />
        </div>
        <section className="flex min-h-[410px] flex-col gap-3.5 rounded-xl border border-[#DCE0E5] bg-white p-5" aria-labelledby="runs-title">
          <h2 id="runs-title" className="text-[21px] leading-7 font-semibold min-[541px]:text-2xl min-[541px]:leading-8">Ejecuciones recientes</h2>
          <AdminTable caption="Ejecuciones recientes de cosecha" columns={columns} rows={runs} />
          <Button href="/admin/cosecha/nueva" className="mt-auto w-[220px] self-start">Nueva cosecha</Button>
        </section>
      </div>
    </main>
  );
}
