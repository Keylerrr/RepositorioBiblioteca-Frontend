export default function ResourceLoading() {
  return (
    <main aria-label="Cargando ficha del recurso" className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-12" role="status">
      <div className="h-3 w-32 animate-pulse bg-[#e7dfd9]" />
      <div className="mt-8 h-12 max-w-xl animate-pulse bg-[#e7dfd9]" />
      <div className="mt-4 h-4 max-w-sm animate-pulse bg-[#efedeb]" />
      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="h-7 w-40 animate-pulse bg-[#e7dfd9]" />
          <div className="h-24 animate-pulse bg-[#efedeb]" />
          <div className="h-40 animate-pulse bg-[#efedeb]" />
        </div>
        <div className="h-48 animate-pulse bg-[#efedeb]" />
      </div>
      <span className="sr-only">Cargando ficha...</span>
    </main>
  );
}