"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { joinParty, leaveParty } from "@/lib/parties/member-actions";

const primaryClass =
  "rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60";
const secondaryClass =
  "rounded-xl border border-line px-4 py-2.5 text-sm font-medium disabled:opacity-60";
const disabledClass =
  "rounded-xl border border-dashed border-line px-4 py-2.5 text-center text-sm text-muted";

// Disabled state for a time conflict; the other party's title is a link.
function ConflictNote({ partyId, title }) {
  return (
    <p aria-disabled="true" className={disabledClass}>
      ชนเวลากับ “
      <Link href={`/party/${partyId}`} className="font-medium text-accent underline">
        {title}
      </Link>
      ”
    </p>
  );
}

// state comes from memberActionState() on the server. After an action the
// Server Action revalidates this page, so the next state arrives with it.
export function JoinButton({ partyId, state }) {
  const [result, setResult] = useState(null);
  const [isPending, startTransition] = useTransition();

  function run(action) {
    setResult(null);
    startTransition(async () => {
      const next = await action(partyId);

      if (!next.ok) {
        setResult(next);
      }
    });
  }

  let control;

  switch (state.kind) {
    case "guest":
      control = (
        <Link
          href={`/login?next=${encodeURIComponent(`/party/${partyId}`)}`}
          className={`${primaryClass} text-center`}
        >
          เข้าสู่ระบบเพื่อเข้าร่วม
        </Link>
      );
      break;
    case "host":
      control = (
        <Link href={`/manage/${partyId}`} className={`${secondaryClass} text-center`}>
          จัดการตี้
        </Link>
      );
      break;
    case "cancelled":
      control = (
        <button type="button" disabled className={disabledClass}>
          ปิดรับแล้ว
        </button>
      );
      break;
    case "confirmed":
      control = (
        <ConfirmDialog
          triggerLabel="ออกจากตี้"
          triggerClassName={secondaryClass}
          title="ออกจากตี้นี้?"
          description="ที่นั่งของคุณจะว่างให้คนอื่น และแชทของตี้จะปิดสำหรับคุณทันที ถ้าตี้ยังไม่เต็มและยังไม่เริ่ม กลับมาเข้าร่วมใหม่ได้"
          confirmLabel="ออกจากตี้"
          pendingLabel="กำลังออก..."
          onConfirm={() => leaveParty(partyId)}
        />
      );
      break;
    case "pending":
      control = (
        <div className="grid gap-2">
          <p className="rounded-xl bg-highlight px-4 py-2.5 text-center text-sm font-medium text-highlight-foreground">
            รอเจ้าของตี้อนุมัติ
          </p>
          <ConfirmDialog
            triggerLabel="ยกเลิกคำขอ"
            triggerClassName={secondaryClass}
            title="ยกเลิกคำขอเข้าร่วม?"
            description="คำขอจะหายจากรายการของเจ้าของตี้ และแชทของตี้จะปิดสำหรับคุณ ส่งคำขอใหม่ได้ภายหลังถ้าตี้ยังไม่เริ่ม"
            confirmLabel="ยกเลิกคำขอ"
            pendingLabel="กำลังยกเลิก..."
            onConfirm={() => leaveParty(partyId)}
          />
        </div>
      );
      break;
    case "rejected":
      control = (
        <div className="grid gap-2">
          <button type="button" disabled className={disabledClass}>
            ถูกปฏิเสธ
          </button>
          <p className="text-sm text-muted">
            เจ้าของตี้ปฏิเสธคำขอนี้แล้ว ส่งคำขอใหม่เองไม่ได้ เว้นแต่เจ้าของตี้จะเปลี่ยนใจและยืนยันให้
          </p>
        </div>
      );
      break;
    case "ended":
      control = (
        <button type="button" disabled className={disabledClass}>
          ตี้จบแล้ว
        </button>
      );
      break;
    case "started":
      control = (
        <button type="button" disabled className={disabledClass}>
          เริ่มแล้ว
        </button>
      );
      break;
    case "full":
      control = (
        <button type="button" disabled className={disabledClass}>
          เต็มแล้ว
        </button>
      );
      break;
    case "conflict":
      control = (
        <ConflictNote partyId={state.conflictingPartyId} title={state.conflictingTitle} />
      );
      break;
    default:
      control = (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(joinParty)}
          className={primaryClass}
        >
          {isPending
            ? "กำลังส่ง..."
            : state.kind === "join"
              ? "เข้าร่วม"
              : "ขอเข้าร่วม"}
        </button>
      );
  }

  return (
    <div className="grid gap-2">
      {control}
      {result ? (
        <div role="alert" className="grid gap-1 text-sm text-danger">
          <p>{result.message}</p>
          {result.code === "time_conflict" && result.conflictingPartyId ? (
            <Link
              href={`/party/${result.conflictingPartyId}`}
              className="font-medium text-accent underline"
            >
              ดูตี้ “{result.conflictingTitle}”
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
