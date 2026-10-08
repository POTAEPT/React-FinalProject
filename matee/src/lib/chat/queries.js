import { createClient } from "@/lib/supabase/server";

export const MESSAGE_LIMIT = 50;
export const messageColumns =
  "id, party_id, user_id, body, created_at, profiles(display_name, avatar_url)";

export function toMessage(row) {
  return {
    id: row.id,
    partyId: row.party_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    displayName: row.profiles?.display_name ?? null,
    avatarUrl: row.profiles?.avatar_url ?? null,
  };
}

// The latest messages of a party, oldest first. RLS returns nothing to anyone
// who is not a pending or confirmed member (or an admin), so callers only use
// this for members.
export async function listPartyMessages(partyId, limit = MESSAGE_LIMIT) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("party_messages")
    .select(messageColumns)
    .eq("party_id", partyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("list party messages", error.message);
    return { ok: false, messages: [] };
  }

  return { ok: true, messages: (data ?? []).map(toMessage).reverse() };
}
