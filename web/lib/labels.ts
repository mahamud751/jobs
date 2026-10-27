import { Lang } from "./i18n";

type Pair = Record<string, { bn: string; en: string }>;

export const vehicles: Pair = {
  PRIVATE_CAR: { bn: "প্রাইভেট কার", en: "Private car" },
  MICROBUS: { bn: "মাইক্রোবাস", en: "Microbus" },
  PICKUP: { bn: "পিকআপ", en: "Pickup" },
  COVERED_VAN: { bn: "কাভার্ড ভ্যান", en: "Covered van" },
  TRUCK: { bn: "ট্রাক", en: "Truck" },
  BUS: { bn: "বাস", en: "Bus" },
  MOTORCYCLE: { bn: "মোটরসাইকেল", en: "Motorcycle" },
  CNG: { bn: "সিএনজি", en: "CNG" },
  AMBULANCE: { bn: "অ্যাম্বুলেন্স", en: "Ambulance" },
};

export const jobTypes: Pair = {
  FULL_TIME: { bn: "ফুল-টাইম", en: "Full-time" },
  PART_TIME: { bn: "পার্ট-টাইম", en: "Part-time" },
  CONTRACT: { bn: "চুক্তিভিত্তিক", en: "Contract" },
};

export const categories: Pair = {
  RESIDENTIAL: { bn: "আবাসিক", en: "Residential" },
  OFFICE: { bn: "অফিস", en: "Office" },
  PERSONAL: { bn: "ব্যক্তিগত", en: "Personal" },
  COMMERCIAL: { bn: "বাণিজ্যিক", en: "Commercial" },
};

export const licenses: Pair = {
  NON_PROFESSIONAL_LIGHT: { bn: "নন-প্রফেশনাল লাইট", en: "Non-professional light" },
  PROFESSIONAL_LIGHT: { bn: "প্রফেশনাল লাইট", en: "Professional light" },
  MEDIUM: { bn: "মিডিয়াম", en: "Medium" },
  HEAVY: { bn: "হেভি", en: "Heavy" },
  MOTORCYCLE: { bn: "মোটরসাইকেল", en: "Motorcycle" },
  PSV: { bn: "পিএসভি", en: "PSV" },
};

export const jobStatus: Pair = {
  DRAFT: { bn: "খসড়া", en: "Draft" },
  PENDING_APPROVAL: { bn: "অনুমোদনের অপেক্ষায়", en: "Pending approval" },
  ACTIVE: { bn: "চালু", en: "Active" },
  REJECTED: { bn: "বাতিল", en: "Rejected" },
  CLOSED: { bn: "বন্ধ", en: "Closed" },
  EXPIRED: { bn: "মেয়াদ শেষ", en: "Expired" },
};

export const appStatus: Pair = {
  SUBMITTED: { bn: "জমা হয়েছে", en: "Submitted" },
  UNDER_REVIEW: { bn: "পর্যালোচনাধীন", en: "Under review" },
  INTERVIEW: { bn: "সাক্ষাৎকার", en: "Interview" },
  HIRED: { bn: "নিয়োগ হয়েছে", en: "Hired" },
  REJECTED: { bn: "প্রত্যাখ্যাত", en: "Rejected" },
  WITHDRAWN: { bn: "প্রত্যাহার", en: "Withdrawn" },
};

export const verifyStatus: Pair = {
  UNVERIFIED: { bn: "যাচাই হয়নি", en: "Unverified" },
  PENDING: { bn: "পর্যালোচনাধীন", en: "Pending" },
  VERIFIED: { bn: "যাচাইকৃত", en: "Verified" },
  REJECTED: { bn: "বাতিল", en: "Rejected" },
};

export function label(map: Pair, key: string | null | undefined, lang: Lang) {
  if (!key) return "—";
  return map[key]?.[lang] || key;
}

export function placeName(place: { nameBn: string; nameEn: string } | null | undefined, lang: Lang) {
  if (!place) return "";
  return lang === "bn" ? place.nameBn : place.nameEn;
}
