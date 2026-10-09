import { notFound } from "next/navigation";
import ResourceDetail from "@/features/public/detail/components/ResourceDetail";
import { getById } from "@/shared/services/databaseService";

export default async function DatabaseDetailPage({ params }) {
  const { id } = await params;
  const database = await getById(id);
  if (!database) notFound();
  return <ResourceDetail resource={database} type="database" />;
}