import Link from "next/link";

function DetailItem({ label, children }) {
  return (
    <div className="border-b border-[#e8ece5] py-4 sm:grid sm:grid-cols-[190px_1fr] sm:gap-5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-[#788278]">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-[#344238] sm:mt-0">{children || "No especificado"}</dd>
    </div>
  );
}

export default function ResourceDetail({ resource, type, includedDatabases = [] }) {
  const isDatabase = type === "database";
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Ruta de navegación" className="text-xs text-[#738075]">
        <Link className="hover:text-[#b52e39]" href="/directorio">Directorio</Link><span className="mx-2">/</span>{isDatabase ? "Bases de datos" : "Revistas"}<span className="mx-2">/</span><span className="text-[#344238]">{resource.name}</span>
      </nav>
      <header className="mt-7 grid gap-7 border-b border-[#dfe5dc] pb-8 sm:grid-cols-[1fr_auto] sm:items-end sm:pb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#56744f]">{isDatabase ? "Base de datos" : "Revista académica"}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight text-[#19251c] sm:text-5xl">{resource.name}</h1>
          <p className="mt-3 text-sm text-[#68736a]">{resource.institution} · {resource.country}</p>
        </div>
        {resource.url && <a className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#385b3b] px-6 text-sm font-semibold text-white transition hover:bg-[#29472e]" href={resource.url} rel="noreferrer" target="_blank">
          {resource.access_label || "Abrir sitio oficial"} <span aria-hidden="true">↗</span>
        </a>}
      </header>
      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16 lg:py-10">
        <div>
          <section>
            <h2 className="font-serif text-2xl text-[#26372b]">Descripción</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#536154]">{resource.description || "La API pública no proporciona una descripción para este recurso."}</p>
          </section>
          <section className="mt-10">
            <h2 className="font-serif text-2xl text-[#26372b]">Datos técnicos</h2>
            <dl className="mt-3">
              <DetailItem label="Cobertura geográfica">{resource.geographic_coverage}</DetailItem>
              <DetailItem label="Idioma">{resource.language}</DetailItem>
              <DetailItem label="Período">{resource.coverage_period}</DetailItem>
              <DetailItem label="Tipo de material">{resource.material_type}</DetailItem>
              <DetailItem label="Licencia">{resource.license}</DetailItem>
            </dl>
          </section>
          <section className="mt-10 grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl text-[#26372b]">Identificadores</h2>
              <dl className="mt-3 divide-y divide-[#e8ece5]">
                {resource.identifiers.length ? resource.identifiers.map((identifier) => <div className="py-3" key={`${identifier.identifier_type}-${identifier.identifier_value}`}><dt className="text-xs text-[#788278]">{identifier.identifier_type}</dt><dd className="mt-1 text-sm font-medium text-[#344238]">{identifier.identifier_value}</dd></div>) : <p className="py-3 text-sm text-[#68736a]">No hay identificadores disponibles.</p>}
              </dl>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-[#26372b]">Enlaces</h2>
              <ul className="mt-3 divide-y divide-[#e8ece5]">
                {resource.links.map((link) => <li className="py-3" key={`${link.link_type}-${link.url}`}><span className="block text-xs text-[#788278]">{link.link_type}</span><a className="mt-1 inline-block break-all text-sm font-medium text-[#385b3b] underline decoration-[#a9b8a2] underline-offset-2 hover:text-[#b52e39]" href={link.url} rel="noreferrer" target="_blank">{link.url}</a></li>)}
              </ul>
            </div>
          </section>
        </div>
        <aside className="space-y-8">
          <section className="border-t-2 border-[#b52e39] pt-4">
            <h2 className="font-serif text-xl text-[#26372b]">Áreas temáticas</h2>
            <ul className="mt-3 space-y-2">
              {resource.subject_areas.map((area) => <li className="flex gap-2 text-sm text-[#536154]" key={area}><span className="text-[#b52e39]">/</span>{area}</li>)}
            </ul>
          </section>
          {!isDatabase && (
            <section className="border-t-2 border-[#597650] pt-4">
              <h2 className="font-serif text-xl text-[#26372b]">Disponible en</h2>
              <ul className="mt-3 space-y-3">
                {(includedDatabases.length ? includedDatabases : resource.platforms ?? []).map((database) => <li key={database.id}><Link className="text-sm font-semibold text-[#385b3b] underline decoration-[#a9b8a2] underline-offset-2 hover:text-[#b52e39]" href={`/bases-de-datos/${database.id}`}>{database.name}</Link><span className="mt-1 block text-xs text-[#788278]">{database.institution || database.base_api_url || "Plataforma"}</span></li>)}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}