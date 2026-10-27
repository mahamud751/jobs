"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "./mark";
import { useI18n } from "./providers";
import { media, salaryRange } from "@/lib/format";
import { categories, jobTypes, label, licenses, placeName, vehicles } from "@/lib/labels";
import { Division, Driver, Job } from "@/lib/types";

export function JobCard({ job }: { job: Job }) {
  const { lang, t } = useI18n();
  const area = placeName(job.area, lang);
  const extra = job.areaText && job.areaText !== area && job.areaText !== job.area?.nameBn && job.areaText !== job.area?.nameEn ? job.areaText : "";
  const where = [area, extra, placeName(job.district, lang)].filter(Boolean).join(", ");
  return (
    <article className="card listing-card flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-forest">{job.employer.displayName}</p>
          <h3 className="mt-1 text-lg font-bold leading-snug">{job.title}</h3>
        </div>
        {job.featured && <span className="rounded-full bg-gold/25 px-2 py-1 text-[11px] font-bold">{t("featured")}</span>}
      </div>
      <p className="mt-3 text-sm text-muted">{where}</p>
      <div className="mt-3 mb-5 flex flex-wrap gap-1.5">
        <span className="chip">{label(vehicles, job.vehicleType, lang)}</span>
        <span className="chip">{label(jobTypes, job.jobType, lang)}</span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/70 pt-5">
        <div>
          <p className="text-base font-extrabold">{salaryRange(job.salaryMin, job.salaryMax, job.salaryNegotiable, lang)}</p>
          <p className="text-xs text-muted">{t("perMonth")}</p>
        </div>
        <Link href={`/jobs/${job.slug}`} className="card-link">{t("view")}</Link>
      </div>
    </article>
  );
}

export function DriverCard({ driver }: { driver: Driver }) {
  const { lang, t } = useI18n();
  return (
    <article className="card listing-card flex h-full flex-col p-6">
      <div className="flex items-start gap-3">
        <Avatar name={driver.fullName} photo={media(driver.photoUrl)} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold">{driver.fullName}</h3>
            {driver.verified && <span className="rounded-full bg-forest-soft px-2 py-0.5 text-[11px] font-bold text-forest-deep">{t("verified")}</span>}
          </div>
          <p className="text-sm text-muted">{[placeName(driver.area, lang), placeName(driver.district, lang)].filter(Boolean).join(", ")}</p>
        </div>
      </div>
      {driver.bio && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{driver.bio}</p>}
      <div className="mt-3 mb-5 flex flex-wrap gap-1.5">
        {driver.vehicles.slice(0, 3).map((item) => <span key={item} className="chip">{label(vehicles, item, lang)}</span>)}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/70 pt-5">
        <div>
          <p className="text-xs text-muted">{driver.experienceYears} {t("years")}</p>
          <p className="font-extrabold">{salaryRange(driver.expectedSalaryMin, driver.expectedSalaryMax, false, lang)}</p>
        </div>
        <Link href={`/drivers/${driver.id}`} className="card-link">{t("view")}</Link>
      </div>
    </article>
  );
}

