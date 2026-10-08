import { partyEndMs } from "@/lib/parties/time";

const DAY_MS = 24 * 60 * 60 * 1000;
export const CHAT_RETENTION_DAYS = 7;

// Same rule as public.chat_expires_at() in the schema: a cancelled party's chat
// lives 7 days after the cancel (parties.updated_at), any other party's chat
// lives 7 days after the party ends.
export function chatExpiresAtMs(party) {
  if (party.status === "cancelled") {
    return Date.parse(party.updatedAt) + CHAT_RETENTION_DAYS * DAY_MS;
  }

  const endMs =
    party.endMs ?? partyEndMs(party.eventDate, party.eventTime, party.durationMinutes);

  return endMs + CHAT_RETENTION_DAYS * DAY_MS;
}

// open:     the party is still running or upcoming (not cancelled)
// closing:  finished or cancelled, still writable; daysLeft rounds up
// expired:  no transcript and no composer; the insert policy agrees
export function chatState(party, now = Date.now()) {
  const expiresAtMs = chatExpiresAtMs(party);

  if (Number.isNaN(expiresAtMs) || expiresAtMs <= now) {
    return { kind: "expired", expiresAtMs };
  }

  const endMs =
    party.endMs ?? partyEndMs(party.eventDate, party.eventTime, party.durationMinutes);

  if (party.status === "cancelled" || endMs <= now) {
    return {
      kind: "closing",
      expiresAtMs,
      daysLeft: Math.max(1, Math.ceil((expiresAtMs - now) / DAY_MS)),
    };
  }

  return { kind: "open", expiresAtMs };
}
