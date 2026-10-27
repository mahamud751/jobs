"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { api } from "@/lib/api";

type Stats = {
  drivers: number;
  employers: number;
  activeJobs: number;
  pendingJobs: number;
  applications: number;
  openComplaints: number;
  recentUsers: number;
  deletionRequests: number;
  roles: { role: string; count: number }[];
  jobsByDistrict: { count: number; district?: { nameBn: string } }[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { api<Stats>("/admin/stats").then(setStats).catch(() => setError(true)); }, []);
  const cards = stats ? [
    ["ড্রাইভার", stats.drivers],
    ["নিয়োগকর্তা", stats.employers],
    ["চালু বিজ্ঞাপন", stats.activeJobs],
    ["অনুমোদন বাকি", stats.pendingJobs],
    ["আবেদন", stats.applications],
    ["খোলা অভিযোগ", stats.openComplaints],
    ["৩০ দিনের নতুন অ্যাকাউন্ট", stats.recentUsers],
    ["মুছে ফেলার অনুরোধ", stats.deletionRequests],
  ] : [];
  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-xs font-bold tracking-widest text-forest">আপনার ওয়ার্কস্পেস</p><h1 className="text-3xl font-extrabold">এক নজরে চালক</h1><p className="mt-2 text-sm text-muted">ব্যবহারকারী, বিজ্ঞাপন ও প্ল্যাটফর্মের সর্বশেষ তথ্য।</p></div>
        <Link href="/jobs" className="btn-ink gap-3">বিজ্ঞাপন দেখুন <span aria-hidden="true">↗</span></Link>
      </div>
      {error && <p role="alert" className="panel mt-6 p-5 text-sm text-danger">তথ্য লোড করা যায়নি। আবার চেষ্টা করতে পৃষ্ঠাটি রিফ্রেশ করুন।</p>}
      {!stats && !error && <div role="status" aria-label="লোড হচ্ছে" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="panel h-36 animate-pulse bg-white/70" />)}</div>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value], index) => (
          <div key={String(label)} className="panel stat-card">
            <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-muted">{label}</p><span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${index === 3 || index === 5 ? "bg-gold/15 text-amber-800" : "bg-forest/8 text-forest"}`}>{["◎", "▣", "▤", "◷", "↗", "⚑", "+", "◇"][index]}</span></div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight">{Number(value).toLocaleString("bn-BD")}</p>
          </div>
        ))}
      </div>
      {stats && (
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <div className="panel p-6">
            <div className="flex items-center justify-between border-b border-line pb-4"><h2 className="font-bold">ব্যবহারকারীর ভূমিকা</h2><Link href="/users" className="text-xs font-bold text-forest">সব দেখুন ↗</Link></div>
            <ul className="mt-5 space-y-5">{stats.roles.map((row) => <li key={row.role}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="text-muted">{row.role}</span><span className="font-bold">{row.count.toLocaleString("bn-BD")}</span></div><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-forest" style={{ width: `${row.count / Math.max(1, ...stats.roles.map((item) => item.count)) * 100}%` }} /></div></li>)}</ul>
            {!stats.roles.length && <p className="py-8 text-center text-sm text-muted">কোনো তথ্য পাওয়া যায়নি।</p>}
          </div>
          <div className="panel p-6">
            <div className="flex items-center justify-between border-b border-line pb-4"><h2 className="font-bold">জেলা অনুযায়ী চালু বিজ্ঞাপন</h2><Link href="/locations" className="text-xs font-bold text-forest">এলাকা দেখুন ↗</Link></div>
            <ul className="mt-3 divide-y divide-line">{stats.jobsByDistrict.map((row, index) => <li key={index} className="flex items-center gap-3 py-4"><span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-paper text-forest">⌖</span><span className="text-sm">{row.district?.nameBn || "অন্যান্য"}</span><span className="ml-auto rounded-lg bg-forest/8 px-3 py-1 text-sm font-bold text-forest">{row.count.toLocaleString("bn-BD")}</span></li>)}</ul>
            {!stats.jobsByDistrict.length && <p className="py-8 text-center text-sm text-muted">কোনো চালু বিজ্ঞাপন নেই।</p>}
          </div>
        </div>
      )}
    </Shell>
  );
}
