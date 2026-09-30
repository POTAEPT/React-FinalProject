import Link from "next/link";
import { notFound } from "next/navigation";

import { PartyFeed } from "@/components/party-feed";
import {
  categoryDescription,
  categoryLabel,
  isPartyCategory,
} from "@/lib/parties/categories";

export async function generateMetadata({ params }) {
  const { category } = await params;

  if (!isPartyCategory(category)) {
    return { title: "หมวดหมู่ | MaTee" };
  }

  return { title: `${categoryLabel(category)} | MaTee` };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;

  if (!isPartyCategory(category)) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="grid gap-2">
        <Link href="/categories" className="text-sm text-muted">
          หมวดหมู่ทั้งหมด
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          {categoryLabel(category)}
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted">
          {categoryDescription(category)}
        </p>
      </div>
      <PartyFeed
        filters={{ category, availability: "open" }}
        emptyMessage="ยังไม่มีตี้เปิดรับในหมวดนี้"
      />
    </main>
  );
}
