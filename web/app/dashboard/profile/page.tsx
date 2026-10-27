"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMe } from "../layout";
import { useI18n } from "@/components/providers";
import { api, token } from "@/lib/api";
import { categories, jobTypes, label, licenses, placeName, vehicles } from "@/lib/labels";
import { Division } from "@/lib/types";

export default function ProfilePage() {
  const { me, refresh } = useMe();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [locations, setLocations] = useState<Division[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formRev, setFormRev] = useState(0);
  const access = token();

  useEffect(() => {
    api<Division[]>("/locations/tree?activeOnly=true").then(setLocations).catch(() => setLocations([]));
  }, []);

  const districts = locations.flatMap((item) => item.districts);
  const driver = me.driver;
  const selectedAreas = useMemo(() => districts, [districts]);

  async function saveDriver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!driver) return;
    const form = new FormData(event.currentTarget);
    const picked = form.getAll("vehicles").map(String);
    const cats = form.getAll("categories").map(String);
    setError("");
    try {
      await api("/drivers/me", {
        method: "PATCH",
        token: access,
        body: {
          fullName: form.get("fullName"),
          bio: form.get("bio"),
          addressLine: form.get("addressLine"),
          districtCode: form.get("districtCode"),
          areaId: form.get("areaId") || null,
          workDistrictCode: form.get("workDistrictCode") || null,
          licenseClass: form.get("licenseClass") || undefined,
          licenseNumber: form.get("licenseNumber") || undefined,
          licenseExpiry: form.get("licenseExpiry") || null,
          experienceYears: Number(form.get("experienceYears") || 0),
          expectedSalaryMin: form.get("expectedSalaryMin") ? Number(form.get("expectedSalaryMin")) : null,
          expectedSalaryMax: form.get("expectedSalaryMax") ? Number(form.get("expectedSalaryMax")) : null,
          jobPreference: form.get("jobPreference") || undefined,
          drivingCategories: cats,
          vehicles: picked,
          isJobSeeker: form.get("isJobSeeker") === "on",
          isAvailable: form.get("isAvailable") === "on",
          educationLevel: form.get("educationLevel"),
        },
      });
      setMessage(bn ? "প্রোফাইল সেভ হয়েছে।" : "Profile saved.");
      await refresh();
      setFormRev((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function saveEmployer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/employers/me", {
        method: "PATCH",
        token: access,
        body: {
          displayName: form.get("displayName"),
          companyName: form.get("companyName"),
          contactPerson: form.get("contactPerson"),
          about: form.get("about"),
          addressLine: form.get("addressLine"),
          website: form.get("website"),
          districtCode: form.get("districtCode"),
          type: form.get("type"),
        },
      });
      setMessage(bn ? "প্রোফাইল সেভ হয়েছে।" : "Profile saved.");
      await refresh();
      setFormRev((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function upload(kind: "photo" | "file", field: string, extra?: string) {
    const input = document.getElementById(field) as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    const form = new FormData();
    if (kind === "photo") form.append("photo", file);
    else {
      form.append("file", file);
      form.append("kind", extra || "LICENSE");
    }
    await api(kind === "photo" ? "/drivers/me/photo" : "/drivers/me/documents", { method: "POST", token: access, form });
    await refresh();
  }

  async function addExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/drivers/me/experiences", {
      method: "POST",
      token: access,
      body: {
        employer: form.get("employer"),
        role: form.get("role"),
        vehicleType: form.get("vehicleType") || undefined,
        category: form.get("category") || undefined,
        startYear: Number(form.get("startYear")),
        endYear: form.get("endYear") ? Number(form.get("endYear")) : null,
        description: form.get("description"),
      },
    });
    event.currentTarget.reset();
    await refresh();
  }

  async function addReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/drivers/me/references", {
      method: "POST",
      token: access,
      body: { name: form.get("name"), phone: form.get("phone"), relation: form.get("relation"), note: form.get("note") },
    });
    event.currentTarget.reset();
    await refresh();
  }

  return (
    <div className="grid gap-5">
      <h1 className="text-3xl font-extrabold">{bn ? "প্রোফাইল" : "Profile"}</h1>
      {message && <p className="text-sm font-semibold text-forest">{message}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {driver && locations.length === 0 && <p className="text-sm text-muted">{bn ? "এলাকার তালিকা লোড হচ্ছে…" : "Loading locations…"}</p>}
      {driver && locations.length > 0 && (
        <>
          <form key={formRev} onSubmit={saveDriver} className="card grid gap-3 p-5">
            <input className="field" name="fullName" defaultValue={driver.fullName} required />
            <textarea className="area" name="bio" defaultValue={driver.bio || ""} placeholder={bn ? "সংক্ষিপ্ত পরিচিতি" : "Short introduction"} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="field" name="districtCode" defaultValue={driver.district?.code || ""}>
                {districts.map((item) => <option key={item.code} value={item.code}>{placeName(item, lang)}</option>)}
              </select>
              <select className="field" name="areaId" defaultValue={driver.area?.id || ""}>
                <option value="">{bn ? "এলাকা" : "Area"}</option>
                {selectedAreas.flatMap((item) => item.areas.map((area) => (
                  <option key={area.id} value={area.id}>{placeName(item, lang)} — {placeName(area, lang)}</option>
                )))}
              </select>
              <select className="field" name="workDistrictCode" defaultValue={driver.workDistrict?.code || ""}>
                <option value="">{bn ? "পছন্দের কর্মস্থল" : "Preferred workplace"}</option>
                {districts.map((item) => <option key={item.code} value={item.code}>{placeName(item, lang)}</option>)}
              </select>
              <input className="field" name="addressLine" defaultValue={driver.addressLine || ""} placeholder={bn ? "ঠিকানা (গোপন)" : "Address (private)"} />
              <select className="field" name="licenseClass" defaultValue={driver.licenseClass || ""}>
                <option value="">{bn ? "লাইসেন্স শ্রেণি" : "Licence class"}</option>
                {Object.keys(licenses).map((key) => <option key={key} value={key}>{label(licenses, key, lang)}</option>)}
              </select>
              <input className="field" name="licenseNumber" defaultValue={driver.licenseNumber || ""} placeholder={bn ? "লাইসেন্স নম্বর (গোপন)" : "Licence number (private)"} />
              <input className="field" name="licenseExpiry" type="date" defaultValue={driver.licenseExpiry?.slice(0, 10) || ""} />
              <input className="field" name="experienceYears" type="number" min={0} defaultValue={driver.experienceYears} placeholder={bn ? "অভিজ্ঞতা (বছর)" : "Years"} />
              <input className="field" name="expectedSalaryMin" type="number" defaultValue={driver.expectedSalaryMin || ""} placeholder={bn ? "সর্বনিম্ন বেতন" : "Minimum pay"} />
              <input className="field" name="expectedSalaryMax" type="number" defaultValue={driver.expectedSalaryMax || ""} placeholder={bn ? "সর্বোচ্চ বেতন" : "Maximum pay"} />
              <select className="field" name="jobPreference" defaultValue={driver.jobPreference || ""}>
                <option value="">{bn ? "কাজের ধরন" : "Job type"}</option>
                {Object.keys(jobTypes).map((key) => <option key={key} value={key}>{label(jobTypes, key, lang)}</option>)}
              </select>
              <input className="field" name="educationLevel" defaultValue={driver.educationLevel || ""} placeholder={bn ? "শিক্ষা" : "Education"} />
            </div>
            <fieldset className="grid gap-2 sm:grid-cols-3">
              <legend className="mb-1 text-sm font-bold">{bn ? "গাড়ি" : "Vehicles"}</legend>
              {Object.keys(vehicles).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="vehicles" value={key} defaultChecked={driver.vehicles.includes(key)} />
                  {label(vehicles, key, lang)}
                </label>
              ))}
            </fieldset>
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="mb-1 text-sm font-bold">{bn ? "কাজের ক্ষেত্র" : "Context"}</legend>
              {Object.keys(categories).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="categories" value={key} defaultChecked={driver.drivingCategories.includes(key)} />
                  {label(categories, key, lang)}
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isJobSeeker" defaultChecked={driver.isJobSeeker !== false} />{bn ? "চাকরি খুঁজছি" : "Looking for work"}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isAvailable" defaultChecked={driver.isAvailable} />{bn ? "এখন উপলভ্য" : "Available now"}</label>
            <button className="btn-ink w-fit">{bn ? "সেভ করুন" : "Save"}</button>
          </form>
          <div className="card grid gap-3 p-5">
            <p className="font-bold">{bn ? "ছবি ও কাগজপত্র" : "Photo and documents"}</p>
            <p className="text-sm text-muted">{bn ? "লাইসেন্স ও এনআইডি শুধু আপনি এবং অ্যাডমিন দেখতে পাবেন।" : "Licence and NID files are visible only to you and an admin."}</p>
            <input id="photo" type="file" accept="image/*" />
            <button className="btn-line w-fit" type="button" onClick={() => upload("photo", "photo")}>{bn ? "ছবি দিন" : "Upload photo"}</button>
            <input id="doc" type="file" accept="image/*,.pdf" />
            <div className="flex flex-wrap gap-2">
              {["LICENSE", "NID", "EXPERIENCE_PROOF"].map((kind) => (
                <button key={kind} className="btn-line" type="button" onClick={() => upload("file", "doc", kind)}>{kind}</button>
              ))}
            </div>
            <ul className="text-sm text-muted">
              {driver.documents?.map((doc) => <li key={doc.id}>{doc.kind}: {doc.fileName}</li>)}
            </ul>
          </div>
          <form onSubmit={addExperience} className="card grid gap-2 p-5 sm:grid-cols-2">
            <p className="font-bold sm:col-span-2">{bn ? "আগের কাজ" : "Past work"}</p>
            {driver.experiences.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm sm:col-span-2">
                <span>{item.role} · {item.employer} · {item.startYear}</span>
                <button type="button" className="font-bold text-danger" onClick={async () => { await api(`/drivers/me/experiences/${item.id}`, { method: "DELETE", token: access }); await refresh(); }}>✕</button>
              </div>
            ))}
            <input className="field" name="employer" required placeholder={bn ? "নিয়োগকর্তা" : "Employer"} />
            <input className="field" name="role" required placeholder={bn ? "পদ" : "Role"} />
            <input className="field" name="startYear" required type="number" placeholder="2018" />
            <input className="field" name="endYear" type="number" placeholder="2024" />
            <button className="btn-line sm:col-span-2 w-fit">{bn ? "অভিজ্ঞতা যোগ" : "Add experience"}</button>
          </form>
          <form onSubmit={addReference} className="card grid gap-2 p-5 sm:grid-cols-2">
            <p className="font-bold sm:col-span-2">{bn ? "রেফারেন্স" : "References"}</p>
            {driver.references?.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm sm:col-span-2">
                <span>{item.name} · {item.relation}</span>
                <button type="button" className="font-bold text-danger" onClick={async () => { await api(`/drivers/me/references/${item.id}`, { method: "DELETE", token: access }); await refresh(); }}>✕</button>
              </div>
            ))}
            <input className="field" name="name" required placeholder={bn ? "নাম" : "Name"} />
            <input className="field" name="phone" placeholder={bn ? "ফোন" : "Phone"} />
            <input className="field" name="relation" placeholder={bn ? "সম্পর্ক" : "Relation"} />
            <input className="field" name="note" placeholder={bn ? "নোট" : "Note"} />
            <button className="btn-line w-fit sm:col-span-2">{bn ? "রেফারেন্স যোগ" : "Add reference"}</button>
          </form>
          <div className="card flex flex-wrap gap-2 p-5">
            <button className="btn-line" onClick={async () => { await api("/drivers/me/activation", { method: "POST", token: access, body: { active: !driver.isProfileActive } }); await refresh(); }}>
              {driver.isProfileActive ? (bn ? "প্রোফাইল সাময়িক বন্ধ" : "Hide profile") : (bn ? "আবার চালু" : "Activate")}
            </button>
            <button className="btn-line" onClick={async () => { await api("/privacy/me/deletion", { method: "POST", token: access }); await refresh(); }}>{bn ? "মুছে ফেলার অনুরোধ" : "Request deletion"}</button>
          </div>
        </>
      )}
      {me.employer && locations.length > 0 && (
        <form key={formRev} onSubmit={saveEmployer} className="card grid gap-3 p-5">
          <select className="field" name="type" defaultValue={me.employer.type}>
            <option value="INDIVIDUAL">{bn ? "ব্যক্তি" : "Individual"}</option>
            <option value="COMPANY">{bn ? "প্রতিষ্ঠান" : "Company"}</option>
          </select>
          <input className="field" name="displayName" defaultValue={me.employer.displayName} required />
          <input className="field" name="companyName" defaultValue={me.employer.companyName || ""} placeholder={bn ? "প্রতিষ্ঠানের নাম" : "Company"} />
          <input className="field" name="contactPerson" defaultValue={me.employer.contactPerson || ""} placeholder={bn ? "যোগাযোগের ব্যক্তি" : "Contact person"} />
          <textarea className="area" name="about" defaultValue={me.employer.about || ""} />
          <input className="field" name="addressLine" defaultValue={me.employer.addressLine || ""} placeholder={bn ? "ঠিকানা" : "Address"} />
          <input className="field" name="website" defaultValue={me.employer.website || ""} placeholder="Website" />
          <select className="field" name="districtCode" defaultValue={me.employer.district?.code || ""}>
            {districts.map((item) => <option key={item.code} value={item.code}>{placeName(item, lang)}</option>)}
          </select>
          <button className="btn-ink w-fit">{bn ? "সেভ করুন" : "Save"}</button>
          <button type="button" className="btn-line w-fit" onClick={async () => { await api("/privacy/me/deletion", { method: "POST", token: access }); await refresh(); }}>{bn ? "মুছে ফেলার অনুরোধ" : "Request deletion"}</button>
        </form>
      )}
    </div>
  );
}
