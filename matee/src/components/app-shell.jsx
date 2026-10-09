"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Suspense } from "react";

import { PartySearch } from "@/components/party-search";
import { SiteHeader } from "@/components/site-header";

// Pages that draw their own full-screen layout, with no sidebar or column.
const BARE_PATHS = ["/login", "/register", "/banned"];

// Pages whose title sits above the card on desktop.
const TITLES = { "/": "หาตี้", "/account": "โปรไฟล์" };

export function AppShell({ account, theme, children }) {
  const pathname = usePathname();

  if (BARE_PATHS.includes(pathname)) {
    return <div className="-mb-20 flex min-h-screen flex-1 flex-col md:mb-0">{children}</div>;
  }

  // The sidebar is fixed to the window edge, so the column is centered in the
  // window. Side padding keeps the column clear of the rail on narrow windows.
  return (
    <div className="flex w-full flex-1 flex-col md:px-[4.5rem] min-[72rem]:px-0">
      <SiteHeader account={account} theme={theme} />
      <div className="mx-auto flex w-full min-w-0 flex-1 flex-col md:max-w-2xl">
        {/* Threads puts the page title above the card, on the page itself. */}
        {pathname === "/search" ? (
          <Suspense fallback={<div aria-hidden="true" className="h-16" />}>
            <PartySearch />
          </Suspense>
        ) : TITLES[pathname] ? (
          <p aria-hidden="true" className="hidden h-16 items-center px-4 text-lg font-semibold md:flex">
            {TITLES[pathname]}
          </p>
        ) : (
          <div aria-hidden="true" className="hidden h-3 md:block" />
        )}
        <div className="flex min-w-0 flex-1 flex-col bg-card md:flex-none md:rounded-3xl md:border md:border-line">
          {children}
        </div>
        <p className="hidden px-4 py-8 text-center text-sm text-muted md:block">
          © 2026 MaTee · หาตี้ทำกิจกรรมสำหรับนักศึกษา มช.
        </p>
      </div>
      {pathname === "/create" ? null : (
        <Link
          href="/create"
          aria-label="ตั้งตี้ใหม่"
          className="press fixed right-4 bottom-28 z-10 grid size-14 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-lg md:right-8 md:bottom-8"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      )}
      {account ? null : (
        <aside className="fixed top-3 right-6 hidden w-72 xl:block">
          <div className="grid gap-3 rounded-3xl border border-line bg-card p-5">
            <h2 className="text-lg font-semibold">เข้าสู่ระบบหรือสมัครสมาชิก</h2>
            <p className="text-sm leading-6 text-muted">
              ตั้งตี้ ขอเข้าร่วม และคุยในแชทของตี้ได้เมื่อมีบัญชี
            </p>
            <Link
              href="/login"
              className="press rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-brand-foreground"
            >
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="text-center text-sm font-medium text-accent underline">
              สมัครสมาชิก
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
