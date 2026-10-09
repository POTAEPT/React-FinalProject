import SignOutButton from '@/components/account/SignOutButton'

export default function BannedPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-t-4 border-danger-line border-t-danger bg-card p-8 text-center">
        <div className="mb-4 text-4xl">🚫</div>
        <h1 className="mb-2 text-2xl font-semibold">บัญชีถูกระงับ</h1>
        <p className="mb-6 text-sm text-muted">บัญชีของคุณถูกระงับการใช้งาน<br/>หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</p>
        <SignOutButton />
      </div>
    </main>
  )
}
