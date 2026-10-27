"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers";
import { api, token } from "@/lib/api";
import { appStatus, label } from "@/lib/labels";

type Row = { id: string; status: string; coverNote?: string; job: { slug: string; title: string; employer: { displayName: string } }; history: { status: string; note?: string | null; createdAt: string }[] };

export default function ApplicationsPage() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api<Row[]>("/applications/me", { token: token() }).then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{bn ? "আমার আবেদন" : "My applications"}</h1>
      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <article key={row.id} className="card p-4">
            <Link href={`/jobs/${row.job.slug}`} className="font-bold">{row.job.title}</Link>
            <p className="text-sm text-muted">{row.job.employer.displayName}</p>
            <p className="mt-2 text-sm font-semibold">{label(appStatus, row.status, lang)}</p>
            <ol className="mt-2 grid gap-1 text-xs text-muted">
              {row.history.map((item, index) => <li key={index}>{label(appStatus, item.status, lang)}{item.note ? ` — ${item.note}` : ""}</li>)}
            </ol>
            {row.status !== "HIRED" && row.status !== "WITHDRAWN" && row.status !== "REJECTED" && (
              <button className="btn-line mt-3" onClick={async () => {
                await api(`/applications/${row.id}`, { method: "PATCH", token: token(), body: { status: "WITHDRAWN" } });
                setRows(await api<Row[]>("/applications/me", { token: token() }));
              }}>{bn ? "প্রত্যাহার" : "Withdraw"}</button>
            )}
          </article>
        ))}
        {!rows.length && <p className="text-muted">{bn ? "এখনো আবেদন করেননি।" : "No applications yet."}</p>}
      </div>
    </div>
  );
}
