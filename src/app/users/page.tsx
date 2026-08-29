import type { Metadata } from "next";
import { UserManager } from "@/components/user-manager";

export const metadata: Metadata = { title: "People" };

export default function UsersPage() {
  return <UserManager />;
}
