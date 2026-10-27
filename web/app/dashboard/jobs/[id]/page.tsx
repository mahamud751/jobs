"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JobEditor } from "@/components/job-editor";
import { useI18n } from "@/components/providers";
import { api, token } from "@/lib/api";
import { appStatus, label } from "@/lib/labels";
import { Driver, Job } from "@/lib/types";

type Applicant = { id: string; status: string; coverNote?: string; driver: Driver & { phone?: string }; history: { status: string; note?: string; createdAt: string }[] };

export default function ManageJobPage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Applicant[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const access = token();
    const rows = await api<Job[]>("/employers/me/jobs", { token: access });
    const found = rows.find((item) => item.id === id) || null;
    setJob(found);
    if (found) setApps(await api<Applicant[]>(`/jobs/${found.id}/applications`, { token: access }));
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, [id]);

  async function setStatus(applicationId: string, status: string) {
    await api(`/applications/${applicationId}`, { method: "PATCH", token: token(), body: { status, note } });
    setNote("");
    await load();
  }

  async function close() {
    await api(`/jobs/${id}/close`, { method: "POST", token: token() });
    await load();
  }

  if (!job) return <p className="text-muted">{error || (bn ? "লোড হচ্ছে…" : "Loading…")}</p>;
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">{job.title}</h1>
        <button className="btn-line" onClick={close}>{bn ? "বন্ধ করুন" : "Close"}</button>
      </div>
      {job.rejectionReason && <p className="text-sm text-danger">{job.rejectionReason}</p>}
      <JobEditor job={job} />
      <section>
        <h2 className="text-xl font-extrabold">{bn ? "আবেদনকারী" : "Applicants"}</h2>
        <textarea className="area mt-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder={bn ? "সাক্ষাৎকারের নোট" : "Note for the driver"} />
        <div className="mt-3 grid gap-3">
          {apps.map((item) => (
            <article key={item.id} className="card p-4">
              <p className="font-bold">{item.driver.fullName} · {item.driver.phone}</p>
              <p className="text-sm text-muted">{label(appStatus, item.status, lang)}</p>
              {item.coverNote && <p className="mt-2 text-sm">{item.coverNote}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {["UNDER_REVIEW", "INTERVIEW", "HIRED", "REJECTED"].map((status) => (
                  <button key={status} className="btn-line" onClick={() => setStatus(item.id, status)}>{label(appStatus, status, lang)}</button>
                ))}
              </div>
            </article>
          ))}
          {!apps.length && <p className="text-sm text-muted">{bn ? "এখনো আবেদন নেই।" : "No applications yet."}</p>}
        </div>
      </section>
    </div>
  );
}
