"use client";

import { useState, useTransition } from "react";

// Two-step delete for one chat message: "ลบ" turns into "ลบข้อความนี้?" with
// confirm and cancel, so a chat with many messages needs no dialog per row.
// onDelete runs a Server Action and returns its { ok, message } result.
export function DeleteMessageButton({ onDelete, onDeleted }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await onDelete();

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setAsking(false);
      onDeleted?.();
    });
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="text-xs font-medium text-muted underline-offset-4 hover:text-danger hover:underline"
      >
        ลบ
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium">ลบข้อความนี้?</span>
      <button
        type="button"
        onClick={confirm}
        disabled={isPending}
        className="rounded-lg bg-danger px-2 py-1 font-medium text-danger-foreground disabled:opacity-60"
      >
        {isPending ? "กำลังลบ..." : "ลบ"}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        disabled={isPending}
        className="rounded-lg border border-line px-2 py-1 font-medium disabled:opacity-60"
      >
        ไม่ลบ
      </button>
      {error ? (
        <span role="alert" className="basis-full text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}
