import type { MetadataRoute } from "next";
import { publicGet } from "@/lib/public-api";
import { Job, Page } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";
  const staticRoutes = ["", "/jobs", "/drivers", "/about", "/help", "/contact", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "daily" as const,
  }));
  try {
    const jobs = await publicGet<Page<Job>>("/jobs?pageSize=50");
    return [...staticRoutes, ...jobs.data.map((job) => ({ url: `${base}/jobs/${job.slug}`, changeFrequency: "daily" as const }))];
  } catch {
    return staticRoutes;
  }
}
