"use client";

export default function ResourceError({ retry }) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-16 sm:px-8">
      <section aria-live="polite" className="mx-auto max-w-xl border border-[#e3b9b8] bg-[#fff7f6] px-6 py-10 text-center" role="alert">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a02f39]">Servicio no disponible</p>
        <h1 className="mt-3 text-3xl font-bold text-[#1f1a1a]">No pudimos cargar este recurso</h1>
        <p className="mt-3 text-sm leading-6 text-[#5c5252]">Verifica que el backend esté activo y vuelve a intentarlo.</p>
        <button className="mt-6 min-h-11 rounded-md bg-[#a3141c] px-5 text-sm font-semibold text-white transition hover:bg-[#8a1018] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]" onClick={() => retry()} type="button">Reintentar</button>
      </section>
    </main>
  );
}