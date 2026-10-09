import { fetchPublicApi, PublicApiError, readPage } from "@/shared/services/publicApi";
import { capitalizeWords } from "@/shared/utils/formatText";

const endpoint = "/api/platforms/public/";

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

function mapPlatform(platform) {
  const publicPlatform = { ...platform };
  delete publicPlatform.base_api_url;
  const institutions = capitalizeNamedItems(platform.institutions);
  const languages = capitalizeNamedItems(platform.languages);
  const countries = capitalizeNamedItems(platform.countries);
  const knowledgeAreas = capitalizeNamedItems(platform.knowledge_areas);
  const materialTypes = capitalizeNamedItems(platform.material_types);
  const academicPrograms = capitalizeNamedItems(platform.academic_programs);
  const country = displayNames(countries);
  const url = platform.public_url ?? "";

  return {
    ...publicPlatform,
    name: capitalizeWords(platform.name),
    public_url: platform.public_url,
    institutions,
    languages,
    countries,
    knowledge_areas: knowledgeAreas,
    material_types: materialTypes,
    description: "",
    institution: displayNames(institutions),
    country,
    url,
    access_label: "Abrir sitio oficial",
    geographic_coverage: country,
    language: displayNames(languages),
    coverage_period: formatPeriod(platform.start_period, platform.finish_period),
    material_type: displayNames(materialTypes),
    license: null,
    identifiers: [],
    links: platform.public_url
      ? [{ link_type: "Sitio oficial", url: platform.public_url }]
      : [],
    subject_areas: knowledgeAreas.map((area) => area.name),
    academic_programs: academicPrograms,
  };
}

export async function getPage(params = {}, { signal } = {}) {
  const response = await fetchPublicApi(endpoint, params, signal);
  return { ...readPage(response), results: response.results.map(mapPlatform) };
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
    return mapPlatform(await fetchPublicApi(`${endpoint}${encodeURIComponent(id)}/`));
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return null;
    throw error;
  }
}