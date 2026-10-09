import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/next-path";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// For /login and /register: a signed-in user has nothing to do there, so send
// them on to ?next= (same-site paths only) or the home feed.
export async function redirectSignedIn(searchParams) {
  if (!getSupabaseEnv()) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { next } = await searchParams;
    redirect(safeNextPath(next));
  }
}
