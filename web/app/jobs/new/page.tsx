"use client";

import { PublicShell } from "@/components/chrome";
import { JobEditor } from "@/components/job-editor";
import { useI18n } from "@/components/providers";

export default function NewJobPage() {
  const { lang } = useI18n();
  return (
    <PublicShell>
      <div className="wrap max-w-3xl py-10">
        <h1 className="mb-5 text-3xl font-extrabold">{lang === "bn" ? "ড্রাইভার নিয়োগের বিজ্ঞাপন" : "Post a driver job"}</h1>
        <p className="mb-5 text-sm leading-6 text-muted">{lang === "bn" ? "পাঠানোর পর অ্যাডমিন অনুমোদন না হওয়া পর্যন্ত বিজ্ঞাপন প্রকাশ হবে না। মোবাইল যাচাই করা থাকতে হবে।" : "An admin approves the post before it goes live. Verify your mobile first."}</p>
        <JobEditor />
      </div>
    </PublicShell>
  );
}
