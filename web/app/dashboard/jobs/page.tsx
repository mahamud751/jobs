"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers";
import { api, token } from "@/lib/api";
import { salaryRange } from "@/lib/format";
import { jobStatus, label, placeName } from "@/lib/labels";
import { Job } from "@/lib/types";

export default function MyJobsPage() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setJobs(await api<Job[]>("/employers/me/jobs", { token: token() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">{bn ? "আমার বিজ্ঞাপন" : "My jobs"}</h1>
        <Link href="/jobs/new" className="btn-gold">{bn ? "নতুন" : "New"}</Link>
      </div>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-5 grid gap-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/dashboard/jobs/${job.id}`} className="card flex items-center justify-between gap-3 p-4">
            <span>
              <span className="block font-bold">{job.title}</span>
              <span className="text-sm text-muted">{placeName(job.district, lang)} · {salaryRange(job.salaryMin, job.salaryMax, job.salaryNegotiable, lang)}</span>
            </span>
            <span className="text-sm font-bold">{label(jobStatus, job.status, lang)} · {job.applicationCount || 0}</span>
          </Link>
        ))}
        {!jobs.length && <p className="text-muted">{bn ? "এখনো কোনো বিজ্ঞাপন নেই।" : "No jobs yet."}</p>}
      </div>
    </div>
  );
}
