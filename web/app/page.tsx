import { Suspense } from "react";
import Link from "next/link";
import { DriverCard, JobCard } from "@/components/cards";
import { PublicShell } from "@/components/chrome";
import { RouteFallback } from "@/components/fallback";
import { HomeSearch } from "@/components/home-search";
import { translate, trustItems } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { placeName } from "@/lib/labels";
import { publicGet } from "@/lib/public-api";
import { Division, HomePayload } from "@/lib/types";

export default function HomePage() {
  return (
    <PublicShell>
      <Suspense fallback={<RouteFallback />}>
        <HomeContent />
      </Suspense>
    </PublicShell>
  );
}

async function HomeContent() {
  const lang = await getLang();
  const t = (key: string) => translate(lang, key);
  let home: HomePayload | null = null;
  let locations: Division[] = [];
  try {
    [home, locations] = await Promise.all([
      publicGet<HomePayload>("/home"),
      publicGet<Division[]>("/locations/tree?activeOnly=true"),
    ]);
  } catch {
    home = null;
  }

  return (
    <>
      <section className="hero-surface relative overflow-hidden border-b border-line">
        <div className="mesh absolute inset-0" />
        <div className="hero-road" aria-hidden="true"><span /><span /><span /></div>
        <div className="wrap relative grid items-center gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:py-24">
          <div>
            <p className="hero-kicker inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white/80 px-4 py-2 text-xs font-bold text-forest-deep">{t("hero.kicker")}</p>
            <h1 className="mt-5 max-w-xl hero-title text-4xl font-extrabold leading-[1.3] tracking-tight sm:text-6xl">{t("hero.title")}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">{t("hero.text")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/drivers" className="btn-gold px-6 py-3.5">{t("hero.driver")} <span aria-hidden="true">↗</span></Link>
              <Link href="/jobs" className="btn-line px-6 py-3.5">{t("hero.job")} <span aria-hidden="true">→</span></Link>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-ink/80 sm:grid-cols-2">
              {trustItems(lang).map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest/10 text-xs text-forest">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <HomeSearch locations={locations} />
        </div>
      </section>

      {home ? (
        <section className="bg-forest-deep text-white">
          <div className="wrap grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
            {[
              [home.counts.driverCount, t("stats.drivers")],
              [home.counts.jobCount, t("stats.jobs")],
              [home.counts.liveDistricts, t("stats.districts")],
              [home.counts.employerCount, t("stats.employers")],
            ].map(([value, label]) => (
              <div key={String(label)} className="border-l border-white/15 pl-5">
                <p className="text-3xl font-extrabold text-gold">{value}</p>
                <p className="mt-1 text-sm text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="wrap py-6 text-sm text-danger">{t("offline")}</div>
      )}

      <section className="wrap grid gap-4 py-12 md:grid-cols-2">
        <Link href="/drivers" className="card path-card p-8 transition hover:-translate-y-0.5">
          <span aria-hidden="true" className="path-icon">⌖</span><p className="text-xs font-bold uppercase tracking-wide text-forest">{t("nav.findDriver")}</p>
          <h2 className="mt-2 text-2xl font-extrabold">{t("path.hireTitle")}</h2>
          <p className="mt-3 leading-7 text-muted">{t("path.hireText")}</p>
        </Link>
        <Link href="/jobs" className="card path-card bg-ink p-8 text-white transition hover:-translate-y-0.5">
          <span aria-hidden="true" className="path-icon">↗</span><p className="text-xs font-bold uppercase tracking-wide text-gold">{t("nav.findJob")}</p>
          <h2 className="mt-2 text-2xl font-extrabold">{t("path.workTitle")}</h2>
          <p className="mt-3 leading-7 text-white/70">{t("path.workText")}</p>
        </Link>
      </section>

      <section className="wrap">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">{t("section.jobs")}</h2>
          <Link href="/jobs" className="text-sm font-bold text-forest">{t("all")}</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {home?.jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
        {!home?.jobs.length && <p className="empty-state">{t("emptyJobs")}</p>}
      </section>

      <section className="wrap py-12">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">{t("section.drivers")}</h2>
          <Link href="/drivers" className="text-sm font-bold text-forest">{t("all")}</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {home?.drivers.map((driver) => <DriverCard key={driver.id} driver={driver} />)}
        </div>
        {!home?.drivers.length && <p className="empty-state">{t("emptyDrivers")}</p>}
      </section>

      <section className="wrap grid gap-8 pb-4 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold">{t("section.how")}</h2>
          <ol className="mt-5 grid gap-4">
            {[["how.d1", "how.d1t"], ["how.d2", "how.d2t"], ["how.d3", "how.d3t"]].map(([title, text], index) => (
              <li key={title} className="card flex gap-4 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold font-extrabold">{index + 1}</span>
                <span>
                  <span className="block font-bold">{t(title)}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{t(text)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold">{t("nav.findDriver")}</h2>
          <ol className="mt-5 grid gap-4">
            {[["how.e1", "how.e1t"], ["how.e2", "how.e2t"], ["how.e3", "how.e3t"]].map(([title, text], index) => (
              <li key={title} className="card flex gap-4 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-extrabold text-white">{index + 1}</span>
                <span>
                  <span className="block font-bold">{t(title)}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{t(text)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap py-12">
        <h2 className="text-2xl font-extrabold">{t("section.cover")}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {home?.coverage.map((item) => (
            <div key={item.code} className="card p-4">
              <p className="font-bold">{placeName(item, lang)}</p>
              <p className={`mt-2 text-xs font-bold ${item.live ? "text-forest" : "text-muted"}`}>{item.live ? t("live") : t("soon")}</p>
              <p className="mt-1 text-xs text-muted">{item.liveDistricts}/{item.districts}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap pb-4">
        <div className="rounded-3xl bg-forest-deep px-6 py-8 text-white sm:px-10">
          <h2 className="text-2xl font-extrabold">{t("section.safety")}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-white/80">{t("safety")}</p>
        </div>
      </section>
    </>
  );
}
