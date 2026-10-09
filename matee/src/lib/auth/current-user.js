import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// The signed-in user for this request, or null. getUser() asks Supabase Auth
// over the network, so it is cached per request: the layout (header), the page
// and its queries all share one call instead of each making their own.
// Server Actions are separate requests and call getUser() themselves.
export const getCurrentUser = cache(async () => {
  if (!getSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user ?? null;
  } catch (error) {
    // Let Next handle its own signals (e.g. cookies() during a static
    // render attempt) instead of logging them as failures.
    unstable_rethrow(error);
    console.error("get current user", error);
    return null;
  }
});
