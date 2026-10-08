import { createRemoteJWKSet, jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'
import { requireSupabaseEnv } from '@/lib/supabase/env'

/**
 * อธิบาย: ฟังก์ชันสำหรับดึง Session และ Profile ของผู้ใช้งาน โดยใช้ Local JWT Verification
 *
 * ใช้ Project JWKS ของ Supabase เพื่อตรวจสอบลายเซ็นและวันหมดอายุของ JWT
 * บนเซิร์ฟเวอร์ โดยไม่เชื่อข้อมูลจาก cookie เพียงอย่างเดียว
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

    // 2. ยืนยันความถูกต้องของ Token กับ Project JWKS
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

  // 3. ดึงข้อมูล Profile เพิ่มเติมจาก Database
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

  // 4. ส่งค่ากลับไปใช้งาน
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
