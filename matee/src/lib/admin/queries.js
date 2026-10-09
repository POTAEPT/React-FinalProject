import { partyEndMs } from "@/lib/parties/time";
import { createClient } from "@/lib/supabase/server";

// Reads for the /admin pages. Every caller runs requireAdmin() first; RLS also
// lets an admin read every member row and every chat message (is_admin()).

// Totals for the dashboard. "finished" is an open party whose end time has
// passed (there is no finished status in the table); joins count confirmed
// members other than the host, who has a confirmed row of their own.
export async function getAdminStats() {
  const supabase = await createClient();
  const [users, banned, parties, members, messages, recentUsers] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("banned_at", "is", null),
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

  const failed = [users, banned, parties, members, messages, recentUsers].find(
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
      bannedUsers: banned.count ?? 0,
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
