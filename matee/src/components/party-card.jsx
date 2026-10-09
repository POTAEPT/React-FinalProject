import Image from "next/image";
import Link from "next/link";

import { categoryLabel, joinModeLabel } from "@/lib/parties/categories";
import { formatEventDate, formatTimeRange } from "@/lib/parties/time";

function Avatar({ name, url }) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={40}
        height={40}
        className="size-10 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-10 place-items-center rounded-full bg-soft font-medium text-soft-foreground"
    >
      {name.slice(0, 1)}
    </span>
  );
}

function Meta({ children }) {
  return <span className="flex items-center gap-1.5">{children}</span>;
}

// Threads-style post: avatar rail on the left, content column on the right.
// conflict: the viewer's party that overlaps this one, or null. It is shown
// below the card's link, since a link cannot sit inside another link.
export function PartyCard({ party, conflict = null }) {
  const slots = `${party.confirmedCount}/${party.maxMembers}`;
  const status = party.ended
    ? "จบแล้ว"
    : party.full
      ? "เต็มแล้ว"
      : party.started
        ? "เริ่มแล้ว"
        : null;

  return (
    <article className="flex flex-col">
      <Link
        href={`/party/${party.id}`}
        className="press flex gap-3 px-4 pt-4 pb-3 hover:bg-background/60 active:bg-background focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <Avatar name={party.hostName} url={party.hostAvatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="truncate font-semibold">{party.hostName}</span>
            <span className="shrink-0 text-muted">
              {joinModeLabel(party.joinMode)}
            </span>
            <span className="ml-auto shrink-0 rounded-full bg-soft px-2.5 py-0.5 text-xs font-medium text-soft-foreground">
              {categoryLabel(party.category, party.customCategory)}
            </span>
          </div>
          <h2 className="text-base font-semibold leading-6 tracking-tight">
            {party.title}
          </h2>
          <p className="text-sm leading-6 text-muted">
            {formatEventDate(party.eventDate)} ·{" "}
            {formatTimeRange(party.eventTime, party.durationMinutes)}
          </p>
          <p className="text-sm leading-6">{party.location}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <Meta>
              <span
                aria-hidden="true"
                className="h-1.5 w-12 overflow-hidden rounded-full bg-line"
              >
                <span
                  className="block h-full origin-left rounded-full bg-brand"
                  style={{
                    transform: `scaleX(${Math.min(1, party.confirmedCount / party.maxMembers)})`,
                  }}
                />
              </span>
              <span className="tabular-nums">{slots} ที่นั่ง</span>
            </Meta>
            {status ? <span>{status}</span> : null}
            {party.pendingCount != null && party.pendingCount > 0 ? (
              <span className="rounded-full bg-highlight px-2 py-0.5 text-xs font-medium text-highlight-foreground">
                รอการยืนยัน {party.pendingCount}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      {conflict ? (
        <p
          aria-disabled="true"
          className="mx-4 mb-3 ml-[3.75rem] rounded-xl bg-background px-3 py-2 text-sm text-muted"
        >
          ชนเวลากับ “
          <Link
            href={`/party/${conflict.partyId}`}
            className="font-medium text-accent underline"
          >
            {conflict.title}
          </Link>
          ”
        </p>
      ) : null}
    </article>
  );
}
