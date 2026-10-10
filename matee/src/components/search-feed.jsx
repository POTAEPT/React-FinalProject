import { FeedMessage } from "@/components/feed-message";
import { SearchResults } from "@/components/search-results";
import { listParties } from "@/lib/parties/queries";

// Fetches the whole list once; SearchResults filters it in the browser.
export async function SearchFeed() {
  const result = await listParties({ availability: "all" });

  if (!result.ok) {
    return <FeedMessage reason={result.reason} />;
  }

  return <SearchResults parties={result.parties} commitments={result.commitments} />;
}
