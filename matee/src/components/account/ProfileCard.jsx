export default function ProfileCard({ profile }) {
  return (
    <div className="p-6 bg-white border shadow-sm rounded-2xl border-zinc-100">
      <h2 className="mb-4 text-base font-medium text-zinc-800">ข้อมูลโปรไฟล์</h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between"><dt className="text-zinc-500">ชื่อที่แสดง</dt><dd className="font-medium">{profile.display_name || '—'}</dd></div>
        <div className="flex justify-between"><dt className="text-zinc-500">Role</dt>
          <dd><span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-600 rounded-full">{profile.role}</span></dd>
        </div>
      </dl>
    </div>
  )
}
