"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/directorio?tipo=bases", label: "Bases de datos", tipo: "bases" },
  { href: "/directorio?tipo=revistas", label: "Revistas", tipo: "revistas" },
];

export default function PublicNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls="public-navigation"
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-10 w-10 place-items-center rounded-sm text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {isOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      <nav
        id="public-navigation"
        aria-label="Navegación principal"
        className={`${isOpen ? "block" : "hidden"} absolute inset-x-0 top-full bg-wine-dark px-5 pb-4 lg:static lg:block lg:bg-transparent lg:p-0`}
      >
        <ul className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-7">
          {links.map(({ href, label, tipo }) => {
            const isActive = tipo
              ? pathname === "/directorio" && searchParams.get("tipo") === tipo
              : pathname === "/";

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    isActive
                      ? "border-sand text-white"
                      : "border-transparent text-white/85 hover:border-white/60 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
