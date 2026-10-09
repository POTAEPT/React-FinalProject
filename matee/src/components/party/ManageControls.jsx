"use client";

import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cancelParty, decideRequest } from "@/lib/parties/member-actions";

const primaryClass =
  "rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60";
const secondaryClass =
  "rounded-xl border border-line px-3 py-1.5 text-sm font-medium disabled:opacity-60";
const dangerClass =
  "w-full rounded-xl bg-danger px-4 py-2.5 text-sm font-medium text-danger-foreground disabled:opacity-60";

function ErrorText({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  );
}

// Confirm or reject one pending request. Confirming acts at once; rejecting
// asks first (QA-2). decideRequest revalidates the page, so the row moves to
// the right list, or disappears when the request is out of date.
export function DecisionButtons({ memberId, name }) {
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await decideRequest(memberId, "confirmed");

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
          onClick={confirm}
          aria-label={`ยืนยัน ${name}`}
          className={primaryClass}
        >
          {isPending ? "กำลังยืนยัน..." : "ยืนยัน"}
        </button>
        <ConfirmDialog
          triggerLabel="ปฏิเสธ"
          triggerAriaLabel={`ปฏิเสธ ${name}`}
          triggerClassName={secondaryClass}
          title={`ปฏิเสธคำขอของ ${name}?`}
          description="คนนี้จะส่งคำขอเข้าตี้นี้ใหม่เองไม่ได้ ถ้าเปลี่ยนใจภายหลัง กดยืนยันได้จากรายการ “ปฏิเสธแล้ว” ในหน้านี้"
          confirmLabel="ปฏิเสธคำขอ"
          pendingLabel="กำลังปฏิเสธ..."
          onConfirm={() => decideRequest(memberId, "rejected")}
        />
      </div>
      <ErrorText message={error} />
    </div>
  );
}

// QA-6: the host can let in someone they rejected earlier.
export function UndoRejectButton({ memberId, name }) {
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await decideRequest(memberId, "confirmed");

      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="grid justify-items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={confirm}
        aria-label={`เปลี่ยนใจ ยืนยัน ${name}`}
        className={secondaryClass}
      >
        {isPending ? "กำลังยืนยัน..." : "เปลี่ยนใจ ยืนยัน"}
      </button>
      <ErrorText message={error} />
    </div>
  );
}

// Cancel the whole party, always behind a confirm dialog. Cancelling is one-way.
export function CancelPartyButton({ partyId, title }) {
  return (
    <ConfirmDialog
      triggerLabel="ยกเลิกตี้"
      triggerClassName={dangerClass}
      title={`ยกเลิกตี้ “${title}”?`}
      description="ยกเลิกแล้วเปิดกลับไม่ได้ ตี้จะหายจากหน้าหาตี้ และไม่มีใครเข้าร่วมเพิ่มได้ สมาชิกยังคุยในแชทได้อีก 7 วัน"
      confirmLabel="ยืนยันยกเลิกตี้"
      pendingLabel="กำลังยกเลิก..."
      cancelLabel="ไม่ยกเลิก"
      onConfirm={() => cancelParty(partyId)}
    />
  );
}
