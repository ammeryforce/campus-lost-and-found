import type { Metadata } from "next";
import { ClaimManager } from "@/components/claim-manager";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Claims" };

export default async function ClaimsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ClaimManager user={user} />;
}
