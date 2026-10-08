'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth/actions'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import AlertMessage from '@/components/ui/AlertMessage'

/**
 * อธิบาย: Component สำหรับฟอร์มเข้าสู่ระบบ
 * หน้าที่คือจัดการ State (กำลังโหลด, ข้อผิดพลาด) และส่งข้อมูลไปหาฟังก์ชัน signIn
 */
export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/'
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn(form)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(nextPath)
    router.refresh()
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-line bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-sm text-muted">
          เข้าสู่บัญชีเพื่อเริ่มใช้งาน MaTee
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
              className="rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              className="rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="font-medium text-accent underline">
            สมัครสมาชิก
          </Link>
        </p>
      </section>
    </main>
  )
}
