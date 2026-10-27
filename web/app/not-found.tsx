import Link from "next/link";
import { PublicShell } from "@/components/chrome";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="wrap py-24">
        <p className="text-sm font-bold text-forest">404</p>
        <h1 className="mt-2 text-4xl font-extrabold">এই পাতাটি নেই</h1>
        <Link href="/" className="btn-ink mt-6">হোমে ফিরুন</Link>
      </div>
    </PublicShell>
  );
}
