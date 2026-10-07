import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getSupabaseEnv } from './env'

/**
 * อธิบาย: ฟังก์ชันนี้ใช้ใน Middleware เพื่อตรวจสอบและต่ออายุ (Refresh) Token
 *
 * การทำงานกับ Supabase และ JWT:
 * 1. Supabase เก็บ session ในรูปแบบของ JWT ไว้ใน Cookies
 * 2. JWT มีวันหมดอายุ (มักจะ 1 ชั่วโมง)
 * 3. เมื่อ User เปิดหน้าเว็บ request จะวิ่งผ่าน Middleware ก่อน
 * 4. เราสร้าง Supabase Client ขึ้นมา และดึงค่าจาก Cookie
 * 5. เมื่อเราเรียก `supabase.auth.getUser()` ตัว @supabase/ssr จะตรวจสอบ Token
 *    ถ้า Token ใกล้หมดอายุ มันจะขอ Token ใหม่ให้ทันที
 * 6. สุดท้ายเรานำ Token ใหม่ (ถ้ามี) ไปแนบใส่ `supabaseResponse` เพื่อส่ง Cookie ใหม่กลับไปให้เบราว์เซอร์
 */
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const env = getSupabaseEnv()
  if (!env) return { supabaseResponse, user: null }

  const supabase = createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.headers.append(
              'Set-Cookie',
              `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${options?.secure ? '; Secure' : ''}`
            )
          )
        },
      },
    }
  )

  // ดึงข้อมูล User จาก Token ปัจจุบัน (และ refresh ให้อัตโนมัติถ้าใกล้หมดอายุ)
  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user, supabase }
}
