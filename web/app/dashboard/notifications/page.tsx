"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMe } from "../layout";
import { useI18n } from "@/components/providers";
import { api, token } from "@/lib/api";
import { when } from "@/lib/format";

type Note = { id: string; title: string; body: string; isRead: boolean; createdAt: string; meta?: { slug?: string } | null };

export default function NotificationsPage() {
  const { refresh } = useMe();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [rows, setRows] = useState<Note[]>([]);

  async function load() {
    const data = await api<{ data: Note[] }>("/notifications", { token: token() });
    setRows(data.data);
  }
  useEffect(() => { load().catch(() => setRows([])); }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">{bn ? "নোটিশ" : "Notices"}</h1>
        <button className="btn-line" onClick={async () => { await api("/notifications/read-all", { method: "POST", token: token() }); await load(); await refresh(); }}>{bn ? "সব পড়া হয়েছে" : "Mark all read"}</button>
      </div>
      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <article key={row.id} className={`card p-4 ${row.isRead ? "opacity-70" : ""}`}>
            <p className="font-bold">{row.title}</p>
            <p className="text-sm leading-6">{row.body}</p>
            <p className="mt-1 text-xs text-muted">{when(row.createdAt, lang)}</p>
            {row.meta?.slug && <Link className="text-sm font-bold text-forest" href={`/jobs/${row.meta.slug}`}>{bn ? "চাকরি দেখুন" : "View job"}</Link>}
            {!row.isRead && <button className="ml-3 text-sm font-bold" onClick={async () => { await api(`/notifications/${row.id}/read`, { method: "PATCH", token: token() }); await load(); await refresh(); }}>{bn ? "পড়া হয়েছে" : "Read"}</button>}
          </article>
        ))}
        {!rows.length && <p className="text-muted">{bn ? "কোনো নোটিশ নেই।" : "No notices."}</p>}
      </div>
    </div>
  );
}
