"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AccountFeedback from "@/shared/components/AccountFeedback";
import { LoginField } from "@/shared/components/AdminLoginForm";
import { useAccountsApi } from "@/shared/components/AccountsProvider";

export default function ForgotPasswordForm() {
  const accountsApi = useAccountsApi();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const result = await accountsApi.forgotPassword({ email: email.trim() });
      setMessage(result?.detail || "Si el correo está registrado, recibirás una contraseña provisional.");
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }

  return <Card className="w-full max-w-md rounded-2xl border-0 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <CardHeader className="space-y-3 pb-6">
      <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Recuperar contraseña</CardTitle>
      <CardDescription className="text-base text-gray-500">Ingresa tu correo institucional y te enviaremos una contraseña provisional.</CardDescription>
    </CardHeader>
    {message ? <>
      <CardContent className="space-y-5">
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">{message}</div>
        <p className="text-[13px] text-gray-500">Al iniciar sesión con la contraseña provisional se te pedirá cambiarla.</p>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Button asChild className="h-12 w-full rounded-lg bg-[#C8102E] text-[15px] font-medium text-white transition-colors hover:bg-[#A50D25]">
          <Link href="/admin/login">Volver a iniciar sesión</Link>
        </Button>
      </CardFooter>
    </> : <form onSubmit={submit} aria-busy={busy}>
      <CardContent className="space-y-5">
        {error && <AccountFeedback error={error} />}
        <fieldset disabled={busy} className="space-y-5">
          <LoginField id="forgot-email" label="Correo institucional" type="email" autoComplete="username" placeholder="usuario@ufps.edu.co" value={email} onChange={(event) => setEmail(event.target.value)} />
        </fieldset>
      </CardContent>
      <CardFooter className="flex-col gap-4 pt-2 pb-4">
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-lg bg-[#C8102E] text-[15px] font-medium text-white transition-colors hover:bg-[#A50D25]">{busy ? "Enviando…" : "Enviar contraseña provisional"}</Button>
        <Link href="/admin/login" className="text-sm font-medium text-[#C8102E] hover:underline">Volver a iniciar sesión</Link>
      </CardFooter>
    </form>}
  </Card>;
}
