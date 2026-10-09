/**
 * อธิบาย: หน้าต่างเล็กๆ (Panel) ที่เอาไว้แสดงข้อมูลที่แกะออกมาจาก JWT Token ของ Supabase
 * ข้อมูลเหล่านี้คือสิ่งที่แนบมาพร้อมกับคุกกี้ของเรา โดยไม่ต้องเชื่อมต่อฐานข้อมูลใหม่เลย
 */
export default function ClaimsPanel({ user }) {
  const expDate = user.exp ? new Date(user.exp * 1000).toLocaleString('th-TH') : 'ไม่ทราบ'

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      {/* <h2 className="mb-1 text-base font-semibold">ข้อมูล Session (JWT)</h2>
      <p className="mb-4 text-xs text-muted">ข้อมูลที่ decode มาจาก Token โดยตรง</p> */}
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between gap-4"><dt className="shrink-0 text-muted">User ID (sub)</dt><dd className="break-all text-right font-mono text-xs">{user.id}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Email</dt><dd className="font-medium">{user.email}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">หมดอายุ (exp)</dt><dd className="font-medium">{expDate}</dd></div>
      </dl>
    </div>
  )
}
