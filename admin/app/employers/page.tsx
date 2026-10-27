"use client";

import { useEffect, useState } from "react";
import { Shell, Table } from "@/components/shell";
import { api } from "@/lib/api";

type Row = { id: string; displayName: string; type: string; isVerified: boolean; companyName?: string; user: { phone: string; isBlocked: boolean }; _count: { jobs: number } };

export default function EmployersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  async function load() { setRows((await api<{ data: Row[] }>("/admin/employers")).data); }
  useEffect(() => { load().catch(() => setRows([])); }, []);
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">নিয়োগকর্তা</h1>
      <div className="mt-4">
        <Table
          headers={["নাম", "ধরন", "ফোন", "বিজ্ঞাপন", "যাচাই"]}
          rows={rows.map((row) => [
            row.companyName || row.displayName,
            row.type,
            row.user.phone,
            row._count.jobs,
            <button key={row.id} className="btn-line" onClick={async () => { await api(`/admin/employers/${row.id}`, { method: "PATCH", body: { isVerified: !row.isVerified } }); await load(); }}>{row.isVerified ? "যাচাইকৃত" : "যাচাই করুন"}</button>,
          ])}
        />
      </div>
    </Shell>
  );
}
