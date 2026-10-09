'use server'

import { revalidatePath } from 'next/cache'

import { fail } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'

// Saves the signed-in user's display name. RLS lets a user update only their
// own profile row; the table check keeps the name at 1 to 40 characters.
export async function updateDisplayName(displayName) {
  const name = String(displayName ?? '').trim()

  if (name.length < 1 || name.length > 40) {
    return fail('invalid', 'ชื่อต้องยาว 1-40 ตัวอักษร')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return fail('unauthenticated', 'กรุณาเข้าสู่ระบบ')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', user.id)

  if (error) {
    console.error('update display name', error.message)
    return fail('unknown', 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง')
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
