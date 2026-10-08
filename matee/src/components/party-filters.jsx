"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { isPartyCategory, PARTY_CATEGORIES } from "@/lib/parties/categories";

const fieldClass =
  "w-full rounded-xl border border-line bg-card px-3 py-2 text-base outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function PartyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get("category") ?? "";
  const category = isPartyCategory(rawCategory) ? rawCategory : "";
  const availability = searchParams.get("availability") === "all" ? "all" : "open";
  const q = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [syncedQuery, setSyncedQuery] = useState(q);

  if (q !== syncedQuery) {
    setSyncedQuery(q);
    setQuery(q);
  }

  function apply(next) {
    const params = new URLSearchParams();
    const text = next.q.trim();

    if (text) {
      params.set("q", text);
    }

    if (next.category) {
      params.set("category", next.category);
    }

    if (next.availability === "all") {
      params.set("availability", "all");
    }

    const href = params.size ? `/?${params}` : "/";
    router.push(href);
  }

  function onSubmit(event) {
    event.preventDefault();
    apply({ q: query, category, availability });
  }

  const filtered = Boolean(q || category || availability === "all");

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_11rem_11rem_auto]">
      <div className="grid gap-1">
        <label htmlFor="party-search" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="party-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ชื่อกิจกรรมหรือสถานที่"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="party-category" className="text-sm font-medium">
          หมวดหมู่
        </label>
        <select
          id="party-category"
          value={category}
          onChange={(event) =>
            apply({ q: query, category: event.target.value, availability })
          }
          className={fieldClass}
        >
          <option value="">ทุกหมวด</option>
          {PARTY_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <label htmlFor="party-availability" className="text-sm font-medium">
          สถานะ
        </label>
        <select
          id="party-availability"
          value={availability}
          onChange={(event) =>
            apply({ q: query, category, availability: event.target.value })
          }
          className={fieldClass}
        >
          <option value="open">เปิดรับ</option>
          <option value="all">ทั้งหมดที่ยังไม่ยกเลิก</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          ค้นหา
        </button>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.push("/");
            }}
            className="rounded-xl px-3 py-2 text-sm text-muted"
          >
            ล้าง
          </button>
        ) : null}
      </div>
    </form>
  );
}
