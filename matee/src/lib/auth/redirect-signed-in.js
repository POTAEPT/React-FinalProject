import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/next-path";
import { getCurrentUser } from "@/lib/auth/current-user";

// For /login and /register: a signed-in user has nothing to do there, so send
// them on to ?next= (same-site paths only) or the home feed.
export async function redirectSignedIn(searchParams) {
  const user = await getCurrentUser();

  if (user) {
    const { next } = await searchParams;
    redirect(safeNextPath(next));
  }
}
