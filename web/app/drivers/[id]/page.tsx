import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactBox, ReportBox } from "@/components/actions";
import { Avatar } from "@/components/mark";
import { PublicShell } from "@/components/chrome";
import { RouteFallback } from "@/components/fallback";
import { ApiError } from "@/lib/api";
import { publicGet } from "@/lib/public-api";
import { media, salaryRange, when } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { categories, jobTypes, label, licenses, placeName, vehicles } from "@/lib/labels";
import { Driver } from "@/lib/types";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const driver = await publicGet<Driver>(`/drivers/${id}`);
    return { title: driver.fullName, description: driver.bio || driver.fullName };
  } catch {
    return { title: "Driver" };
  }
}

export default function DriverPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PublicShell>
      <Suspense fallback={<RouteFallback />}>
        <DriverDetail params={params} />
      </Suspense>
    </PublicShell>
  );
}

async function DriverDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const t = (key: string) => translate(lang, key);
  let driver: Driver;
  try {
    driver = await publicGet<Driver>(`/drivers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <div className="wrap py-16 text-danger">{t("offline")}</div>;
  }
  return (
      <article className="wrap grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-4">
            <Avatar name={driver.fullName} photo={media(driver.photoUrl)} size="h-16 w-16 text-xl" />
            <div>
              <h1 className="text-3xl font-extrabold">{driver.fullName}</h1>
              <p className="text-muted">{[placeName(driver.area, lang), placeName(driver.district, lang)].filter(Boolean).join(", ")}</p>
              <p className="mt-1 text-xs font-bold text-forest">{driver.verified ? t("verified") : t("pending")}</p>
            </div>
          </div>
          {driver.bio && <p className="mt-6 max-w-2xl leading-7">{driver.bio}</p>}
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              [t("experience"), `${driver.experienceYears} ${t("years")}`],
              [t("salary"), salaryRange(driver.expectedSalaryMin, driver.expectedSalaryMax, false, lang)],
              [t("jobType"), label(jobTypes, driver.jobPreference, lang)],
              [t("license"), label(licenses, driver.licenseClass, lang)],
              [t("available"), driver.isAvailable ? t("live") : "—"],
              [t("member"), when(driver.memberSince, lang)],
            ].map(([name, value]) => (
              <div key={name} className="card px-4 py-3">
                <dt className="text-xs font-bold text-muted">{name}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {driver.vehicles.map((item) => <span key={item} className="chip">{label(vehicles, item, lang)}</span>)}
            {driver.drivingCategories.map((item) => <span key={item} className="chip">{label(categories, item, lang)}</span>)}
          </div>
          {!!driver.experiences.length && (
            <div className="mt-8">
              <h2 className="text-xl font-extrabold">{lang === "bn" ? "অভিজ্ঞতা" : "Experience"}</h2>
              <ul className="mt-3 grid gap-3">
                {driver.experiences.map((item) => (
                  <li key={item.id} className="card p-4">
                    <p className="font-bold">{item.role} · {item.employer}</p>
                    <p className="text-sm text-muted">{item.startYear}–{item.endYear || (lang === "bn" ? "বর্তমান" : "Now")} · {label(vehicles, item.vehicleType, lang)}</p>
                    {item.description && <p className="mt-2 text-sm leading-6">{item.description}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {driver.educationLevel && <p className="mt-6 text-sm"><span className="font-bold">{lang === "bn" ? "শিক্ষা: " : "Education: "}</span>{driver.educationLevel}</p>}
          <div className="mt-6"><ReportBox againstUserId={driver.userId} /></div>
        </div>
        <ContactBox driverId={driver.id} />
      </article>
  );
}
