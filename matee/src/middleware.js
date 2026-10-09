import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function redirectWithSession(url, supabaseResponse) {
  const response = NextResponse.redirect(url)

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })

  return response
}

/**
 * อธิบาย: ไฟล์ Middleware ทำหน้าที่เปรียบเสมือนยามเฝ้าประตู (Guard)
 * 
 * หน้าที่หลัก:
 * 1. เรียก `updateSession` เพื่อต่ออายุ Token ของ Supabase
 * 2. ป้องกันหน้าต่าง ๆ (Protected Routes) ถ้ายังไม่ได้ Login ให้เด้งไปหน้า /login
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl

  // 1. ตรวจสอบและต่ออายุ Session
  const { user, supabaseResponse } = await updateSession(request)

  // 2. ตรวจสอบหน้าที่ห้ามเข้าถ้าไม่ได้ล็อกอิน
  const protectedPaths = ['/create', '/my-party', '/manage', '/account']
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return redirectWithSession(loginUrl, supabaseResponse)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.webp).*)',
  ],
}
