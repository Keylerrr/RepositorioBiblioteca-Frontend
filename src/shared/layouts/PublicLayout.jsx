import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import PublicNavigation from "@/shared/layouts/PublicNavigation";

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="relative z-20 bg-wine-dark text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3 py-2 sm:gap-4">
            <Image
              src="/brand/ufps_logo.png"
              alt="Universidad Francisco de Paula Santander"
              width={200}
              height={157}
              priority
              className="h-[34px] w-[44px] object-contain sm:h-[44px] sm:w-[56px]"
            />
            <span aria-hidden="true" className="h-8 w-px bg-white/45 sm:h-10" />
            <Image
              src="/brand/biblioteca_logo.png"
              alt="Biblioteca Eduardo Cote Lamus"
              width={1024}
              height={1024}
              priority
              className="h-[76px] w-[76px] object-contain sm:h-[92px] sm:w-[92px]"
            />
          </div>
          <Suspense fallback={null}>
            <PublicNavigation />
          </Suspense>
        </div>
      </header>
      {children}
      <footer className="public-footer mt-auto border-t-[3px] border-primary text-footer-text">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <Image
              src="/brand/ufps_logo.png"
              alt="Universidad Francisco de Paula Santander"
              width={200}
              height={157}
              className="h-[38px] w-[48px] object-contain"
            />
            <Image
              src="/brand/biblioteca_logo.png"
              alt="Biblioteca Eduardo Cote Lamus"
              width={1024}
              height={1024}
              className="h-[72px] w-[72px] object-contain"
            />
          </div>
          <Link
            href="/directorio"
            className="rounded-sm text-sm font-semibold text-footer-text transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Ir al directorio →
          </Link>
        </div>
      </footer>
    </div>
  );
}