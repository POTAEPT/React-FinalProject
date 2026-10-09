import { chatState } from "@/lib/chat/expiry";
import { messageColumns, toMessage } from "@/lib/chat/message";
import { isPartyCategory } from "@/lib/parties/categories";
import { loadRelated, matchesSearch, partyColumns } from "@/lib/parties/queries";
import { partyEndMs } from "@/lib/parties/time";
import { createClient } from "@/lib/supabase/server";

// Reads for the /admin pages. Every caller runs requireAdmin() first; RLS also
// lets an admin read every member row and every chat message (is_admin()).

// Totals for the dashboard. "finished" is an open party whose end time has
// passed (there is no finished status in the table); joins count confirmed
// members other than the host, who has a confirmed row of their own.
export async function getAdminStats() {
  const supabase = await createClient();
  const [users, parties, members, messages, recentUsers] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("parties")
      .select("id, owner_id, status, event_date, event_time, duration_minutes"),
    supabase
      .from("party_members")
      .select("party_id, user_id, status")
      .in("status", ["pending", "confirmed"]),
    supabase.from("party_messages").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const failed = [users, parties, members, messages, recentUsers].find(
    (result) => result.error,
  );

  if (failed) {
    console.error("admin stats", failed.error.message);
    return { ok: false, stats: null };
  }

  const now = Date.now();
  const partyRows = parties.data ?? [];
  const owners = new Map(partyRows.map((party) => [party.id, party.owner_id]));
  const cancelled = partyRows.filter((party) => party.status === "cancelled").length;
  const finished = partyRows.filter(
    (party) =>
      party.status === "open" &&
      partyEndMs(party.event_date, party.event_time, party.duration_minutes) <= now,
  ).length;
  const memberRows = (members.data ?? []).filter(
    (member) => member.user_id !== owners.get(member.party_id),
  );

  return {
    ok: true,
    stats: {
      users: users.count ?? 0,
      openParties: partyRows.length - cancelled - finished,
      finishedParties: finished,
      cancelledParties: cancelled,
      joins: memberRows.filter((member) => member.status === "confirmed").length,
      pendingRequests: memberRows.filter((member) => member.status === "pending").length,
      messages: messages.count ?? 0,
      recentUsers: (recentUsers.data ?? []).map((user) => ({
        id: user.id,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      })),
    },
  };
}

export const ADMIN_PARTY_STATUSES = [
  { value: "", label: "ทั้งหมด" },
  { value: "open", label: "เปิดอยู่" },
  { value: "finished", label: "จบแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
];

// open, finished or cancelled, the same split as the dashboard.
export function adminPartyStatus(party) {
  if (party.status === "cancelled") return "cancelled";
  return party.ended ? "finished" : "open";
}

// Every party, newest event first, including cancelled and finished ones (the
// public feed hides both).
//   q         title, place or host name
//   status    "", "open", "finished" or "cancelled"
//   category  one of PARTY_CATEGORIES
export async function listAdminParties({ q = "", status = "", category = "" } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("parties")
    .select(partyColumns)
    .order("event_date", { ascending: false })
    .order("event_time", { ascending: false })
    .limit(500);

  if (isPartyCategory(category)) {
    query = query.eq("category", category);
  }

  if (status === "cancelled") {
    query = query.eq("status", "cancelled");
  } else if (status === "open" || status === "finished") {
    query = query.eq("status", "open");
  }

  const { data, error } = await query;

  if (error) {
    console.error("admin list parties", error.message);
    return { ok: false, parties: [] };
  }

  const needle = q.trim().toLocaleLowerCase("th");
  const parties = (await loadRelated(supabase, data ?? [])).filter(
    (party) =>
      (!status || adminPartyStatus(party) === status) &&
      (matchesSearch(party, q.trim()) ||
        party.hostName.toLocaleLowerCase("th").includes(needle)),
  );

  return { ok: true, parties };
}

// Every user, newest first. Email is not shown: it lives in auth.users, which
// only the service role can read.
export async function listAdminUsers({ q = "" } = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("admin list users", error.message);
    return { ok: false, users: [] };
  }

  const needle = q.trim().toLocaleLowerCase("th");
  const users = (data ?? [])
    .map((user) => ({
      id: user.id,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      createdAt: user.created_at,
    }))
    .filter((user) => !needle || user.displayName.toLocaleLowerCase("th").includes(needle));

  return { ok: true, users };
}

// One party for /admin/parties/[id]: details, confirmed and pending counts, and
// the whole chat transcript that is still stored. A chat past its expiry
// keeps its rows until the nightly purge (purge_expired_chats) removes them.
export async function getAdminParty(id) {
  const supabase = await createClient();
  const [partyResult, messagesResult] = await Promise.all([
    supabase.from("parties").select(partyColumns).eq("id", id).maybeSingle(),
    supabase
      .from("party_messages")
      .select(messageColumns)
      .eq("party_id", id)
      .order("created_at", { ascending: true })
      .limit(1000),
  ]);

  if (partyResult.error || messagesResult.error) {
    console.error("admin party", (partyResult.error ?? messagesResult.error).message);
    return { ok: false, party: null };
  }

  if (!partyResult.data) {
    return { ok: true, party: null };
  }

  const [party] = await loadRelated(supabase, [partyResult.data]);

  return {
    ok: true,
    party,
    chat: chatState(party),
    messages: (messagesResult.data ?? []).map(toMessage),
  };
}
