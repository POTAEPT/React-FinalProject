import Link from "next/link";

import { mockAdminUsers, USE_ADMIN_MOCK_DATA } from "@/app/test/admin-mock-data";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "จัดการผู้ใช้ | ผู้ดูแลระบบ" };

async function loadUsers() {
  if (USE_ADMIN_MOCK_DATA) return mockAdminUsers;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, banned_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error("โหลดรายชื่อผู้ใช้ไม่สำเร็จ");

  return data ?? [];
}

export default async function AdminUsersPage() {
  // Temporarily disabled for UI review. Restore before enabling the real admin API.
  // await requireAdmin();
  const users = await loadUsers();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">ผู้ดูแลระบบ</p>
          <h1 className="mt-1 text-3xl font-semibold">จัดการผู้ใช้</h1>
        </div>
        <Link href="/admin" className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-card">
          กลับ Dashboard
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="border-b border-line px-5 py-4 text-sm text-muted">ข้อมูลตัวอย่างสำหรับตรวจ UI</div>
        <div className="divide-y divide-line">
          {users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-semibold">{user.display_name}</p>
                <p className="mt-1 text-sm text-muted">{user.email}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-background px-3 py-1">{user.role}</span>
                <span className={user.banned_at ? "text-danger" : "text-success"}>
                  {user.banned_at ? "ถูกแบน" : "ใช้งานปกติ"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
