"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/shell";
import { api } from "@/lib/api";

type Job = {
  id: string;
  title: string;
  description: string;
  status: string;
  salaryMin?: number;
  salaryMax?: number;
  featured?: boolean;
  employer: { displayName: string; phone?: string };
  district: { nameBn: string };
  applications?: { id: string; status: string; driver: { fullName: string } }[];
};

export default function JobReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function load() { setJob(await api<Job>(`/admin/jobs/${id}`)); }
  useEffect(() => { load().catch(() => setJob(null)); }, [id]);

  async function approve() {
    await api(`/admin/jobs/${id}/approve`, { method: "POST" });
    setMessage("অনুমোদন হয়েছে");
    await load();
  }
  async function reject(event: FormEvent) {
    event.preventDefault();
    await api(`/admin/jobs/${id}/reject`, { method: "POST", body: { reason } });
    setMessage("বাতিল হয়েছে");
    await load();
  }

  if (!job) return <Shell><p>লোড হচ্ছে…</p></Shell>;
  return (
    <Shell>
      <p className="text-sm font-bold text-forest">{job.status} · {job.district.nameBn}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{job.title}</h1>
      <p className="mt-2 text-sm text-muted">{job.employer.displayName} {job.employer.phone ? `· ${job.employer.phone}` : ""}</p>
      <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7">{job.description}</p>
      <p className="mt-3 font-bold">৳{job.salaryMin || "—"} – ৳{job.salaryMax || "—"}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-ink" onClick={approve}>অনুমোদন</button>
        <button className="btn-gold" onClick={async () => { await api(`/admin/jobs/${id}/featured`, { method: "PATCH", body: { featured: !job.featured } }); await load(); }}>{job.featured ? "ফিচার সরান" : "প্রিমিয়াম স্থান"}</button>
      </div>
      <form onSubmit={reject} className="mt-4 flex flex-wrap gap-2">
        <input className="field max-w-md" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="বাতিলের কারণ" required />
        <button className="btn-line">বাতিল</button>
      </form>
      {message && <p className="mt-3 text-sm text-forest">{message}</p>}
      <h2 className="mt-8 font-extrabold">আবেদন</h2>
      <ul className="mt-2 text-sm">{job.applications?.map((item) => <li key={item.id}>{item.driver.fullName} · {item.status}</li>)}</ul>
    </Shell>
  );
}
