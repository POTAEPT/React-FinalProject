'use client'
export default function AlertMessage({ message }) {
  if (!message) return null
  return <p role="alert" className="rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">{message}</p>
}
