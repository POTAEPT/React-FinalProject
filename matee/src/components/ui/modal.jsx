"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Threads-style sheet over the page. Closing goes back, so the URL and the
// modal stay in step. Esc, the backdrop and Cancel all close it.
// closeHref: where closing goes when the modal opened on a direct visit, so
// there is no previous page to go back to. Omit it to go back in history.
export function Modal({ title, children, closeHref }) {
  const router = useRouter();
  const panelRef = useRef(null);
  const backdropRef = useRef(null);

  function close() {
    if (closeHref) {
      router.replace(closeHref);
    } else {
      router.back();
    }
  }

  useEffect(() => {
    const previous = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    // Keep Tab and screen readers inside the sheet: everything else on the
    // page becomes inert while it is open (elements already inert stay so).
    const background = [...document.body.children].filter(
      (element) => !element.contains(backdropRef.current) && !element.inert,
    );
    background.forEach((element) => {
      element.inert = true;
    });

    function onKey(event) {
      if (event.key === "Escape") {
        if (closeHref) {
          router.replace(closeHref);
        } else {
          router.back();
        }
      }
    }

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      background.forEach((element) => {
        element.inert = false;
      });
      previous?.focus?.();
    };
  }, [router, closeHref]);

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-black/50 md:p-3"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="modal-panel flex h-dvh w-full flex-col overflow-hidden bg-card shadow-2xl outline-none md:h-auto md:max-h-[calc(100dvh-1.5rem)] md:max-w-xl md:rounded-3xl"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line px-5 py-4">
          <button
            type="button"
            aria-label="ปิด"
            onClick={close}
            className="press -ml-2 grid size-10 place-items-center justify-self-start rounded-full hover:bg-background"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <h2 className="text-base font-semibold">{title}</h2>
          <span />
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain p-5">{children}</div>
      </div>
    </div>
  );
}
