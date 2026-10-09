'use client'
export default function Button({ children, loading, ...props }) {
  return (
    <button
      disabled={loading || props.disabled}
      className="mt-2 w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {loading ? 'กำลังดำเนินการ...' : children}
    </button>
  )
}
