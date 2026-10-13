import Link from "next/link";
import Button from "@/shared/components/Button";

export default function AccountFeedback({ error, retry, sessionRequired = false }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p>{sessionRequired ? "Inicia sesión con una cuenta autorizada para acceder a la administración." : error.message || error}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {sessionRequired && <Link className="font-semibold underline" href="/admin/login">Iniciar sesión</Link>}
        {retry && <Button size="small" variant="outline" onClick={retry}>Reintentar</Button>}
      </div>
    </div>
  );
}
