"use client";

import { FormEvent, useState } from "react";
import { useI18n } from "./providers";
import { api, token } from "@/lib/api";
import { categories, label } from "@/lib/labels";

export function ApplyBox({ slug }: { slug: string }) {
  const { t } = useI18n();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const access = token();
    if (!access) {
      window.location.href = `/login?next=/jobs/${slug}`;
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`/jobs/${slug}/applications`, { method: "POST", token: access, body: { coverNote: note } });
      setMessage(t("applied"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <h2 className="font-extrabold">{t("apply")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{t("phoneHidden")}</p>
      <textarea className="area mt-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("cover")} />
      {message && <p className="mt-3 text-sm font-semibold text-forest">{message}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <button className="btn-gold mt-3" disabled={busy || !!message}>{t("apply")}</button>
    </form>
  );
}

export function ContactBox({ driverId }: { driverId: string }) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const access = token();
    if (!access) {
      window.location.href = `/login?next=/drivers/${driverId}`;
      return;
    }
    setError("");
    try {
      await api("/contact-requests", { method: "POST", token: access, body: { driverId, message } });
      setDone(t("requestSent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <h2 className="font-extrabold">{t("request")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{t("phoneHidden")}</p>
      <textarea className="area mt-3" value={message} onChange={(event) => setMessage(event.target.value)} />
      {done && <p className="mt-3 text-sm font-semibold text-forest">{done}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <button className="btn-ink mt-3" disabled={!!done}>{t("request")}</button>
    </form>
  );
}

export function ReportBox({ againstJobId, againstUserId }: { againstJobId?: string; againstUserId?: string }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("FAKE_JOB");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const types = {
    FAKE_JOB: { bn: "ভুয়া বিজ্ঞাপন", en: "Fake job" },
    FRAUD: { bn: "প্রতারণা", en: "Fraud" },
    HARASSMENT: { bn: "হয়রানি", en: "Harassment" },
    FAKE_PROFILE: { bn: "ভুয়া প্রোফাইল", en: "Fake profile" },
    OTHER: { bn: "অন্যান্য", en: "Other" },
  } as const;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const access = token();
    if (!access) {
      window.location.href = "/login";
      return;
    }
    try {
      await api("/complaints", { method: "POST", token: access, body: { type, description, againstJobId, againstUserId } });
      setDone(t("reported"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (!open) return <button className="text-sm font-semibold text-muted underline" onClick={() => setOpen(true)}>{t("report")}</button>;
  return (
    <form onSubmit={submit} className="mt-4 grid gap-2">
      <select className="field" value={type} onChange={(event) => setType(event.target.value)}>
        {Object.entries(types).map(([key, names]) => <option key={key} value={key}>{names[lang]}</option>)}
      </select>
      <textarea className="area" required minLength={10} value={description} onChange={(event) => setDescription(event.target.value)} />
      {done && <p className="text-sm font-semibold text-forest">{done}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn-line" disabled={!!done}>{t("report")}</button>
    </form>
  );
}

export function MetaLine({ items }: { items: string[] }) {
  const { lang } = useI18n();
  return <p className="text-sm text-muted">{items.filter(Boolean).join(" · ")}{lang && ""}{label(categories, "", lang) && ""}</p>;
}
