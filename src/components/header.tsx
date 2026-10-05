"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import type { AuthUser } from "@/lib/auth";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/items", label: "Items", icon: "box" },
  { href: "/claims", label: "Claims", icon: "claim" },
  { href: "/users", label: "People", icon: "users" },
];

export function Header({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark"><Icon name="box" /></span>
          <span><strong>Findly</strong><small>Campus Lost &amp; Found</small></span>
        </Link>
        <button className="mobile-menu" type="button" onClick={() => setOpen(!open)} aria-label="Toggle menu"><Icon name={open ? "close" : "menu"} /></button>
        <nav className={open ? "main-nav nav-open" : "main-nav"} aria-label="Main navigation">
          {links.filter((link) => link.href !== "/users" || user.role === "admin").map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return <Link key={link.href} href={link.href} className={active ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}><Icon name={link.icon} />{link.label}</Link>;
          })}
        </nav>
        <div className="header-profile" aria-label="Signed-in profile"><span className="online-dot" /><span className="avatar">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span><span><strong>{user.name}</strong><small>{user.role === "admin" ? "Administrator" : "Campus user"}</small></span><button className="logout-button" type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }}>Log out</button></div>
      </div>
    </header>
  );
}
