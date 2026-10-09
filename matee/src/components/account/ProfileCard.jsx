export default function ProfileCard({ profile }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h2 className="mb-4 text-base font-semibold">ข้อมูลโปรไฟล์</h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Username</dt><dd className="font-medium">{profile.display_name || '—'}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Role</dt>
          <dd><span className="rounded-full bg-soft px-2 py-0.5 text-xs font-medium text-soft-foreground">{profile.role}</span></dd>
        </div>
      </dl>
    </div>
  )
}
