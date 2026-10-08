'use client'
export default function Button({ children, loading, ...props }) {
  return (
    <button
      disabled={loading || props.disabled}
      className="w-full py-2.5 mt-2 text-sm font-medium text-white transition bg-zinc-900 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
      {...props}
    >
      {loading ? 'กำลังดำเนินการ...' : children}
    </button>
  )
}
