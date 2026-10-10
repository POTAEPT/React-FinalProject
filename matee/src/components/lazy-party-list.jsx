"use client";

import { useEffect, useRef, useState } from "react";

import { PartyCard } from "@/components/party-card";
import { PartyFeedSkeleton } from "@/components/party-card-skeleton";
import { findConflict } from "@/lib/parties/my-commitments";

const PAGE_SIZE = 10;
const LOAD_DELAY_MS = 250;

// Renders the parties a page at a time. A skeleton sits where the next page
// goes; when it scrolls near the viewport the next page replaces it. Mount it
// with a key that changes with the list, so the count starts over.
export function LazyPartyList({ parties, commitments }) {
  const [count, setCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  const hasMore = count < parties.length;

  useEffect(() => {
    const node = sentinelRef.current;

    if (!hasMore || !node) {
      return undefined;
    }

    // Observing again after every page makes the callback fire for a sentinel
    // that is still on screen, so a tall viewport keeps filling.
    let timer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Short pause so the skeleton reads as loading rather than flashing.
        if (entry.isIntersecting && !timer) {
          timer = setTimeout(() => setCount((value) => value + PAGE_SIZE), LOAD_DELAY_MS);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(node);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [hasMore, count]);

  return (
    <>
      <ul className="divide-y divide-line">
        {parties.slice(0, count).map((party) => (
          <li key={party.id}>
            <PartyCard
              party={party}
              conflict={findConflict(commitments, party.startMs, party.endMs, party.id)}
            />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div ref={sentinelRef} className="border-t border-line">
          <PartyFeedSkeleton count={2} />
        </div>
      ) : (
        <p className="border-t border-line px-4 py-8 text-center text-sm text-muted">
          ดูครบทุกตี้แล้ว
        </p>
      )}
    </>
  );
}
