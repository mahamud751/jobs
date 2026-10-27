"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./providers";
import { label, placeName, vehicles } from "@/lib/labels";
import { Division } from "@/lib/types";

export function HomeSearch({ locations }: { locations: Division[] }) {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"drivers" | "jobs">("drivers");
  const [district, setDistrict] = useState("");
  const [vehicle, setVehicle] = useState("");
  const districts = locations.flatMap((item) => item.districts);

  function go(path: string) {
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (vehicle) params.set("vehicle", vehicle);
    router.push(`${path}?${params.toString()}`);
  }

  return (
    <form className="search-panel relative rounded-3xl bg-white p-6 sm:p-8" onSubmit={(event) => { event.preventDefault(); go(`/${mode}`); }}>
      <div className="search-modes" role="group" aria-label={t("search")}>
        {(["drivers", "jobs"] as const).map((item) => (
          <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={mode === item ? "is-selected" : ""}>
            {t(item === "drivers" ? "hero.driver" : "hero.job")}
          </button>
        ))}
      </div>
      <div className="mb-6 mt-7">
        <p className="mb-2 text-xs font-bold tracking-wide text-forest">{t("search")}</p>
        <h2 className="text-2xl font-extrabold">{t(mode === "drivers" ? "path.hireTitle" : "path.workTitle")}</h2>
      </div>
      <div className="grid gap-5">
        <label className="text-xs font-bold text-muted">{t("district")}
          <select className="field mt-2 h-12 bg-paper/50" value={district} onChange={(event) => setDistrict(event.target.value)}>
            <option value="">{t("any")}</option>
            {districts.map((item) => <option key={item.code} value={item.code}>{placeName(item, lang)}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-muted">{t("vehicle")}
          <select className="field mt-2 h-12 bg-paper/50" value={vehicle} onChange={(event) => setVehicle(event.target.value)}>
            <option value="">{t("any")}</option>
            {Object.keys(vehicles).map((key) => <option key={key} value={key}>{label(vehicles, key, lang)}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-ink mt-1 w-full py-3.5">
          {t(mode === "drivers" ? "hero.driver" : "hero.job")} <span aria-hidden="true">→</span>
        </button>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted"><span aria-hidden="true" className="text-forest">✓</span>{t("phoneHidden")}</p>
      </div>
    </form>
  );
}
