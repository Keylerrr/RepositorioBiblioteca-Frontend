import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";

export default function HomePage() {
  return (
    <PublicLayout>
    <main className="flex-1">
      <section className="relative isolate overflow-hidden bg-[#f3f5ed]">
        <div className="absolute -right-24 -top-28 -z-10 h-96 w-96 rounded-full border-[56px] border-[#dce7d2]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#56744f]">Sistema de bibliotecas</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.03] text-[#19251c] sm:text-6xl lg:text-7xl">
              Conocimiento para <span className="italic text-[#597650]">llegar más lejos.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#536154] sm:text-lg">
              Explora recursos académicos, revistas y bases de datos para acompañar tu investigación.
            </p>
            <form action="/directorio" className="mt-9 flex max-w-2xl gap-2 rounded-lg border border-[#d8dfd4] bg-white p-2 shadow-sm">
              <label className="sr-only" htmlFor="home-search">Buscar recursos</label>
              <input id="home-search" name="q" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#19251c] outline-none placeholder:text-[#89948a]" placeholder="¿Qué estás buscando?" />
              <button className="rounded-md bg-[#b52e39] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#952530]" type="submit">Buscar</button>
            </form>
            <Link href="/directorio" className="mt-5 inline-flex text-sm font-semibold text-[#385b3b] underline decoration-[#a7b69e] underline-offset-4 hover:text-[#b52e39]">
              Explorar todo el directorio <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
          <div className="relative hidden min-h-[340px] lg:block" aria-hidden="true">
            <div className="absolute right-4 top-0 h-72 w-72 rounded-full bg-[#d7e3d0]" />
            <div className="absolute right-16 top-12 flex h-64 w-64 flex-col justify-between rounded-[48%_48%_8px_8px] bg-[#42634a] p-8 text-[#f6f5e9] shadow-xl">
              <span className="text-xs uppercase tracking-[0.16em]">Biblioteca abierta</span>
              <span className="font-serif text-4xl leading-tight">Ideas que encuentran su fuente.</span>
              <span className="text-sm text-[#d4e0d0]">Catálogo académico · 2026</span>
            </div>
            <div className="absolute bottom-0 right-0 rounded-lg border border-[#d4dbcf] bg-white px-5 py-4 shadow-md">
              <span className="block text-2xl font-semibold text-[#b52e39]">2 colecciones</span>
              <span className="text-xs text-[#647166]">para investigar y descubrir</span>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        <Link href="/directorio?tipo=bases" className="group border-t-2 border-[#b52e39] py-5">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b52e39]">01 / Colección</span>
          <h2 className="mt-3 font-serif text-2xl text-[#19251c] group-hover:text-[#b52e39]">Bases de datos</h2>
          <p className="mt-2 text-sm text-[#667168]">Fuentes especializadas para tu trabajo académico.</p>
        </Link>
        <Link href="/directorio?tipo=revistas" className="group border-t-2 border-[#597650] py-5">
          <span className="text-xs font-bold uppercase tracking-widest text-[#597650]">02 / Colección</span>
          <h2 className="mt-3 font-serif text-2xl text-[#19251c] group-hover:text-[#b52e39]">Revistas</h2>
          <p className="mt-2 text-sm text-[#667168]">Publicaciones para mantenerte al día.</p>
        </Link>
        <div className="border-t-2 border-[#d5a14a] py-5 sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#9b6f25]">Encuentra tu próximo recurso</span>
          <p className="mt-3 font-serif text-2xl text-[#19251c]">Una buena búsqueda abre caminos.</p>
        </div>
      </section>
    </main>
    </PublicLayout>
  );
}