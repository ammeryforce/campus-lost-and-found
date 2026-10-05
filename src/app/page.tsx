import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Overview" };

export default async function HomePage() {
  if (!await getCurrentUser()) redirect("/login");
  return <Dashboard />;
}
