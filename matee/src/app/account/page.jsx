import Link from 'next/link'
import { redirect } from 'next/navigation'

import Image from 'next/image'
import SignOutButton from '@/components/account/SignOutButton'
import { PartyCard } from '@/components/party-card'
import { getSession } from '@/lib/auth/get-session'
import { listMyMemberships } from '@/lib/parties/my-commitments'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'โปรไฟล์ | MaTee' }

const ROLE_LABELS = { user: 'ผู้ใช้', admin: 'ผู้ดูแลระบบ' }

const TABS = [
  { value: 'hosted', label: 'ตี้ที่ตั้ง', empty: 'ยังไม่ได้ตั้งตี้' },
  { value: 'joined', label: 'ตี้ที่เข้าร่วม', empty: 'ยังไม่ได้เข้าร่วมตี้ไหน' },
]

// A membership row shaped like the feed's party, so PartyCard can draw it.
function toCardParty(item, hostName, hostAvatarUrl) {
  const now = Date.now()

  return {
    id: item.partyId,
    title: item.title,
    category: item.category,
    customCategory: item.customCategory,
    joinMode: item.joinMode,
    eventDate: item.eventDate,
    eventTime: item.eventTime,
    durationMinutes: item.durationMinutes,
    location: item.location,
    maxMembers: item.maxMembers,
    confirmedCount: item.confirmedCount,
    pendingCount: null,
    hostName,
    hostAvatarUrl,
    full: item.confirmedCount >= item.maxMembers,
    started: item.startMs <= now,
    ended: item.endMs <= now,
  }
}

export default async function AccountPage({ searchParams }) {
  const session = await getSession()

  // Guard in case the middleware misses: guests leave.
  if (!session) redirect('/login')

  const { tab: rawTab } = await searchParams
  const tab = rawTab === 'joined' ? 'joined' : 'hosted'
  const { profile, user } = session
  const name = profile.display_name || 'ไม่ระบุชื่อ'

  const supabase = await createClient()
  const memberships = (await listMyMemberships(supabase, user.id))
    .filter((item) => item.partyStatus !== 'cancelled' && item.status !== 'cancelled' && item.status !== 'rejected')
    .sort((a, b) => b.startMs - a.startMs)
  const hosted = memberships.filter((item) => item.isHost)
  const joined = memberships.filter((item) => !item.isHost)
  const shown = tab === 'hosted' ? hosted : joined

  // Hosts of joined parties, for the name and avatar on each card.
  const owners = new Map()
  const joinedIds = joined.map((item) => item.partyId)

  if (tab === 'joined' && joinedIds.length) {
    const { data: parties } = await supabase.from('parties').select('id, owner_id').in('id', joinedIds)
    const ownerIds = [...new Set((parties ?? []).map((row) => row.owner_id))]
    const { data: profiles } = ownerIds.length
      ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ownerIds)
      : { data: [] }
    const byId = new Map((profiles ?? []).map((row) => [row.id, row]))

    for (const row of parties ?? []) {
      owners.set(row.id, byId.get(row.owner_id))
    }
  }

  return (
    <main className="flex w-full flex-1 flex-col">
      <h1 className="sr-only">
        โปรไฟล์
      </h1>

      <section className="grid gap-4 px-4 pt-3 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="grid min-w-0 gap-1 pt-1">
            <h2 className="truncate text-2xl font-semibold leading-8 tracking-tight">{name}</h2>
            <p className="truncate text-sm text-muted">{user.email}</p>
            <p>
              <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-medium text-soft-foreground">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
            </p>
          </div>
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={80} height={80} className="size-20 shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-full bg-soft text-3xl font-medium text-soft-foreground">
              {name.slice(0, 1)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted tabular-nums">
          ตั้งตี้ {hosted.length} · เข้าร่วม {joined.length}
        </p>
        <div className="flex gap-3">
          <Link
            href="/account/edit"
            className="press flex-1 rounded-xl border border-line px-4 py-2 text-center text-sm font-semibold hover:bg-background"
          >
            แก้ไขโปรไฟล์
          </Link>
          <SignOutButton />
        </div>
      </section>

      <nav aria-label="ตี้ของฉัน" className="grid grid-cols-2 border-b border-line">
        {TABS.map((item) => {
          const active = item.value === tab

          return (
            <Link
              key={item.value}
              href={item.value === 'hosted' ? '/account' : '/account?tab=joined'}
              aria-current={active ? 'page' : undefined}
              className={`press relative py-3 text-center text-sm font-semibold hover:bg-background/60 ${
                active ? 'text-foreground' : 'text-muted'
              }`}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-foreground" />
              ) : null}
            </Link>
          )
        })}
      </nav>

      {shown.length ? (
        <ul className="divide-y divide-line">
          {shown.map((item) => {
            const owner = owners.get(item.partyId)

            return (
              <li key={item.memberId}>
                <PartyCard
                  party={toCardParty(
                    item,
                    item.isHost ? name : (owner?.display_name ?? 'ไม่ระบุชื่อ'),
                    item.isHost ? profile.avatar_url : (owner?.avatar_url ?? null),
                  )}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="m-4 rounded-3xl border border-dashed border-line px-4 py-8 text-center text-sm leading-6 text-muted">
          {TABS.find((item) => item.value === tab).empty}
        </p>
      )}
    </main>
  )
}
