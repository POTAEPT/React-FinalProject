import Link from "next/link";

import {
  AdminCancelPartyButton,
  AdminDeletePartyButton,
} from "@/components/admin/admin-controls";
import {
  ADMIN_PARTY_STATUSES,
  adminPartyStatus,
  listAdminParties,
} from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/require-admin";
import { categoryLabel, isPartyCategory, PARTY_CATEGORIES } from "@/lib/parties/categories";
import { formatEventDate, formatTimeRange } from "@/lib/parties/time";

export const metadata = {
  title: "จัดการตี้ | ผู้ดูแลระบบ",
};

const chipBase = "press shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium";
const chipOn = "border-brand bg-brand-soft font-semibold text-foreground";
const chipOff = "border-line text-muted hover:bg-background";

const statusBadge = {
  open: { label: "เปิดอยู่", className: "bg-brand-soft text-foreground" },
  finished: { label: "จบแล้ว", className: "bg-soft text-soft-foreground" },
  cancelled: { label: "ยกเลิก", className: "border border-danger-line bg-danger-bg text-danger" },
};

// The filters live in the URL, so the page works without JavaScript and a
// filtered list can be linked to (the dashboard links to each status).
function hrefWith(current, change) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...current, ...change })) {
    if (value) params.set(key, value);
  }

  return params.size ? `/admin/parties?${params}` : "/admin/parties";
}

export default async function AdminPartiesPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const status = ADMIN_PARTY_STATUSES.some((item) => item.value === params.status)
    ? params.status
    : "";
  const category = isPartyCategory(params.category) ? params.category : "";
  const current = { q, status, category };
  const { ok, parties } = await listAdminParties(current);

  return (
    <main className="grid gap-4 py-6">
      <h1 className="px-4 text-2xl font-semibold">จัดการตี้</h1>
      <form action="/admin/parties" role="search" className="flex gap-2 px-4">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <label htmlFor="admin-party-q" className="sr-only">
          ค้นหาตี้
        </label>
        <input
          id="admin-party-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="ชื่อตี้ สถานที่ หรือชื่อเจ้าของ"
          className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2 text-base outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button type="submit" className="press rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
          ค้นหา
        </button>
      </form>
      <div className="grid gap-2 px-4">
        <div role="group" aria-label="สถานะ" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {ADMIN_PARTY_STATUSES.map((item) => (
            <Link
              key={item.value || "all"}
              href={hrefWith(current, { status: item.value })}
              aria-current={status === item.value ? "true" : undefined}
              className={`${chipBase} ${status === item.value ? chipOn : chipOff}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div role="group" aria-label="หมวด" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          <Link
            href={hrefWith(current, { category: "" })}
            aria-current={!category ? "true" : undefined}
            className={`${chipBase} ${!category ? chipOn : chipOff}`}
          >
            ทุกหมวด
          </Link>
          {PARTY_CATEGORIES.map((item) => (
            <Link
              key={item.value}
              href={hrefWith(current, { category: item.value })}
              aria-current={category === item.value ? "true" : undefined}
              className={`${chipBase} ${category === item.value ? chipOn : chipOff}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {!ok ? (
        <p role="alert" className="mx-4 rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">
          โหลดรายการตี้ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง
        </p>
      ) : (
        <section aria-labelledby="party-count">
          <p id="party-count" className="px-4 pb-1 text-sm text-muted">
            {parties.length.toLocaleString("th-TH")} ตี้
          </p>
          {parties.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">ไม่พบตี้ที่ตรงกับตัวกรอง</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {parties.map((party) => {
                const state = adminPartyStatus(party);
                const badge = statusBadge[state];

                return (
                  <li key={party.id} className="grid gap-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid min-w-0 gap-0.5">
                        <Link href={`/admin/parties/${party.id}`} className="truncate font-semibold underline-offset-4 hover:underline">
                          {party.title}
                        </Link>
                        <p className="text-sm text-muted">
                          {categoryLabel(party.category, party.customCategory)} · {party.hostName}
                          {party.hostBanned ? " (ถูกระงับ)" : ""}
                        </p>
                        <p className="text-sm text-muted">
                          {formatEventDate(party.eventDate)} · {formatTimeRange(party.eventTime, party.durationMinutes)} · {party.confirmedCount}/{party.maxMembers} คน
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      {state === "open" ? <AdminCancelPartyButton partyId={party.id} title={party.title} /> : null}
                      <AdminDeletePartyButton partyId={party.id} title={party.title} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
