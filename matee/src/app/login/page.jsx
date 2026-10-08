import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = { title: 'เข้าสู่ระบบ — MaTee' }

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
