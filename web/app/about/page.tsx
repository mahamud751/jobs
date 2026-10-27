import type { Metadata } from "next";
import CmsPage from "@/components/cms-page";

export const metadata: Metadata = { title: "আমাদের কথা" };
export default function Page() {
  return <CmsPage slug="about" />;
}
