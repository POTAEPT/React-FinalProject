import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * อธิบาย: ไฟล์ Middleware ทำหน้าที่เปรียบเสมือนยามเฝ้าประตู (Guard)
 * 
 * หน้าที่หลัก:
 * 1. เรียก `updateSession` เพื่อต่ออายุ Token ของ Supabase
 * 2. ป้องกันหน้าต่าง ๆ (Protected Routes) ถ้ายังไม่ได้ Login ให้เด้งไปหน้า /login
 * 3. ตรวจสอบสถานะการโดนแบน (Banned) ถ้าโดนแบน ให้เด้งไปหน้า /banned
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (pathname === '/banned') {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // 1. ตรวจสอบและต่ออายุ Session
  const { user, supabase, supabaseResponse } = await updateSession(request)

  // 2. ตรวจสอบหน้าที่ห้ามเข้าถ้าไม่ได้ล็อกอิน
  const protectedPaths = ['/create', '/my-party', '/manage', '/account']
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. ตรวจสอบว่าโดนแบนหรือไม่
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('banned_at')
      .eq('id', user.id)
      .single()

    if (profile?.banned_at) {
      return NextResponse.redirect(new URL('/banned', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.webp).*)',
  ],
}
