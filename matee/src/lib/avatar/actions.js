'use server'

import { revalidatePath } from 'next/cache'

import { fail } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

/**
 * อธิบาย: ฟังก์ชันสำหรับอัปโหลดรูปประจำตัว (Avatar)
 *
 * การทำงานของ Supabase Storage:
 * 1. เราจะตั้งชื่อไฟล์เป็นรหัสผู้ใช้ตามด้วย timestamp เพื่อป้องกันปัญหาการแคชของเบราว์เซอร์
 * 2. เราทำการอัปโหลดด้วย `supabase.storage.from('avatars').upload`
 * 3. เมื่อเสร็จแล้ว เราจะขอ URL แบบสาธารณะ (`getPublicUrl`) มาบันทึกลงฐานข้อมูลในตาราง profiles
 *
 * คืน { ok: true, publicUrl } หรือ { ok: false, code, message }
 */
export async function uploadAvatar({ userId, file }) {
  if (!file) return fail('invalid', 'กรุณาเลือกไฟล์')
  if (!AVATAR_TYPES.includes(file.type)) {
    return fail('invalid', 'รองรับเฉพาะไฟล์ JPEG, PNG, WEBP')
  }
  if (file.size > AVATAR_MAX_BYTES) return fail('invalid', 'ขนาดไฟล์ต้องไม่เกิน 2MB')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return fail('unauthenticated', 'กรุณาเข้าสู่ระบบ')
  if (user.id !== userId) return fail('not_allowed', 'ไม่มีสิทธิ์แก้ไขรูปโปรไฟล์นี้')

  const ext = file.type.split('/')[1]
  const filePath = `${userId}/${Date.now()}.${ext}` // ตั้งชื่อไฟล์ให้ไม่ซ้ำ

  // อัปโหลดไป Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('upload avatar', uploadError.message)
    return fail('unknown', 'อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง')
  }

  // ขอ URL สาธารณะ
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // อัปเดตข้อมูลผู้ใช้ในตาราง Profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  if (updateError) {
    console.error('save avatar url', updateError.message)
    return fail('unknown', 'บันทึกรูปไม่สำเร็จ ลองใหม่อีกครั้ง')
  }

  revalidatePath('/', 'layout')
  return { ok: true, publicUrl }
}
