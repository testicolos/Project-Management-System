"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FolderKanban, LayoutDashboard, UsersRound } from "lucide-react";

const items = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/companies", label: "Companies", icon: Building2, admin: true },
  { href: "/users", label: "Users", icon: UsersRound, admin: true },
];

export function Navigation({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return <nav className="nav" aria-label="Primary">{items.filter((item) => !item.admin || isAdmin).map((item) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    const Icon = item.icon;
    return <Link className={`nav-link ${active ? "active" : ""}`} href={item.href} key={item.href}><Icon /><span>{item.label}</span></Link>;
  })}</nav>;
}
