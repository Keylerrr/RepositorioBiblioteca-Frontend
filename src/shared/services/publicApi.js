const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export class PublicApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
  }
}

const requestTimeoutMs = 10_000;

export async function fetchPublicApi(path, params = {}, signal) {
  if (!apiBaseUrl) {
    throw new PublicApiError("Configura NEXT_PUBLIC_API_URL para conectar con la API pública.");
  }

  const url = new URL(`${apiBaseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  let response;
  try {
    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new PublicApiError("No se pudo conectar con la API pública. Verifica que el backend esté disponible.");
  }

  if (!response.ok) {
    let message = `La API pública respondió con el estado ${response.status}.`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // The response may not contain a JSON error body.
    }
    throw new PublicApiError(message, response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new PublicApiError("La API pública devolvió una respuesta que no es JSON.", response.status);
  }
}

export function readPage(response) {
  if (!response || !Array.isArray(response.results)) {
    throw new PublicApiError("La API pública devolvió una respuesta de listado inválida.");
  }

  return {
    current_page: response.current_page ?? 1,
    total_pages: response.total_pages ?? 1,
    page_size: response.page_size ?? response.results.length,
    total_items: response.total_items ?? response.results.length,
    next: response.next ?? null,
    previous: response.previous ?? null,
    results: response.results,
  };
}