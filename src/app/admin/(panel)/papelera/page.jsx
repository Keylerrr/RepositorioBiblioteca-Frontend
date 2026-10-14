import ArchivedAdministrativeUsers from "@/shared/components/ArchivedAdministrativeUsers";

export default async function TrashPage({ searchParams }) {
  const { vista } = await searchParams;
  return <ArchivedAdministrativeUsers key={vista === "usuarios" ? "usuarios" : "papelera"} overview={vista !== "usuarios"} />;
}
