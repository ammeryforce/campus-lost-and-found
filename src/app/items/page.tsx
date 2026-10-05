import type { Metadata } from "next";
import { ItemManager } from "@/components/item-manager";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Items" };

export default async function ItemsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ItemManager user={user} />;
}
