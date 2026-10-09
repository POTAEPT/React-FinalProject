import Image from "next/image";

import { listAdminUsers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatTimestamp } from "@/lib/parties/time";

export const metadata = {
  title: "ผู้ใช้ | ผู้ดูแลระบบ",
};

const ROLE_LABELS = { user: "ผู้ใช้", admin: "ผู้ดูแลระบบ" };

export default async function AdminUsersPage({ searchParams }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const { ok, users } = await listAdminUsers({ q });

  return (
    <main className="grid gap-4 py-6">
      <h1 className="px-4 text-2xl font-semibold">ผู้ใช้</h1>
      <form action="/admin/users" role="search" className="flex gap-2 px-4">
        <label htmlFor="admin-user-q" className="sr-only">
          ค้นหาผู้ใช้
        </label>
        <input
          id="admin-user-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="ชื่อผู้ใช้"
          className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2 text-base outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button type="submit" className="press rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
          ค้นหา
        </button>
      </form>
      {!ok ? (
        <p role="alert" className="mx-4 rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">
          โหลดรายชื่อผู้ใช้ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง
        </p>
      ) : (
        <section aria-labelledby="user-count">
          <p id="user-count" className="px-4 pb-1 text-sm text-muted">
            {users.length.toLocaleString("th-TH")} คน
          </p>
          {users.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">ไม่พบผู้ใช้ชื่อนี้</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {users.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-soft text-soft-foreground">
                        {user.displayName.slice(0, 1)}
                      </span>
                    )}
                    <div className="grid min-w-0 gap-0.5">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold">{user.displayName}</span>
                        <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-medium text-soft-foreground">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </p>
                      <p className="text-sm text-muted">สมัครเมื่อ {formatTimestamp(user.createdAt)}</p>
                    </div>
                  </div>
                  {user.id === admin.id ? <span className="text-sm text-muted">บัญชีของคุณ</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
