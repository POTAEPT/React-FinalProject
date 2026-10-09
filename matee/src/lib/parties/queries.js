import { getMyCommitments } from "@/lib/parties/my-commitments";
import { partyEndMs, partyStartMs } from "@/lib/parties/time";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const partyColumns =
  "id, owner_id, title, category, custom_category, join_mode, event_date, event_time, duration_minutes, location, max_members, confirmed_count, detail, status, created_at, updated_at";

function matchesSearch(party, query) {
  if (!query) {
    return true;
  }

  const haystack = [party.title, party.location, party.customCategory]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("th");

  return haystack.includes(query.toLocaleLowerCase("th"));
}

function toParty(row, owner, counts) {
  const start = partyStartMs(row.event_date, row.event_time);
  const end = partyEndMs(row.event_date, row.event_time, row.duration_minutes);
  const pendingCount =
    counts && counts.pending_count != null ? Number(counts.pending_count) : null;

  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    category: row.category,
    customCategory: row.custom_category,
    joinMode: row.join_mode,
    eventDate: row.event_date,
    eventTime: row.event_time,
    durationMinutes: row.duration_minutes,
    location: row.location,
    maxMembers: row.max_members,
    confirmedCount: row.confirmed_count,
    pendingCount: Number.isFinite(pendingCount) ? pendingCount : null,
    detail: row.detail,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startMs: start,
    endMs: end,
    hostName: owner?.display_name ?? "ไม่ระบุชื่อ",
    hostAvatarUrl: owner?.avatar_url ?? null,
    hostBanned: Boolean(owner?.banned_at),
    full: row.confirmed_count >= row.max_members,
    started: start <= Date.now(),
    ended: end <= Date.now(),
  };
}

async function loadRelated(supabase, rows) {
  const partyIds = rows.map((row) => row.id);
  const ownerIds = [...new Set(rows.map((row) => row.owner_id))];

  const [ownersResult, countsResult] = await Promise.all([
    ownerIds.length
      ? supabase
          .from("profiles")
          .select("id, display_name, avatar_url, banned_at")
          .in("id", ownerIds)
      : Promise.resolve({ data: [], error: null }),
    partyIds.length
      ? supabase
          .from("party_counts")
          .select("party_id, pending_count, current_members")
          .in("party_id", partyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (ownersResult.error) {
    console.error("load party hosts", ownersResult.error.message);
  }

  if (countsResult.error) {
    console.error("load party counts", countsResult.error.message);
  }

  const owners = new Map((ownersResult.data ?? []).map((owner) => [owner.id, owner]));
  const counts = new Map(
    (countsResult.data ?? []).map((count) => [count.party_id, count]),
  );

  return rows.map((row) =>
    toParty(row, owners.get(row.owner_id), counts.get(row.id)),
  );
}

export async function listParties({
  q = "",
  category = "",
  availability = "open",
  after = "",
  before = "",
  host = "",
} = {}) {
  if (!getSupabaseEnv()) {
    return { ok: false, reason: "unconfigured", parties: [] };
  }

  const supabase = await createClient();
  let query = supabase
    .from("parties")
    .select(partyColumns)
    .eq("status", "open")
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true })
    .limit(1000);

  if (category) {
    query = query.eq("category", category);
  }

  if (after) {
    query = query.gte("event_date", after);
  }

  if (before) {
    query = query.lte("event_date", before);
  }

  const { data, error } = await query;

  if (error) {
    console.error("list parties", error.message);
    return { ok: false, reason: "query", parties: [] };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const commitments = user ? await getMyCommitments(supabase, user.id) : [];

  const parties = (await loadRelated(supabase, data ?? [])).filter((party) => {
    if (party.hostBanned) {
      return false;
    }

    if (!matchesSearch(party, q)) {
      return false;
    }

    if (host && !party.hostName.toLocaleLowerCase("th").includes(host.toLocaleLowerCase("th"))) {
      return false;
    }

    if (availability === "open") {
      return !party.full && !party.started;
    }

    return true;
  });

  return { ok: true, parties, commitments };
}

export async function getParty(id) {
  if (!getSupabaseEnv()) {
    return { ok: false, reason: "unconfigured", party: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parties")
    .select(partyColumns)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("get party", error.message);
    return { ok: false, reason: "query", party: null };
  }

  if (!data) {
    return { ok: true, party: null };
  }

  const [party] = await loadRelated(supabase, [data]);

  if (party.hostBanned) {
    return { ok: true, party: null };
  }

  return { ok: true, party };
}

// The signed-in viewer of a party page: their own member row (any status) and
// their active commitments for the time-conflict check. Guests get user: null.
export async function getViewerMembership(partyId) {
  const empty = { user: null, membership: null, commitments: [] };

  if (!getSupabaseEnv()) {
    return empty;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return empty;
  }

  const [membershipResult, commitments] = await Promise.all([
    supabase
      .from("party_members")
      .select("id, status")
      .eq("party_id", partyId)
      .eq("user_id", user.id)
      .maybeSingle(),
    getMyCommitments(supabase, user.id),
  ]);

  if (membershipResult.error) {
    console.error("get membership", membershipResult.error.message);
  }

  return { user, membership: membershipResult.data ?? null, commitments };
}

// Member rows of a party with each member's profile, oldest first. RLS shows the
// host every row; everyone else sees confirmed rows and their own.
export async function listPartyMembers(partyId) {
  if (!getSupabaseEnv()) {
    return { ok: false, reason: "unconfigured", members: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("party_members")
    .select("id, user_id, status, created_at, profiles(display_name, avatar_url)")
    .eq("party_id", partyId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("list party members", error.message);
    return { ok: false, reason: "query", members: [] };
  }

  const members = (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    displayName: row.profiles?.display_name ?? "ไม่ระบุชื่อ",
    avatarUrl: row.profiles?.avatar_url ?? null,
  }));

  return { ok: true, members };
}
