import Link from "next/link";

import { USE_ADMIN_MOCK_DATA, mockAdminParties } from "@/app/test/admin-mock-data";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "จัดการตี้ | ผู้ดูแลระบบ" };

async function loadParties() {
  if (USE_ADMIN_MOCK_DATA) return mockAdminParties;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parties")
    .select("id, title, category, event_date, event_time, location, status, confirmed_count, max_members, profiles!parties_owner_id_fkey(display_name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error("โหลดรายการตี้ไม่สำเร็จ");

  return (data ?? []).map((party) => ({
    ...party,
    owner: party.profiles?.display_name ?? "ไม่ทราบชื่อ",
    members: party.confirmed_count,
  }));
}

export default async function AdminPartiesPage() {
  // Temporarily disabled for UI review. Restore before enabling the real admin API.
  // await requireAdmin();
  const parties = await loadParties();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">ผู้ดูแลระบบ</p>
          <h1 className="mt-1 text-3xl font-semibold">จัดการตี้</h1>
        </div>
        <Link href="/admin" className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-card">
          กลับ Dashboard
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="border-b border-line px-5 py-4 text-sm text-muted">ข้อมูลตัวอย่างสำหรับตรวจ UI</div>
        <div className="divide-y divide-line">
          {parties.map((party) => (
            <div key={party.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div>
                <Link href={`/admin/parties/${party.id}`} className="font-semibold hover:text-accent">
                  {party.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {party.category} · {party.owner} · {party.location}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>{party.event_date} เวลา {party.event_time}</p>
                <p className="mt-1 text-muted">{party.members}/{party.max_members} คน · {party.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
