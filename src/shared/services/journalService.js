import { fetchPublicApi, PublicApiError, readPage } from "@/shared/services/publicApi";
import { capitalizeWords } from "@/shared/utils/formatText";

const endpoint = "/api/journals/public/";

function capitalizeNamedItems(items) {
  return (items ?? []).map((item) => (
    item && typeof item === "object"
      ? { ...item, name: capitalizeWords(item.name) }
      : item
  ));
}

function displayNames(items) {
  const names = (items ?? []).map((item) => item.name).filter(Boolean);
  return names.length ? names.join(", ") : "No especificado";
}

function formatPeriod(start, finish) {
  if (!start && !finish) return "No especificado";
  return `${start ?? "Inicio no especificado"} – ${finish ?? "Actualidad"}`;
}

function mapJournal(journal) {
  const languages = capitalizeNamedItems(journal.languages);
  const countries = capitalizeNamedItems(journal.countries);
  const knowledgeAreas = capitalizeNamedItems(journal.knowledge_areas);
  const materialTypes = capitalizeNamedItems(journal.material_types);
  const academicPrograms = capitalizeNamedItems(journal.academic_programs);
  const platforms = capitalizeNamedItems(journal.platforms);

  return {
    ...journal,
    title: capitalizeWords(journal.title),
    editorial_name: capitalizeWords(journal.editorial_name),
    languages,
    countries,
    knowledge_areas: knowledgeAreas,
    material_types: materialTypes,
    academic_programs: academicPrograms,
    platforms,
    name: capitalizeWords(journal.title),
    description: "",
    institution: capitalizeWords(journal.editorial_name) ?? "No especificado",
    country: displayNames(countries),
    url: "",
    access_label: "Abrir sitio oficial",
    geographic_coverage: displayNames(countries),
    language: displayNames(languages),
    coverage_period: formatPeriod(journal.start_period, journal.finish_period),
    material_type: displayNames(materialTypes),
    license: journal.license,
    identifiers: journal.issn ? [{ identifier_type: "ISSN", identifier_value: journal.issn }] : [],
    links: [],
    subject_areas: knowledgeAreas.map((area) => area.name),
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