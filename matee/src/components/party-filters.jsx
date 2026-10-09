"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { isPartyCategory, PARTY_CATEGORIES } from "@/lib/parties/categories";

const chipBase =
  "press shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const chipOn = "border-brand bg-brand-soft font-semibold text-foreground";
const chipOff = "border-line text-muted hover:bg-background";

export function PartyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get("category") ?? "";
  const category = isPartyCategory(rawCategory) ? rawCategory : "";
  const availability = searchParams.get("availability") === "open" ? "open" : "all";

  // Keep the search text and its filters; change only the chips.
  function apply(next) {
    const params = new URLSearchParams(searchParams);

    params.delete("category");
    params.delete("availability");

    if (next.category) {
      params.set("category", next.category);
    }

    if (next.availability === "open") {
      params.set("availability", "open");
    }

    router.push(params.size ? `/search?${params}` : "/search");
  }

  return (
    <div className="grid gap-3 px-4 py-3">
      <div
        role="group"
        aria-label="กรองตี้"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
      >
        <button
          type="button"
          aria-pressed={availability === "open"}
          onClick={() =>
            apply({
              category,
              availability: availability === "open" ? "all" : "open",
            })
          }
          className={`${chipBase} ${availability === "open" ? chipOn : chipOff}`}
        >
          เปิดรับ
        </button>
        <span aria-hidden="true" className="my-1 w-px shrink-0 bg-line" />
        <button
          type="button"
          aria-pressed={!category}
          onClick={() => apply({ category: "", availability })}
          className={`${chipBase} ${!category ? chipOn : chipOff}`}
        >
          ทุกหมวด
        </button>
        {PARTY_CATEGORIES.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={category === item.value}
            onClick={() => apply({ category: item.value, availability })}
            className={`${chipBase} ${category === item.value ? chipOn : chipOff}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
