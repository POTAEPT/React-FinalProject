import Link from "next/link";
import { redirect } from "next/navigation";

import { categoryLabel } from "@/lib/parties/categories";
import { listMyMemberships } from "@/lib/parties/my-commitments";
import { groupMyParties, myPartyBadge } from "@/lib/parties/my-party";
import { formatEventDate, formatTimeRange } from "@/lib/parties/time";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "ตี้ของฉัน | MaTee",
};

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const badgeTone = {
  danger: "border border-danger-line bg-danger-bg text-danger",
  highlight: "border border-foreground text-foreground",
  muted: "border border-line text-muted",
};

function PartyRow({ item, pendingCount }) {
  const badge = myPartyBadge(item);
  const inactive = item.partyStatus === "cancelled" || item.status === "cancelled";

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <Link href={`/party/${item.partyId}`} className={`grid min-w-0 gap-0.5 ${inactive ? "opacity-60" : ""}`}>
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{item.title}</span>
          {item.isHost ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">เจ้าของ</span>
          ) : null}
          {badge ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeTone[badge.tone]}`}>
              {badge.label}
            </span>
          ) : null}
        </span>
        <span className="text-sm text-muted">
          {formatTimeRange(item.eventTime, item.durationMinutes)} ·{" "}
          {categoryLabel(item.category, item.customCategory)} · {item.location}
        </span>
      </Link>
      <span className="flex shrink-0 items-center gap-2">
        {/* After leaving, the chat is closed to this user, so the link would
            only lead to "คุณออกจากตี้แล้ว". A cancelled party keeps its chat. */}
        {item.status === "cancelled" ? null : (
          <Link
            href={`/party/${item.partyId}#chat`}
            className="rounded-full border border-line px-3 py-1 text-sm"
          >
            แชท
          </Link>
        )}
        {item.isHost ? (
          <Link
            href={`/manage/${item.partyId}`}
            aria-label={
              pendingCount > 0
                ? `จัดการตี้ ${item.title} มีคำขอรออนุมัติ ${pendingCount} คน`
                : `จัดการตี้ ${item.title}`
            }
            className="relative rounded-full border border-line p-1.5"
          >
            <GearIcon />
            {pendingCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-highlight px-1 text-xs font-medium text-highlight-foreground">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        ) : null}
      </span>
    </li>
  );
}

function Agenda({ groups, pendingCounts }) {
  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <section key={group.date} className="rounded-2xl border border-line bg-card px-4 py-2">
          <h3 className="pt-2 text-sm font-semibold text-muted">{formatEventDate(group.date)}</h3>
          <ul className="divide-y divide-line">
            {group.items.map((item) => (
              <PartyRow
                key={item.memberId}
                item={item}
                pendingCount={pendingCounts.get(item.partyId) ?? 0}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default async function MyPartyPage() {
  if (!getSupabaseEnv()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-muted">
        ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน matee/.env.local
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/my-party");
  }

  const memberships = await listMyMemberships(supabase, user.id);
  const hostedIds = memberships.filter((item) => item.isHost).map((item) => item.partyId);
  const pendingCounts = new Map();

  if (hostedIds.length) {
    // party_counts respects RLS; the host sees every row of their own parties.
    const { data, error } = await supabase
      .from("party_counts")
      .select("party_id, pending_count")
      .in("party_id", hostedIds);

    if (error) {
      console.error("load pending counts", error.message);
    }

    for (const row of data ?? []) {
      pendingCounts.set(row.party_id, Number(row.pending_count) || 0);
    }
  }

  const { upcoming, past } = groupMyParties(memberships);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">ตี้ของฉัน</h1>
        <p className="text-sm leading-6 text-muted">ตี้ที่คุณเป็นเจ้าของ เข้าร่วม หรือรออนุมัติ เรียงตามวัน</p>
      </div>

      {upcoming.length ? (
        <Agenda groups={upcoming} pendingCounts={pendingCounts} />
      ) : (
        <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm leading-6 text-muted">
          ยังไม่มีตี้ที่กำลังจะมาถึง{" "}
          <Link href="/" className="font-medium text-accent underline">
            ไปหาตี้
          </Link>
        </p>
      )}

      {past.length ? (
        <details>
          <summary className="cursor-pointer text-lg font-semibold">
            ที่ผ่านมา ({past.reduce((total, group) => total + group.items.length, 0)})
          </summary>
          <div className="mt-4">
            <Agenda groups={past} pendingCounts={pendingCounts} />
          </div>
        </details>
      ) : null}
    </main>
  );
}
