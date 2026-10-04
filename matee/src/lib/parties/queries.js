import { partyEndMs, partyStartMs } from "@/lib/parties/time";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const partyColumns =
  "id, owner_id, title, category, custom_category, join_mode, event_date, event_time, duration_minutes, location, max_members, confirmed_count, detail, status, created_at";

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
  const pendingCount =
    counts && counts.pending_count != null ? Number(counts.pending_count) : null;

  return {
    id: row.id,
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
    hostName: owner?.display_name ?? "ไม่ระบุชื่อ",
    hostBanned: Boolean(owner?.banned_at),
    full: row.confirmed_count >= row.max_members,
    started: start <= Date.now(),
    ended: partyEndMs(row.event_date, row.event_time, row.duration_minutes) <= Date.now(),
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

  const { data, error } = await query;

  if (error) {
    console.error("list parties", error.message);
    return { ok: false, reason: "query", parties: [] };
  }

  const parties = (await loadRelated(supabase, data ?? [])).filter((party) => {
    if (party.hostBanned) {
      return false;
    }

    if (!matchesSearch(party, q)) {
      return false;
    }

    if (availability === "open") {
      return !party.full && !party.started;
    }

    return true;
  });

  return { ok: true, parties };
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
