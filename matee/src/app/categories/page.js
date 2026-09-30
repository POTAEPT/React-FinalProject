import Link from "next/link";

import { PARTY_CATEGORIES } from "@/lib/parties/categories";
import { listParties } from "@/lib/parties/queries";

export const metadata = {
  title: "หมวดหมู่ | MaTee",
};

export default async function CategoriesPage() {
  const result = await listParties({ availability: "open" });
  const counts = new Map(PARTY_CATEGORIES.map((category) => [category.value, 0]));

  if (result.ok) {
    for (const party of result.parties) {
      counts.set(party.category, (counts.get(party.category) ?? 0) + 1);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">หมวดหมู่</h1>
        <p className="max-w-xl text-sm leading-6 text-muted">
          เลือกหมวดที่สนใจ แล้วดูตี้ที่ยังเปิดรับในหมวดนั้น
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PARTY_CATEGORIES.map((category) => (
          <li key={category.value}>
            <Link
              href={`/categories/${category.value}`}
              className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-card p-4 transition hover:border-accent"
            >
              <span className="text-lg font-semibold">{category.label}</span>
              <span className="text-sm leading-6 text-muted">{category.description}</span>
              <span className="mt-auto pt-3 text-sm font-medium">
                {result.ok ? `${counts.get(category.value) ?? 0} ตี้` : "ดูตี้"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!result.ok && result.reason === "unconfigured" ? (
        <p className="text-sm text-muted">
          ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน matee/.env.local
        </p>
      ) : null}
      {!result.ok && result.reason === "query" ? (
        <p role="alert" className="text-sm">
          โหลดจำนวนตี้ไม่สำเร็จ
        </p>
      ) : null}
    </main>
  );
}
