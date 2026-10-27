"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PublicShell } from "@/components/chrome";
import { useI18n } from "@/components/providers";
import { api, saveSession } from "@/lib/api";
import { placeName } from "@/lib/labels";
import { Division } from "@/lib/types";

export default function RegisterPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const bn = lang === "bn";
  const [role, setRole] = useState<"driver" | "employer">("driver");
  const [employerType, setEmployerType] = useState("INDIVIDUAL");
  const [locations, setLocations] = useState<Division[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Division[]>("/locations/tree?activeOnly=true").then(setLocations).catch(() => setLocations([]));
  }, []);
  const districts = locations.flatMap((item) => item.districts);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const phone = String(form.get("phone") || "");
    const password = String(form.get("password") || "");
    const email = String(form.get("email") || "") || undefined;
    const districtCode = String(form.get("districtCode") || "");
    try {
      const path = role === "driver" ? "/auth/register/driver" : "/auth/register/employer";
      const body = role === "driver"
        ? { phone, password, email, fullName: form.get("fullName"), districtCode }
        : {
            phone, password, email, districtCode, type: employerType,
            displayName: form.get("displayName"),
            companyName: form.get("companyName") || undefined,
            contactPerson: form.get("contactPerson") || undefined,
          };
      const data = await api<{ accessToken: string; refreshToken: string; devOtp?: string }>(path, { method: "POST", body });
      saveSession(data.accessToken, data.refreshToken);
      if (data.devOtp) sessionStorage.setItem("chalok_dev_otp", data.devOtp);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <div className="wrap grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{bn ? "অ্যাকাউন্ট খুলুন" : "Create an account"}</h1>
          <p className="mt-3 leading-7 text-muted">{bn ? "ড্রাইভার হলে প্রোফাইল পরে সম্পূর্ণ করবেন। নিয়োগকর্তা হলে বিজ্ঞাপন পাঠাতে পারবেন।" : "Drivers finish their profile next. Employers can post a job after verifying their mobile."}</p>
        </div>
        <form onSubmit={submit} className="card grid gap-3 p-6">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={role === "driver" ? "btn-ink" : "btn-line"} onClick={() => setRole("driver")}>{bn ? "ড্রাইভার" : "Driver"}</button>
            <button type="button" className={role === "employer" ? "btn-ink" : "btn-line"} onClick={() => setRole("employer")}>{bn ? "নিয়োগকর্তা" : "Employer"}</button>
          </div>
          <input className="field" name="phone" required pattern="01[3-9][0-9]{8}" placeholder={bn ? "মোবাইল নম্বর" : "Mobile number"} />
          <input className="field" name="password" required minLength={8} type="password" placeholder={bn ? "পাসওয়ার্ড" : "Password"} />
          <input className="field" name="email" type="email" placeholder={bn ? "ইমেইল (ঐচ্ছিক)" : "Email (optional)"} />
          {role === "driver" ? (
            <input className="field" name="fullName" required placeholder={bn ? "পুরো নাম" : "Full name"} />
          ) : (
            <>
              <select className="field" value={employerType} onChange={(event) => setEmployerType(event.target.value)}>
                <option value="INDIVIDUAL">{bn ? "ব্যক্তি" : "Individual"}</option>
                <option value="COMPANY">{bn ? "প্রতিষ্ঠান" : "Company"}</option>
              </select>
              <input className="field" name="displayName" required placeholder={bn ? "প্রদর্শিত নাম" : "Display name"} />
              {employerType === "COMPANY" && <input className="field" name="companyName" required placeholder={bn ? "প্রতিষ্ঠানের নাম" : "Company name"} />}
              <input className="field" name="contactPerson" placeholder={bn ? "যোগাযোগের ব্যক্তি" : "Contact person"} />
            </>
          )}
          <select className="field" name="districtCode" required defaultValue="">
            <option value="" disabled>{bn ? "জেলা" : "District"}</option>
            {districts.map((item) => <option key={item.code} value={item.code}>{placeName(item, lang)}</option>)}
          </select>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn-gold" disabled={busy}>{bn ? "অ্যাকাউন্ট তৈরি" : "Create account"}</button>
          <p className="text-sm text-muted">{bn ? "আগে থেকে অ্যাকাউন্ট আছে?" : "Already registered?"} <Link href="/login" className="font-bold text-forest">{bn ? "লগইন" : "Log in"}</Link></p>
        </form>
      </div>
    </PublicShell>
  );
}
