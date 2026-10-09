"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/parties", label: "ตี้" },
  { href: "/admin/users", label: "ผู้ใช้" },
];

// Tabs at the top of every /admin page. The party detail page counts as "ตี้".
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูผู้ดูแลระบบ" className="flex gap-1 border-b border-line px-2">
      {tabs.map((tab) => {
        const active =
          tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold ${
              active ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
