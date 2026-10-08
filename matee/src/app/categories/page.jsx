import Link from "next/link";

import { PARTY_CATEGORIES } from "@/lib/parties/categories";

export const metadata = {
  title: "หมวดหมู่ | MaTee",
};

export default function CategoriesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold">หมวดหมู่กิจกรรม</h1>
        <p className="text-sm leading-6 text-muted">
          เลือกหมวดเพื่อดูตี้ที่กำลังเปิดรับ
        </p>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARTY_CATEGORIES.map((category) => (
          <li key={category.value}>
            <Link
              href={`/?category=${encodeURIComponent(category.value)}`}
              className="block h-full rounded-2xl border border-line bg-card p-5 transition hover:border-accent"
            >
              <h2 className="font-semibold">{category.label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {category.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}