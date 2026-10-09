'use client'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

export default function SignOutButton() {
  const router = useRouter()
  return (
    <button
      onClick={async () => { await signOut(); router.push('/login'); router.refresh() }}
      className="press flex-1 rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:bg-background"
    >
      ออกจากระบบ
    </button>
  )
}
