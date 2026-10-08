'use client'
export default function FormField({ label, name, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-zinc-700">{label}</label>
      <input
        id={name}
        name={name}
        className="px-3 py-2 text-sm text-black transition border rounded-lg outline-none border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        {...props}
      />
    </div>
  )
}
