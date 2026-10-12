import AdminLayout from "@/shared/layouts/AdminLayout";
import AccountsGateway from "@/shared/components/AccountsGateway";

export default function AdminRouteLayout({ children }) {
  return <AccountsGateway><AdminLayout>{children}</AdminLayout></AccountsGateway>;
}
