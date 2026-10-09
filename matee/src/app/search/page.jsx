import { Suspense } from "react";

import { PartyFilters } from "@/components/party-filters";
import { PartyFeed } from "@/components/party-feed";
import { readFeedFilters } from "@/lib/parties/filters";

export const metadata = {
  title: "ค้นหา | MaTee",
};

export default async function SearchPage({ searchParams }) {
  const filters = await readFeedFilters(searchParams, "all");
  const searching = Boolean(filters.q || filters.category || filters.after || filters.before || filters.host);

  return (
    <main className="flex w-full flex-1 flex-col">
      <h1 className="sr-only">ค้นหา</h1>
      <Suspense fallback={<div className="m-4 h-9 rounded-full bg-line/60" />}>
        <PartyFilters />
      </Suspense>
      <div className="border-t border-line" />
      {searching ? (
        <PartyFeed
          filters={filters}
          emptyMessage="ไม่พบตี้ที่ตรงกับคำค้นหา ลองเปลี่ยนคำ หมวด หรือเอาตัวกรองออก"
        />
      ) : (
        <>
          <h2 className="px-4 pt-4 pb-1 text-base font-semibold text-muted">ตี้แนะนำ</h2>
          <PartyFeed
            filters={{ ...filters, availability: "open" }}
            emptyMessage="ยังไม่มีตี้ที่เปิดรับ ลองตั้งตี้ใหม่"
          />
        </>
      )}
    </main>
  );
}
