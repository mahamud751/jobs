"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMe } from "./layout";
import { useI18n } from "@/components/providers";
import { api } from "@/lib/api";

export default function OverviewPage() {
  const { me, refresh } = useMe();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [code, setCode] = useState("");
  const [hint, setHint] = useState("");
  const [message, setMessage] = useState("");

  async function sendOtp() {
    const data = await api<{ devOtp?: string }>("/auth/otp/request", { method: "POST", body: { phone: me.phone, purpose: "verify" } });
    setHint(data.devOtp || sessionStorage.getItem("chalok_dev_otp") || "");
    setMessage(bn ? "কোড পাঠানো হয়েছে। লোকাল মোডে কোড নিচে দেখা যাচ্ছে, এসএমএস গেটওয়ে এখনো যুক্ত নয়।" : "Code created. SMS is not connected, so the local code is shown below.");
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    await api("/auth/otp/verify", { method: "POST", body: { phone: me.phone, code } });
    sessionStorage.removeItem("chalok_dev_otp");
    await refresh();
  }

  const driver = me.driver;
  const checks = driver ? [
    [!!driver.fullName, bn ? "নাম" : "Name"],
    [!!driver.vehicles?.length, bn ? "গাড়ির ধরন" : "Vehicle"],
    [driver.experienceYears > 0, bn ? "অভিজ্ঞতা" : "Experience"],
    [!!driver.licenseClass, bn ? "লাইসেন্সের শ্রেণি" : "Licence class"],
    [me.phoneVerified, bn ? "মোবাইল যাচাই" : "Mobile verified"],
  ] : [];

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{bn ? `স্বাগতম, ${me.name || ""}` : `Hello, ${me.name || ""}`}</h1>
      {!me.phoneVerified && (
        <form onSubmit={verify} className="card grid gap-3 p-5">
          <p className="font-bold">{bn ? "মোবাইল নম্বর যাচাই করুন" : "Verify your mobile"}</p>
          <p className="text-sm text-muted">{me.phone}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-line" onClick={sendOtp}>{bn ? "কোড নিন" : "Get code"}</button>
            <input className="field max-w-[140px]" value={code} onChange={(event) => setCode(event.target.value)} placeholder="000000" />
            <button className="btn-ink">{bn ? "যাচাই" : "Verify"}</button>
          </div>
          {hint && <p className="text-sm font-semibold">OTP: {hint}</p>}
          {message && <p className="text-sm text-muted">{message}</p>}
        </form>
      )}
      {driver && (
        <div className="card p-5">
          <p className="font-bold">{bn ? "প্রোফাইল" : "Profile"} · {driver.verificationStatus}</p>
          <ul className="mt-3 grid gap-1 text-sm">
            {checks.map(([ok, label]) => <li key={String(label)}>{ok ? "✓" : "○"} {label}</li>)}
          </ul>
          <Link href="/dashboard/profile" className="btn-gold mt-4">{bn ? "প্রোফাইল সম্পাদনা" : "Edit profile"}</Link>
        </div>
      )}
      {me.employer && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [me.employer.jobs.total, bn ? "মোট বিজ্ঞাপন" : "Jobs"],
            [me.employer.jobs.pending, bn ? "অনুমোদনের অপেক্ষায়" : "Pending"],
            [me.employer.jobs.active, bn ? "চালু" : "Active"],
          ].map(([value, label]) => (
            <div key={String(label)} className="card p-4">
              <p className="text-2xl font-extrabold">{value}</p>
              <p className="text-sm text-muted">{label}</p>
            </div>
          ))}
          <Link href="/jobs/new" className="btn-gold">{bn ? "বিজ্ঞাপন দিন" : "Post a job"}</Link>
          <Link href="/drivers" className="btn-ink">{bn ? "ড্রাইভার খুঁজুন" : "Find drivers"}</Link>
        </div>
      )}
      {me.deletionRequestedAt && <p className="text-sm text-muted">{bn ? "মুছে ফেলার অনুরোধ অ্যাডমিনের কাছে আছে।" : "A deletion request is waiting for an admin."}</p>}
    </div>
  );
}
