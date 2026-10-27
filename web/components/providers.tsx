"use client";

import { createContext, useContext, useMemo } from "react";
import { Lang, translate } from "@/lib/i18n";

const Ctx = createContext<{ lang: Lang; t: (path: string) => string }>({
  lang: "bn",
  t: (path) => path,
});

export function Providers({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: (path: string) => translate(lang, path) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
