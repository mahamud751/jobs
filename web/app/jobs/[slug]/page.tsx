import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApplyBox, ReportBox } from "@/components/actions";
import { PublicShell } from "@/components/chrome";
import { RouteFallback } from "@/components/fallback";
import { ApiError } from "@/lib/api";
import { publicGet } from "@/lib/public-api";
import { salaryRange, when } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { categories, jobTypes, label, licenses, placeName, vehicles } from "@/lib/labels";
import { Job } from "@/lib/types";

export function generateStaticParams() {
  return [{ slug: "_" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const job = await publicGet<Job>(`/jobs/${slug}`);
    return { title: job.title, description: job.description.slice(0, 150) };
  } catch {
    return { title: "Job" };
  }
}

export default function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <PublicShell>
      <Suspense fallback={<RouteFallback />}>
        <JobDetail params={params} />
      </Suspense>
    </PublicShell>
  );
}

async function JobDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = await getLang();
  const t = (key: string) => translate(lang, key);
  let job: Job;
  try {
    job = await publicGet<Job>(`/jobs/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <div className="wrap py-16 text-danger">{t("offline")}</div>;
  }
  const facts = [
    [t("district"), [placeName(job.area, lang), job.areaText, placeName(job.district, lang)].filter(Boolean).join(", ")],
    [t("vehicle"), label(vehicles, job.vehicleType, lang)],
    [t("jobType"), label(jobTypes, job.jobType, lang)],
    [t("category"), label(categories, job.drivingCategory, lang)],
    [t("license"), label(licenses, job.licenseClass, lang)],
    [t("experience"), `${job.experienceRequired}+ ${t("years")}`],
    [t("deadline"), when(job.deadline, lang)],
    [t("salary"), salaryRange(job.salaryMin, job.salaryMax, job.salaryNegotiable, lang)],
  ];
  return (
      <article className="wrap grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-bold text-forest">{job.employer.displayName}{job.employer.isVerified ? ` · ${t("verified")}` : ""}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{job.title}</h1>
          <p className="mt-3 text-2xl font-extrabold">{salaryRange(job.salaryMin, job.salaryMax, job.salaryNegotiable, lang)} <span className="text-sm font-semibold text-muted">{t("perMonth")}</span></p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {facts.map(([name, value]) => (
              <div key={name} className="card px-4 py-3">
                <dt className="text-xs font-bold text-muted">{name}</dt>
                <dd className="mt-1 font-semibold">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-8 text-xl font-extrabold">{lang === "bn" ? "কাজের বিবরণ" : "Description"}</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-ink/90">{job.description}</p>
          {job.workingHours && <p className="mt-4 text-sm"><span className="font-bold">{lang === "bn" ? "সময়: " : "Hours: "}</span>{job.workingHours}</p>}
          {job.holidays && <p className="mt-1 text-sm"><span className="font-bold">{lang === "bn" ? "ছুটি: " : "Leave: "}</span>{job.holidays}</p>}
          {job.applyInstructions && <p className="mt-4 text-sm text-muted">{job.applyInstructions}</p>}
          {job.employer.phone && <p className="mt-4 font-semibold">{job.employer.phone}</p>}
          <div className="mt-6"><ReportBox againstJobId={job.id} /></div>
        </div>
        <ApplyBox slug={job.slug} />
      </article>
  );
}
