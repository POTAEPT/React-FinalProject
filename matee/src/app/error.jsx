'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('⚠️ [GlobalError Caught]:', error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">เกิดข้อผิดพลาด</h1>

      <p role="alert" className="max-w-lg overflow-auto rounded-xl border border-danger-line bg-danger-bg p-4 text-left text-sm text-danger">
        {error.message || 'Unknown Error'}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90"
      >
        ลองใหม่อีกครั้ง
      </button>
    </main>
  )
}
