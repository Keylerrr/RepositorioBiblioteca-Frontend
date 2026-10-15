import HarvestDashboard from "@/features/admin/harvesting/components/HarvestDashboard";
import HarvestJournals from "@/features/admin/harvesting/components/HarvestJournals";
import Button from "@/shared/components/Button";
import Notice from "@/shared/components/Notice";

export default async function HarvestPage({ searchParams }) {
  const { vista, cosecha } = await searchParams;
  if (vista === "revistas") {
    if (typeof cosecha !== "string" || !/^[1-9]\d*$/.test(cosecha)) {
      return <Notice variant="error">
        <p>Selecciona una cosecha válida para ver sus revistas.</p>
        <Button href="/admin/cosecha" variant="quiet" className="mt-3">Volver a cosechas</Button>
      </Notice>;
    }
    return <HarvestJournals key={cosecha} harvestId={cosecha} />;
  }
  return <HarvestDashboard />;
}
