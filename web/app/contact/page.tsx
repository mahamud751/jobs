"use client";

import { FormEvent, useState } from "react";
import { PublicShell } from "@/components/chrome";
import { useI18n } from "@/components/providers";
import { api } from "@/lib/api";

export default function ContactPage() {
  const { lang } = useI18n();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    try {
      await api("/contact", {
        method: "POST",
        body: {
          name: form.get("name"),
          email: form.get("email") || undefined,
          phone: form.get("phone") || undefined,
          subject: form.get("subject"),
          message: form.get("message"),
          website: form.get("website") || undefined,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  const bn = lang === "bn";
  return (
    <PublicShell>
      <div className="wrap max-w-xl py-12">
        <h1 className="text-4xl font-extrabold">{bn ? "যোগাযোগ" : "Contact"}</h1>
        <p className="mt-3 text-muted">{bn ? "প্রশ্ন বা সহায়তার জন্য বার্তা পাঠান। অ্যাডমিন প্যানেল থেকে উত্তর দেখা হবে।" : "Send a note. It appears in the admin panel."}</p>
        {done ? <p className="card mt-6 p-5 font-semibold text-forest">{bn ? "বার্তা পৌঁছেছে।" : "Message sent."}</p> : (
          <form onSubmit={submit} className="mt-6 grid gap-3">
            <input className="field" name="name" required placeholder={bn ? "নাম" : "Name"} />
            <input className="field" name="phone" placeholder={bn ? "মোবাইল" : "Mobile"} />
            <input className="field" name="email" type="email" placeholder={bn ? "ইমেইল" : "Email"} />
            <input className="field" name="subject" required placeholder={bn ? "বিষয়" : "Subject"} />
            <textarea className="area" name="message" required minLength={10} placeholder={bn ? "বার্তা" : "Message"} />
            <input className="hidden" name="website" tabIndex={-1} autoComplete="off" />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button className="btn-ink">{bn ? "পাঠান" : "Send"}</button>
          </form>
        )}
      </div>
    </PublicShell>
  );
}
