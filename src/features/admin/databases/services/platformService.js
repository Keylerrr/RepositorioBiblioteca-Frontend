import { apiClient } from "@/shared/services/apiClient";

export const platformService = {
  /**
   * List active platforms (with optional search, filters, ordering, pagination)
   */
  getPlatforms: async (params = {}) => {
    return apiClient.get("/api/platforms/", params);
  },

  /**
   * List archived/deleted platforms
   */
  getArchivedPlatforms: async (params = {}) => {
    return apiClient.get("/api/platforms/archived/", params);
  },

  /**
   * Get detail of a specific platform
   */
  getPlatformById: async (id) => {
    return apiClient.get(`/api/platforms/${id}/`);
  },

  /**
   * Create a new platform (POST /api/platforms/)
   */
  createPlatform: async (data) => {
    return apiClient.post("/api/platforms/", data);
  },

  /**
   * Full update of a platform (PUT /api/platforms/{id}/)
   */
  updatePlatform: async (id, data) => {
    return apiClient.put(`/api/platforms/${id}/`, data);
  },

  /**
   * Partial update of a platform (PATCH /api/platforms/{id}/)
   */
  patchPlatform: async (id, data) => {
    return apiClient.patch(`/api/platforms/${id}/`, data);
  },

  /**
   * Delete platform (DELETE /api/platforms/{id}/)
   */
  deletePlatform: async (id, deleteExplanation = "") => {
    const body = deleteExplanation ? { delete_explanation: deleteExplanation } : null;
    return apiClient.delete(`/api/platforms/${id}/`, body);
  },

  /**
   * Restore platform (POST /api/platforms/{id}/restore/)
   */
  restorePlatform: async (id) => {
    return apiClient.post(`/api/platforms/${id}/restore/`, {});
  },

  /**
   * Status transitions
   */
  publishPlatform: async (id) => {
    return apiClient.post(`/api/platforms/${id}/publish/`, {});
  },

  markObsoletePlatform: async (id) => {
    return apiClient.post(`/api/platforms/${id}/mark-obsolete/`, {});
  },

  reactivatePlatform: async (id) => {
    return apiClient.post(`/api/platforms/${id}/reactivate/`, {});
  },

  /**
   * Check / Register public URL (POST /api/platforms/{id}/check-link/)
   * If url is provided and non-empty, send { url }. If empty or null, send empty body {}.
   */
  checkLink: async (id, url = null) => {
    const cleanUrl = typeof url === "string" ? url.trim() : null;
    const body = cleanUrl ? { url: cleanUrl } : {};
    return apiClient.post(`/api/platforms/${id}/check-link/`, body);
  },

  /**
   * Get valid syntax options (GET /api/platforms/valid-sintaxis/)
   */
  getValidSintaxis: async () => {
    try {
      const res = await apiClient.get("/api/platforms/valid-sintaxis/");
      return Array.isArray(res) ? res : res.results || [];
    } catch {
      return [
        { id: 1, name: "AND, OR, NOT; comillas; filtros por año y colección" },
        { id: 2, name: "OAI-PMH / Dublin Core" },
        { id: 3, name: "REST API / JSON Search Syntax" }
      ];
    }
  },

  /**
   * Get link check logs history (GET /api/platforms/link-check-logs/)
   */
  getLinkCheckLogs: async (params = {}) => {
    try {
      return await apiClient.get("/api/platforms/link-check-logs/", params);
    } catch {
      return { results: [] };
    }
  },

  /**
   * Helper to load catalog list safely from /api/catalog/{resource}/
   */
  getCatalogData: async (endpoint, fallback = []) => {
    try {
      const res = await apiClient.get(endpoint);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Load catalog options from /api/catalog/ endpoints as defined in API_del_catalogo.docx.txt
   */
  loadFormCatalogs: async () => {
    const [sintaxis, institutions, languages, countries, materialTypes, academicPrograms] = await Promise.all([
      platformService.getValidSintaxis(),
      platformService.getCatalogData("/api/catalog/institutions/", [
        { id: 1, name: "SciELO Network" },
        { id: 2, name: "Universidad Francisco de Paula Santander" }
      ]),
      platformService.getCatalogData("/api/catalog/languages/", [
        { id: 1, abbreviation: "ES", name: "Español" },
        { id: 2, abbreviation: "PT", name: "Portugués" },
        { id: 3, abbreviation: "EN", name: "Inglés" }
      ]),
      platformService.getCatalogData("/api/catalog/countries/", [
        { id: 1, abbreviation: "BR", name: "Brasil", emoji_flag: "🇧🇷" },
        { id: 2, abbreviation: "CO", name: "Colombia", emoji_flag: "🇨🇴" },
        { id: 3, abbreviation: "MX", name: "México", emoji_flag: "🇲🇽" },
        { id: 4, abbreviation: "US", name: "Estados Unidos", emoji_flag: "🇺🇸" }
      ]),
      platformService.getCatalogData("/api/catalog/material-types/", [
        { id: 1, name: "Revistas y artículos" },
        { id: 2, name: "Libros y Monografías" },
        { id: 3, name: "Tesis y Disertaciones" }
      ]),
      platformService.getCatalogData("/api/catalog/academic-programs/", [
        { id: 1, name: "Ingeniería de Sistemas" },
        { id: 2, name: "Ingeniería Industrial" },
        { id: 3, name: "Medicina" },
        { id: 4, name: "Todos los programas" }
      ]),
    ]);

    return {
      sintaxis: Array.isArray(sintaxis) ? sintaxis : sintaxis.results || [],
      institutions,
      languages,
      countries,
      materialTypes,
      academicPrograms,
    };
  },
};
