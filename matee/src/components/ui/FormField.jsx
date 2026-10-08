'use client'
export default function FormField({ label, name, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-foreground">{label}</label>
      <input
        id={name}
        name={name}
        className="rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        {...props}
      />
    </div>
  )
}
