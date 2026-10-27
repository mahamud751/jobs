export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function api<T>(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.auth !== false) {
    const token = localStorage.getItem("chalok_admin_token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API}/api${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/login")) {
    localStorage.removeItem("chalok_admin_token");
    window.location.href = "/login";
  }
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message || "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export const STAFF = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "SUPPORT"];
