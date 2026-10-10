import { FeedMessage } from "@/components/feed-message";
import { LazyPartyList } from "@/components/lazy-party-list";
import { listParties } from "@/lib/parties/queries";

export async function PartyFeed({ filters, emptyMessage }) {
  const result = await listParties(filters);

  if (!result.ok) {
    return <FeedMessage reason={result.reason} />;
  }

  if (result.parties.length === 0) {
    return <FeedMessage>{emptyMessage}</FeedMessage>;
  }

  return <LazyPartyList parties={result.parties} commitments={result.commitments} />;
}
