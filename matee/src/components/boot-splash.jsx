"use client";

import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";

// Full-screen spinning logo while the page loads or refreshes. It is in the
// server HTML, so it shows before any script runs, and goes away once React
// has taken over. Without JavaScript the layout's <noscript> rule hides it.
export function BootSplash() {
  const [phase, setPhase] = useState("show");

  useEffect(() => {
    // A short minimum keeps a fast load from flashing the logo.
    const leave = setTimeout(() => setPhase("leave"), 400);
    const done = setTimeout(() => setPhase("gone"), 700);

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
      className={`fixed inset-0 z-[100] grid place-items-center bg-card transition-opacity duration-300 ${
        phase === "leave" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <BrandLogo variant="icon" className="brand-spin h-16 w-auto" priority />
    </div>
  );
}
