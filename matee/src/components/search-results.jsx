"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PartyFeedSkeleton } from "@/components/party-card-skeleton";
import { LazyPartyList } from "@/components/lazy-party-list";
import { FeedMessage } from "@/components/feed-message";
import { filterParties, hasSearchFilters, readSearchFilters } from "@/lib/parties/search";

// Client-side search: the page loads every open party once, and this filters
// them as the URL (?q=, chips, date range) changes. No request per keystroke.
export function SearchResults({ parties, commitments }) {
  const query = useSearchParams().toString();
  // Debounce: filter 300 ms after the URL stops changing, skeleton meanwhile.
  const [settled, setSettled] = useState(query);
  const pending = settled !== query;

  useEffect(() => {
    if (!pending) {
      return undefined;
    }

    const timer = setTimeout(() => setSettled(query), 300);

    return () => clearTimeout(timer);
  }, [pending, query]);

  const filters = readSearchFilters(new URLSearchParams(settled));
  const searching = hasSearchFilters(filters);
  const shown = filterParties(parties, searching ? filters : { ...filters, availability: "open" });

  return (
    <>
      {pending ? (
        <PartyFeedSkeleton />
      ) : searching ? null : (
        <h2 className="px-4 pt-4 pb-1 text-base font-semibold text-muted">ตี้แนะนำ</h2>
      )}
      {pending ? null : shown.length === 0 ? (
        <FeedMessage>
          {searching
            ? "ไม่พบตี้ที่ตรงกับคำค้นหา ลองเปลี่ยนคำ หมวด หรือเอาตัวกรองออก"
            : "ยังไม่มีตี้ที่เปิดรับ ลองตั้งตี้ใหม่"}
        </FeedMessage>
      ) : (
        <LazyPartyList
          key={settled}
          parties={shown}
          commitments={commitments}
        />
      )}
    </>
  );
}
