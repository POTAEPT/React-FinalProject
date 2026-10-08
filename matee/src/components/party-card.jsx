import Link from "next/link";

import { SkipButton } from "@/components/party/SkipButton";
import { categoryLabel, joinModeLabel } from "@/lib/parties/categories";
import { formatEventDate, formatTimeRange } from "@/lib/parties/time";

// conflict: the viewer's party that overlaps this one, or null.
// canSkip: a signed-in viewer who is not the host.
export function PartyCard({ party, conflict = null, canSkip = false }) {
  const slots = `${party.confirmedCount}/${party.maxMembers}`;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-card transition hover:border-accent">
      <Link
        href={`/party/${party.id}`}
        className="flex flex-1 flex-col gap-3 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-accent">
            {categoryLabel(party.category, party.customCategory)}
          </p>
          <p className="shrink-0 text-sm text-muted">
            {joinModeLabel(party.joinMode)}
          </p>
        </div>
        <h2 className="text-lg font-semibold leading-7">{party.title}</h2>
        <p className="text-sm leading-6 text-muted">
          {formatEventDate(party.eventDate)} ·{" "}
          {formatTimeRange(party.eventTime, party.durationMinutes)}
        </p>
        <p className="text-sm leading-6">{party.location}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-sm">
          <p className="font-medium">
            {slots} ที่นั่ง
            {party.full ? " · เต็มแล้ว" : ""}
            {party.started && !party.ended ? " · เริ่มแล้ว" : ""}
            {party.ended ? " · จบแล้ว" : ""}
          </p>
          {party.pendingCount != null && party.pendingCount > 0 ? (
            <p className="text-muted">รอการยืนยัน {party.pendingCount}</p>
          ) : null}
        </div>
        <p className="text-sm text-muted">โดย {party.hostName}</p>
      </Link>
      {conflict || canSkip ? (
        <div className="flex items-start justify-between gap-3 border-t border-line px-4 py-3">
          {conflict ? (
            <p aria-disabled="true" className="text-sm text-muted">
              ชนเวลากับ “
              <Link
                href={`/party/${conflict.partyId}`}
                className="font-medium text-accent underline"
              >
                {conflict.title}
              </Link>
              ”
            </p>
          ) : (
            <span />
          )}
          {canSkip ? (
            <SkipButton partyId={party.id} title={party.title} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
