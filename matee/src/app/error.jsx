'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('⚠️ [GlobalError Caught]:', error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">เกิดข้อผิดพลาด</h1>

      {/* error.message can be technical (or from Supabase), so it is logged,
          not shown. The digest lets the team find the server log. */}
      <p role="alert" className="max-w-lg rounded-xl border border-danger-line bg-danger-bg p-4 text-sm leading-6 text-danger">
        มีบางอย่างผิดพลาด ลองอีกครั้ง หรือกลับไปหน้าหาตี้
        {error.digest ? (
          <span className="mt-1 block text-xs text-muted">รหัสอ้างอิง: {error.digest}</span>
        ) : null}
      </p>
      <Link href="/" className="text-sm font-medium text-accent underline underline-offset-4">
        กลับไปหาตี้
      </Link>
      <button
        onClick={() => reset()}
        className="rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground transition hover:opacity-90"
      >
        ลองใหม่อีกครั้ง
      </button>
    </main>
  )
}
