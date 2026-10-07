'use client'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

export default function SignOutButton() {
  const router = useRouter()
  return (
    <button
      onClick={async () => { await signOut(); router.push('/login'); router.refresh() }}
      className="w-full py-2.5 text-sm font-medium transition border rounded-lg text-zinc-700 border-zinc-200 hover:bg-zinc-50"
    >
      ออกจากระบบ
    </button>
  )
}
