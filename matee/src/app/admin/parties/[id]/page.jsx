import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdminCancelPartyButton,
  AdminDeleteMessageButton,
  AdminDeletePartyButton,
} from "@/components/admin/admin-controls";
import { adminPartyStatus, getAdminParty } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/require-admin";
import { categoryLabel, joinModeLabel } from "@/lib/parties/categories";
import { formatEventDate, formatTimeRange, formatTimestamp } from "@/lib/parties/time";

export const metadata = {
  title: "รายละเอียดตี้ | ผู้ดูแลระบบ",
};

const partyIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const statusLabel = { open: "เปิดอยู่", finished: "จบแล้ว", cancelled: "ยกเลิก" };

function chatNote(chat) {
  if (chat.kind === "expired") {
    return "แชทหมดอายุแล้ว ข้อความที่ยังเหลือจะถูกลบอัตโนมัติในรอบถัดไป";
  }

  if (chat.kind === "closing") {
    return `แชทจะหมดอายุ ${formatTimestamp(new Date(chat.expiresAtMs).toISOString(), { withTime: true })}`;
  }

  return null;
}

export default async function AdminPartyPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  if (!partyIdPattern.test(id)) {
    notFound();
  }

  const { ok, party, chat, messages } = await getAdminParty(id);

  if (!ok) {
    throw new Error("load admin party failed");
  }

  if (!party) {
    notFound();
  }

  const state = adminPartyStatus(party);
  const note = chatNote(chat);

  return (
    <main className="grid gap-6 px-4 py-6">
      <Link href="/admin/parties" className="text-sm text-muted underline underline-offset-4">
        กลับไปรายการตี้
      </Link>
      <section aria-labelledby="party-title" className="grid gap-2">
        <p className="text-sm text-muted">
          {categoryLabel(party.category, party.customCategory)} · {statusLabel[state]}
        </p>
        <h1 id="party-title" className="text-2xl font-semibold">
          {party.title}
        </h1>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">เจ้าของตี้</dt>
          <dd>
            {party.hostName}
            {party.hostBanned ? <span className="ml-2 font-medium text-danger">ถูกระงับ</span> : null}
          </dd>
          <dt className="text-muted">วันเวลา</dt>
          <dd>
            {formatEventDate(party.eventDate)} · {formatTimeRange(party.eventTime, party.durationMinutes)}
          </dd>
          <dt className="text-muted">สถานที่</dt>
          <dd>{party.location}</dd>
          <dt className="text-muted">สมาชิก</dt>
          <dd>
            {party.confirmedCount}/{party.maxMembers} คน · {joinModeLabel(party.joinMode)}
            {party.pendingCount ? ` · รออนุมัติ ${party.pendingCount}` : ""}
          </dd>
          <dt className="text-muted">สร้างเมื่อ</dt>
          <dd>{formatTimestamp(party.createdAt, { withTime: true })}</dd>
        </dl>
        {party.detail ? (
          <p className="whitespace-pre-wrap text-sm leading-6">{party.detail}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {state === "open" ? <AdminCancelPartyButton partyId={party.id} title={party.title} /> : null}
          <AdminDeletePartyButton partyId={party.id} title={party.title} redirectTo="/admin/parties" />
          {party.hostBanned ? null : (
            <Link href={`/party/${party.id}`} className="ml-auto text-sm text-muted underline underline-offset-4">
              เปิดหน้าตี้
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="transcript-title" className="grid gap-3 border-t border-line pt-6">
        <h2 id="transcript-title" className="text-lg font-semibold">
          แชท ({messages.length})
        </h2>
        {note ? (
          <p role="status" className="rounded-xl bg-soft px-3 py-2 text-sm text-soft-foreground">
            {note}
          </p>
        ) : null}
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">ไม่มีข้อความ</p>
        ) : (
          <ol aria-label="ข้อความในแชท" className="grid gap-3">
            {messages.map((message) => (
              <li key={message.id} className="flex gap-3">
                {message.avatarUrl ? (
                  <Image src={message.avatarUrl} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-soft text-sm text-soft-foreground">
                    {(message.displayName ?? "?").slice(0, 1)}
                  </span>
                )}
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <p className="text-xs text-muted">
                    <span className="font-medium text-foreground">{message.displayName ?? "สมาชิก"}</span>
                    {message.userId === party.ownerId ? " (เจ้าของตี้)" : ""} ·{" "}
                    {formatTimestamp(message.createdAt, { withTime: true })}
                  </p>
                  <p className="whitespace-pre-wrap break-words rounded-2xl bg-background px-3 py-2 text-sm leading-6">
                    {message.body}
                  </p>
                  <AdminDeleteMessageButton messageId={message.id} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
