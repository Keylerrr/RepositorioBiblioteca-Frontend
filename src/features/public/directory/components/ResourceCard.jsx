import Link from "next/link";

export default function ResourceCard({ resource, type }) {
  const isDatabase = type === "database";
  const detailPath = isDatabase ? `/bases-de-datos/${resource.id}` : `/revistas/${resource.id}`;

  return (
    <article className="flex h-full flex-col border border-[#e0e5dc] bg-white p-5 transition hover:border-[#a8b9a2] hover:shadow-[0_8px_24px_rgba(36,59,39,0.07)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md text-sm font-bold ${isDatabase ? "bg-[#f7e9e8] text-[#a02f39]" : "bg-[#eaf0e5] text-[#42634a]"}`} aria-hidden="true">
          {isDatabase ? "BD" : "R"}
        </span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-[#778278]">{isDatabase ? "Base de datos" : "Revista"}</span>
      </div>
      <h2 className="font-serif text-2xl leading-tight text-[#1d2a20]">{resource.name}</h2>
      <p className="mt-2 text-sm text-[#617064]">{resource.institution}</p>
      <p className="mt-1 text-xs text-[#899289]">{resource.country}</p>
      <p className="mt-4 line-clamp-2 flex-1 text-sm leading-6 text-[#58645a]">{resource.description || "Consulta la cobertura y el acceso disponibles."}</p>
      <div className="mt-6 border-t border-[#edf0ea] pt-4">
        <Link className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-[#385b3b] px-4 text-sm font-semibold text-white transition hover:bg-[#29472e]" href={detailPath}>
          {isDatabase ? "Ver base de datos" : "Ver información"}
          <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </div>
    </article>
  );
}