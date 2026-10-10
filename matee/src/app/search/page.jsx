import { Suspense } from "react";

import { PartyFilters } from "@/components/party-filters";
import { PartyFeedSkeleton } from "@/components/party-card-skeleton";
import { SearchFeed } from "@/components/search-feed";

// Rendering: SSR (ตั้งใจ) — ปุ่มบนการ์ดขึ้นกับคนที่ดู (session + ตี้ที่ตัวเองมี) และ
// จำนวนที่นั่งต้องเป็นค่าปัจจุบัน จึงสร้างหน้าล่วงหน้า (SSG/ISR) ไม่ได้
// หน้านี้ดึงตี้ทั้งหมดครั้งเดียว แล้วกรองฝั่ง client ตาม ?q= / หมวด / ช่วงวันที่
// (ดู SearchResults) จึงไม่อ่าน searchParams บน server
export const dynamic = "force-dynamic";

export const metadata = {
  title: "ค้นหา | MaTee",
};

export default function SearchPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <h1 className="sr-only">ค้นหา</h1>
      <Suspense fallback={<div className="m-4 h-9 rounded-full bg-line/60" />}>
        <PartyFilters />
      </Suspense>
      <div className="border-t border-line" />
      <Suspense fallback={<PartyFeedSkeleton />}>
        <SearchFeed />
      </Suspense>
    </main>
  );
}
