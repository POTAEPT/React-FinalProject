"use client";

import { useId, useRef, useState, useTransition } from "react";

const toneClass = {
  danger: "bg-danger text-danger-foreground",
  primary: "bg-accent text-accent-foreground",
};

// A button that asks before it acts. onConfirm runs a Server Action and returns
// its { ok, message } result: on success the dialog closes (the action's
// revalidation updates the page), on failure the message stays in the dialog.
export function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  triggerAriaLabel,
  title,
  description,
  confirmLabel,
  pendingLabel = "กำลังดำเนินการ...",
  cancelLabel = "ไม่ใช่ตอนนี้",
  tone = "danger",
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();

      if (result && !result.ok) {
        setError(result.message);
        return;
      }

      dialogRef.current?.close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={triggerAriaLabel}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-line bg-card p-5 text-foreground backdrop:bg-black/40"
      >
        <div className="grid gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-6 text-muted">{description}</p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={isPending}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${toneClass[tone]}`}
            >
              {isPending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
