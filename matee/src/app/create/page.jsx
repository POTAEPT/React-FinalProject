import { createParty } from "@/app/create/actions";
import { PartyForm } from "@/components/party/PartyForm";
import { addDays, bangkokToday } from "@/lib/parties/time";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "ตั้งตี้ | MaTee",
};

export default async function CreatePage() {
  const today = bangkokToday();

  if (!getSupabaseEnv()) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8 text-sm leading-6 text-muted">
        ใส่ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน matee/.env.local
      </main>
    );
  }

  let user = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("create page session", error);

    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8 text-sm">
        เชื่อมต่อบัญชีไม่สำเร็จ
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">ตั้งตี้</h1>
        <p className="text-sm leading-6 text-muted">
          ใส่รายละเอียดกิจกรรม คนที่เปิดแอปจะเห็นการ์ดนี้ในหน้าหาตี้ และเลือกหมวดจากตัวกรองได้
        </p>
      </div>
      {user ? (
        <div className="rounded-2xl border border-line bg-card p-5">
          <PartyForm
            action={createParty}
            mode="create"
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
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm leading-6">
          เข้าสู่ระบบก่อนตั้งตี้
        </p>
      )}
    </main>
  );
}
