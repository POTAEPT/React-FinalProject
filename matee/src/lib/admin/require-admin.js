import { notFound } from "next/navigation";

import { getSession } from "@/lib/auth/get-session";

export async function requireAdmin() {
  const session = await getSession();

  if (!session || session.profile.role !== "admin" || session.profile.banned_at) {
    notFound();
  }

  return session;
}
