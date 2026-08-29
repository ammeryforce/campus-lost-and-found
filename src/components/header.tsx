"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/items", label: "Items", icon: "box" },
  { href: "/claims", label: "Claims", icon: "claim" },
  { href: "/users", label: "People", icon: "users" },
];

export function Header() {
  const pathname = usePathname();
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
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return <Link key={link.href} href={link.href} className={active ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}><Icon name={link.icon} />{link.label}</Link>;
          })}
        </nav>
        <div className="header-profile" aria-label="Administrator profile"><span className="online-dot" /><span className="avatar">AD</span><span><strong>Admin</strong><small>Campus desk</small></span></div>
      </div>
    </header>
  );
}
