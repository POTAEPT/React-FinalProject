import { Suspense } from "react";

import { PartyFeed } from "@/components/party-feed";
import { PartyFilters } from "@/components/party-filters";
import { readFeedFilters } from "@/lib/parties/filters";

export const metadata = {
  title: "หาตี้ | MaTee",
};

export default async function Home({ searchParams }) {
  const filters = await readFeedFilters(searchParams);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">หาตี้</h1>
        <p className="max-w-xl text-sm leading-6 text-muted">
          ตี้ที่ยังเปิดรับและยังไม่เริ่ม เลือกหมวดหรือค้นจากชื่อกับสถานที่
        </p>
      </div>
      <Suspense fallback={<div className="h-16 rounded-xl bg-line/60" />}>
        <PartyFilters />
      </Suspense>
      <PartyFeed
        filters={filters}
        emptyMessage="ยังไม่มีตี้ที่ตรงกับตัวกรอง ลองล้างคำค้นหรือตั้งตี้ใหม่"
      />
    </main>
  );
}
