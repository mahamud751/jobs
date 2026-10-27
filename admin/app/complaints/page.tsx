"use client";

import { useEffect, useState } from "react";
import { Shell, Table } from "@/components/shell";
import { api } from "@/lib/api";

type Row = { id: string; type: string; description: string; status: string; reporter: { name: string | null; phone: string } };

export default function ComplaintsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  async function load() { setRows((await api<{ data: Row[] }>("/admin/complaints")).data); }
  useEffect(() => { load().catch(() => setRows([])); }, []);
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">অভিযোগ</h1>
      <div className="mt-4">
        <Table
          headers={["ধরন", "বিবরণ", "রিপোর্টার", "অবস্থা"]}
          rows={rows.map((row) => [
            row.type,
            row.description,
            `${row.reporter.name || ""} ${row.reporter.phone}`,
            <select key={row.id} className="field" defaultValue={row.status} onChange={async (event) => { await api(`/admin/complaints/${row.id}`, { method: "PATCH", body: { status: event.target.value } }); await load(); }}>
              {["OPEN", "IN_PROGRESS", "RESOLVED", "DISMISSED"].map((item) => <option key={item}>{item}</option>)}
            </select>,
          ])}
        />
      </div>
    </Shell>
  );
}
