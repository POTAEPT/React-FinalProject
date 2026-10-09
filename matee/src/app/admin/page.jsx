import Image from "next/image";
import Link from "next/link";

import { getAdminStats } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatTimestamp } from "@/lib/parties/time";

export const metadata = {
  title: "ผู้ดูแลระบบ | MaTee",
};

function Stat({ label, value, href, note }) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString("th-TH")}</p>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </>
  );

  return href ? (
    <Link href={href} className="press rounded-2xl border border-line p-4 hover:bg-background">
      {body}
    </Link>
  ) : (
    <div className="rounded-2xl border border-line p-4">{body}</div>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const { ok, stats } = await getAdminStats();

  return (
    <main className="grid gap-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">ภาพรวม</h1>
      {!ok ? (
        <p role="alert" className="rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">
          โหลดตัวเลขไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง
        </p>
      ) : (
        <>
          <section aria-labelledby="party-stats" className="grid gap-3">
            <h2 id="party-stats" className="text-base font-semibold">ตี้</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="เปิดอยู่" value={stats.openParties} href="/admin/parties?status=open" note="ยังไม่จบ" />
              <Stat label="จบแล้ว" value={stats.finishedParties} href="/admin/parties?status=finished" />
              <Stat label="ยกเลิก" value={stats.cancelledParties} href="/admin/parties?status=cancelled" />
            </div>
          </section>
          <section aria-labelledby="activity-stats" className="grid gap-3">
            <h2 id="activity-stats" className="text-base font-semibold">ผู้ใช้และกิจกรรม</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="ผู้ใช้" value={stats.users} href="/admin/users" />
              <Stat label="การเข้าร่วม" value={stats.joins} note="สมาชิกที่ยืนยันแล้ว ไม่นับเจ้าของตี้" />
              <Stat label="คำขอรออนุมัติ" value={stats.pendingRequests} />
              <Stat label="ข้อความในแชท" value={stats.messages} note="แชทที่หมดอายุถูกลบไปแล้ว" />
            </div>
          </section>
          <section aria-labelledby="recent-users" className="grid gap-2">
            <h2 id="recent-users" className="text-base font-semibold">สมัครล่าสุด</h2>
            <ul className="divide-y divide-line">
              {stats.recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-soft text-sm text-soft-foreground">
                        {user.displayName.slice(0, 1)}
                      </span>
                    )}
                    <span className="truncate text-sm font-medium">{user.displayName}</span>
                  </span>
                  <span className="shrink-0 text-sm text-muted">{formatTimestamp(user.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
