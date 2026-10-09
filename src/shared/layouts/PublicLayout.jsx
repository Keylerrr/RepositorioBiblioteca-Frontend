import Image from "next/image";
import Link from "next/link";
import { Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";
import PublicNavigation from "@/shared/layouts/PublicNavigation";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function PublicLayout({ children }) {
  return (
    <div className={`${sourceSans.className} flex min-h-screen flex-col bg-[#faf7f4] text-[#1f1a1a]`}>
      <header className="relative z-20 bg-[#7f1218] text-white">
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
      <footer
        className="mt-auto border-t-[3px] border-[#a3141c] bg-[#212121] text-[#d4d4d4]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 0.8px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      >
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
            className="rounded-sm text-sm font-semibold text-[#d4d4d4] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Ir al directorio →
          </Link>
        </div>
      </footer>
    </div>
  );
}