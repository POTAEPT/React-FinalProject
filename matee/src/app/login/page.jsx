import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import { redirectSignedIn } from '@/lib/auth/redirect-signed-in'

export const metadata = { title: 'เข้าสู่ระบบ | MaTee' }

export default async function LoginPage({ searchParams }) {
  await redirectSignedIn(searchParams)

  return <Suspense fallback={<div>Loading...</div>}><LoginForm /></Suspense>
}
