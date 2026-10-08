'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('⚠️ [GlobalError Caught]:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">

      <p className="mb-6 max-w-lg overflow-auto rounded-lg border border-danger/40 bg-danger-soft p-4 text-left text-sm text-danger">
        {error.message || 'Unknown Error'}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-accent px-6 py-2 text-accent-foreground transition hover:opacity-90"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  )
}
