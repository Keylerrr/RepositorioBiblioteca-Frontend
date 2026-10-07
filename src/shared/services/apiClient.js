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
