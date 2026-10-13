import { apiClient } from "@/shared/services/apiClient";

const usersById = new Map();

export const userService = {
  getUserById: async (id) => {
    if (id === null || id === undefined || id === "") return null;

    // Manejo del Usuario del Sistema (ID 0)
    if (id === 0 || id === "0") {
      return { id: 0, username: "system", full_name: "Usuario del sistema" };
    }

    const key = String(id);
    if (!usersById.has(key)) {
      const request = apiClient
        .get(`/api/accounts/users/${encodeURIComponent(id)}/`)
        .catch(() => {
          // Si el usuario no existe (404) o la petición falla, se retorna el objeto con el estado
          return { id, username: `user_${id}`, full_name: "Usuario no encontrado" };
        });

      usersById.set(key, request);
    }

    return usersById.get(key);
  },
};

export function getUserDisplayName(user) {
  if (!user) return "—";
  if (typeof user === "string") return user || "—";

  // Prioridad al campo full_name devuelto por el backend o el fallback de 404
  if (user.full_name && typeof user.full_name === "string" && user.full_name.trim() !== "") {
    return user.full_name.trim();
  }

  const fallbackName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fallbackName || user.username || user.email || (user.id ? `Usuario #${user.id}` : "—");
}