import { requireAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

import { mockAdminDashboard, USE_ADMIN_MOCK_DATA } from "@/app/test/admin-mock-data";

export const metadata = { title: "ผู้ดูแลระบบ | MaTee" };

async function loadDashboard() {
  const supabase = await createClient();
  const [users, parties, joins, messages, recentUsers] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("parties").select("status, event_date, event_time"),
    supabase.from("party_members").select("id", { count: "exact", head: true }),
    supabase.from("party_messages").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  if ([users, parties, joins, messages, recentUsers].some((result) => result.error)) {
    throw new Error("โหลดข้อมูล Dashboard ไม่สำเร็จ");
  }

  const partyRows = parties.data ?? [];
  const finished = partyRows.filter(
    (party) =>
      party.status === "open" &&
      new Date(`${party.event_date}T${party.event_time}`).getTime() < Date.now(),
  ).length;

  return {
    users: users.count ?? 0,
    openParties: partyRows.filter((party) => party.status === "open").length - finished,
    cancelledParties: partyRows.filter((party) => party.status === "cancelled").length,
    finishedParties: finished,
    joins: joins.count ?? 0,
    messages: messages.count ?? 0,
    recentUsers: recentUsers.data ?? [],
  };
}

export default async function AdminPage() {
  // Temporarily disabled for UI review. Restore before connecting the real admin dashboard.
  // await requireAdmin();
  const data = USE_ADMIN_MOCK_DATA ? mockAdminDashboard : await loadDashboard();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-3xl font-semibold">แดชบอร์ดผู้ดูแลระบบ</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["ผู้ใช้", data.users],
          ["ตี้ที่เปิด", data.openParties],
          ["ตี้ยกเลิก", data.cancelledParties],
          ["ตี้ที่จบแล้ว", data.finishedParties],
          ["การเข้าร่วม", data.joins],
          ["ข้อความ", data.messages],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-card p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <nav className="mt-6 flex flex-wrap gap-3" aria-label="เมนูผู้ดูแลระบบ">
        <Link href="/admin/parties" className="rounded-xl border border-line bg-card px-4 py-3 text-sm font-medium hover:bg-background">
          จัดการตี้
        </Link>
        <Link href="/admin/users" className="rounded-xl border border-line bg-card px-4 py-3 text-sm font-medium hover:bg-background">
          จัดการผู้ใช้
        </Link>
      </nav>
      <section className="mt-6 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">สมาชิกที่สมัครล่าสุด</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {data.recentUsers.map((user) => (
            <li key={user.id} className="flex justify-between border-b border-line py-2 last:border-0">
              <span>{user.display_name ?? user.displayName}</span>
              <span className="text-muted">{new Date(user.created_at ?? user.createdAt).toLocaleDateString("th-TH")}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
