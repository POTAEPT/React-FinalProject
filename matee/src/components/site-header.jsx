"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { useTheme } from "@/components/theme-provider";
import { signOut } from "@/lib/auth/actions";
import { THEMES } from "@/lib/theme";

const links = [
  { href: "/", label: "หาตี้", icon: "home" },
  { href: "/create", label: "ตั้งตี้", icon: "plus" },
  { href: "/my-party", label: "ตี้ของฉัน", icon: "calendar" },
];

const searchLink = { href: "/search", label: "ค้นหา", icon: "search" };

// Signed-in viewers also get Profile as a main section, as Threads does.
const profileLink = { href: "/account", label: "โปรไฟล์", icon: "user" };
// Admins only (account.isAdmin): last in the sidebar and the phone tab bar.
const adminLink = { href: "/admin", label: "ผู้ดูแลระบบ", icon: "shield" };

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ name, className = "size-5", filled = false }) {
  const paths = {
    home: <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
    plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    arrow: <path d="M19 12H5M11 6l-6 6 6 6" />,
    menu: <path d="M5 9h14M5 15h14" />,
    more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
    monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    shield: <path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z" />,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

const themeIcon = { system: "monitor", light: "sun", dark: "moon" };

const menuRow =
  "press flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-base font-semibold hover:bg-background";

// Threads-style menu: plain rows, "ธีม" drills into the theme
// choices, and log out sits last in red below a divider.
// account is null for guests, who only get the theme row.
function MenuPanel({ account, close, onSignOut, signingOut }) {
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState("main");

  if (view === "theme") {
    return (
      <div className="grid gap-3 pb-1">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center px-1 pt-1">
          <button
            type="button"
            aria-label="กลับ"
            onClick={() => setView("main")}
            className="press grid size-10 place-items-center rounded-full hover:bg-background"
          >
            <Icon name="arrow" className="size-6" />
          </button>
          <p className="text-center text-base font-semibold">ธีม</p>
        </div>
        <div role="group" aria-label="ธีม" className="mx-2 flex gap-1 rounded-2xl bg-background p-1">
          {[...THEMES.slice(1), THEMES[0]].map((option) => {
            const selected = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                aria-label={option.label}
                onClick={() => setTheme(option.value)}
                className={`press grid h-11 place-items-center rounded-xl text-base font-semibold ${
                  selected
                    ? "flex-[2] border border-line bg-card shadow-sm"
                    : "flex-1 text-muted hover:text-foreground"
                }`}
              >
                {selected ? option.label : <Icon name={themeIcon[option.value]} className="size-5" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <button type="button" onClick={() => setView("theme")} className={menuRow}>
        ธีม
        <Icon name="chevron" className="size-4 -rotate-90 text-muted" />
      </button>
      {account ? (
        <>
          <Link href="/account/edit" onClick={close} className={menuRow}>
            ตั้งค่าโปรไฟล์
          </Link>
          <div className="mx-2 my-1 border-t border-line" />
          <button
            type="button"
            disabled={signingOut}
            onClick={onSignOut}
            className={`${menuRow} text-danger hover:bg-danger-bg disabled:opacity-60`}
          >
            {signingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>
        </>
      ) : null}
    </div>
  );
}

// A disclosure: a button that opens a small panel below it. Closes on Escape,
// on a click outside, and when an item inside is chosen.
function Dropdown({ label, button, children, placement = "below", variant = "pill" }) {
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
        className={
          variant === "icon"
            ? "press grid size-10 place-items-center rounded-full hover:bg-background aria-expanded:bg-background"
            : "flex items-center gap-2 rounded-full border border-line px-1.5 py-1 text-sm hover:bg-background"
        }
      >
        {button}
        {variant === "icon" ? null : <Icon name="chevron" className="size-4 text-muted" />}
      </button>
      {open ? (
        <div
          id={panelId}
          className={`absolute z-20 grid w-72 rounded-3xl border border-line bg-card p-2 shadow-xl ${
            placement === "above"
              ? "bottom-full left-0 mb-2"
              : placement === "start"
                ? "left-0 mt-2"
                : "right-0 mt-2"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

function AccountMenu({ account, placement, variant, iconName = "menu" }) {
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
      placement={placement}
      variant={variant}
      label={`เมนูบัญชี ${account.displayName}`}
      button={
        variant === "icon" ? (
          <Icon name={iconName} className="size-6" />
        ) : (
          <>
            <Icon name="more" className="size-5" />
            <span className="font-medium max-md:hidden">เพิ่มเติม</span>
          </>
        )
      }
    >
      {(close) => (
        <MenuPanel
          account={account}
          close={close}
          signingOut={signingOut}
          onSignOut={() => onSignOut(close)}
        />
      )}
    </Dropdown>
  );
}

// The "=" button that opens the menu, shared by the sidebar and the phone
// top bar. Signed-in viewers get theme and log out; guests only the theme.
function MenuButton({ account, placement = "start" }) {
  if (account) {
    return <AccountMenu account={account} placement={placement} variant="icon" />;
  }

  return (
    <Dropdown
      placement={placement}
      variant="icon"
      label="เมนู"
      button={<Icon name="menu" className="size-6" />}
    >
      {(close) => <MenuPanel account={null} close={close} />}
    </Dropdown>
  );
}

function GuestSidebar() {
  return (
    <div className="grid gap-2">
      <Link
        href="/login"
        className="press rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-brand-foreground"
      >
        เข้าสู่ระบบ
      </Link>
      <Link href="/register" className="rounded-xl px-4 py-2 text-center text-sm hover:bg-background">
        สมัครสมาชิก
      </Link>
    </div>
  );
}

// account: { id, displayName, avatarUrl, isAdmin } for a signed-in user, or null.
// The theme comes from ThemeProvider (useTheme) inside the menus.
export function SiteHeader({ account }) {
  const pathname = usePathname();
  // Like Threads, the logo bar shows on the home tab only. Profile has its own
  // icon row (search, settings); other pages open with their own title.
  const showPhoneBar = pathname === "/";
  // Below 72rem the sidebar has no room for icon and text, so it folds to an
  // icon rail: labels hide, and railOnly parts show.
  const hideLabel = "max-[72rem]:hidden";
  const railOnly = "hidden max-[72rem]:grid";
  const navLinks = account
    ? [links[0], searchLink, links[1], links[2], profileLink, ...(account.isAdmin ? [adminLink] : [])]
    : [links[0], searchLink, links[1], links[2]];

  return (
    <>
      {/* Desktop: Threads-style sidebar. It folds to an icon rail when the
          window is too narrow for icon and text. */}
      <aside
        className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col justify-between px-3 py-5 transition-[width] duration-300 ease-out md:flex max-[72rem]:w-[4.5rem]"
      >
        <div className="grid gap-6">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              aria-label="MaTee มาตี้กัน"
              className="flex items-center gap-2 px-3 leading-tight max-[72rem]:w-full max-[72rem]:justify-center max-[72rem]:px-0"
            >
              <span className={`${hideLabel} h-10`}>
                <BrandLogo variant="full" className="h-10 w-auto" priority />
              </span>
              <span className={`${railOnly} size-10 place-items-center`}>
                <BrandLogo variant="icon" className="h-9 w-auto" priority />
              </span>
            </Link>
            <div className={hideLabel}>
              <MenuButton account={account} />
            </div>
          </div>
          <nav aria-label="เมนูหลัก">
            <ul className="grid gap-1">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      title={link.label}
                      aria-label={link.label}
                      aria-current={active ? "page" : undefined}
                      className={`press flex items-center gap-3 rounded-2xl px-3 py-3 text-base max-[72rem]:justify-center max-[72rem]:px-0 ${
                        active
                          ? "bg-brand-soft font-semibold text-foreground"
                          : "text-foreground hover:bg-background"
                      }`}
                    >
                      <Icon name={link.icon} className="size-6 shrink-0" filled={active && ["home", "user", "shield"].includes(link.icon)} />
                      <span className={hideLabel}>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="grid justify-items-center gap-2">
          <div className={railOnly}>
            <MenuButton account={account} placement="above" />
          </div>
          {account ? null : (
            <div className={`w-full ${hideLabel}`}>
              <GuestSidebar />
            </div>
          )}
          {account ? null : (
            <Link
              href="/login"
              aria-label="เข้าสู่ระบบ"
              title="เข้าสู่ระบบ"
              className={`press grid size-10 place-items-center rounded-full hover:bg-background ${railOnly}`}
            >
              <Icon name="user" className="size-6" />
            </Link>
          )}
        </div>
      </aside>

      {/* Phone: Threads-style top bar and an icon-only tab bar. */}
      <header
        className={`glass-card sticky top-0 z-10 grid-cols-[1fr_auto_1fr] items-center px-3 py-2 md:hidden ${
          showPhoneBar ? "grid" : "hidden"
        }`}
      >
        {/* The sidebar's ≡ menu is hidden on phones; this keeps the theme (and,
            when signed in, settings and log out) within reach. */}
        <div className="justify-self-start">
          <MenuButton account={account} />
        </div>
        <Link href="/" className="flex items-center gap-2 leading-tight">
          <BrandLogo variant="full" className="h-8 w-auto" priority />
        </Link>
        <div className="flex items-center gap-1 justify-self-end">
          <Link
            href="/search"
            aria-label="ค้นหา"
            className="press grid size-10 place-items-center rounded-full hover:bg-background"
          >
            <Icon name="search" className="size-6" />
          </Link>
          {account ? null : (
            <Link
              href="/login"
              className="press whitespace-nowrap rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-foreground"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </header>

      {account && pathname === "/account" ? (
        <div className="glass-card sticky top-0 z-10 flex items-center justify-end gap-1 px-3 py-2 md:hidden">
          <Link
            href="/search"
            aria-label="ค้นหา"
            className="press grid size-10 place-items-center rounded-full hover:bg-background"
          >
            <Icon name="search" className="size-6" />
          </Link>
          <AccountMenu account={account} placement="below" variant="icon" iconName="gear" />
        </div>
      ) : null}

      <nav
        aria-label="เมนูหลัก"
        className="glass-card fixed inset-x-0 bottom-0 z-10 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex items-center justify-around px-6 py-1.5">
          {[
            { ...links[2], icon: "calendar" },
            { ...links[0], icon: "home" },
            profileLink,
            ...(account?.isAdmin ? [adminLink] : []),
          ].map((link) => {
            const active = isActive(pathname, link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-label={link.label}
                  aria-current={active ? "page" : undefined}
                  className={`press grid size-12 place-items-center ${
                    active ? "text-foreground" : "text-muted"
                  }`}
                >
                  <Icon
                    name={link.icon}
                    className="size-6"
                    filled={active && link.icon !== "calendar"}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
