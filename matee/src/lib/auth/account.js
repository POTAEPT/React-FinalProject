import { cache } from "react";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// The signed-in user's name and avatar for the shell and composer, or null for
// guests. Cached per request so the layout and the page share one lookup.
export const loadAccount = cache(async () => {
  if (!getSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    return {
      displayName: profile?.display_name ?? user.email ?? "บัญชีของฉัน",
      avatarUrl: profile?.avatar_url ?? null,
    };
  } catch (error) {
    console.error("load account", error);
    return null;
  }
});
