"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mark } from "./mark";
import { useI18n } from "./providers";
import { clearSession, token } from "@/lib/api";

export function SiteHeader() {
  const { lang, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!token());
  }, []);

  function setLang(next: "bn" | "en") {
    document.cookie = `chalok_lang=${next};path=/;max-age=31536000`;
    router.refresh();
  }

  const links = [
    ["/drivers", t("nav.findDriver")],
    ["/jobs", t("nav.findJob")],
    ["/jobs/new", t("nav.post")],
    ["/about", t("nav.about")],
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-xl">
      <div className="wrap flex h-[72px] items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight">{t("brand")}</span>
            <span className="hidden text-[11px] text-muted sm:block">{t("tagline")}</span>
          </span>
        </Link>
        <nav className="ml-6 hidden items-center gap-5 text-sm font-semibold lg:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`border-b-2 py-6 transition-colors ${pathname === href ? "border-forest text-forest" : "border-transparent text-muted hover:text-forest"}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-full border border-line bg-white p-0.5 text-xs font-bold">
            <button className={`rounded-full px-2.5 py-1 ${lang === "bn" ? "bg-ink text-white" : ""}`} aria-pressed={lang === "bn"} onClick={() => setLang("bn")}>বাং</button>
            <button className={`rounded-full px-2.5 py-1 ${lang === "en" ? "bg-ink text-white" : ""}`} aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
          </div>
          {authed ? (
            <Link href="/dashboard" className="btn-ink hidden sm:inline-flex">{t("nav.dashboard")}</Link>
          ) : (
            <>
              <Link href="/login" className="hidden px-2 text-sm font-semibold sm:inline">{t("nav.login")}</Link>
              <Link href="/register" className="btn-gold hidden sm:inline-flex">{t("nav.register")}</Link>
            </>
          )}
          <button className="btn-line px-3 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={lang === "bn" ? "মেনু" : "Menu"} aria-expanded={open} aria-controls="mobile-menu">
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="border-t border-line bg-card px-4 py-3 shadow-xl lg:hidden">
          <div className="grid gap-1">
            {links.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-paper">
                {label}
              </Link>
            ))}
            {authed ? (
              <>
                <Link href="/dashboard" className="rounded-xl px-3 py-2.5 font-semibold" onClick={() => setOpen(false)}>{t("nav.dashboard")}</Link>
                <button className="rounded-xl px-3 py-2.5 text-left font-semibold" onClick={() => { clearSession(); setAuthed(false); setOpen(false); router.push("/"); }}>{t("logout")}</button>
              </>
            ) : (
              <><Link href="/login" className="rounded-xl px-3 py-2.5 font-semibold" onClick={() => setOpen(false)}>{t("nav.login")}</Link><Link href="/register" className="btn-gold mt-2" onClick={() => setOpen(false)}>{t("nav.register")}</Link></>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 border-t border-line bg-ink text-white">
      <div className="wrap grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Mark />
            <span className="text-lg font-extrabold">{t("brand")}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">{t("footer")}</p>
        </div>
        <div className="text-sm">
          <p className="font-bold">{t("nav.findDriver")}</p>
          <div className="mt-3 grid gap-2 text-white/70">
            <Link href="/drivers">{t("nav.findDriver")}</Link>
            <Link href="/jobs">{t("nav.findJob")}</Link>
            <Link href="/jobs/new">{t("nav.post")}</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-bold">{t("nav.about")}</p>
          <div className="mt-3 grid gap-2 text-white/70">
            <Link href="/about">{t("nav.about")}</Link>
            <Link href="/help">{t("nav.help")}</Link>
            <Link href="/contact">{t("nav.contact")}</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-bold">{t("nav.privacy")}</p>
          <div className="mt-3 grid gap-2 text-white/70">
            <Link href="/privacy">{t("nav.privacy")}</Link>
            <Link href="/terms">{t("nav.terms")}</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">© 2026 Chalok</div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}
