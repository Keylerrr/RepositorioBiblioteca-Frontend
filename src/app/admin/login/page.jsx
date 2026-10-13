import AdminLoginForm from "@/shared/components/AdminLoginForm";
import AccountsGateway from "@/shared/components/AccountsGateway";
import AdminAuthLayout from "@/shared/layouts/AdminAuthLayout";

export default function AdminLoginPage() {
  return (
    <AccountsGateway>
      <AdminAuthLayout>
        <AdminLoginForm />
      </AdminAuthLayout>
    </AccountsGateway>
  )
}
