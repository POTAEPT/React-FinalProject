// Port of the shadcn/ui Skeleton: a pulsing placeholder block. Size and shape
// come from className; the fill is the theme's soft surface.
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={`rounded-md bg-soft motion-safe:animate-pulse ${className}`}
      {...props}
    />
  );
}
