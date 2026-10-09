import { PartyComposer } from "@/components/party-composer";
import { PartyFeed } from "@/components/party-feed";
import { loadAccount } from "@/lib/auth/account";
import { readFeedFilters } from "@/lib/parties/filters";

export const metadata = {
  title: "หาตี้ | MaTee",
};

export default async function Home({ searchParams }) {
  const [filters, account] = await Promise.all([
    readFeedFilters(searchParams),
    loadAccount(),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <h1 className="sr-only">
        หาตี้
      </h1>
      <div className="border-b border-line">
        <PartyComposer account={account} />
      </div>
      <PartyFeed
        filters={filters}
        emptyMessage="ยังไม่มีตี้ที่ตรงกับตัวกรอง ลองเปลี่ยนหมวดหรือตั้งตี้ใหม่"
      />
    </main>
  );
}
