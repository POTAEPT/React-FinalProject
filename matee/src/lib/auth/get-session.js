import { jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'

/**
 * อธิบาย: ฟังก์ชันสำหรับดึง Session และ Profile ของผู้ใช้งาน โดยใช้ Local JWT Verification
 *
 * การทำงานกับ JWT (JSON Web Token):
 * ปกติแล้วเราจะต้องส่ง Token กลับไปถามเซิร์ฟเวอร์ (Network Call) ว่ายังใช้ได้ไหม
 * แต่ด้วยความลับของ JWT (Secret Key) ที่ตั้งไว้ใน `.env.local`
 * เราสามารถใช้ไลบรารี `jose` ตรวจสอบลายเซ็น (Signature) และวันหมดอายุ (Exp) 
 * ได้ทันทีบนฝั่งเครื่องเซิร์ฟเวอร์ของเราเอง (Locally) ซึ่งทำให้เร็วกว่ามาก!
 */
export async function getSession() {
  const supabase = await createClient()

  // 1. อ่านค่า Token จาก Cookie
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) return null

  let payload
  try {
    // 2. แปลง Secret Key
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET)
    
    // 3. ยืนยันความถูกต้องของ Token (Local Verify)
    // หาก Token ปลอมหรือหมดอายุ โค้ดจะโยน Error ไปที่ block catch ทันที
    const { payload: verified } = await jwtVerify(session.access_token, secret)
    payload = verified
  } catch (err) {
    console.error('JWT verify failed:', err.code)
    return null
  }

  // 4. ดึงข้อมูล Profile เพิ่มเติมจาก Database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, role, avatar_url, banned_at')
    .eq('id', payload.sub)
    .single()

  if (profileError || !profile) return null

  // 5. ส่งค่ากลับไปใช้งาน
  return {
    user: {
      id: payload.sub,
      email: payload.email,
      exp: payload.exp,
      role: payload.role,
    },
    profile,
  }
}
