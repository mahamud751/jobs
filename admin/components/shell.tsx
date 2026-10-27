"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, STAFF } from "@/lib/api";

const icons = ["▦", "◎", "▣", "▤", "⚑", "⌖", "♙", "✉", "▧", "≡", "◇"];

const links = [
  ["/", "সারাংশ"],
  ["/drivers", "ড্রাইভার"],
  ["/employers", "নিয়োগকর্তা"],
  ["/jobs", "বিজ্ঞাপন"],
  ["/complaints", "অভিযোগ"],
  ["/locations", "এলাকা"],
  ["/users", "ব্যবহারকারী"],
  ["/messages", "বার্তা"],
  ["/content", "কনটেন্ট"],
  ["/audit", "লগ"],
  ["/plans", "প্ল্যান"],
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    api<{ role: string; name: string | null }>("/auth/me")
      .then((me) => {
        if (!STAFF.includes(me.role)) throw new Error("Staff only");
        setName(`${me.name || "Staff"} · ${me.role}`);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const active = (href: string) => href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const title = links.find(([href]) => active(href))?.[1] || "সারাংশ";
  function logout() { localStorage.removeItem("chalok_admin_token"); router.push("/login"); }
  if (!name) return <div role="status" className="grid min-h-screen place-items-center text-sm text-muted"><div className="panel px-10 py-8">লোড হচ্ছে…</div></div>;

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col overflow-y-auto bg-ink text-white lg:flex">
        <Link href="/" className="flex items-center gap-3 border-b border-white/10 px-6 py-7">
          <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-gold text-2xl text-ink">◎</span>
          <span><span className="block text-xl font-extrabold">চালক</span><span className="text-[10px] font-semibold tracking-[.2em] text-white/45">ADMIN WORKSPACE</span></span>
        </Link>
        <p className="px-6 pt-7 pb-3 text-[10px] font-bold tracking-[.18em] text-white/40">ম্যানেজমেন্ট</p>
        <nav aria-label="প্রধান নেভিগেশন" className="grid gap-1 px-3">
          {links.map(([href, label], index) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className="admin-nav"><span aria-hidden="true" className="w-6 text-center text-lg">{icons[index]}</span>{label}{active(href) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}</Link>
          ))}
        </nav>
        <div className="mx-4 mt-auto pt-8 pb-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="truncate text-xs text-white/65">{name}</p>
            <button className="mt-2 text-sm font-semibold text-gold" onClick={logout}>লগ আউট <span aria-hidden="true">↗</span></button>
          </div>
        </div>
      </aside>
      <header className="border-b border-line bg-white/90 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <p className="text-sm text-muted"><span className="font-bold text-ink">চালক অ্যাডমিন</span><span className="mx-3 text-line">/</span>{title}</p>
          <div className="flex items-center gap-3"><span className="hidden max-w-60 truncate text-xs text-muted sm:block">{name}</span><span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-forest/10 text-sm font-bold text-forest">{name.slice(0, 1)}</span><button className="text-xs font-semibold text-forest lg:hidden" onClick={logout}>লগ আউট</button></div>
        </div>
      </header>
      <nav aria-label="মোবাইল নেভিগেশন" className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-3 lg:hidden">
        {links.map(([href, label]) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ${active(href) ? "bg-ink text-white" : "bg-paper text-muted"}`}>{label}</Link>)}
      </nav>
      <main className="mx-auto max-w-[1440px] p-4 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-line bg-paper/70 text-xs tracking-wide text-muted">
          <tr>{headers.map((header) => <th scope="col" key={header} className="px-5 py-4 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line/70 transition-colors last:border-0 hover:bg-paper/60">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-4 align-middle">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="px-4 py-14 text-center"><span aria-hidden="true" className="mb-3 inline-grid h-12 w-12 place-items-center rounded-2xl bg-paper text-xl text-muted">▤</span><p className="text-sm font-semibold text-muted">কোনো তথ্য পাওয়া যায়নি।</p></div>}
    </div>
  );
}
