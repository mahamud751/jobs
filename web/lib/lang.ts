import { cookies } from "next/headers";
import { Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  return jar.get("chalok_lang")?.value === "en" ? "en" : "bn";
}
