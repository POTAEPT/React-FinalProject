"use client";

import { useRef, useState, useTransition } from "react";

import { cancelParty, decideRequest } from "@/lib/parties/member-actions";

const primaryClass =
  "rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60";
const secondaryClass =
  "rounded-xl border border-line px-3 py-1.5 text-sm font-medium disabled:opacity-60";
const dangerClass =
  "rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-red-600";

function ErrorText({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-300">
      {message}
    </p>
  );
}

// Confirm or reject one pending request. decideRequest revalidates the page,
// so the row moves to the right list with the same response.
export function DecisionButtons({ memberId, name }) {
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function decide(decision) {
    setError(null);
    startTransition(async () => {
      const result = await decideRequest(memberId, decision);

      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="grid justify-items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide("confirmed")}
          aria-label={`ยืนยัน ${name}`}
          className={primaryClass}
        >
          ยืนยัน
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide("rejected")}
          aria-label={`ปฏิเสธ ${name}`}
          className={secondaryClass}
        >
          ปฏิเสธ
        </button>
      </div>
      <ErrorText message={error} />
    </div>
  );
}

// Cancel the whole party, always behind a confirm dialog. Cancelling is one-way.
export function CancelPartyButton({ partyId, title }) {
  const dialogRef = useRef(null);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function confirmCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelParty(partyId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      dialogRef.current?.close();
    });
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={dangerClass}
      >
        ยกเลิกตี้
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="cancel-party-title"
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-line bg-card p-5 text-foreground backdrop:bg-black/40"
      >
        <div className="grid gap-4">
          <h2 id="cancel-party-title" className="text-lg font-semibold">
            ยกเลิกตี้ “{title}”?
          </h2>
          <p className="text-sm leading-6 text-muted">
            ยกเลิกแล้วเปิดกลับไม่ได้ ตี้จะหายจากหน้าหาตี้ และไม่มีใครเข้าร่วมเพิ่มได้
            สมาชิกยังคุยในแชทได้อีก 7 วัน
          </p>
          <ErrorText message={error} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
              className={secondaryClass}
            >
              ไม่ยกเลิก
            </button>
            <button
              type="button"
              onClick={confirmCancel}
              disabled={isPending}
              className={dangerClass}
            >
              {isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิกตี้"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
