"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, STAFF } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    try {
      const data = await api<{ accessToken: string; user: { role: string } }>("/auth/login", {
        method: "POST",
        auth: false,
        body: { identifier: form.get("identifier"), password: form.get("password") },
      });
      if (!STAFF.includes(data.user.role)) throw new Error("এই প্যানেল শুধু স্টাফের জন্য।");
      localStorage.setItem("chalok_admin_token", data.accessToken);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top_right,#dcebe1,transparent_60%)] px-4 py-12">
      <form onSubmit={submit} className="panel w-full max-w-md p-8 sm:p-10">
        <span aria-hidden="true" className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-3xl text-gold">◎</span><p className="text-xs font-bold uppercase tracking-[.2em] text-forest">Chalok Workspace</p>
        <h1 className="mt-2 text-3xl font-extrabold">অ্যাডমিন লগইন</h1>
        <p className="mt-3 text-sm leading-6 text-muted">চালক ম্যানেজমেন্ট প্যানেলে স্বাগতম। আপনার অ্যাকাউন্টে প্রবেশ করুন।</p>
        <div className="mt-7 grid gap-5">
          <label className="text-sm font-semibold">মোবাইল বা ইমেইল<input className="field mt-2" name="identifier" autoComplete="username" required placeholder="মোবাইল বা ইমেইল" /></label>
          <label className="text-sm font-semibold">পাসওয়ার্ড<input className="field mt-2" name="password" type="password" autoComplete="current-password" required placeholder="পাসওয়ার্ড" /></label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn-ink">ঢুকুন</button>
        </div>
      </form>
    </div>
  );
}
