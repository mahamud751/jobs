"use client";

import { FormEvent, useEffect, useState } from "react";
import { Shell, Table } from "@/components/shell";
import { api } from "@/lib/api";

type User = { id: string; name: string | null; phone: string; email: string | null; role: string; isBlocked: boolean; isActive: boolean; deletionRequestedAt?: string | null };

export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [message, setMessage] = useState("");

  async function load() { setRows((await api<{ data: User[] }>("/admin/users")).data); }
  useEffect(() => { load().catch(() => setRows([])); }, []);

  async function access(id: string, body: { isBlocked?: boolean; isActive?: boolean }) {
    await api(`/admin/users/${id}`, { method: "PATCH", body });
    await load();
  }

  async function staff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/admin/staff", {
        method: "POST",
        body: { name: form.get("name"), phone: form.get("phone"), password: form.get("password"), role: form.get("role"), email: form.get("email") || undefined },
      });
      setMessage("স্টাফ যোগ হয়েছে");
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">ব্যবহারকারী</h1>
      <div className="mt-4">
        <Table
          headers={["নাম", "ফোন", "ভূমিকা", "অবস্থা", ""]}
          rows={rows.map((row) => [
            row.name,
            row.phone,
            row.role,
            `${row.isBlocked ? "ব্লক" : "খোলা"}${row.deletionRequestedAt ? " · মুছতে চায়" : ""}`,
            <span key={row.id} className="flex gap-2">
              <button className="btn-line" onClick={() => access(row.id, { isBlocked: !row.isBlocked, blockReason: row.isBlocked ? "" : "Blocked by admin" })}>{row.isBlocked ? "খুলুন" : "ব্লক"}</button>
              {row.deletionRequestedAt && <button className="btn-line" onClick={async () => { if (confirm("তথ্য সরিয়ে অ্যাকাউন্ট বন্ধ করবেন?")) { await api(`/admin/users/${row.id}/anonymize`, { method: "POST" }); await load(); } }}>মুছুন</button>}
            </span>,
          ])}
        />
      </div>
      <form onSubmit={staff} className="panel mt-5 grid gap-3 p-4 md:grid-cols-5">
        <p className="font-bold md:col-span-5">নতুন স্টাফ — শুধু সুপার অ্যাডমিন</p>
        <input className="field" name="name" required placeholder="নাম" />
        <input className="field" name="phone" required placeholder="01XXXXXXXXX" />
        <input className="field" name="email" placeholder="ইমেইল" />
        <input className="field" name="password" required placeholder="পাসওয়ার্ড" />
        <select className="field" name="role" defaultValue="SUPPORT">
          <option value="ADMIN">ADMIN</option>
          <option value="CONTENT_MANAGER">CONTENT_MANAGER</option>
          <option value="SUPPORT">SUPPORT</option>
        </select>
        <button className="btn-ink md:col-span-5 w-fit">যোগ করুন</button>
        {message && <p className="text-sm md:col-span-5">{message}</p>}
      </form>
    </Shell>
  );
}
