"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Table } from "@/components/shell";
import { api } from "@/lib/api";

type Row = { id: string; fullName: string; phone?: string; verificationStatus?: string; experienceYears: number; district?: { nameBn: string }; blocked?: boolean };

export default function DriversPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [verification, setVerification] = useState("");

  function load(query = "") {
    api<{ data: Row[] }>(`/admin/drivers${query}`).then((result) => setRows(result.data)).catch(() => setRows([]));
  }
  useEffect(() => { load(); }, []);

  function search(next: { q?: string; verification?: string } = {}) {
    const query = next.q ?? q;
    const status = next.verification ?? verification;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("verification", status);
    const text = params.toString();
    load(text ? `?${text}` : "");
  }

  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">ড্রাইভার</h1>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); search(); }}>
        <input className="field max-w-xs" value={q} onChange={(event) => setQ(event.target.value)} onBlur={() => search()} placeholder="নাম বা ফোন" />
        <select className="field max-w-[180px]" value={verification} onChange={(event) => { setVerification(event.target.value); search({ verification: event.target.value }); }}>
          <option value="">সব স্ট্যাটাস</option>
          {["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].map((item) => <option key={item}>{item}</option>)}
        </select>
      </form>
      <div className="mt-4">
        <Table
          headers={["নাম", "ফোন", "জেলা", "অভিজ্ঞতা", "যাচাই", ""]}
          rows={rows.map((row) => [row.fullName, row.phone, row.district?.nameBn, `${row.experienceYears} বছর`, row.verificationStatus, <Link key={row.id} className="font-bold text-forest" href={`/drivers/${row.id}`}>খুলুন</Link>])}
        />
      </div>
    </Shell>
  );
}
