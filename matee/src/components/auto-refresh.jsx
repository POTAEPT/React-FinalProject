"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-renders the current server page every `seconds` while the tab is
// visible, and once right away when the tab comes back after that long.
// router.refresh() keeps client state (open <details>, typed form values),
// so it is safe on pages with forms. Used by /manage so new join requests
// show up without a reload; party_members is not on Realtime.
export function AutoRefresh({ seconds = 15 }) {
  const router = useRouter();

  useEffect(() => {
    const interval = seconds * 1000;
    let last = Date.now();
    let timer = null;

    function refresh() {
      last = Date.now();
      router.refresh();
    }

    function start() {
      clearInterval(timer);
      if (document.visibilityState !== "visible") return;
      if (Date.now() - last >= interval) refresh();
      timer = setInterval(refresh, interval);
    }

    start();
    document.addEventListener("visibilitychange", start);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", start);
    };
  }, [router, seconds]);

  return null;
}
