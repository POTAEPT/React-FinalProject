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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error: signInError } = await signIn(form)
    
    if (signInError) {
      setError(signInError)
      setLoading(false)
      return
    }
    
    // Login สำเร็จให้เด้งไปหน้าเดิมที่พยายามจะเข้า หรือไปหน้าแรก
    router.push(nextPath)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm p-8 bg-white border border-zinc-100 rounded-2xl shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">เข้าสู่ระบบ</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
        <AlertMessage message={error} />
        <Button loading={loading}>เข้าสู่ระบบ</Button>
      </form>
      <p className="mt-6 text-sm text-center text-zinc-500">
        ยังไม่มีบัญชี? <Link href="/register" className="text-zinc-900 font-medium hover:underline">สมัครสมาชิก</Link>
      </p>
    </div>
  )
}
