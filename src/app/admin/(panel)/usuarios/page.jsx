import AdministrativeUsers from "@/shared/components/AdministrativeUsers";
import AdministrativeUserForm from "@/shared/components/AdministrativeUserForm";
import UserPermissions from "@/shared/components/UserPermissions";

import PermissionPresets from "@/shared/components/PermissionPresets";
import PermissionPresetForm from "@/shared/components/PermissionPresetForm";

export default async function UsersPage({ searchParams }) {
  const { vista, usuario, preset, resultado } = await searchParams;
  if (vista === "presets") return <PermissionPresets result={resultado} />;
  if (vista === "crear-preset") return <PermissionPresetForm />;
  if (vista === "editar-preset" && typeof preset === "string" && /^\d+$/.test(preset)) return <PermissionPresetForm key={preset} presetId={preset} />;
  if (vista === "crear") return <AdministrativeUserForm />;
  if (vista === "editar" && typeof usuario === "string" && /^\d+$/.test(usuario)) {
    return <AdministrativeUserForm key={usuario} userId={usuario} />;
  }
  if (vista === "permisos" && typeof usuario === "string" && /^\d+$/.test(usuario)) {
    return <UserPermissions key={usuario} userId={usuario} />;
  }
  return <AdministrativeUsers />;
}
