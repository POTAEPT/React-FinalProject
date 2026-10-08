'use client'
export default function AlertMessage({ message }) {
  if (!message) return null
  return <p className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">{message}</p>
}
