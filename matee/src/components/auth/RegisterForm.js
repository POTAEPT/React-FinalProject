'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth/actions'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import AlertMessage from '@/components/ui/AlertMessage'

/**
 * อธิบาย: Component สำหรับฟอร์มสมัครสมาชิก
 * เหมือนกับ LoginForm แต่เพิ่มช่อง Username และเรียก signUp
 */
export default function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', email: '', password: '' })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error: signUpError } = await signUp(form)
    
    if (signUpError) {
      setError(signUpError)
      setLoading(false)
      return
    }
    
    router.push('/account')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm p-8 bg-white border border-zinc-100 rounded-2xl shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">สมัครสมาชิก</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Username" name="username" value={form.username} onChange={handleChange} required />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} />
        <AlertMessage message={error} />
        <Button loading={loading}>สมัครสมาชิก</Button>
      </form>
      <p className="mt-6 text-sm text-center text-zinc-500">
        มีบัญชีอยู่แล้ว? <Link href="/login" className="text-zinc-900 font-medium hover:underline">เข้าสู่ระบบ</Link>
      </p>
    </div>
  )
}
