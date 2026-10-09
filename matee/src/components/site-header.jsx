"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "หาตี้" },
  { href: "/create", label: "ตั้งตี้" },
  { href: "/my-party", label: "ตี้ของฉัน" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-t-4 border-b border-t-brand border-b-line bg-card">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 leading-tight">
          <span aria-hidden="true" className="size-7 rounded-full bg-brand" />
          <span>
            <span className="block text-lg font-semibold">MaTee</span>
            <span className="block text-xs text-muted">มาตี้กัน</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 ${
                  active ? "bg-accent text-accent-foreground" : "text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
