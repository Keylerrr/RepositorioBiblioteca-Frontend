import Link from "next/link";

export default function ResourceCard({ resource, type }) {
  const isDatabase = type === "database";
  const detailPath = isDatabase ? `/bases-de-datos/${resource.id}` : `/revistas/${resource.id}`;

  return (
    <article className="flex h-full flex-col border border-[#e7dfd9] bg-white p-5 transition hover:border-[#c9a45c] hover:shadow-[0_8px_24px_rgba(54,35,28,0.07)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md text-sm font-bold ${isDatabase ? "bg-[#f8eeee] text-[#7f1218]" : "bg-[#f4eee8] text-[#7f1218]"}`} aria-hidden="true">
          {isDatabase ? "BD" : "R"}
        </span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-[#5c5252]">{isDatabase ? "Base de datos" : "Revista"}</span>
      </div>
      <h2 className="text-2xl font-bold leading-tight text-[#1f1a1a]">{resource.name}</h2>
      <p className="mt-2 text-sm text-[#5c5252]">{resource.institution}</p>
      <p className="mt-1 text-xs text-[#5c5252]">{resource.country}</p>
      <p className="mt-4 line-clamp-2 flex-1 text-sm leading-6 text-[#5c5252]">{resource.description || "Consulta la cobertura y el acceso disponibles."}</p>
      <div className="mt-6 border-t border-[#e7dfd9] pt-4">
        <Link className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[#a3141c] px-4 text-sm font-semibold text-white transition hover:bg-[#8a1018] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]" href={detailPath}>
          {isDatabase ? "Ver base de datos" : "Ver información"}
          <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </div>
    </article>
  );
}