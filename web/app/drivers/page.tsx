import { Suspense } from "react";
import type { Metadata } from "next";
import { DriverCard, Filters, Pager } from "@/components/cards";
import { PublicShell } from "@/components/chrome";
import { RouteFallback } from "@/components/fallback";
import { translate } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { publicGet } from "@/lib/public-api";
import { Division, Driver, Page } from "@/lib/types";

export const metadata: Metadata = { title: "ড্রাইভার খুঁজুন" };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function DriversPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <PublicShell>
      <Suspense fallback={<RouteFallback />}>
        <DriverResults searchParams={searchParams} />
      </Suspense>
    </PublicShell>
  );
}

async function DriverResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lang = await getLang();
  const t = (key: string) => translate(lang, key);
  const raw = await searchParams;
  const values = {
    division: one(raw.division),
    district: one(raw.district),
    vehicle: one(raw.vehicle),
    jobType: one(raw.jobType),
    category: one(raw.category),
    licenseClass: one(raw.licenseClass),
    experienceMin: one(raw.experienceMin),
    salaryMax: one(raw.salaryMax),
    verified: one(raw.verified),
    q: one(raw.q),
    page: one(raw.page),
  };
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
  let drivers: Page<Driver> | null = null;
  let locations: Division[] = [];
  try {
    [drivers, locations] = await Promise.all([
      publicGet<Page<Driver>>(`/drivers?${params.toString()}`),
      publicGet<Division[]>("/locations/tree?activeOnly=true"),
    ]);
  } catch {
    drivers = null;
  }
  return (
      <div className="wrap grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <Filters locations={locations} mode="drivers" values={values} />
        <div>
          <h1 className="text-3xl font-extrabold">{t("nav.findDriver")}</h1>
          <p className="mt-2 text-sm text-muted">{drivers ? drivers.meta.total : 0}</p>
          {!drivers && <p className="mt-6 text-danger">{t("offline")}</p>}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {drivers?.data.map((driver) => <DriverCard key={driver.id} driver={driver} />)}
          </div>
          {drivers && drivers.data.length === 0 && <p className="mt-6 text-muted">{t("emptyDrivers")}</p>}
          {drivers && <Pager page={drivers.meta.page} totalPages={drivers.meta.totalPages} path="/drivers" params={values} />}
        </div>
      </div>
  );
}
