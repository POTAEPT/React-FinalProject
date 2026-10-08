import { createRemoteJWKSet, jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'
import { requireSupabaseEnv } from '@/lib/supabase/env'

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
  const { url } = requireSupabaseEnv()

  // 1. อ่านค่า Token จาก Cookie
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) return null

  let payload
  try {
    const jwks = createRemoteJWKSet(
      new URL(`${url}/auth/v1/.well-known/jwks.json`),
    )

    // ยืนยัน JWT กับ Project JWKS
    // หาก Token ปลอมหรือหมดอายุ โค้ดจะโยน Error ไปที่ block catch ทันที
    const { payload: verified } = await jwtVerify(session.access_token, jwks, {
      issuer: `${url}/auth/v1`,
      audience: 'authenticated',
    })
    payload = verified
  } catch (error) {
    console.error('JWT verify failed:', error)
    return null
  }

  if (typeof payload.sub !== 'string' || !payload.sub) return null

  // ดึงข้อมูล Profile เพิ่มเติมจาก Database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, role, avatar_url, banned_at')
    .eq('id', payload.sub)
    .single()

  if (profileError) {
    console.error('Profile lookup failed:', profileError)
    return null
  }

  if (!profile) return null

  // 5. ส่งค่ากลับไปใช้งาน
  return {
    user: {
      id: payload.sub,
      email: payload.email,
      exp: payload.exp,
      role: profile.role,
    },
    profile,
  }
}
