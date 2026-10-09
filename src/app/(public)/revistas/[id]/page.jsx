import { notFound } from "next/navigation";
import ResourceDetail from "@/features/public/detail/components/ResourceDetail";
import { getById } from "@/shared/services/journalService";

export default async function JournalDetailPage({ params }) {
  const { id } = await params;
  const journal = await getById(id);
  if (!journal) notFound();
  return <ResourceDetail resource={journal} type="journal" />;
}