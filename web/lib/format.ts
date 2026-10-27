import { Lang } from "./i18n";

export function taka(value?: number | null) {
  if (value == null) return "";
  return `৳${value.toLocaleString("en-BD")}`;
}

export function salaryRange(min?: number | null, max?: number | null, negotiable?: boolean, lang: Lang = "bn") {
  if (min == null && max == null) return lang === "bn" ? "আলোচনাসাপেক্ষ" : "Negotiable";
  const text = min != null && max != null && min !== max ? `${taka(min)} – ${taka(max)}` : taka(min ?? max);
  return negotiable ? `${text}` : text;
}

export function when(value?: string | null, lang: Lang = "bn") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function media(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${base}${path}`;
}
