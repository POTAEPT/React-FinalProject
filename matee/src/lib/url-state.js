// Writes the search URL without a server round trip. Next.js picks up native
// history calls in useSearchParams, so the client search re-filters at once.
export function writeSearchUrl(params, { replace = false } = {}) {
  const url = params.size ? `/search?${params}` : "/search";

  window.history[replace ? "replaceState" : "pushState"](null, "", url);

  return params.toString();
}
