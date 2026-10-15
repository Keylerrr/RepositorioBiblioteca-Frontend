import { apiClient } from "@/shared/services/apiClient";

export const journalService = {
  /**
   * List journals (supports ?search=..., pagination, ordering)
   */
  getJournals: async (params = {}) => {
    return apiClient.get("/api/journals/", params);
  },

  /**
   * List logically deleted journals (GET /api/journals/archived/)
   */
  getArchivedJournals: async () => {
    return apiClient.get("/api/journals/archived/");
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
   * Payload: { licenses: [1, 2, ...] }
   */
  publishJournal: async (id, licenses = []) => {
    return apiClient.post(`/api/journals/${id}/publish/`, { licenses });
  },

  /**
   * List licenses (GET /api/journals/licenses/)
   */
  getLicenses: async (params = {}) => {
    try {
      const res = await apiClient.get("/api/journals/licenses/", params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return [];
    } catch (err) {
      console.error("Error fetching licenses:", err);
      throw err;
    }
  },

  /**
   * Create license (POST /api/journals/licenses/)
   * Payload: { name: "CC BY 4.0" }
   */
  createLicense: async (data) => {
    return apiClient.post("/api/journals/licenses/", data);
  },

  /**
   * Partial update of a license (PATCH /api/journals/licenses/{id}/)
   * Payload: { name: "Nuevo Nombre" }
   */
  patchLicense: async (id, data) => {
    return apiClient.patch(`/api/journals/licenses/${id}/`, data);
  },

  /**
   * Delete license (DELETE /api/journals/licenses/{id}/)
   */
  deleteLicense: async (id, deleteExplanation) => {
    return apiClient.delete(`/api/journals/licenses/${id}/`, {
      delete_explanation: deleteExplanation,
    });
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
  deleteJournal: async (id, deleteExplanation = "") => {
    return apiClient.delete(`/api/journals/${id}/`, {
      delete_explanation: deleteExplanation.trim(),
    });
  },

  /**
   * Restore a logically deleted journal (POST /api/journals/{id}/restore/)
   */
  restoreJournal: async (id) => {
    return apiClient.post(`/api/journals/${id}/restore/`, {});
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
