"use client";

export default function ResourceError({ retry }) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-16 sm:px-8">
      <section aria-live="polite" className="mx-auto max-w-xl border border-[#e3b9b8] bg-[#fff7f6] px-6 py-10 text-center" role="alert">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a02f39]">Servicio no disponible</p>
        <h1 className="mt-3 font-serif text-3xl text-[#26372b]">No pudimos cargar este recurso</h1>
        <p className="mt-3 text-sm leading-6 text-[#704d4e]">Verifica que el backend esté activo y vuelve a intentarlo.</p>
        <button className="mt-6 min-h-11 rounded-md bg-[#385b3b] px-5 text-sm font-semibold text-white hover:bg-[#29472e]" onClick={() => retry()} type="button">Reintentar</button>
      </section>
    </main>
  );
}