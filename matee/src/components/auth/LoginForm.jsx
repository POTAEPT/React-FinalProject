'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth/actions'
import { AuthDivider, AuthShell, authButtonClass, authInputClass } from '@/components/auth/AuthShell'
import { safeNextPath } from '@/lib/auth/next-path'

/**
 * อธิบาย: Component สำหรับฟอร์มเข้าสู่ระบบ
 * หน้าที่คือจัดการ State (กำลังโหลด, ข้อผิดพลาด) และส่งข้อมูลไปหาฟังก์ชัน signIn
 */
export default function LoginForm() {
  const searchParams = useSearchParams()
  const nextPath = safeNextPath(searchParams.get('next'))
  
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

    // A full page load, not router.push + router.refresh: refresh would
    // re-request /login, which now redirects signed-in users, and the two
    // navigations could race. A fresh load also renders the header with the
    // new session and keeps /login out of the history (Back skips it).
    window.location.replace(nextPath)
  }

  return (
    <AuthShell title="เข้าสู่ระบบด้วยบัญชี MaTee">
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          placeholder="อีเมล"
          aria-label="Email"
          required
          className={authInputClass}
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          placeholder="รหัสผ่าน"
          aria-label="Password"
          required
          className={authInputClass}
        />

        {error ? (
          <p role="alert" className="rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={`${authButtonClass} mt-1`}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <AuthDivider />

      <Link
        href="/register"
        className="grid h-14 place-items-center rounded-2xl border border-line bg-card text-base font-medium hover:border-accent"
      >
        สมัครสมาชิก
      </Link>
    </AuthShell>
  )
}
