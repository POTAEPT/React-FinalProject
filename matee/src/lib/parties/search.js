import { isPartyCategory } from "@/lib/parties/categories";

// Pure search helpers. They run on the server (admin list) and in the browser
// (live search), so keep server-only imports out of this file.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function lower(text) {
  return text.toLocaleLowerCase("th");
}

export function matchesSearch(party, query) {
  if (!query) {
    return true;
  }

  const haystack = [party.title, party.location, party.customCategory]
    .filter(Boolean)
    .join(" ");

  return lower(haystack).includes(lower(query));
}

// Reads the search filters from URLSearchParams (same rules as readFeedFilters).
export function readSearchFilters(params) {
  const text = (key) => (params.get(key) ?? "").trim();
  const date = (key) => (DATE_PATTERN.test(text(key)) ? text(key) : "");
  const category = text("category");

  return {
    q: text("q"),
    category: isPartyCategory(category) ? category : "",
    availability: params.get("availability") === "open" ? "open" : "all",
    after: date("after"),
    before: date("before"),
    host: text("host"),
  };
}

export function hasSearchFilters(filters) {
  return Boolean(
    filters.q || filters.category || filters.after || filters.before || filters.host,
  );
}

export function filterParties(parties, filters) {
  return parties.filter((party) => {
    if (!matchesSearch(party, filters.q)) {
      return false;
    }

    if (filters.category && party.category !== filters.category) {
      return false;
    }

    if (filters.after && party.eventDate < filters.after) {
      return false;
    }

    if (filters.before && party.eventDate > filters.before) {
      return false;
    }

    if (filters.host && !lower(party.hostName).includes(lower(filters.host))) {
      return false;
    }

    return filters.availability !== "open" || (!party.full && !party.started);
  });
}
