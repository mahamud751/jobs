import { Suspense } from "react";
import type { Metadata } from "next";
import { Filters, JobCard, Pager } from "@/components/cards";
import { PublicShell } from "@/components/chrome";
import { RouteFallback } from "@/components/fallback";
import { translate } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { publicGet } from "@/lib/public-api";
import { Division, Job, Page } from "@/lib/types";

export const metadata: Metadata = { title: "ড্রাইভারের চাকরি" };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <PublicShell>
      <Suspense fallback={<RouteFallback />}>
        <JobResults searchParams={searchParams} />
      </Suspense>
    </PublicShell>
  );
}

async function JobResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lang = await getLang();
  const t = (key: string) => translate(lang, key);
  const raw = await searchParams;
  const values = {
    division: one(raw.division),
    district: one(raw.district),
    vehicle: one(raw.vehicle),
    jobType: one(raw.jobType),
    category: one(raw.category),
    licenseClass: one(raw.licenseClass),
    experience: one(raw.experience),
    salaryMin: one(raw.salaryMin),
    q: one(raw.q),
    page: one(raw.page),
  };
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
  let jobs: Page<Job> | null = null;
  let locations: Division[] = [];
  try {
    [jobs, locations] = await Promise.all([
      publicGet<Page<Job>>(`/jobs?${params.toString()}`),
      publicGet<Division[]>("/locations/tree?activeOnly=true"),
    ]);
  } catch {
    jobs = null;
  }
  return (
      <div className="wrap grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <Filters locations={locations} mode="jobs" values={values} />
        <div>
          <h1 className="text-3xl font-extrabold">{t("nav.findJob")}</h1>
          <p className="mt-2 text-sm text-muted">{jobs ? jobs.meta.total : 0}</p>
          {!jobs && <p className="mt-6 text-danger">{t("offline")}</p>}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {jobs?.data.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
          {jobs && jobs.data.length === 0 && <p className="mt-6 text-muted">{t("emptyJobs")}</p>}
          {jobs && <Pager page={jobs.meta.page} totalPages={jobs.meta.totalPages} path="/jobs" params={values} />}
        </div>
      </div>
  );
}
