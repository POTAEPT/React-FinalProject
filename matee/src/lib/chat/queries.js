import { MESSAGE_LIMIT, messageColumns, toMessage } from "@/lib/chat/message";
import { createClient } from "@/lib/supabase/server";

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
