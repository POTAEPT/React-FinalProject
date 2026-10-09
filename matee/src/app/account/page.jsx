import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import AvatarUploader from '@/components/account/AvatarUploader'
import ProfileCard from '@/components/account/ProfileCard'
import ClaimsPanel from '@/components/account/ClaimsPanel'
import SignOutButton from '@/components/account/SignOutButton'

export const metadata = { title: 'บัญชีของฉัน — MaTee' }

export default async function AccountPage() {
  const session = await getSession()

  // ป้องกันการเข้าถึงถ้าไม่ได้ล็อกอิน หรือโดนแบน (เผื่อ Middleware พลาด)
  if (!session) redirect('/login')
  if (session.profile.banned_at) redirect('/banned')

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">บัญชีของฉัน</h1>
          <p className="mt-1 text-sm text-muted">จัดการข้อมูลโปรไฟล์</p>
        </div>
        
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">รูปโปรไฟล์</h2>
          <AvatarUploader userId={session.user.id} currentAvatarUrl={session.profile.avatar_url} />
        </div>
        
        <ProfileCard profile={session.profile} />
        <ClaimsPanel user={session.user} />
        
        <div className="rounded-2xl border border-line bg-card p-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  )
}
