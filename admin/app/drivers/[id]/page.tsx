"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/shell";
import { API, api } from "@/lib/api";

type Driver = {
  id: string;
  fullName: string;
  phone?: string;
  licenseNumber?: string;
  licenseClass?: string;
  licenseExpiry?: string | null;
  verificationStatus?: string;
  verificationNote?: string | null;
  addressLine?: string | null;
  experienceYears: number;
  bio?: string | null;
  documents?: { id: string; kind: string; fileName: string }[];
  featured?: boolean;
};

export default function DriverReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const row = await api<Driver>(`/admin/drivers/${id}`);
    setDriver(row);
    setNote(row.verificationNote || "");
  }
  useEffect(() => { load().catch(() => setDriver(null)); }, [id]);

  async function verify(status: string) {
    await api(`/admin/drivers/${id}/verification`, { method: "PATCH", body: { status, note } });
    setMessage("আপডেট হয়েছে");
    await load();
  }

  async function openDoc(docId: string) {
    const token = localStorage.getItem("chalok_admin_token");
    const response = await fetch(`${API}/api/documents/${docId}`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    window.open(URL.createObjectURL(blob));
  }

  if (!driver) return <Shell><p>পাওয়া যায়নি।</p></Shell>;
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">{driver.fullName}</h1>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4 text-sm leading-7">
          <p>ফোন: {driver.phone}</p>
          <p>লাইসেন্স শ্রেণি: {driver.licenseClass || "—"}</p>
          <p>লাইসেন্স নম্বর: {driver.licenseNumber || "—"}</p>
          <p>মেয়াদ: {driver.licenseExpiry?.slice(0, 10) || "—"}</p>
          <p>অভিজ্ঞতা: {driver.experienceYears} বছর</p>
          <p>ঠিকানা: {driver.addressLine || "—"}</p>
          <p className="mt-2">{driver.bio}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {driver.documents?.map((doc) => <button key={doc.id} className="btn-line" onClick={() => openDoc(doc.id)}>{doc.kind}</button>)}
          </div>
        </div>
        <div className="panel grid gap-3 p-4">
          <p className="font-bold">যাচাই: {driver.verificationStatus}</p>
          <textarea className="area" value={note} onChange={(event) => setNote(event.target.value)} placeholder="নোট" />
          <div className="flex flex-wrap gap-2">
            <button className="btn-ink" onClick={() => verify("VERIFIED")}>যাচাইকৃত</button>
            <button className="btn-line" onClick={() => verify("PENDING")}>অপেক্ষমাণ</button>
            <button className="btn-line" onClick={() => verify("REJECTED")}>বাতিল</button>
            <button className="btn-gold" onClick={async () => { await api(`/admin/drivers/${id}/featured`, { method: "PATCH", body: { featured: !driver.featured } }); await load(); }}>{driver.featured ? "ফিচার সরান" : "ফিচার করুন"}</button>
          </div>
          {message && <p className="text-sm text-forest">{message}</p>}
        </div>
      </div>
    </Shell>
  );
}
