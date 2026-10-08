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
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 items-center px-4 py-12">
      <div className="flex flex-col max-w-md gap-6 mx-auto">
        <div>
          <h1 className="text-2xl font-semibold">บัญชีของฉัน</h1>
          <p className="mt-1 text-sm text-muted">จัดการข้อมูลโปรไฟล์</p>
        </div>
        
        <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-medium">รูปโปรไฟล์</h2>
          <AvatarUploader userId={session.user.id} currentAvatarUrl={session.profile.avatar_url} />
        </div>
        
        <ProfileCard profile={session.profile} />
        <ClaimsPanel user={session.user} />
        
        <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
          <SignOutButton />
        </div>
      </div>
    </main>
  )
}
