import { createClient } from '@/lib/supabase/client'

/**
 * อธิบาย: รวบรวมฟังก์ชันเกี่ยวกับการยืนยันตัวตน (Auth) ไว้ที่เดียว
 */

// 1. สมัครสมาชิก
export async function signUp({ username, email, password }) {
  if (!username || username.length < 3) return { error: 'Username ต้องมีอย่างน้อย 3 ตัวอักษร' }
  if (!password || password.length < 8) return { error: 'Password ต้องมีอย่างน้อย 8 ตัวอักษร' }

  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // ตรงนี้คือการส่ง Metadata ซึ่งเดี๋ยวจะมี Trigger บน Database มารับไปใส่ตาราง profiles ให้อัตโนมัติ
      data: { username: username.trim() },
    },
  })

  return { error: error?.message || null }
}

// 2. เข้าสู่ระบบ
export async function signIn({ email, password }) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? 'Email หรือ Password ไม่ถูกต้อง' : null }
}

// 3. ออกจากระบบ
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error: error?.message || null }
}
