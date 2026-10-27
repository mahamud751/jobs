"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PublicShell } from "@/components/chrome";
import { useI18n } from "@/components/providers";
import { api, saveSession } from "@/lib/api";

export default function LoginPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bn = lang === "bn";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const data = await api<{ accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        body: { identifier: form.get("identifier"), password: form.get("password") },
      });
      saveSession(data.accessToken, data.refreshToken);
      const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <div className="wrap grid items-start gap-8 py-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-forest">{bn ? "আবার স্বাগতম" : "Welcome back"}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{bn ? "লগইন করুন" : "Log in"}</h1>
          <p className="mt-3 max-w-md leading-7 text-muted">{bn ? "ড্রাইভার ও নিয়োগকর্তা একই পাতা থেকে ঢুকবেন। স্টাফ অ্যাডমিন প্যানেল ব্যবহার করবেন।" : "Drivers and employers use this page. Staff use the admin panel."}</p>
          <div className="card mt-6 p-4 text-sm leading-7">
            <p className="font-bold">{bn ? "ডেমো অ্যাকাউন্ট" : "Demo accounts"}</p>
            <p>Admin · 01700000000 · Admin@12345</p>
            <p>Driver · 01711111111 · Driver@12345</p>
            <p>Employer · 01722222221 · Employer@12345</p>
            <a className="mt-2 inline-block font-bold text-forest" href="http://localhost:3001">Admin panel</a>
          </div>
        </div>
        <form onSubmit={submit} className="card grid gap-3 p-6">
          <label className="label">{bn ? "মোবাইল বা ইমেইল" : "Mobile or email"}
            <input className="field mt-1" name="identifier" required placeholder="01XXXXXXXXX" />
          </label>
          <label className="label">{bn ? "পাসওয়ার্ড" : "Password"}
            <input className="field mt-1" name="password" type="password" required />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn-ink" disabled={busy}>{bn ? "লগইন" : "Log in"}</button>
          <p className="text-sm text-muted">{bn ? "অ্যাকাউন্ট নেই?" : "No account?"} <Link className="font-bold text-forest" href="/register">{bn ? "খুলুন" : "Create one"}</Link></p>
        </form>
      </div>
    </PublicShell>
  );
}
