const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://repositorio-biblioteca-backend.onrender.com").replace(/\/+$/, "");

/**
 * Helper to build full URL with query parameters
 */
function buildUrl(endpoint, params = {}) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // Ensure trailing slash for API endpoints if not present
  const endpointWithSlash = cleanEndpoint.includes("?") 
    ? cleanEndpoint 
    : cleanEndpoint.endsWith("/") 
      ? cleanEndpoint 
      : `${cleanEndpoint}/`;

  const url = new URL(`${API_BASE_URL}${endpointWithSlash}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
}

/**
 * Handle HTTP response and parse JSON or extract errors
 */
async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = { detail: text };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    
    if (data) {
      if (typeof data === "string") {
        errorMessage = data;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (typeof data === "object") {
        // Collect field validation error messages
        const fieldErrors = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
          .join(" | ");
        if (fieldErrors) {
          errorMessage = fieldErrors;
        }
      }
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiClient = {
  get: async (endpoint, params = {}, options = {}) => {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
      ...options,
    });
    return handleResponse(response);
  },

  post: async (endpoint, body = {}, options = {}) => {
    const url = buildUrl(endpoint);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse(response);
  },

  put: async (endpoint, body = {}, options = {}) => {
    const url = buildUrl(endpoint);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse(response);
  },

  patch: async (endpoint, body = {}, options = {}) => {
    const url = buildUrl(endpoint);
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse(response);
  },

  delete: async (endpoint, body = null, options = {}) => {
    const url = buildUrl(endpoint);
    const fetchOptions = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    return handleResponse(response);
  },
};

// Same-origin requests let the browser read the CSRF cookie and keep the
// session cookie; next.config.mjs proxies these routes to the configured API.
async function accountsRequest(path, { method = "GET", body, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (method !== "GET") {
    await accountsRequest("auth/csrf/", { signal });
    const cookie = document.cookie.split(";").find((item) => item.trim().startsWith("csrftoken="));
    if (!cookie) throw new Error("No se pudo obtener el token de seguridad. Recarga la página e intenta nuevamente.");
    headers["X-CSRFToken"] = decodeURIComponent(cookie.trim().slice("csrftoken=".length));
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let response;
  try {
    response = await fetch(`/api/accounts/${path}`, {
      method, headers, credentials: "include", cache: "no-store", signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.");
  }
  if (response.status === 204) return null;
  return handleResponse(response);
}

export function hasAccountPermission(user, action) {
  return Boolean(user?.is_superadmin || user?.effective_permissions?.accounts?.users?.[action]);
}

export const accountsApi = {
  me: (signal) => accountsRequest("auth/me/", { signal }),
  login: (body) => accountsRequest("auth/login/", { method: "POST", body }),
  logout: () => accountsRequest("auth/logout/", { method: "POST" }),
  changePassword: (body) => accountsRequest("password/change/", { method: "POST", body }),
  users: (signal) => accountsRequest("users/", { signal }),
  user: (id, signal) => accountsRequest(`users/${encodeURIComponent(id)}/`, { signal }),
  invite: (body) => accountsRequest("users/invite/", { method: "POST", body }),
  deactivate: (id) => accountsRequest(`users/${encodeURIComponent(id)}/`, { method: "DELETE" }),
  permissions: (signal) => accountsRequest("permissions/", { signal }),
  savePermissions: (id, permissions) => accountsRequest(`users/${encodeURIComponent(id)}/permissions/`, { method: "PUT", body: { permissions } }),
};
