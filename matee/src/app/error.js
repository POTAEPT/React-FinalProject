'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('⚠️ [GlobalError Caught]:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 px-4 text-center">

      <p className="text-sm text-red-500 max-w-lg mb-6 bg-white p-4 rounded-lg border border-red-200 overflow-auto text-left">
        {error.message || 'Unknown Error'}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  )
}
