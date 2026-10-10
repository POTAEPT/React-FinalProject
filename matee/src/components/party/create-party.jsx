import dynamic from "next/dynamic";

import { loadAccount } from "@/lib/auth/account";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createParty } from "@/app/create/actions";
import { FormSkeleton } from "@/components/page-skeletons";
import { addDays, bangkokToday } from "@/lib/parties/time";
import { getSupabaseEnv } from "@/lib/supabase/env";

// The form (react-hook-form, zod) is its own chunk, with a skeleton while it loads.
const PartyForm = dynamic(
  () => import("@/components/party/PartyForm").then((module) => module.PartyForm),
  { loading: () => <FormSkeleton fields={5} /> },
);

// The create-party form with its env and sign-in guards. Shared by the
// /create page and the modal that intercepts it, so there is one form.
export async function CreateParty() {
  const today = bangkokToday();

  if (!getSupabaseEnv()) {
    return (
      <p className="px-4 py-6 text-sm leading-6 text-muted">
        ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน matee/.env.local
      </p>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <p className="m-4 rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm leading-6">
        เข้าสู่ระบบก่อนตั้งตี้
      </p>
    );
  }

  const account = await loadAccount();

  return (
    <PartyForm
      action={createParty}
      mode="create"
      host={account ? { name: account.displayName, avatarUrl: account.avatarUrl } : null}
      draftKey="matee:create-party-draft"
      minDate={today}
      defaultValues={{
        title: "",
        category: "sport",
        customCategory: "",
        eventDate: addDays(today, 1),
        eventTime: "18:00",
        durationMinutes: 120,
        location: "",
        maxMembers: 4,
        detail: "",
        joinMode: "approve",
      }}
      submitLabel="ตั้งตี้"
      pendingLabel="กำลังตั้งตี้..."
    />
  );
}
