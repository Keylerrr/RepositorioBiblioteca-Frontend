import { apiClient } from "@/shared/services/apiClient";

export const journalService = {
  /**
   * List journals (supports ?search=..., pagination, ordering)
   */
  getJournals: async (params = {}) => {
    return apiClient.get("/api/journals/", params);
  },

  /**
   * Get detail of a specific journal
   */
  getJournalById: async (id) => {
    return apiClient.get(`/api/journals/${id}/`);
  },

  /**
   * Create a new journal (POST /api/journals/)
   */
  createJournal: async (data) => {
    return apiClient.post("/api/journals/", data);
  },

  /**
   * Partial update of a journal (PATCH /api/journals/{id}/)
   */
  patchJournal: async (id, data) => {
    return apiClient.patch(`/api/journals/${id}/`, data);
  },

  /**
   * Publish journal (POST /api/journals/{id}/publish/)
   */
  publishJournal: async (id) => {
    return apiClient.post(`/api/journals/${id}/publish/`, {});
  },

  /**
   * Deactivate journal (POST /api/journals/{id}/deactivate/)
   */
  deactivateJournal: async (id) => {
    return apiClient.post(`/api/journals/${id}/deactivate/`, {});
  },

  /**
   * Delete journal (DELETE /api/journals/{id}/)
   */
  deleteJournal: async (id) => {
    return apiClient.delete(`/api/journals/${id}/`);
  },

  /**
   * Published platforms only — journals can only be associated to these.
   * Matches the platforms module status enum (PUBLICADO).
   */
  getPublishedPlatforms: async () => {
    try {
      const res = await apiClient.get("/api/platforms/", {
        status: "publicado",
        page_size: 200,
      });
      const list = Array.isArray(res) ? res : res?.results || [];
      return list.filter((p) => String(p.status || "").toUpperCase() === "PUBLICADO");
    } catch {
      return [];
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
   * Load catalog options required by the journal form.
   * knowledge_areas is intentionally omitted: the backend derives it.
   */
  loadFormCatalogs: async () => {
    const [languages, countries, materialTypes, academicPrograms, editorials, publishedPlatforms] =
      await Promise.all([
        journalService.getCatalogData("/api/catalog/languages/", [
          { id: 1, abbreviation: "ES", name: "Español" },
          { id: 2, abbreviation: "PT", name: "Portugués" },
          { id: 3, abbreviation: "EN", name: "Inglés" },
        ]),
        journalService.getCatalogData("/api/catalog/countries/", [
          { id: 1, abbreviation: "BR", name: "Brasil", emoji_flag: "🇧🇷" },
          { id: 2, abbreviation: "CO", name: "Colombia", emoji_flag: "🇨🇴" },
          { id: 3, abbreviation: "MX", name: "México", emoji_flag: "🇲🇽" },
          { id: 4, abbreviation: "US", name: "Estados Unidos", emoji_flag: "🇺🇸" },
        ]),
        journalService.getCatalogData("/api/catalog/material-types/", [
          { id: 1, name: "Revistas y artículos" },
          { id: 2, name: "Libros y Monografías" },
          { id: 3, name: "Tesis y Disertaciones" },
        ]),
        journalService.getCatalogData("/api/catalog/academic-programs/", [
          { id: 1, name: "Ingeniería de Sistemas" },
          { id: 2, name: "Ingeniería Industrial" },
          { id: 3, name: "Medicina" },
          { id: 4, name: "Todos los programas" },
        ]),
        journalService.getCatalogData("/api/catalog/editorials/").then(async (list) => {
          if (Array.isArray(list) && list.length > 0) return list;
          return journalService.getCatalogData("/api/catalog/editoriales/", []);
        }),
        journalService.getPublishedPlatforms(),
      ]);

    return {
      languages,
      countries,
      materialTypes,
      academicPrograms,
      editorials,
      publishedPlatforms,
    };
  },
};
