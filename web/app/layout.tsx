import type { Metadata } from "next";
import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { getLang } from "@/lib/lang";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010"),
  title: { default: "চালক — ড্রাইভার সার্ভিস ও চাকরি", template: "%s · চালক" },
  description: "বাংলাদেশে ড্রাইভার খুঁজুন বা ড্রাইভারের চাকরি খুঁজুন। ঢাকা ও চট্টগ্রামে চালু, সারা দেশের জন্য প্রস্তুত।",
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
  openGraph: {
    title: "চালক — ড্রাইভার সার্ভিস ও চাকরি",
    description: "Find a driver or a driving job across Bangladesh.",
    locale: "bn_BD",
    type: "website",
  },
};

async function Localized({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return <Providers lang={lang}>{children}</Providers>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="bn" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {ga && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');` }} />
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <Localized>{children}</Localized>
        </Suspense>
      </body>
    </html>
  );
}
