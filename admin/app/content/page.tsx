"use client";

import { FormEvent, useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { api } from "@/lib/api";

type Page = { slug: string; titleBn: string; titleEn: string; bodyBn: string; bodyEn: string };

export default function ContentPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [current, setCurrent] = useState<Page | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<Page[]>("/admin/content").then((rows) => { setPages(rows); setCurrent(rows[0] || null); }).catch(() => setPages([]));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current) return;
    const form = new FormData(event.currentTarget);
    const saved = await api<Page>(`/admin/content/${current.slug}`, {
      method: "PATCH",
      body: { titleBn: form.get("titleBn"), titleEn: form.get("titleEn"), bodyBn: form.get("bodyBn"), bodyEn: form.get("bodyEn") },
    });
    setMessage("সেভ হয়েছে");
    setPages((rows) => rows.map((row) => row.slug === saved.slug ? saved : row));
  }

  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">কনটেন্ট</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {pages.map((page) => <button key={page.slug} className={current?.slug === page.slug ? "btn-ink" : "btn-line"} onClick={() => setCurrent(page)}>{page.slug}</button>)}
      </div>
      {current && (
        <form key={current.slug} onSubmit={save} className="panel mt-4 grid gap-3 p-4">
          <input className="field" name="titleBn" defaultValue={current.titleBn} />
          <input className="field" name="titleEn" defaultValue={current.titleEn} />
          <textarea className="area min-h-40" name="bodyBn" defaultValue={current.bodyBn} />
          <textarea className="area min-h-40" name="bodyEn" defaultValue={current.bodyEn} />
          <button className="btn-ink w-fit">সেভ</button>
          {message && <p className="text-sm text-forest">{message}</p>}
        </form>
      )}
    </Shell>
  );
}
