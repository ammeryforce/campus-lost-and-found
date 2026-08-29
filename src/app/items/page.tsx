import type { Metadata } from "next";
import { ItemManager } from "@/components/item-manager";

export const metadata: Metadata = { title: "Items" };

export default function ItemsPage() {
  return <ItemManager />;
}
