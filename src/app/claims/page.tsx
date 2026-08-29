import type { Metadata } from "next";
import { ClaimManager } from "@/components/claim-manager";

export const metadata: Metadata = { title: "Claims" };

export default function ClaimsPage() {
  return <ClaimManager />;
}
