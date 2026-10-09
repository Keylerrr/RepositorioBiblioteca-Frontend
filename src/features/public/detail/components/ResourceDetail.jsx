import Link from "next/link";
import { getSafeUrl } from "@/shared/utils/getSafeUrl";

const detailTitleClass = "text-2xl font-bold text-[#1f1a1a]";
const detailTextClass = "text-sm leading-7 text-[#5c5252]";

function ResourceLink({ label, url }) {
  return (
    <li className="py-3">
      <span className="block text-xs text-[#5c5252]">{label}</span>
      <a
        className="mt-1 block max-w-full truncate text-sm font-medium text-[#7f1218] underline decoration-[#c9a45c] underline-offset-2 hover:text-[#a3141c]"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {url}
      </a>
    </li>
  );
}

function DetailItem({ label, children }) {
  return (
    <div className="border-b border-[#e7dfd9] py-4 sm:grid sm:grid-cols-[190px_1fr] sm:gap-5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-[#5c5252]">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-[#1f1a1a] sm:mt-0">{children || "No especificado"}</dd>
    </div>
  );
}

export default function ResourceDetail({ resource, type, includedDatabases = [] }) {
  const isDatabase = type === "database";
  const officialUrl = isDatabase ? getSafeUrl(resource.public_url) : null;
  const databaseLinks = officialUrl
    ? [{ link_type: "Sitio oficial", url: officialUrl }]
    : [];
  const journalPlatformLinks = (resource.platforms ?? [])
    .map((platform) => ({
      ...platform,
      journalUrl: getSafeUrl(platform.journal_url),
    }))
    .filter((platform) => platform.journalUrl);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Ruta de navegación" className="text-xs text-[#5c5252]">
        <Link className="hover:text-[#a3141c]" href="/directorio">Directorio</Link><span className="mx-2">/</span>{isDatabase ? "Bases de datos" : "Revistas"}<span className="mx-2">/</span><span className="text-[#1f1a1a]">{resource.name}</span>
      </nav>
      <header className="mt-7 grid gap-7 border-b border-[#e7dfd9] pb-8 sm:grid-cols-[1fr_auto] sm:items-end sm:pb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7f1218]">{isDatabase ? "Base de datos" : "Revista académica"}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight text-[#1f1a1a] sm:text-5xl">{resource.name}</h1>
          <p className="mt-3 text-sm text-[#5c5252]">{resource.institution} · {resource.country}</p>
        </div>
        {officialUrl && <a className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#a3141c] px-6 text-sm font-semibold text-white transition hover:bg-[#8a1018] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3141c]" href={officialUrl} rel="noopener noreferrer" target="_blank">
          {resource.access_label || "Abrir sitio oficial"} <span aria-hidden="true">↗</span>
        </a>}
      </header>
      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16 lg:py-10">
        <div>
          <section>
            <h2 className={detailTitleClass}>Descripción</h2>
            <p className={`mt-3 max-w-3xl ${detailTextClass}`}>{resource.description || "La API pública no proporciona una descripción para este recurso."}</p>
          </section>
          <section className="mt-10">
            <h2 className={detailTitleClass}>Datos técnicos</h2>
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
              <h2 className={detailTitleClass}>Identificadores</h2>
              <dl className="mt-3 divide-y divide-[#e7dfd9]">
                {resource.identifiers.length ? resource.identifiers.map((identifier) => <div className="py-3" key={`${identifier.identifier_type}-${identifier.identifier_value}`}><dt className="text-xs text-[#5c5252]">{identifier.identifier_type}</dt><dd className="mt-1 text-sm font-medium text-[#1f1a1a]">{identifier.identifier_value}</dd></div>) : <p className="py-3 text-sm text-[#5c5252]">No hay identificadores disponibles.</p>}
              </dl>
            </div>
            <div>
              <h2 className={detailTitleClass}>Enlaces</h2>
              {isDatabase ? (
                <ul className="mt-3 divide-y divide-[#e7dfd9]">
                  {databaseLinks.map((link) => (
                    <ResourceLink key={`${link.link_type}-${link.url}`} label={link.link_type} url={link.url} />
                  ))}
                </ul>
              ) : journalPlatformLinks.length ? (
                <ul className="mt-3 divide-y divide-[#e7dfd9]">
                  {journalPlatformLinks.map((platform) => (
                    <ResourceLink key={platform.id} label={platform.name} url={platform.journalUrl} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[#5c5252]">No hay enlaces disponibles para este recurso.</p>
              )}
            </div>
          </section>
        </div>
        <aside className="space-y-8">
          <section className="border-t-2 border-[#a3141c] pt-4">
            <h2 className="text-xl font-bold text-[#1f1a1a]">Áreas temáticas</h2>
            <ul className="mt-3 space-y-2">
              {resource.subject_areas.map((area) => <li className="flex gap-2 text-sm text-[#5c5252]" key={area}><span className="text-[#a3141c]">/</span>{area}</li>)}
            </ul>
          </section>
          {!isDatabase && (
            <section className="border-t-2 border-[#a3141c] pt-4">
              <h2 className="text-xl font-bold text-[#1f1a1a]">Disponible en</h2>
              <ul className="mt-3 space-y-3">
                {(includedDatabases.length ? includedDatabases : resource.platforms ?? []).map((database) => <li key={database.id}><Link className="text-sm font-semibold text-[#7f1218] underline decoration-[#c9a45c] underline-offset-2 hover:text-[#a3141c]" href={`/bases-de-datos/${database.id}`}>{database.name}</Link><span className="mt-1 block text-xs text-[#5c5252]">{database.institution || "Plataforma"}</span></li>)}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}