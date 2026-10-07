import { partyEndMs, partyStartMs } from "@/lib/parties/time";

const membershipColumns =
  "id, party_id, status, parties!inner(id, owner_id, title, category, custom_category, join_mode, event_date, event_time, duration_minutes, location, max_members, confirmed_count, status)";

// Every party_members row of the user, with its party. RLS lets a user read
// their own rows, so this works with the caller's session.
export async function listMyMemberships(supabase, userId) {
  const { data, error } = await supabase
    .from("party_members")
    .select(membershipColumns)
    .eq("user_id", userId);

  if (error) {
    console.error("list my memberships", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const party = row.parties;

    return {
      memberId: row.id,
      status: row.status,
      partyId: party.id,
      isHost: party.owner_id === userId,
      title: party.title,
      category: party.category,
      customCategory: party.custom_category,
      joinMode: party.join_mode,
      eventDate: party.event_date,
      eventTime: party.event_time,
      durationMinutes: party.duration_minutes,
      location: party.location,
      maxMembers: party.max_members,
      confirmedCount: party.confirmed_count,
      partyStatus: party.status,
      startMs: partyStartMs(party.event_date, party.event_time),
      endMs: partyEndMs(party.event_date, party.event_time, party.duration_minutes),
    };
  });
}

// Active commitments, as has_time_conflict() in the schema counts them:
// a pending or confirmed row on an open party that has not ended yet.
export function activeCommitments(memberships, now = Date.now()) {
  return memberships
    .filter(
      (item) =>
        (item.status === "pending" || item.status === "confirmed") &&
        item.partyStatus === "open" &&
        item.endMs > now,
    )
    .map(({ partyId, title, startMs, endMs, status }) => ({
      partyId,
      title,
      startMs,
      endMs,
      status,
    }));
}

export async function getMyCommitments(supabase, userId) {
  return activeCommitments(await listMyMemberships(supabase, userId));
}

// Same overlap test as the SQL: a.start < b.end and b.start < a.end.
// Touching intervals (one ends exactly when the other starts) do not conflict.
export function findConflict(commitments, startMs, endMs, excludeId = null) {
  return (
    commitments.find(
      (item) =>
        item.partyId !== excludeId && item.startMs < endMs && startMs < item.endMs,
    ) ?? null
  );
}

// Shared error shape for joinParty and createParty.
export function timeConflictResult(conflict) {
  return {
    ok: false,
    code: "time_conflict",
    conflictingPartyId: conflict?.partyId ?? null,
    conflictingTitle: conflict?.title ?? null,
    message: conflict
      ? `ชนเวลากับ “${conflict.title}”`
      : "เวลานี้ชนกับตี้ที่คุณมีอยู่แล้ว",
  };
}
