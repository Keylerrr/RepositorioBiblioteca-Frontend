import ForgotPasswordForm from "@/shared/components/ForgotPasswordForm";
import AccountsGateway from "@/shared/components/AccountsGateway";
import AdminAuthLayout from "@/shared/layouts/AdminAuthLayout";

export default function ForgotPasswordPage() {
  return (
    <AccountsGateway>
      <AdminAuthLayout>
        <ForgotPasswordForm />
      </AdminAuthLayout>
    </AccountsGateway>
  )
}
