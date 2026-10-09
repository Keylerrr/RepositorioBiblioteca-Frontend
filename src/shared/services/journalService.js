import { fetchPublicApi, PublicApiError, readPage } from "@/shared/services/publicApi";

const endpoint = "/api/journals/public/";

function displayNames(items) {
  const names = (items ?? []).map((item) => item.name).filter(Boolean);
  return names.length ? names.join(", ") : "No especificado";
}

function formatPeriod(start, finish) {
  if (!start && !finish) return "No especificado";
  return `${start ?? "Inicio no especificado"} – ${finish ?? "Actualidad"}`;
}

function mapJournal(journal) {
  const url = journal.platforms?.find((platform) => platform.base_api_url)?.base_api_url ?? "";
  return {
    ...journal,
    name: journal.title,
    description: "",
    institution: journal.editorial_name ?? "No especificado",
    country: displayNames(journal.countries),
    url,
    access_label: "Abrir plataforma",
    geographic_coverage: displayNames(journal.countries),
    language: displayNames(journal.languages),
    coverage_period: formatPeriod(journal.start_period, journal.finish_period),
    material_type: displayNames(journal.material_types),
    license: journal.license,
    identifiers: journal.issn ? [{ identifier_type: "ISSN", identifier_value: journal.issn }] : [],
    links: (journal.platforms ?? [])
      .filter((platform) => platform.base_api_url)
      .map((platform) => ({ link_type: platform.name, url: platform.base_api_url })),
    subject_areas: (journal.knowledge_areas ?? []).map((area) => area.name),
    academic_programs: (journal.academic_programs ?? []).map((program) => program.name),
  };
}

export async function getPage(params = {}, { signal } = {}) {
  const response = await fetchPublicApi(endpoint, params, signal);
  return { ...readPage(response), results: response.results.map(mapJournal) };
}

export async function getAll() {
  const firstPage = await getPage({ page: 1, page_size: 100 });
  const results = [...firstPage.results];
  for (let page = 2; page <= firstPage.total_pages; page += 1) {
    const nextPage = await getPage({ page, page_size: 100 });
    results.push(...nextPage.results);
  }
  return results;
}

export async function getById(id) {
  try {
    return mapJournal(await fetchPublicApi(`${endpoint}${encodeURIComponent(id)}/`));
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return null;
    throw error;
  }
}