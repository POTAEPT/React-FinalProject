import SignOutButton from '@/components/account/SignOutButton'

export default function BannedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">🚫</div>
        <h1 className="mb-2 text-2xl font-semibold">บัญชีถูกระงับ</h1>
        <p className="mb-6 text-sm text-muted">บัญชีของคุณถูกระงับการใช้งาน<br/>หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</p>
        <SignOutButton />
      </div>
    </div>
  )
}
