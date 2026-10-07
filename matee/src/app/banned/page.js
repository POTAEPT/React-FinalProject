import SignOutButton from '@/components/account/SignOutButton'

export default function BannedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-full max-w-sm p-8 text-center bg-white border shadow-sm rounded-2xl border-zinc-100">
        <div className="mb-4 text-4xl">🚫</div>
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">บัญชีถูกระงับ</h1>
        <p className="mb-6 text-sm text-zinc-500">บัญชีของคุณถูกระงับการใช้งาน<br/>หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</p>
        <SignOutButton />
      </div>
    </div>
  )
}
