"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const KEYS = ["q", "after", "before", "host"];

function Glyph({ children, className = "size-5" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const fieldRow =
  "grid gap-1 rounded-2xl px-4 py-3 hover:bg-background has-[:focus-visible]:bg-background";
const inputClass =
  "w-full bg-transparent text-base outline-none placeholder:text-muted/70";

// Threads-style search: a pill input with a filter button that opens a small
// menu (after date, before date, from host). The URL is the state, so a
// search can be shared and the back button works.
export function PartySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = Object.fromEntries(KEYS.map((key) => [key, searchParams.get(key) ?? ""]));
  const [values, setValues] = useState(initial);
  const [synced, setSynced] = useState(searchParams.toString());
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef(null);

  // Follow the URL when it changes outside this form (back button, chips).
  if (synced !== searchParams.toString()) {
    setSynced(searchParams.toString());
    setValues(initial);
  }

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

  function go(next) {
    const params = new URLSearchParams();

    // The chips live in another component; keep what they set.
    for (const key of ["category", "availability"]) {
      const kept = searchParams.get(key);

      if (kept) {
        params.set(key, kept);
      }
    }

    for (const key of KEYS) {
      const text = (next[key] ?? "").trim();

      if (text) {
        params.set(key, text);
      }
    }

    router.push(params.size ? `/search?${params}` : "/search");
  }

  function set(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event) {
    event.preventDefault();
    setOpen(false);
    go(values);
  }

  const activeFilters = [
    values.after && { key: "after", label: `หลัง ${values.after}` },
    values.before && { key: "before", label: `ก่อน ${values.before}` },
    values.host && { key: "host", label: `จาก ${values.host}` },
  ].filter(Boolean);

  return (
    <div ref={rootRef} className="relative grid gap-3 px-4 pt-3 pb-3">
      <form onSubmit={onSubmit} role="search">
        <label htmlFor="party-search" className="sr-only">
          ค้นหา
        </label>
        <div className="flex items-center gap-2 rounded-full bg-background pr-2 pl-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <Glyph className="size-5 shrink-0 text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </Glyph>
          <input
            id="party-search"
            type="search"
            autoFocus
            value={values.q}
            onChange={(event) => set("q", event.target.value)}
            placeholder="ค้นหาชื่อกิจกรรมหรือสถานที่"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-muted"
          />
          <button
            type="button"
            aria-label="ตัวกรอง"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className="press relative grid size-9 place-items-center rounded-full text-muted hover:text-foreground aria-expanded:text-foreground"
          >
            <Glyph>
              <path d="M4 7h16M7 12h10M10 17h4" />
            </Glyph>
            {activeFilters.length ? (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand"
              />
            ) : null}
          </button>
        </div>
      </form>

      {open ? (
        <form
          id={panelId}
          onSubmit={onSubmit}
          className="absolute top-full right-4 z-20 grid w-72 rounded-3xl border border-line bg-card p-2 shadow-xl"
        >
          <label className={fieldRow}>
            <span className="flex items-center justify-between text-base font-semibold">
              หลังวันที่
              <Glyph className="size-5 text-muted">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </Glyph>
            </span>
            <input
              type="date"
              value={values.after}
              onChange={(event) => set("after", event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={fieldRow}>
            <span className="flex items-center justify-between text-base font-semibold">
              ก่อนวันที่
              <Glyph className="size-5 text-muted">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l-3 2" />
              </Glyph>
            </span>
            <input
              type="date"
              value={values.before}
              onChange={(event) => set("before", event.target.value)}
              className={inputClass}
            />
          </label>
          <div className="mx-2 my-1 border-t border-line" />
          <label className={fieldRow}>
            <span className="flex items-center justify-between text-base font-semibold">
              จากโปรไฟล์…
              <Glyph className="size-5 text-muted">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </Glyph>
            </span>
            <input
              value={values.host}
              onChange={(event) => set("host", event.target.value)}
              placeholder="ชื่อเจ้าของตี้"
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            className="press m-2 rounded-2xl bg-brand px-4 py-3 text-base font-semibold text-brand-foreground"
          >
            ใช้ตัวกรอง
          </button>
        </form>
      ) : null}

      {activeFilters.length ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              aria-label={`เอา ${filter.label} ออก`}
              onClick={() => go({ ...values, [filter.key]: "" })}
              className="press flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm font-medium"
            >
              {filter.label}
              <Glyph className="size-3.5 text-muted">
                <path d="M6 6l12 12M18 6 6 18" />
              </Glyph>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
