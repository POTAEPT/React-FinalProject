import { isPartyCategory } from "@/lib/parties/categories";

function firstString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function readFeedFilters(searchParams) {
  const params = await searchParams;
  const category = firstString(params.category);

  return {
    q: firstString(params.q),
    category: isPartyCategory(category) ? category : "",
    availability: params.availability === "all" ? "all" : "open",
  };
}
