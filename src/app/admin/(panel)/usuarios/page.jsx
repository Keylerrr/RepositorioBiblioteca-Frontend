import AdministrativeUsers from "@/shared/components/AdministrativeUsers";
import AdministrativeUserForm from "@/shared/components/AdministrativeUserForm";
import UserPermissions from "@/shared/components/UserPermissions";

export default async function UsersPage({ searchParams }) {
  const { vista, usuario } = await searchParams;
  if (vista === "crear") return <AdministrativeUserForm />;
  if (vista === "editar" && typeof usuario === "string" && /^\d+$/.test(usuario)) {
    return <AdministrativeUserForm key={usuario} userId={usuario} />;
  }
  if (vista === "permisos" && typeof usuario === "string" && /^\d+$/.test(usuario)) {
    return <UserPermissions key={usuario} userId={usuario} />;
  }
  return <AdministrativeUsers />;
}
