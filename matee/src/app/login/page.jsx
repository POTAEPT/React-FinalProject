import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'เข้าสู่ระบบ | MaTee',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <LoginForm />
    </Suspense>
  )
}
