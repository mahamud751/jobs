"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMe } from "../layout";
import { useI18n } from "@/components/providers";
import { api, token } from "@/lib/api";

type Row = {
  id: string;
  message?: string;
  status: string;
  driver: { id: string; fullName: string };
  phone?: string;
  from: { name?: string | null };
};

export default function ContactsPage() {
  const { me } = useMe();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    setRows(await api<Row[]>("/contact-requests", { token: token() }));
  }
  useEffect(() => { load().catch(() => setRows([])); }, []);

  async function respond(id: string, status: "ACCEPTED" | "DECLINED") {
    await api(`/contact-requests/${id}`, { method: "PATCH", token: token(), body: { status } });
    await load();
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{bn ? "যোগাযোগ" : "Contact requests"}</h1>
      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <article key={row.id} className="card p-4">
            <p className="font-bold">{me.role === "DRIVER" ? row.from.name : row.driver.fullName}</p>
            <p className="text-sm text-muted">{row.message}</p>
            <p className="mt-2 text-sm font-semibold">{row.status}</p>
            {row.phone && <p className="mt-2 font-bold">{row.phone}</p>}
            {me.role === "DRIVER" && row.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <button className="btn-ink" onClick={() => respond(row.id, "ACCEPTED")}>{bn ? "অনুমতি" : "Allow"}</button>
                <button className="btn-line" onClick={() => respond(row.id, "DECLINED")}>{bn ? "না" : "Decline"}</button>
              </div>
            )}
            {me.role === "EMPLOYER" && <Link className="mt-2 inline-block text-sm font-bold text-forest" href={`/drivers/${row.driver.id}`}>{bn ? "প্রোফাইল" : "Profile"}</Link>}
          </article>
        ))}
        {!rows.length && <p className="text-muted">{bn ? "কোনো অনুরোধ নেই।" : "No requests."}</p>}
      </div>
    </div>
  );
}
