"use client";

import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";

// The page arrives fully rendered from the server, so a splash only helps when
// the scripts are slow. It is in the server HTML but hidden; CSS reveals it if
// it is still there after 1 second (.boot-splash in globals.css). Once React
// has taken over it goes at once, or fades out if it was already showing.
// Without JavaScript the layout's <noscript> rule hides it.
const REVEAL_AFTER_MS = 1000;

export function BootSplash() {
  const [phase, setPhase] = useState("show");

  useEffect(() => {
    // performance.now() counts from the start of this page load.
    const shown = performance.now() >= REVEAL_AFTER_MS;
    const leave = setTimeout(() => setPhase(shown ? "leave" : "gone"), 0);
    const done = shown ? setTimeout(() => setPhase("gone"), 300) : null;

    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, []);

  if (phase === "gone") {
    return null;
  }

  return (
    <div
      id="boot-splash"
      role="status"
      aria-label="กำลังโหลด"
      className={`boot-splash fixed inset-0 z-[100] grid place-items-center bg-card ${
        phase === "leave" ? "is-leaving" : ""
      }`}
    >
      <BrandLogo variant="icon" className="brand-spin h-16 w-auto" priority />
    </div>
  );
}
