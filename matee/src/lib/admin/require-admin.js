import { notFound } from "next/navigation";

import { loadAccount } from "@/lib/auth/account";

// First line of every /admin page: anyone who is not an admin, guests included,
// gets the same 404 as a missing page, so the admin area does not show up.
// Returns the admin's account ({ id, displayName, ... }).
export async function requireAdmin() {
  const account = await loadAccount();

  if (!account?.isAdmin) {
    notFound();
  }

  return account;
}