export function Filters({
  locations,
  mode,
  values,
}: {
  locations: Division[];
  mode: "jobs" | "drivers";
  values: Record<string, string | undefined>;
}) {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [division, setDivision] = useState(values.division || "");
  const [district, setDistrict] = useState(values.district || "");
  const [vehicle, setVehicle] = useState(values.vehicle || "");
  const [jobType, setJobType] = useState(values.jobType || "");
  const [category, setCategory] = useState(values.category || "");
  const [license, setLicense] = useState(values.licenseClass || "");
  const [experience, setExperience] = useState(values.experience || values.experienceMin || "");
  const [pay, setPay] = useState(values.salaryMax || values.salaryMin || "");
  const [verified, setVerified] = useState(values.verified === "true");
  const [q, setQ] = useState(values.q || "");

  useEffect(() => {
    setDivision(values.division || "");
    setDistrict(values.district || "");
    setVehicle(values.vehicle || "");
    setJobType(values.jobType || "");
    setCategory(values.category || "");
    setLicense(values.licenseClass || "");
    setExperience(values.experience || values.experienceMin || "");
    setPay(values.salaryMax || values.salaryMin || "");
    setVerified(values.verified === "true");
    setQ(values.q || "");
  }, [values.division, values.district, values.vehicle, values.jobType, values.category, values.licenseClass, values.experience, values.experienceMin, values.salaryMax, values.salaryMin, values.verified, values.q]);

  const districts = useMemo(() => {
    const rows = division ? locations.filter((item) => item.code === division) : locations;
    return rows.flatMap((item) => item.districts);
  }, [division, locations]);

  function apply(patch: Partial<{
    division: string;
    district: string;
    vehicle: string;
    jobType: string;
    category: string;
    license: string;
    experience: string;
    pay: string;
    verified: boolean;
    q: string;
  }> = {}) {
    const next = { division, district, vehicle, jobType, category, license, experience, pay, verified, q, ...patch };
    if (patch.division !== undefined && patch.division !== division) next.district = "";
    const params = new URLSearchParams();
    if (next.division) params.set("division", next.division);
    if (next.district) params.set("district", next.district);
    if (next.vehicle) params.set("vehicle", next.vehicle);
    if (next.jobType) params.set("jobType", next.jobType);
    if (next.category) params.set("category", next.category);
    if (next.license) params.set("licenseClass", next.license);
    if (next.experience) params.set(mode === "jobs" ? "experience" : "experienceMin", next.experience);
    if (next.pay) params.set(mode === "jobs" ? "salaryMin" : "salaryMax", next.pay);
    if (next.verified && mode === "drivers") params.set("verified", "true");
    if (next.q.trim()) params.set("q", next.q.trim());
    const query = params.toString();
    router.push(query ? `${mode === "jobs" ? "/jobs" : "/drivers"}?${query}` : mode === "jobs" ? "/jobs" : "/drivers");
  }

  function pick<K extends "division" | "district" | "vehicle" | "jobType" | "category" | "license">(key: K, value: string) {
    if (key === "division") {
      setDivision(value);
      setDistrict("");
    } else if (key === "district") setDistrict(value);
    else if (key === "vehicle") setVehicle(value);
    else if (key === "jobType") setJobType(value);
    else if (key === "category") setCategory(value);
    else setLicense(value);
    apply({ [key]: value });
  }

  function applyText() {
    const savedExperience = values.experience || values.experienceMin || "";
    const savedPay = values.salaryMax || values.salaryMin || "";
    if (experience === savedExperience && pay === savedPay && q === (values.q || "")) return;
    apply();
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); apply(); }} className="card grid gap-3 p-4">
      <p className="text-sm font-bold">{t("filters")}</p>
      <label className="text-xs font-semibold text-muted">{t("division")}
        <select className="field mt-1" value={division} onChange={(event) => pick("division", event.target.value)}>
          <option value="">{t("any")}</option>
          {locations.map((item) => <option key={item.code} value={item.code}>{placeName(item, lang)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-muted">{t("district")}
        <select className="field mt-1" value={district} onChange={(event) => pick("district", event.target.value)}>
          <option value="">{t("any")}</option>
          {districts.map((item) => <option key={item.code} value={item.code}>{placeName(item, lang)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-muted">{t("vehicle")}
        <select className="field mt-1" value={vehicle} onChange={(event) => pick("vehicle", event.target.value)}>
          <option value="">{t("any")}</option>
          {Object.keys(vehicles).map((key) => <option key={key} value={key}>{label(vehicles, key, lang)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-muted">{t("jobType")}
        <select className="field mt-1" value={jobType} onChange={(event) => pick("jobType", event.target.value)}>
          <option value="">{t("any")}</option>
          {Object.keys(jobTypes).map((key) => <option key={key} value={key}>{label(jobTypes, key, lang)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-muted">{t("category")}
        <select className="field mt-1" value={category} onChange={(event) => pick("category", event.target.value)}>
          <option value="">{t("any")}</option>
          {Object.keys(categories).map((key) => <option key={key} value={key}>{label(categories, key, lang)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-muted">{t("license")}
        <select className="field mt-1" value={license} onChange={(event) => pick("license", event.target.value)}>
          <option value="">{t("any")}</option>
          {Object.keys(licenses).map((key) => <option key={key} value={key}>{label(licenses, key, lang)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-muted">{t("experience")}
        <input className="field mt-1" inputMode="numeric" value={experience} onChange={(event) => setExperience(event.target.value)} onBlur={applyText} placeholder="0" />
      </label>
      <label className="text-xs font-semibold text-muted">{mode === "jobs" ? t("payFloor") : t("payCap")}
        <input className="field mt-1" inputMode="numeric" value={pay} onChange={(event) => setPay(event.target.value)} onBlur={applyText} placeholder="25000" />
      </label>
      <label className="text-xs font-semibold text-muted">{t("query")}
        <input className="field mt-1" value={q} onChange={(event) => setQ(event.target.value)} onBlur={applyText} placeholder={t("query")} />
      </label>
      {mode === "drivers" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verified} onChange={(event) => { setVerified(event.target.checked); apply({ verified: event.target.checked }); }} />
          {t("verifiedOnly")}
        </label>
      )}
    </form>
  );
}

export function Pager({ page, totalPages, path, params }: { page: number; totalPages: number; path: string; params: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;
  function href(next: number) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => { if (value) query.set(key, value); });
    query.set("page", String(next));
    return `${path}?${query.toString()}`;
  }
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm font-semibold">
      {page > 1 && <Link className="btn-line" href={href(page - 1)}>←</Link>}
      <span>{page} / {totalPages}</span>
      {page < totalPages && <Link className="btn-line" href={href(page + 1)}>→</Link>}
    </div>
  );
}
