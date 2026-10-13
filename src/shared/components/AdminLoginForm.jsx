"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AccountFeedback from "@/shared/components/AccountFeedback";
import { useAccountsApi } from "@/shared/components/AccountsProvider";

export function LoginField({ id, label, ...props }) {
  return <div className="space-y-2 rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400">
    <Label htmlFor={id} className="text-[11px] font-medium tracking-wider text-gray-500 uppercase">{label}</Label>
    <Input id={id} required className="h-7 border-0 p-0 text-base shadow-none placeholder:text-gray-400 focus-visible:ring-0" {...props} />
  </div>;
}

export default function AdminLoginForm() {
  const accountsApi = useAccountsApi();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    accountsApi.me(controller.signal).then((user) => {
      if (user.force_password_change) {
        setEmail(user.email);
        setMustChange(true);
      }
    }).catch(() => {});
    return () => controller.abort();
  }, [accountsApi]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (mustChange && newPassword !== confirmation) {
      setError(new Error("Las contraseñas nuevas no coinciden."));
      return;
    }
    setBusy(true);
    try {
      if (mustChange) {
        await accountsApi.changePassword({ current_password: password, new_password: newPassword });
        setPassword("");
        setNewPassword("");
        setConfirmation("");
        router.replace("/admin/usuarios");
        router.refresh();
      } else {
        const result = await accountsApi.login({ email: email.trim(), password });
        if (result.must_change_password || result.user?.force_password_change) {
          setMustChange(true);
        } else {
          setPassword("");
          router.replace("/admin/usuarios");
          router.refresh();
        }
      }
    } catch (error) {
      setError(error.status === 401 ? new Error("El correo o la contraseña son incorrectos.") : error);
    } finally {
      setBusy(false);
    }
  }

  return <Card className="w-full max-w-md rounded-2xl border-0 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <CardHeader className="space-y-3 pb-6">
      <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">{mustChange ? "Cambiar contraseña" : "Iniciar sesión"}</CardTitle>
      <CardDescription className="text-base text-gray-500">{mustChange ? "Cambia tu contraseña provisional antes de continuar con la administración." : "Ingresa con las credenciales administrativas asignadas por la biblioteca."}</CardDescription>
    </CardHeader>
    <form onSubmit={submit} aria-busy={busy}>
      <CardContent className="space-y-5">
        {error && <AccountFeedback error={error} />}
        <fieldset disabled={busy} className="space-y-5">
          {!mustChange && <LoginField id="login-email" label="Correo institucional" type="email" autoComplete="username" placeholder="usuario@ufps.edu.co" value={email} onChange={(event) => setEmail(event.target.value)} />}
          <LoginField id="login-password" label={mustChange ? "Contraseña actual o provisional" : "Contraseña"} type="password" autoComplete="current-password" placeholder="••••••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
          {mustChange && <>
            <LoginField id="new-password" label="Nueva contraseña" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <LoginField id="confirm-password" label="Confirmar nueva contraseña" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </>}
        </fieldset>
        {!mustChange && <div className="flex justify-end">
          <Link href="/admin/recuperar-contrasena" className="text-sm font-medium text-[#C8102E] hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>}
        <p className="pt-1 text-[13px] text-gray-500">{mustChange ? "Usa al menos 12 caracteres. Evita claves comunes, solo numéricas o similares a tus datos personales." : "Usa tu correo institucional y la contraseña asignada."}</p>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-lg bg-[#C8102E] text-[15px] font-medium text-white transition-colors hover:bg-[#A50D25]">{busy ? "Procesando…" : mustChange ? "Guardar contraseña" : "Iniciar sesión"}</Button>
      </CardFooter>
    </form>
  </Card>;
}
