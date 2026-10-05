import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Findly — Campus Lost & Found", template: "%s — Findly" },
  description: "Report, find, and return lost items across campus.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        {user && <Header user={user} />}
        {children}
      </body>
    </html>
  );
}
