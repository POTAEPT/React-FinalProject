import { findConflict } from "@/lib/parties/my-commitments";

// What the join area of a party shows for one viewer. The first matching case
// wins, so the order below is the priority:
//   cancelled   -> closed (everyone but the host; the page shows the notice)
//   guest       -> link to login, back to this party
//   host        -> link to /manage/[id]
//   confirmed   -> leave (until the party ends)
//   pending     -> waiting for the host, with a cancel-request button
//   rejected    -> disabled
//   ended / started / full -> disabled
//   conflict    -> disabled, names and links the other party
//   otherwise   -> join (public) or request (approve)
export function memberActionState(party, viewer, now = Date.now()) {
  const status = viewer?.membership?.status ?? null;
  const ended = party.endMs <= now;
  const started = party.startMs <= now;
  const isHost = Boolean(viewer?.user) && party.ownerId === viewer.user.id;

  if (party.status === "cancelled" && !isHost) {
    return { kind: "cancelled" };
  }

  if (!viewer?.user) {
    return { kind: "guest" };
  }

  if (isHost) {
    return { kind: "host" };
  }

  if (status === "confirmed") {
    return ended ? { kind: "ended" } : { kind: "confirmed" };
  }

  if (status === "pending") {
    return ended ? { kind: "ended" } : { kind: "pending" };
  }

  if (status === "rejected") {
    return { kind: "rejected" };
  }

  if (ended) {
    return { kind: "ended" };
  }

  if (started) {
    return { kind: "started" };
  }

  if (party.confirmedCount >= party.maxMembers) {
    return { kind: "full" };
  }

  const conflict = findConflict(
    viewer.commitments ?? [],
    party.startMs,
    party.endMs,
    party.id,
  );

  if (conflict) {
    return {
      kind: "conflict",
      conflictingPartyId: conflict.partyId,
      conflictingTitle: conflict.title,
    };
  }

  return { kind: party.joinMode === "public" ? "join" : "request" };
}
