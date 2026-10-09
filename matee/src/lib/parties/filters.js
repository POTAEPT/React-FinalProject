import { isPartyCategory } from "@/lib/parties/categories";

function firstString(value) {
  return typeof value === "string" ? value.trim() : "";
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dateParam(value) {
  const text = firstString(value);
  return DATE_PATTERN.test(text) ? text : "";
}

// defaultAvailability: what the feed shows when ?availability is not given.
export async function readFeedFilters(searchParams, defaultAvailability = "open") {
  const params = await searchParams;
  const category = firstString(params.category);

  return {
    q: firstString(params.q),
    category: isPartyCategory(category) ? category : "",
    availability:
      params.availability === "all" || params.availability === "open"
        ? params.availability
        : defaultAvailability,
    after: dateParam(params.after),
    before: dateParam(params.before),
    host: firstString(params.host),
  };
}
