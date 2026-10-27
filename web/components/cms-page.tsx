import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/chrome";
import { RouteFallback } from "@/components/fallback";
import { getLang } from "@/lib/lang";
import { publicGet } from "@/lib/public-api";

export default function CmsPage({ slug }: { slug: string }) {
  return (
    <PublicShell>
      <Suspense fallback={<RouteFallback />}>
        <CmsBody slug={slug} />
      </Suspense>
    </PublicShell>
  );
}

async function CmsBody({ slug }: { slug: string }) {
  const lang = await getLang();
  try {
    const page = await publicGet<{ titleBn: string; titleEn: string; bodyBn: string; bodyEn: string }>(`/content/${slug}`);
    const title = lang === "bn" ? page.titleBn : page.titleEn;
    const body = lang === "bn" ? page.bodyBn : page.bodyEn;
    return (
        <article className="wrap max-w-3xl py-12">
          <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
          <div className="mt-6 whitespace-pre-wrap text-base leading-8 text-ink/90">{body}</div>
        </article>
    );
  } catch {
    notFound();
  }
}
