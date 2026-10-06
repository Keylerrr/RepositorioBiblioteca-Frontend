import Link from "next/link";

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#19251c]">
      <header className="border-b border-[#e1e5dc] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 text-[#19251c]">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#b52e39] font-serif text-xl text-white">B</span>
            <span className="text-sm font-bold leading-tight">Biblioteca<span className="block font-normal text-[#68736a]">Portal de recursos</span></span>
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-5 text-sm font-medium text-[#435246]">
            <Link className="hover:text-[#b52e39]" href="/directorio">Directorio</Link>
            <Link className="hidden rounded-md bg-[#f3f5ed] px-3 py-2 text-[#385b3b] hover:bg-[#e7ecdf] sm:inline-flex" href="/directorio">Recursos académicos</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-auto border-t border-[#e1e5dc] bg-[#f8f9f5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-[#68736a] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>Portal de recursos académicos · Biblioteca</span>
          <Link href="/directorio" className="font-semibold text-[#385b3b] hover:text-[#b52e39]">Ir al directorio →</Link>
        </div>
      </footer>
    </div>
  );
}