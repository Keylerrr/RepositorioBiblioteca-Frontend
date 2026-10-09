import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import HomeSearch from "@/features/public/home/components/HomeSearch";

const collectionCardClass =
  "group rounded-lg border border-[#e7dfd9] bg-white p-5 transition hover:border-[#a3141c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]";

export default function HomePage() {
  return (
    <PublicLayout>
      <main className="flex-1">
        <section className="bg-[#faf7f4]">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-[#1f1a1a] sm:text-5xl lg:text-6xl">
                Conocimiento para <span className="text-[#a3141c]">llegar más lejos.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#5c5252] sm:text-lg">
                Explora recursos académicos, revistas y bases de datos para acompañar tu investigación.
              </p>
              <HomeSearch />
              <Link
                href="/directorio"
                className="mt-5 inline-flex rounded-sm text-sm font-semibold text-[#a3141c] underline decoration-[#c9a45c] underline-offset-4 hover:text-[#8a1018] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a3141c]"
              >
                Explorar todo el directorio <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </div>
            <div className="relative isolate flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl bg-[#7f1218] p-8 text-white shadow-[0_20px_50px_rgba(68,13,16,0.18)] sm:min-h-[340px] lg:min-h-[420px]">
              <svg
                aria-hidden="true"
                className="absolute inset-0 -z-10 h-full w-full text-[#a74449]"
                viewBox="0 0 480 420"
                preserveAspectRatio="xMidYMid slice"
                fill="none"
              >
                <defs>
                  <pattern id="ufps-greca" width="72" height="72" patternUnits="userSpaceOnUse">
                    <path
                      d="M4 4h18v18h18v18H22v18H4V40h18V22H4zm36 0h18v18h18v18H58v18H40V40h18V22H40z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </pattern>
                </defs>
                <rect width="480" height="420" fill="url(#ufps-greca)" opacity="0.42" />
              </svg>
              <p className="max-w-sm text-center text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Ideas que encuentran su fuente.
              </p>
            </div>
          </div>
        </section>
        <section aria-label="Colecciones" className="mx-auto grid max-w-7xl gap-4 px-5 pb-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:pb-16">
          <Link
            href="/directorio?tipo=bases"
            className={collectionCardClass}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 text-[#a3141c]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
            </svg>
            <span className="mt-4 block text-xs font-bold uppercase tracking-widest text-[#a3141c]">01 / Colección</span>
            <h2 className="mt-2 text-xl font-bold text-[#1f1a1a] group-hover:text-[#a3141c]">Bases de datos</h2>
            <p className="mt-2 text-sm leading-6 text-[#5c5252]">Fuentes especializadas para tu trabajo académico.</p>
          </Link>
          <Link
            href="/directorio?tipo=revistas"
            className={collectionCardClass}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 text-[#a3141c]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M5 3.5h14v17H5zM8 7h8M8 10h8M8 13h6M8 17h8" />
            </svg>
            <span className="mt-4 block text-xs font-bold uppercase tracking-widest text-[#a3141c]">02 / Colección</span>
            <h2 className="mt-2 text-xl font-bold text-[#1f1a1a] group-hover:text-[#a3141c]">Revistas</h2>
            <p className="mt-2 text-sm leading-6 text-[#5c5252]">Publicaciones para mantenerte al día.</p>
          </Link>
          <div className="rounded-lg border border-[#e7dfd9] bg-white p-5 sm:col-span-2 lg:col-span-1">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 text-[#c9a45c]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 5.5c3.2-.9 6.2-.5 9 1.5v13c-2.8-2-5.8-2.4-9-1.5zM21 5.5c-3.2-.9-6.2-.5-9 1.5v13c2.8-2 5.8-2.4 9-1.5z" />
            </svg>
            <span className="mt-4 block text-xs font-bold uppercase tracking-widest text-[#5c5252]">Encuentra tu próximo recurso</span>
            <p className="mt-2 text-xl font-bold leading-snug text-[#1f1a1a]">Una buena búsqueda abre caminos.</p>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}