import Image from "next/image";
import Link from "next/link";

// Threads-style "What's new?" row. It only links to /create, which holds the
// real form, so there is one place to maintain party creation.
export function PartyComposer({ account }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {account?.avatarUrl ? (
        <Image
          src={account.avatarUrl}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-soft font-medium text-soft-foreground"
        >
          {account ? account.displayName.slice(0, 1) : "?"}
        </span>
      )}
      <Link href="/create" className="press flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full">
        <span className="truncate text-muted">ตั้งตี้ใหม่ ชวนใครมาทำกิจกรรมด้วยกัน…</span>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-line px-4 py-1.5 text-sm font-semibold">
          ตั้งตี้
        </span>
      </Link>
    </div>
  );
}
