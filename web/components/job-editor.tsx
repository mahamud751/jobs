"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./providers";
import { api, token } from "@/lib/api";
import { categories, jobTypes, label, licenses, placeName, vehicles } from "@/lib/labels";
import { Division, Job } from "@/lib/types";

export function JobEditor({ job }: { job?: Job }) {
  const { lang } = useI18n();
  const router = useRouter();
  const bn = lang === "bn";
  const [locations, setLocations] = useState<Division[]>([]);
  const [district, setDistrict] = useState(job?.district.code || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    api<Division[]>("/locations/tree?activeOnly=true").then(setLocations).catch(() => setLocations([]));
  }, []);
  const areas = locations.flatMap((item) => item.districts).find((item) => item.code === district)?.areas || [];

  async function submit(asDraft: boolean) {
    const access = token();
    if (!access) {
      router.push("/login?next=/jobs/new");
      return;
    }
    const formEl = formRef.current;
    if (!formEl) return;
    const form = new FormData(formEl);
    setBusy(true);
    setError("");
    const body = {
      title: form.get("title"),
      description: form.get("description"),
      districtCode: district,
      areaId: form.get("areaId") || null,
      areaText: form.get("areaText"),
      vehicleType: form.get("vehicleType"),
      salaryMin: form.get("salaryMin") ? Number(form.get("salaryMin")) : null,
      salaryMax: form.get("salaryMax") ? Number(form.get("salaryMax")) : null,
      salaryNegotiable: form.get("salaryNegotiable") === "on",
      workingHours: form.get("workingHours"),
      holidays: form.get("holidays"),
      experienceRequired: Number(form.get("experienceRequired") || 0),
      licenseClass: form.get("licenseClass") || undefined,
      jobType: form.get("jobType"),
      drivingCategory: form.get("drivingCategory") || undefined,
      deadline: form.get("deadline") || null,
      applyInstructions: form.get("applyInstructions"),
      showPhone: form.get("showPhone") === "on",
      submit: !asDraft,
    };
    try {
      await api(job ? `/jobs/${job.id}` : "/jobs", { method: job ? "PATCH" : "POST", token: access, body });
      router.push("/dashboard/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={(event) => { event.preventDefault(); submit(false); }} className="card grid gap-3 p-5">
      <input className="field" name="title" required defaultValue={job?.title} placeholder={bn ? "পদের নাম" : "Job title"} />
      <textarea className="area" name="description" required minLength={20} defaultValue={job?.description} placeholder={bn ? "কাজের বিবরণ" : "Description"} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="field" value={district} onChange={(event) => setDistrict(event.target.value)} required>
          <option value="">{bn ? "জেলা" : "District"}</option>
          {locations.flatMap((item) => item.districts).map((item) => <option key={item.code} value={item.code}>{placeName(item, lang)}</option>)}
        </select>
        <select key={district + areas.length} className="field" name="areaId" defaultValue={job?.area?.id || ""}>
          <option value="">{bn ? "থানা / উপজেলা" : "Thana / upazila"}</option>
          {areas.map((item) => <option key={item.id} value={item.id}>{placeName(item, lang)}</option>)}
        </select>
        <input className="field" name="areaText" defaultValue={job?.areaText || ""} placeholder={bn ? "নির্দিষ্ট এলাকা" : "Neighbourhood"} />
        <select className="field" name="vehicleType" defaultValue={job?.vehicleType || "PRIVATE_CAR"} required>
          {Object.keys(vehicles).map((key) => <option key={key} value={key}>{label(vehicles, key, lang)}</option>)}
        </select>
        <select className="field" name="jobType" defaultValue={job?.jobType || "FULL_TIME"}>
          {Object.keys(jobTypes).map((key) => <option key={key} value={key}>{label(jobTypes, key, lang)}</option>)}
        </select>
        <select className="field" name="drivingCategory" defaultValue={job?.drivingCategory || ""}>
          <option value="">{bn ? "কাজের ক্ষেত্র" : "Context"}</option>
          {Object.keys(categories).map((key) => <option key={key} value={key}>{label(categories, key, lang)}</option>)}
        </select>
        <select className="field" name="licenseClass" defaultValue={job?.licenseClass || ""}>
          <option value="">{bn ? "লাইসেন্স" : "Licence"}</option>
          {Object.keys(licenses).map((key) => <option key={key} value={key}>{label(licenses, key, lang)}</option>)}
        </select>
        <input className="field" name="experienceRequired" type="number" defaultValue={job?.experienceRequired || 0} placeholder={bn ? "অভিজ্ঞতা (বছর)" : "Years required"} />
        <input className="field" name="salaryMin" type="number" defaultValue={job?.salaryMin || ""} placeholder={bn ? "সর্বনিম্ন বেতন" : "Minimum pay"} />
        <input className="field" name="salaryMax" type="number" defaultValue={job?.salaryMax || ""} placeholder={bn ? "সর্বোচ্চ বেতন" : "Maximum pay"} />
        <input className="field" name="workingHours" defaultValue={job?.workingHours || ""} placeholder={bn ? "কাজের সময়" : "Hours"} />
        <input className="field" name="holidays" defaultValue={job?.holidays || ""} placeholder={bn ? "ছুটি" : "Leave"} />
        <input className="field" name="deadline" type="date" defaultValue={job?.deadline?.slice(0, 10) || ""} />
      </div>
      <textarea className="area" name="applyInstructions" defaultValue={job?.applyInstructions || ""} placeholder={bn ? "আবেদনের নির্দেশনা" : "How to apply"} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="salaryNegotiable" defaultChecked={job?.salaryNegotiable} />{bn ? "বেতন আলোচনাসাপেক্ষ" : "Pay is negotiable"}</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="showPhone" defaultChecked={job?.showPhone} />{bn ? "বিজ্ঞাপনে আমার ফোন দেখান" : "Show my phone on the job"}</label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-gold" disabled={busy}>{bn ? "অনুমোদনের জন্য পাঠান" : "Submit for approval"}</button>
        <button type="button" className="btn-line" disabled={busy} onClick={() => submit(true)}>{bn ? "খসড়া রাখুন" : "Save draft"}</button>
      </div>
    </form>
  );
}
