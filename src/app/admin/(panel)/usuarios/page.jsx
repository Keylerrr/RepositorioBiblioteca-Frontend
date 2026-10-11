import AdministrativeUsers from "@/shared/components/AdministrativeUsers";
import AdministrativeUserForm from "@/shared/components/AdministrativeUserForm";

export default async function UsersPage({ searchParams }) {
  const { vista } = await searchParams;
  if (vista === "crear") return <AdministrativeUserForm />;
  return <AdministrativeUsers />;
}
