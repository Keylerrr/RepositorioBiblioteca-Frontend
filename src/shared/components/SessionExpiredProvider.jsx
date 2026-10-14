"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearSessionExpiredNotice,
  SESSION_EXPIRED_EVENT,
} from "@/shared/utils/sessionExpiration";

export default function SessionExpiredProvider({ children }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("Las credenciales de autenticación ya no son válidas.");

  useEffect(() => {
    function handleSessionExpired(event) {
      const detail = event.detail || {};
      setReason(detail.reason || "Las credenciales de autenticación ya no son válidas.");
      setIsOpen(true);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  function handleLoginAgain() {
    clearSessionExpiredNotice();
    setIsOpen(false);

    if (window.location.pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }

  return (
    <>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1F242E]/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FDECEC] text-xl font-bold text-[#C8102E]">
                !
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1F242E]">Tu sesión ha caducado</h2>
                <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                  Por seguridad, debes iniciar sesión nuevamente para continuar utilizando la plataforma.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-[#F3D7D7] bg-[#FFF5F5] px-3 py-2 text-sm text-[#7F1D1D]">
              <span className="font-semibold">Motivo:</span> {reason}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleLoginAgain}
                className="rounded-md bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#A80D27]"
              >
                Iniciar sesión nuevamente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
