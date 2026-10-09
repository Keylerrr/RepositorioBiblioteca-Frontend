import { fetchPublicApi, PublicApiError, readPage } from "@/shared/services/publicApi";

const endpoint = "/api/platforms/public/";

function displayNames(items) {
  const names = (items ?? []).map((item) => item.name).filter(Boolean);
  return names.length ? names.join(", ") : "No especificado";
}

function formatPeriod(start, finish) {
  if (!start && !finish) return "No especificado";
  return `${start ?? "Inicio no especificado"} – ${finish ?? "Actualidad"}`;
}

function mapPlatform(platform) {
  const country = displayNames(platform.countries);
  const url = platform.base_api_url ?? "";
  return {
    ...platform,
    name: platform.name,
    description: "",
    institution: displayNames(platform.institutions),
    country,
    url,
    access_label: "Abrir plataforma",
    geographic_coverage: country,
    language: displayNames(platform.languages),
    coverage_period: formatPeriod(platform.start_period, platform.finish_period),
    material_type: displayNames(platform.material_types),
    license: null,
    identifiers: [],
    links: url ? [{ link_type: "URL base de la plataforma", url }] : [],
    subject_areas: (platform.knowledge_areas ?? []).map((area) => area.name),
    academic_programs: (platform.academic_programs ?? []).map((program) => program.name),
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