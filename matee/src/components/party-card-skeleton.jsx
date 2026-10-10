import { Skeleton } from "@/components/ui/skeleton";

// Same rail + column layout as PartyCard, so the list does not jump when the
// real cards replace it.
export function PartyCardSkeleton() {
  return (
    <div className="flex gap-3 px-4 pt-4 pb-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="mt-1 h-3 w-28" />
      </div>
    </div>
  );
}

export function PartyFeedSkeleton({ count = 4 }) {
  return (
    <div role="status" aria-label="กำลังโหลดรายการตี้" className="divide-y divide-line">
      {Array.from({ length: count }, (_, index) => (
        <PartyCardSkeleton key={index} />
      ))}
    </div>
  );
}
