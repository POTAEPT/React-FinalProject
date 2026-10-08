import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import AvatarUploader from '@/components/account/AvatarUploader'
import ProfileCard from '@/components/account/ProfileCard'
import ClaimsPanel from '@/components/account/ClaimsPanel'
import SignOutButton from '@/components/account/SignOutButton'

export const metadata = { title: 'เธเธฑเธเธเธตเธเธญเธเธเธฑเธ โ€” MaTee' }

export default async function AccountPage() {
  const session = await getSession()

  // เธเนเธญเธเธเธฑเธเธเธฒเธฃเน€เธเนเธฒเธ–เธถเธเธ–เนเธฒเนเธกเนเนเธ”เนเธฅเนเธญเธเธญเธดเธ เธซเธฃเธทเธญเนเธ”เธเนเธเธ (เน€เธเธทเนเธญ Middleware เธเธฅเธฒเธ”)
  if (!session) redirect('/login')
  if (session.profile.banned_at) redirect('/banned')

  return (
    <div className="min-h-screen px-4 py-12 bg-zinc-50">
      <div className="flex flex-col max-w-md gap-6 mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">เธเธฑเธเธเธตเธเธญเธเธเธฑเธ</h1>
          <p className="mt-1 text-sm text-zinc-500">เธเธฑเธ”เธเธฒเธฃเธเนเธญเธกเธนเธฅเนเธเธฃเนเธเธฅเน</p>
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-2xl border-zinc-100">
          <h2 className="mb-4 text-base font-medium text-zinc-800">เธฃเธนเธเนเธเธฃเนเธเธฅเน</h2>
          <AvatarUploader userId={session.user.id} currentAvatarUrl={session.profile.avatar_url} />
        </div>

        <ProfileCard profile={session.profile} />
        <ClaimsPanel user={session.user} />

        <div className="p-6 bg-white border shadow-sm rounded-2xl border-zinc-100">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
