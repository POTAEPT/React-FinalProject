import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = { title: 'สมัครสมาชิก — MaTee' }

export default function RegisterPage() {
  console.log('✅ [Server] Rendering RegisterPage')
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <RegisterForm />
    </div>
  )
}
