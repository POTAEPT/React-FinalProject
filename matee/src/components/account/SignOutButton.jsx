'use client'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

export default function SignOutButton() {
  const router = useRouter()
  return (
    <button
      onClick={async () => { await signOut(); router.push('/login'); router.refresh() }}
      className="w-full rounded-xl border border-line py-2.5 text-sm font-medium transition hover:bg-background"
    >
      ออกจากระบบ
    </button>
  )
}
