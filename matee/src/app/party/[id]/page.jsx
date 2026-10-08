import Link from "next/link";
import { notFound } from "next/navigation";

import {
  categoryLabel,
  joinModeLabel,
} from "@/lib/parties/categories";
import { getParty } from "@/lib/parties/queries";
import {
  formatDuration,
  formatEventDate,
  formatTimeRange,
} from "@/lib/parties/time";

const partyIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const result = partyIdPattern.test(id) ? await getParty(id) : { party: null };

  return {
    title: result.party ? `${result.party.title} | MaTee` : "ตี้ | MaTee",
  };
}

function statusLabel(party) {
  if (party.status === "cancelled") {
    return "ยกเลิกแล้ว";
  }

  if (party.ended) {
    return "จบแล้ว";
  }

  if (party.started) {
    return "เริ่มแล้ว";
  }

  if (party.full) {
    return "เต็มแล้ว";
  }

  return "เปิดรับ";
}

export default async function PartyPage({ params }) {
  const { id } = await params;

  if (!partyIdPattern.test(id)) {
    notFound();
  }

  const result = await getParty(id);

  if (!result.ok && result.reason === "unconfigured") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-muted">
        ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน matee/.env.local
      </main>
    );
  }

  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p role="alert">โหลดรายละเอียดตี้ไม่สำเร็จ</p>
      </main>
    );
  }

  if (!result.party) {
    notFound();
  }

  const party = result.party;
  const slots = `${party.confirmedCount}/${party.maxMembers}`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-sm text-muted">
        กลับไปหาตี้
      </Link>
      <article className="grid gap-6 rounded-2xl border border-line bg-card p-5 sm:p-6">
        <div className="grid gap-2">
          <p className="text-sm font-medium text-accent">
            {categoryLabel(party.category, party.customCategory)}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{party.title}</h1>
          <p className="text-sm text-muted">โดย {party.hostName}</p>
        </div>
        <p className="text-4xl font-semibold tracking-tight">
          {slots}
          <span className="ml-2 text-base font-medium text-muted">ที่นั่ง</span>
        </p>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">วันเวลา</dt>
            <dd className="mt-1 font-medium">
              {formatEventDate(party.eventDate)} · {formatTimeRange(party.eventTime, party.durationMinutes)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">ระยะเวลา</dt>
            <dd className="mt-1 font-medium">{formatDuration(party.durationMinutes)}</dd>
          </div>
          <div>
            <dt className="text-muted">สถานที่</dt>
            <dd className="mt-1 font-medium">{party.location}</dd>
          </div>
          <div>
            <dt className="text-muted">วิธีเข้าร่วม</dt>
            <dd className="mt-1 font-medium">{joinModeLabel(party.joinMode)}</dd>
          </div>
          <div>
            <dt className="text-muted">สถานะ</dt>
            <dd className="mt-1 font-medium">{statusLabel(party)}</dd>
          </div>
          {party.pendingCount != null ? (
            <div>
              <dt className="text-muted">รอการยืนยัน</dt>
              <dd className="mt-1 font-medium">{party.pendingCount} คน</dd>
            </div>
          ) : null}
        </dl>
        {party.detail ? (
          <p className="whitespace-pre-wrap text-sm leading-7">{party.detail}</p>
        ) : (
          <p className="text-sm text-muted">ยังไม่มีรายละเอียดเพิ่ม</p>
        )}
        <Link
          href={`/?category=${party.category}`}
          className="text-sm font-medium text-accent"
        >
          ตี้อื่นในหมวด {categoryLabel(party.category)}
        </Link>
      </article>
    </main>
  );
}
