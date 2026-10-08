'use client'
export default function AlertMessage({ message }) {
  if (!message) return null
  return <p className="px-3 py-2 text-sm text-red-600 border border-red-100 rounded-lg bg-red-50">{message}</p>
}
