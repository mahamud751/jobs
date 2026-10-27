"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { PublicShell } from "@/components/chrome";
import { useI18n } from "@/components/providers";
import { api, clearSession, token } from "@/lib/api";
import { Me } from "@/lib/types";

const Ctx = createContext<{ me: Me; refresh: () => Promise<void> } | null>(null);
export function useMe() {
  const value = useContext(Ctx);
  if (!value) throw new Error("Dashboard missing profile");
  return value;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const bn = lang === "bn";

  async function refresh() {
    const access = token();
    if (!access) {
      router.replace("/login");
      return;
    }
    try {
      setMe(await api<Me>("/auth/me", { token: access }));
    } catch {
      clearSession();
      router.replace("/login");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!me) {
    return <PublicShell><div className="wrap py-20 text-muted">{bn ? "লোড হচ্ছে…" : "Loading…"}</div></PublicShell>;
  }

  const staff = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "SUPPORT"].includes(me.role);
  const links = me.role === "EMPLOYER"
    ? [["/dashboard", bn ? "সারাংশ" : "Overview"], ["/dashboard/profile", bn ? "প্রোফাইল" : "Profile"], ["/dashboard/jobs", bn ? "আমার বিজ্ঞাপন" : "My jobs"], ["/jobs/new", bn ? "নতুন বিজ্ঞাপন" : "New job"], ["/dashboard/contacts", bn ? "যোগাযোগ" : "Contact"], ["/dashboard/notifications", bn ? "নোটিশ" : "Notices"]]
    : [["/dashboard", bn ? "সারাংশ" : "Overview"], ["/dashboard/profile", bn ? "প্রোফাইল" : "Profile"], ["/dashboard/applications", bn ? "আবেদন" : "Applications"], ["/dashboard/contacts", bn ? "যোগাযোগ" : "Contact"], ["/dashboard/notifications", bn ? "নোটিশ" : "Notices"]];

  return (
    <Ctx.Provider value={{ me, refresh }}>
      <PublicShell>
        <div className="wrap grid gap-8 py-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="card h-fit p-4 lg:sticky lg:top-24">
            <p className="mb-4 border-b border-line px-3 pt-2 pb-5 text-sm font-bold text-forest">{me.phone}</p>
            <nav className="mt-2 grid gap-1">
              {links.map(([href, label]) => (
                <Link key={href} href={href} aria-current={(pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))) ? "page" : undefined} className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${(pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))) ? "bg-forest-soft text-forest-deep" : "text-muted hover:bg-paper"}`}>{label}</Link>
              ))}
              <button className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger" onClick={() => { clearSession(); router.push("/"); }}>{bn ? "লগ আউট" : "Log out"}</button>
            </nav>
            {staff && <a className="mt-3 block px-3 text-sm font-bold text-forest" href="http://localhost:3001">{bn ? "অ্যাডমিন প্যানেল" : "Admin panel"}</a>}
          </aside>
          <div>{children}</div>
        </div>
      </PublicShell>
    </Ctx.Provider>
  );
}
