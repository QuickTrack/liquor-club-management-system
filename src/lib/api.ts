/**
 * API Client - Enhanced fetch wrapper with retry, logging, and correlation tracking
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Generate a unique correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Exponential backoff delay with jitter
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Is the error worthy of a retry?
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Network errors (failed to fetch)
  if (error.message === "Failed to fetch" || error.name === "TypeError") {
    return true;
  }

  // 5xx server errors
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // 429 Too Many Requests
  if (error.status === 429) {
    return true;
  }

  // 408 Request Timeout
  if (error.status === 408) {
    return true;
  }

  return false;
}

/**
 * Generic API fetch with retry, logging, and correlation
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<{ data: T; error?: string; correlationId?: string; attempted: number }> {
  const correlationId = generateCorrelationId();
  const token = localStorage.getItem("token");

  const url = endpoint.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_API_URL || ""}${endpoint}`
    : endpoint;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Correlation-ID": correlationId,
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Log request (debug level in dev)
      if (process.env.NODE_ENV === "development") {
        console.debug(`[API] ${options.method || "GET"} ${endpoint}`, {
          correlationId,
          attempt,
        });
      }

      const res = await fetch(url, {
        ...options,
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        const apiError: any = new Error(data.error || "Request failed");
        apiError.status = res.status;
        apiError.correlationId = correlationId;

        // Log error
        console.error(`[API Error] ${res.status} ${endpoint}`, {
          correlationId,
          error: data.error,
          details: data.details,
        });

        // Should we retry?
        if (attempt < retries && isRetryableError(apiError)) {
          const delayMs = getRetryDelay(attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        return {
          data: null as any,
          error: data.error || "Request failed",
          correlationId,
          attempted: attempt,
        };
      }

      return { data, correlationId, attempted: attempt };
    } catch (error: any) {
      lastError = error;

      // Network error - retry
      if (attempt < retries) {
        const delayMs = getRetryDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      console.error(`[API Network Error] ${endpoint}`, {
        correlationId,
        error: error.message,
        attempted: attempt,
      });

      return {
        data: null as any,
        error: error.message || "Network error",
        correlationId,
        attempted: attempt,
      };
    }
  }

  return {
    data: null as any,
    error: lastError?.message || "Max retries exceeded",
    correlationId,
    attempted: retries,
  };
}

/**
 * GET request helper with retry
 */
export async function apiGet<T>(endpoint: string): Promise<{ data: T; error?: string }> {
  return apiFetch<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper with retry
 */
export async function apiPost<T>(
  endpoint: string,
  body: object
): Promise<{ data: T; error?: string }> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PUT request helper with retry
 */
export async function apiPut<T>(
  endpoint: string,
  body: object
): Promise<{ data: T; error?: string }> {
  return apiFetch<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request helper with retry
 */
export async function apiPatch<T>(
  endpoint: string,
  body: object
): Promise<{ data: T; error?: string }> {
  return apiFetch<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper with retry
 */
export async function apiDelete<T>(endpoint: string): Promise<{ data: T; error?: string }> {
  return apiFetch<T>(endpoint, { method: "DELETE" });
}

/**
 * Upload file helper (multipart/form-data)
 */
export async function apiUpload<T>(
  endpoint: string,
  file: File,
  extraFields?: Record<string, string>
): Promise<{ data: T; error?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return apiFetch<T>(endpoint, {
    method: "POST",
    body: formData,
    // Don't set Content-Type - browser will set with boundary
  });
}

export const apiClient = {
  fetch: apiFetch,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  upload: apiUpload,
  generateCorrelationId,
};

export default apiClient;
