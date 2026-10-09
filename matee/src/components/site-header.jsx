"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { signOut } from "@/lib/auth/actions";
import { THEME_COOKIE, THEMES } from "@/lib/theme";

const links = [
  { href: "/", label: "หาตี้", icon: "search" },
  { href: "/create", label: "ตั้งตี้", icon: "plus" },
  { href: "/my-party", label: "ตี้ของฉัน", icon: "calendar" },
];

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ name, className = "size-5" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
    monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

const themeIcon = { system: "monitor", light: "sun", dark: "moon" };

// Writes the choice where the server reads it (cookie, for the first paint)
// and applies it at once through data-theme on <html>.
function applyTheme(value) {
  const root = document.documentElement;

  if (value === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = value;
  }

  document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}

function ThemeOptions({ theme, onChange }) {
  return (
    <fieldset className="grid gap-1">
      <legend className="px-2 pb-1 text-xs font-medium text-muted">ธีม</legend>
      <div className="grid grid-cols-3 gap-1">
        {THEMES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={theme === option.value}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs ${
              theme === option.value
                ? "bg-accent text-accent-foreground"
                : "text-foreground hover:bg-background"
            }`}
          >
            <Icon name={themeIcon[option.value]} className="size-4" />
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// A disclosure: a button that opens a small panel below it. Closes on Escape,
// on a click outside, and when an item inside is chosen.
function Dropdown({ label, button, children }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-line px-1.5 py-1 text-sm hover:bg-background"
      >
        {button}
        <Icon name="chevron" className="size-4 text-muted" />
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-20 mt-2 grid w-64 gap-2 rounded-2xl border border-line bg-card p-2 shadow-lg"
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ account }) {
  if (account.avatarUrl) {
    return (
      <Image
        src={account.avatarUrl}
        alt=""
        width={28}
        height={28}
        className="size-7 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-7 place-items-center rounded-full bg-soft text-sm font-medium text-soft-foreground"
    >
      {account.displayName.slice(0, 1)}
    </span>
  );
}

function AccountMenu({ account, theme, onTheme }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut(close) {
    setSigningOut(true);
    await signOut();
    close();
    setSigningOut(false);
    router.push("/");
    router.refresh();
  }

  return (
    <Dropdown
      label={`เมนูบัญชี ${account.displayName}`}
      button={
        <>
          <Avatar account={account} />
          <span className="hidden max-w-32 truncate font-medium sm:inline">
            {account.displayName}
          </span>
        </>
      }
    >
      {(close) => (
        <>
          <p className="truncate px-2 pt-1 text-sm font-semibold">{account.displayName}</p>
          <Link
            href="/account"
            onClick={close}
            className="rounded-xl px-2 py-2 text-sm hover:bg-background"
          >
            โปรไฟล์ของฉัน
          </Link>
          <div className="border-t border-line pt-2">
            <ThemeOptions theme={theme} onChange={onTheme} />
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => onSignOut(close)}
            className="rounded-xl border-t border-line px-2 py-2 text-left text-sm text-danger hover:bg-danger-bg disabled:opacity-60"
          >
            {signingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>
        </>
      )}
    </Dropdown>
  );
}

function GuestMenu({ theme, onTheme }) {
  return (
    <div className="flex items-center gap-2">
      <Dropdown label="เลือกธีม" button={<Icon name={themeIcon[theme]} className="size-5" />}>
        {() => <ThemeOptions theme={theme} onChange={onTheme} />}
      </Dropdown>
      <Link
        href="/login"
        className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
      >
        เข้าสู่ระบบ
      </Link>
      <Link href="/register" className="hidden rounded-full px-3 py-1.5 text-sm sm:inline">
        สมัครสมาชิก
      </Link>
    </div>
  );
}

// account: { displayName, avatarUrl } for a signed-in user, or null.
// theme: the saved preference ("system" | "light" | "dark") from the cookie.
export function SiteHeader({ account, theme: savedTheme }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState(savedTheme);

  function onTheme(value) {
    applyTheme(value);
    setTheme(value);
  }

  return (
    <>
      <header className="border-t-4 border-b border-t-brand border-b-line bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 leading-tight">
            <span aria-hidden="true" className="size-7 rounded-full bg-brand" />
            <span>
              <span className="block text-lg font-semibold">MaTee</span>
              <span className="block text-xs text-muted">มาตี้กัน</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 text-sm sm:flex">
              {links.map((link) => {
                const active = isActive(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3 py-1.5 ${
                      active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-background"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            {account ? (
              <AccountMenu account={account} theme={theme} onTheme={onTheme} />
            ) : (
              <GuestMenu theme={theme} onTheme={onTheme} />
            )}
          </div>
        </div>
      </header>

      {/* Mobile: the main sections move to a tab bar within thumb reach. */}
      <nav
        aria-label="เมนูหลัก"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="grid grid-cols-3">
          {links.map((link) => {
            const active = isActive(pathname, link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                    active ? "font-semibold text-accent" : "text-muted"
                  }`}
                >
                  <Icon name={link.icon} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
