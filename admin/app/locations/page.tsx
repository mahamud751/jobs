"use client";

import { FormEvent, useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { api } from "@/lib/api";

type Area = { id: string; nameEn: string; nameBn: string; kind: string };
type District = { id: string; nameEn: string; nameBn: string; serviceActive: boolean; areas: Area[] };
type Division = { nameBn: string; districts: District[] };

export default function LocationsPage() {
  const [tree, setTree] = useState<Division[]>([]);
  const [districtId, setDistrictId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const rows = await api<Division[]>("/admin/locations");
    setTree(rows);
    if (!districtId && rows[0]?.districts[0]) setDistrictId(rows[0].districts[0].id);
  }
  useEffect(() => { load().catch(() => setTree([])); }, []);

  async function toggle(id: string, serviceActive: boolean) {
    await api(`/admin/districts/${id}`, { method: "PATCH", body: { serviceActive } });
    setMessage(serviceActive ? "জেলা চালু হয়েছে। নতুন কোড লাগেনি।" : "জেলার সেবা বন্ধ হয়েছে।");
    await load();
  }

  async function addArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/admin/areas", {
      method: "POST",
      body: { districtId, nameEn: form.get("nameEn"), nameBn: form.get("nameBn"), kind: form.get("kind") },
    });
    event.currentTarget.reset();
    await load();
  }

  const selected = tree.flatMap((item) => item.districts).find((item) => item.id === districtId);

  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">এলাকা</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">জেলার সুইচ চালু করলে সেই জেলার ড্রাইভার ও বিজ্ঞাপন সার্চে আসে। নতুন থানা বা উপজেলা এখান থেকে যোগ করা যায়। এর জন্য ডেভেলপার দিয়ে কোড বদলাতে হয় না।</p>
      {message && <p className="mt-3 text-sm font-semibold text-forest">{message}</p>}
      <div className="mt-5 grid gap-4">
        {tree.map((division) => (
          <section key={division.nameBn} className="panel p-4">
            <h2 className="font-extrabold">{division.nameBn}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {division.districts.map((district) => (
                <div key={district.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm">
                  <button className="text-left" onClick={() => setDistrictId(district.id)}>{district.nameBn}</button>
                  <button className={district.serviceActive ? "btn-ink" : "btn-line"} onClick={() => toggle(district.id, !district.serviceActive)}>{district.serviceActive ? "চালু" : "বন্ধ"}</button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <form onSubmit={addArea} className="panel mt-5 grid gap-3 p-4 md:grid-cols-4">
        <p className="font-bold md:col-span-4">নতুন থানা বা উপজেলা {selected ? `— ${selected.nameBn}` : ""}</p>
        <input className="field" name="nameEn" required placeholder="English name" />
        <input className="field" name="nameBn" required placeholder="বাংলা নাম" />
        <select className="field" name="kind" defaultValue="UPAZILA">
          <option value="UPAZILA">উপজেলা</option>
          <option value="THANA">থানা</option>
        </select>
        <button className="btn-ink">যোগ করুন</button>
        <ul className="text-sm text-muted md:col-span-4">
          {selected?.areas.map((area) => (
            <li key={area.id} className="flex items-center justify-between border-b border-line py-1">
              <span>{area.nameBn} · {area.kind}</span>
              <button type="button" className="text-danger" onClick={async () => { await api(`/admin/areas/${area.id}`, { method: "DELETE" }); await load(); }}>মুছুন</button>
            </li>
          ))}
        </ul>
      </form>
    </Shell>
  );
}
