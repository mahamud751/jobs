export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown; token?: string | null; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  let body: BodyInit | undefined;
  if (options.form) body = options.form;
  else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const response = await fetch(`${API_URL}/api${path}`, {
    method: options.method || "GET",
    headers,
    body,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message || "Request failed";
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("chalok_token");
}

export function saveSession(accessToken: string, refreshToken: string) {
  localStorage.setItem("chalok_token", accessToken);
  localStorage.setItem("chalok_refresh", refreshToken);
}

export function clearSession() {
  localStorage.removeItem("chalok_token");
  localStorage.removeItem("chalok_refresh");
}
