"use client";

import { useState, useTransition } from "react";

import { skipParty } from "@/lib/parties/member-actions";

// Hides the party from this user's feed. skipParty revalidates "/", so the card
// leaves the list with the same response.
export function SkipButton({ partyId, title }) {
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await skipParty(partyId);

      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <span className="grid justify-items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-label={`ข้ามตี้ ${title}`}
        className="rounded-full border border-line px-3 py-1 text-sm text-muted transition hover:border-accent disabled:opacity-60"
      >
        {isPending ? "กำลังข้าม..." : "ข้าม"}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-red-700 dark:text-red-300">
          {error}
        </span>
      ) : null}
    </span>
  );
}
