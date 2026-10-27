import { cacheLife } from "next/cache";
import { API_URL, ApiError } from "./api";

export async function publicGet<T>(path: string): Promise<T> {
  "use cache";
  cacheLife({ revalidate: 30, expire: 300, stale: 60 });
  const response = await fetch(`${API_URL}/api${path}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message || "Request failed";
    throw new ApiError(message, response.status);
  }
  return data as T;
}
