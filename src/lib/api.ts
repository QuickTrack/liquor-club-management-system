/**
 * Authenticated fetch wrapper that includes JWT token
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; error?: string }> {
  const token = localStorage.getItem("token");
  
  const url = endpoint.startsWith("/") 
    ? `${process.env.NEXT_PUBLIC_API_URL || ""}${endpoint}`
    : endpoint;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      return { data: null as any, error: data.error || "Request failed" };
    }

    return { data };
  } catch (error: any) {
    console.error("API fetch error:", error);
    return { data: null as any, error: error.message || "Network error" };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<{ data: T; error?: string }> {
  return apiFetch<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
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
 * PUT request helper
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
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<{ data: T; error?: string }> {
  return apiFetch<T>(endpoint, { method: "DELETE" });
}
