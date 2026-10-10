import { Skeleton } from "@/components/ui/skeleton";

// Placeholders for the loading.jsx files and Suspense fallbacks. They follow the
// shape of the real sections so the page does not jump when content arrives.

function Status({ children }) {
  return (
    <div role="status" aria-label="กำลังโหลด">
      {children}
    </div>
  );
}

export function BackBarSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3">
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

// Rows with a small leading block: my-party, admin lists, member lists.
export function ListSkeleton({ rows = 5 }) {
  return (
    <Status>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </Status>
  );
}

export function PartyDetailSkeleton() {
  return (
    <Status>
      <BackBarSkeleton />
      <div className="grid gap-6 border-b border-line px-4 py-5">
        <div className="grid gap-3">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-28" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="grid gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="px-4 py-5">
        <ChatSkeleton />
      </div>
    </Status>
  );
}

// The chat card on /party/[id]: heading, a few bubbles, the input.
export function ChatSkeleton({ bubbles = 3 }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
      <Skeleton className="h-6 w-28" />
      <ChatBubblesSkeleton count={bubbles} />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

// Alternating left/right bubbles, also shown at the top of the chat while
// older messages load.
export function ChatBubblesSkeleton({ count = 3 }) {
  return (
    <div aria-hidden="true" className="grid gap-3">
      {Array.from({ length: count }, (_, index) => {
        const mine = index % 2 === 1;

        return (
          <div key={index} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className={`grid gap-1 ${mine ? "justify-items-end" : ""}`}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className={`h-9 rounded-2xl ${mine ? "w-40" : "w-56"}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Generic page: a title row and a few content blocks.
export function PageSkeleton() {
  return (
    <Status>
      <div className="grid gap-4 px-4 py-5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <ListSkeleton rows={4} />
    </Status>
  );
}

export function ProfileSkeleton() {
  return (
    <Status>
      <div className="grid gap-4 px-4 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      <ListSkeleton rows={3} />
    </Status>
  );
}
