"use client";

import { useEffect, useState } from "react";
import { Shell, Table } from "@/components/shell";
import { api } from "@/lib/api";

type Row = { id: string; action: string; entityType: string; summary?: string | null; createdAt: string; actor?: { name?: string | null; role: string } | null };

export default function AuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { api<{ data: Row[] }>("/admin/audit").then((result) => setRows(result.data)).catch(() => setRows([])); }, []);
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">কার্য লগ</h1>
      <p className="mt-2 text-sm text-muted">বিজ্ঞাপন, যাচাই, এলাকা ও অ্যাকাউন্টে কে কী বদলেছেন।</p>
      <div className="mt-4">
        <Table
          headers={["সময়", "কে", "কাজ", "বিষয়", "সারাংশ"]}
          rows={rows.map((row) => [new Date(row.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }), row.actor?.name || "—", row.action, row.entityType, row.summary || ""])}
        />
      </div>
    </Shell>
  );
}
