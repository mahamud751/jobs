"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { api } from "@/lib/api";

type Message = { id: string; name: string; phone?: string; email?: string; subject: string; message: string; isRead: boolean; createdAt: string };

export default function MessagesPage() {
  const [rows, setRows] = useState<Message[]>([]);
  useEffect(() => { api<Message[]>("/admin/messages").then(setRows).catch(() => setRows([])); }, []);
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">বার্তা</h1>
      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <article key={row.id} className="panel p-4">
            <p className="font-bold">{row.subject} {!row.isRead && <span className="text-forest">নতুন</span>}</p>
            <p className="text-sm text-muted">{row.name} · {row.phone} · {row.email}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{row.message}</p>
            {!row.isRead && <button className="btn-line mt-3" onClick={async () => { await api(`/admin/messages/${row.id}/read`, { method: "PATCH" }); setRows(await api<Message[]>("/admin/messages")); }}>পড়া হয়েছে</button>}
          </article>
        ))}
      </div>
    </Shell>
  );
}
