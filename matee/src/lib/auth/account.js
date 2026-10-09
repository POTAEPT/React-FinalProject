import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// The signed-in user's id, name, avatar and admin flag for the shell, the
// composer and requireAdmin(), or null for guests. Cached per request so the
// layout and the page share one lookup. A banned admin is not an admin.
export const loadAccount = cache(async () => {
  if (!getSupabaseEnv()) {
    return null;
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, role, banned_at")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id: user.id,
      displayName: profile?.display_name ?? user.email ?? "บัญชีของฉัน",
      avatarUrl: profile?.avatar_url ?? null,
      isAdmin: profile?.role === "admin" && !profile?.banned_at,
    };
  } catch (error) {
    // Let Next handle its own signals (e.g. cookies() during a static
    // render attempt) instead of logging them as failures.
    unstable_rethrow(error);
    console.error("load account", error);
    return null;
  }
});
