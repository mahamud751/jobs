"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Table } from "@/components/shell";
import { api } from "@/lib/api";

type Job = { id: string; title: string; status: string; employer: { displayName: string }; district: { nameBn: string }; createdAt: string };

export default function JobsPage() {
  const [rows, setRows] = useState<Job[]>([]);
  const [status, setStatus] = useState("PENDING_APPROVAL");
  function load(next = status) {
    const params = next ? `?status=${next}` : "";
    api<{ data: Job[] }>(`/admin/jobs${params}`).then((result) => setRows(result.data)).catch(() => setRows([]));
  }
  useEffect(() => { load("PENDING_APPROVAL"); }, []);
  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">বিজ্ঞাপন</h1>
        <select className="field max-w-[220px]" value={status} onChange={(event) => { setStatus(event.target.value); load(event.target.value); }}>
          <option value="">সব</option>
          {["DRAFT", "PENDING_APPROVAL", "ACTIVE", "REJECTED", "CLOSED", "EXPIRED"].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="mt-4">
        <Table
          headers={["শিরোনাম", "নিয়োগকর্তা", "জেলা", "স্ট্যাটাস", ""]}
          rows={rows.map((row) => [row.title, row.employer.displayName, row.district.nameBn, row.status, <Link key={row.id} className="font-bold text-forest" href={`/jobs/${row.id}`}>খুলুন</Link>])}
        />
      </div>
    </Shell>
  );
}
