'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * อธิบาย: ฟังก์ชันสำหรับอัปโหลดรูปประจำตัว (Avatar)
 * 
 * การทำงานของ Supabase Storage:
 * 1. เราจะตั้งชื่อไฟล์เป็นรหัสผู้ใช้ตามด้วย timestamp เพื่อป้องกันปัญหาการแคชของเบราว์เซอร์
 * 2. เราทำการอัปโหลดด้วย `supabase.storage.from('avatars').upload`
 * 3. เมื่อเสร็จแล้ว เราจะขอ URL แบบสาธารณะ (`getPublicUrl`) มาบันทึกลงฐานข้อมูลในตาราง profiles
 */
export async function uploadAvatar({ userId, file }) {
  if (!file) return { error: 'กรุณาเลือกไฟล์' }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'รองรับเฉพาะไฟล์ JPEG, PNG, WEBP' }
  }
  if (file.size > 2 * 1024 * 1024) return { error: 'ขนาดไฟล์ต้องไม่เกิน 2MB' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return { error: 'ไม่มีสิทธิ์แก้ไขรูปโปรไฟล์นี้' }
  }

  const ext = file.type.split('/')[1]
  const filePath = `${userId}/${Date.now()}.${ext}` // ตั้งชื่อไฟล์ให้ไม่ซ้ำ

  // อัปโหลดไป Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  // ขอ URL สาธารณะ
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // อัปเดตข้อมูลผู้ใช้ในตาราง Profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  return { publicUrl, error: null }
}
