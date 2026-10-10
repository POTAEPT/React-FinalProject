import nextDynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AutoRefresh } from "@/components/auto-refresh";
import {
  CancelPartyButton,
  DecisionButtons,
  UndoRejectButton,
} from "@/components/party/ManageControls";
import { FormSkeleton, MemberSectionsSkeleton } from "@/components/page-skeletons";
import { joinModeLabel } from "@/lib/parties/categories";
import { updateParty } from "@/lib/parties/party-actions";
import {
  getParty,
  getViewerMembership,
  listPartyMembers,
} from "@/lib/parties/queries";
import { bangkokToday, formatEventDate, formatTimeRange } from "@/lib/parties/time";

const PartyForm = nextDynamic(
  () => import("@/components/party/PartyForm").then((module) => module.PartyForm),
  { loading: () => <FormSkeleton fields={5} /> },
);

// Rendering: SSR (ตั้งใจ) — เฉพาะเจ้าของตี้ (ตรวจทุก request) และคิวคำขอต้อง
// เป็นค่าล่าสุด หน้านี้ยัง refresh เองทุก 15 วินาที (<AutoRefresh>) เพื่อดึง SSR ใหม่
export const dynamic = "force-dynamic";

const partyIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const metadata = {
  title: "จัดการตี้ | MaTee",
};

function MemberRow({ member, children }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="flex items-center gap-3">
        {member.avatarUrl ? (
          <Image
            src={member.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-soft text-sm text-soft-foreground">
            {member.displayName.slice(0, 1)}
          </span>
        )}
        <span className="text-sm font-medium">{member.displayName}</span>
      </span>
      {children}
    </li>
  );
}

// Members and the edit form load after the header, so the page shell shows first.
async function ManageMembers({ party }) {
  const { members } = await listPartyMembers(party.id);
  const pending = members.filter((member) => member.status === "pending");
  const confirmed = members.filter((member) => member.status === "confirmed");
  const rejected = members.filter((member) => member.status === "rejected");
  const cancelled = party.status === "cancelled";
  // Editing stops once the party starts; the schedule locks once anyone else
  // has joined or asked to join (QA-1).
  const editable = !cancelled && !party.started;
  const scheduleLocked = members.some(
    (member) =>
      member.userId !== party.ownerId &&
      (member.status === "pending" || member.status === "confirmed"),
  );

  return (
    <>
      <section aria-labelledby="pending-title" className="grid gap-2 rounded-2xl border border-line bg-card p-5">
        <h2 id="pending-title" className="text-lg font-semibold">
          รออนุมัติ ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">
            {party.joinMode === "public" ? "ตี้นี้เข้าได้เลย ไม่ต้องอนุมัติ" : "ยังไม่มีคำขอใหม่"}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((member) => (
              <MemberRow key={member.id} member={member}>
                {cancelled ? null : (
                  <DecisionButtons memberId={member.id} name={member.displayName} />
                )}
              </MemberRow>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="confirmed-title" className="grid gap-2 rounded-2xl border border-line bg-card p-5">
        <h2 id="confirmed-title" className="text-lg font-semibold">
          สมาชิก ({confirmed.length})
        </h2>
        <ul className="divide-y divide-line">
          {confirmed.map((member) => (
            <MemberRow key={member.id} member={member}>
              {member.userId === party.ownerId ? (
                <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-medium text-soft-foreground">
                  เจ้าของตี้
                </span>
              ) : null}
            </MemberRow>
          ))}
        </ul>
      </section>

      {rejected.length ? (
        <section aria-labelledby="rejected-title" className="grid gap-2 rounded-2xl border border-line bg-card p-5">
          <h2 id="rejected-title" className="text-lg font-semibold">
            ปฏิเสธแล้ว ({rejected.length})
          </h2>
          <p className="text-sm text-muted">
            คนกลุ่มนี้ส่งคำขอใหม่เองไม่ได้ ถ้าเปลี่ยนใจ กดยืนยันให้เข้าตี้ได้เลย
          </p>
          <ul className="divide-y divide-line">
            {rejected.map((member) => (
              <MemberRow key={member.id} member={member}>
                {cancelled ? null : (
                  <UndoRejectButton memberId={member.id} name={member.displayName} />
                )}
              </MemberRow>
            ))}
          </ul>
        </section>
      ) : null}

      {editable ? (
        <details className="group rounded-2xl border border-line bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">แก้ไขรายละเอียดตี้</summary>
          <div className="mt-4">
            <PartyForm
              action={updateParty.bind(null, party.id)}
              mode="edit"
              minDate={bangkokToday()}
              scheduleLocked={scheduleLocked}
              minMembers={party.confirmedCount}
              defaultValues={{
                title: party.title,
                category: party.category,
                customCategory: party.customCategory ?? "",
                eventDate: party.eventDate,
                eventTime: String(party.eventTime).slice(0, 5),
                durationMinutes: party.durationMinutes,
                location: party.location,
                maxMembers: party.maxMembers,
                detail: party.detail,
                joinMode: party.joinMode,
              }}
              submitLabel="บันทึกการแก้ไข"
              pendingLabel="กำลังบันทึก..."
            />
          </div>
        </details>
      ) : null}
    </>
  );
}

// Host only. Anyone else, including other signed-in users, gets a 404.
// Signed-out visitors are sent to /login by the proxy (src/proxy.js).
export default async function ManagePartyPage({ params }) {
  const { id } = await params;

  if (!partyIdPattern.test(id)) {
    notFound();
  }

  const [result, viewer] = await Promise.all([getParty(id), getViewerMembership(id)]);

  if (!result.ok || !result.party || !viewer.user || result.party.ownerId !== viewer.user.id) {
    notFound();
  }

  const party = result.party;
  const cancelled = party.status === "cancelled";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      {cancelled ? null : <AutoRefresh seconds={15} />}
      <Link href={`/party/${party.id}`} className="text-sm text-muted">
        กลับไปหน้าตี้
      </Link>
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{party.title}</h1>
        <p className="text-sm text-muted">
          {formatEventDate(party.eventDate)} · {formatTimeRange(party.eventTime, party.durationMinutes)} ·{" "}
          {joinModeLabel(party.joinMode)} · {party.confirmedCount}/{party.maxMembers} ที่นั่ง
        </p>
        {cancelled ? (
          <p role="status" className="rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">
            ตี้นี้ถูกยกเลิกแล้ว
          </p>
        ) : null}
      </div>

      <Suspense fallback={<MemberSectionsSkeleton />}>
        <ManageMembers party={party} />
      </Suspense>

      {cancelled ? null : <CancelPartyButton partyId={party.id} title={party.title} />}
    </main>
  );
}
