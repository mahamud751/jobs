"use client";

import { useEffect, useState } from "react";
import { Shell, Table } from "@/components/shell";
import { api } from "@/lib/api";

type Plan = { id: string; code: string; nameBn: string; priceBdt: number; interval: string; isActive: boolean; isFuture: boolean; descriptionBn: string };

export default function PlansPage() {
  const [rows, setRows] = useState<Plan[]>([]);
  const [message, setMessage] = useState("");
  async function load() { setRows(await api<Plan[]>("/admin/plans")); }
  useEffect(() => { load().catch(() => setRows([])); }, []);
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">ভবিষ্যৎ আয়ের প্ল্যান</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">প্রাথমিক সংস্করণে সাধারণ বিজ্ঞাপন বিনামূল্যে। পেইড পোস্ট, প্রিমিয়াম, সাবস্ক্রিপশন ও পেমেন্ট গেটওয়ে পরে যুক্ত হবে। চেকআউট এখন 501 দেয়, কারণ bKash, Nagad বা SSLCommerz আলাদা খরচ।</p>
      <div className="mt-4">
        <Table
          headers={["প্ল্যান", "মূল্য", "মেয়াদ", "অবস্থা", ""]}
          rows={rows.map((row) => [
            `${row.nameBn} — ${row.descriptionBn}`,
            `৳${row.priceBdt}`,
            row.interval,
            row.isActive ? "চালু" : "বন্ধ",
            <button key={row.id} className="btn-line" onClick={async () => {
              try {
                await api(`/admin/plans/${row.id}`, { method: "PATCH", body: { isActive: !row.isActive } });
                setMessage("আপডেট হয়েছে। পেমেন্ট এখনো নেওয়া হবে না।");
                await load();
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Error");
              }
            }}>{row.isActive ? "বন্ধ করুন" : "চালু চিহ্ন"}</button>,
          ])}
        />
      </div>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </Shell>
  );
}
