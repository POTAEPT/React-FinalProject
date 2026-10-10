import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { siteUrl } from "@/lib/site";

// Rebuilt at most once an hour; party pages come and go.
export const revalidate = 3600;

// Open parties are public, so the sitemap reads them with the anon key and no
// cookies. That keeps this route cacheable instead of per-request.
async function openPartyEntries(origin) {
  const env = getSupabaseEnv();

  if (!env) {
    return [];
  }

  const supabase = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("parties")
    .select("id, updated_at")
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("sitemap parties", error.message);
    return [];
  }

  return (data ?? []).map((party) => ({
    url: `${origin}/party/${party.id}`,
    lastModified: party.updated_at,
    changeFrequency: "daily",
    priority: 0.6,
  }));
}

export default async function sitemap() {
  const origin = siteUrl();

  return [
    { url: origin, changeFrequency: "hourly", priority: 1 },
    { url: `${origin}/search`, changeFrequency: "daily", priority: 0.8 },
    ...(await openPartyEntries(origin)),
  ];
}
