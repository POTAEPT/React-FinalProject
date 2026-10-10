// Shared by the server query, the Server Action and the client chat panel, so it
// must not import a server-only module.
// One page of chat: the first load, the catch-up, and each "older" load.
export const MESSAGE_LIMIT = 20;
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
