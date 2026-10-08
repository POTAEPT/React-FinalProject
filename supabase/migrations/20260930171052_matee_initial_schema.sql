-- MaTee (เธกเธฒเธ•เธตเนเธเธฑเธ) โ€” Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.
-- Login and register use Supabase Auth (auth.users). This file does not create a users table.
-- The last section schedules the nightly chat purge with pg_cron; see the note there.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.party_category as enum (
  'sport',       -- เธเธตเธฌเธฒ
  'board_game',  -- เธเธญเธฃเนเธ”เน€เธเธก
  'study',       -- เธ•เธดเธงเธชเธญเธ
  'cafe',        -- เธเธฒเน€เธเน
  'other'        -- เธญเธทเนเธเน (custom_category holds the label)
);

-- Party lifecycle. Only what the host can set.
-- "Full" is not stored: it is confirmed_count >= max_members.
-- "Started" and "Finished" are derived from event_date, event_time and duration_minutes.
create type public.party_status as enum (
  'open',
  'cancelled'
);

-- How people get in.
create type public.party_join_mode as enum (
  'public',   -- Join inserts the member as confirmed at once
  'approve'   -- Request inserts as pending; the host confirms or rejects
);

-- Global account role. Set by hand in the Supabase table editor; there is no UI to promote.
create type public.user_role as enum (
  'user',
  'admin'
);

-- Stage of one person in a party. This is what the approve page reads and writes.
create type public.member_status as enum (
  'pending',    -- เธเธญเน€เธเนเธฒ เธฃเธญเน€เธเนเธฒเธเธญเธเธ•เธตเนเธขเธทเธเธขเธฑเธ
  'confirmed',  -- เธขเธทเธเธขเธฑเธเนเธฅเนเธง เธเธฑเธเธฃเธงเธกเนเธเธเธณเธเธงเธเธเธ
  'rejected',   -- เน€เธเนเธฒเธเธญเธเธ•เธตเนเธเธเธดเน€เธชเธ
  'cancelled'   -- เธเธนเนเนเธเนเธขเธเน€เธฅเธดเธเน€เธญเธ เธซเธฃเธทเธญเธญเธญเธเธเธฒเธเธ•เธตเน
);

-- ---------------------------------------------------------------------------
-- Profiles (register, login, avatar, role, ban)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
  role public.user_role not null default 'user',
  banned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Current user is an admin. Security definer so policies can call it without
-- depending on the caller's own view of profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Current user is banned. Every write policy for normal users checks "not is_banned()"
-- so a stale session cannot write after an admin sets banned_at.
create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and banned_at is not null
  );
$$;

-- role and banned_at are moderation columns. A signed-in user cannot change role
-- (not even an admin; use the dashboard) and only an admin can change banned_at.
-- The dashboard and the service role have no auth.uid() and are not restricted.
create or replace function public.protect_profile_moderation_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'role is set in the Supabase dashboard';
  end if;

  if new.banned_at is distinct from old.banned_at and not public.is_admin() then
    raise exception 'Only an admin can ban or unban';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_moderation_columns
  before update on public.profiles
  for each row execute function public.protect_profile_moderation_columns();

-- ---------------------------------------------------------------------------
-- Party time helpers
-- event_date and event_time are wall-clock values the host typed in Thailand,
-- so date + time is read as Asia/Bangkok when turned into an instant.
-- start = event_date + event_time; end = start + duration_minutes.
-- Both are immutable so they can be used in indexes and policies.
-- ---------------------------------------------------------------------------

create or replace function public.party_start_at(event_date date, event_time time)
returns timestamptz
language sql
immutable
as $$
  select (event_date + event_time) at time zone 'Asia/Bangkok';
$$;

create or replace function public.party_end_at(event_date date, event_time time, duration_minutes integer)
returns timestamptz
language sql
immutable
as $$
  select public.party_start_at(event_date, event_time) + make_interval(mins => duration_minutes);
$$;

-- ---------------------------------------------------------------------------
-- Parties
-- ---------------------------------------------------------------------------

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category public.party_category not null,
  -- Label shown in place of the category when category = 'other'.
  custom_category text check (custom_category is null or char_length(custom_category) between 1 and 30),
  join_mode public.party_join_mode not null default 'approve',
  event_date date not null,
  event_time time not null,
  -- 30 minutes to 8 hours, in 30-minute steps. End time = start + duration.
  duration_minutes integer not null default 120
    check (duration_minutes between 30 and 480 and duration_minutes % 30 = 0),
  location text not null check (char_length(location) between 1 and 120),
  max_members integer not null check (max_members between 2 and 30),
  -- Denormalised headcount (status = confirmed, includes the host).
  -- Maintained by the trigger on party_members; clients cannot write it.
  confirmed_count integer not null default 0 check (confirmed_count >= 0),
  detail text not null default '' check (char_length(detail) <= 1000),
  status public.party_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- custom_category is present exactly when the category is 'other'.
  check ((category = 'other') = (custom_category is not null))
);

create index parties_feed_idx
  on public.parties (status, created_at desc);

create index parties_category_idx
  on public.parties (category, status, event_date);

create index parties_owner_idx
  on public.parties (owner_id);

-- Guards on updates to a party:
--  * confirmed_count can only change from refresh_party_confirmed_count() (it sets
--    the matee.refreshing_counts flag for the duration of its own update).
--  * Cancel is one-way: a cancelled party never goes back to open.
create or replace function public.protect_party_row()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.confirmed_count is distinct from old.confirmed_count
     and current_setting('matee.refreshing_counts', true) is distinct from 'on' then
    raise exception 'confirmed_count is maintained by a trigger';
  end if;

  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'A cancelled party stays cancelled';
  end if;

  return new;
end;
$$;

create trigger parties_protect_row
  before update on public.parties
  for each row execute function public.protect_party_row();

-- ---------------------------------------------------------------------------
-- Members: headcount stage, confirm, cancel, leave
-- The owner is inserted as confirmed when the party is created and stays confirmed.
-- Public party: others are inserted as confirmed. Approve party: as pending until the
-- owner approves. Leaving sets the row to cancelled; joining again reuses the same row.
-- current members = count of rows with status = confirmed (includes the owner).
-- ---------------------------------------------------------------------------

create table public.party_members (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.member_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (party_id, user_id)
);

create index party_members_party_status_idx
  on public.party_members (party_id, status);

create index party_members_user_idx
  on public.party_members (user_id, status);

create or replace function public.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.party_members (party_id, user_id, status)
  values (new.id, new.owner_id, 'confirmed');
  return new;
end;
$$;

create trigger parties_add_owner
  after insert on public.parties
  for each row execute function public.add_owner_as_member();

create or replace function public.enforce_party_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  cap integer;
  taken integer;
begin
  if exists (
    select 1
    from public.parties
    where id = new.party_id
      and owner_id = new.user_id
  ) and new.status <> 'confirmed' then
    raise exception 'The host stays confirmed';
  end if;

  if new.status <> 'confirmed' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'confirmed' then
    return new;
  end if;

  select max_members into cap
  from public.parties
  where id = new.party_id;

  select count(*) into taken
  from public.party_members
  where party_id = new.party_id
    and status = 'confirmed'
    and id <> new.id;

  if taken + 1 > cap then
    raise exception 'Party is full';
  end if;

  return new;
end;
$$;

create trigger party_members_capacity
  before insert or update of status on public.party_members
  for each row execute function public.enforce_party_capacity();

-- Keep parties.confirmed_count in sync. Runs after every member change and rewrites
-- the count only when it actually changed, so parties.updated_at is left alone
-- (updated_at marks a host or admin edit; the cancel chat expiry depends on that).
create or replace function public.refresh_party_confirmed_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected uuid[];
begin
  if tg_op = 'INSERT' then
    affected := array[new.party_id];
  elsif tg_op = 'DELETE' then
    affected := array[old.party_id];
  else
    affected := array[new.party_id, old.party_id];
  end if;

  perform set_config('matee.refreshing_counts', 'on', true);

  update public.parties p
  set confirmed_count = counts.n
  from (
    select x.party_id,
           (
             select count(*)
             from public.party_members m
             where m.party_id = x.party_id
               and m.status = 'confirmed'
           ) as n
    from unnest(affected) as x (party_id)
  ) counts
  where p.id = counts.party_id
    and p.confirmed_count is distinct from counts.n;

  perform set_config('matee.refreshing_counts', 'off', true);

  return null;
end;
$$;

create trigger party_members_refresh_confirmed_count
  after insert or update or delete on public.party_members
  for each row execute function public.refresh_party_confirmed_count();

-- Current user is pending or confirmed in the party. This is who can read and send chat.
create or replace function public.is_active_member(p_party uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.party_members
    where party_id = p_party
      and user_id = auth.uid()
      and status in ('pending', 'confirmed')
  );
$$;

-- Can the current user enter p_party with member status p_status right now?
-- Shared by the join (insert) and rejoin (update) policies:
-- not the host, party open, not started yet, and the status matches the join mode
-- (confirmed for a public party, pending for an approve party).
create or replace function public.join_allowed(p_party uuid, p_status public.member_status)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.parties p
    where p.id = p_party
      and p.owner_id <> auth.uid()
      and p.status = 'open'
      and public.party_start_at(p.event_date, p.event_time) > now()
      and p_status = case p.join_mode
        when 'public' then 'confirmed'::public.member_status
        else 'pending'::public.member_status
      end
  );
$$;

-- ---------------------------------------------------------------------------
-- Time conflicts
-- A user cannot join, request, or create a party whose [start, end) overlaps a
-- party where they already have an active commitment: a pending or confirmed row
-- (the host row is confirmed, so hosted parties count) on an open party whose end
-- is in the future. Touching intervals (end == start) do not conflict.
-- ---------------------------------------------------------------------------

-- Runs with the caller's rights, so the app can call it for the signed-in user
-- (a user always sees their own party_members rows). The triggers below call it
-- as security definer so the check is complete even when the host moves someone
-- else's row (rejected -> confirmed).
create or replace function public.has_time_conflict(
  p_user uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_exclude_party uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.party_members m
    join public.parties p on p.id = m.party_id
    where m.user_id = p_user
      and m.status in ('pending', 'confirmed')
      and p.status = 'open'
      and public.party_end_at(p.event_date, p.event_time, p.duration_minutes) > now()
      and (p_exclude_party is null or p.id <> p_exclude_party)
      -- overlap: a.start < b.end and b.start < a.end
      and public.party_start_at(p.event_date, p.event_time) < p_end
      and p_start < public.party_end_at(p.event_date, p.event_time, p.duration_minutes)
  );
$$;

-- Convenience for the app: would p_user conflict if they joined p_party?
create or replace function public.has_time_conflict(p_user uuid, p_party uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select public.has_time_conflict(
    p_user,
    public.party_start_at(p.event_date, p.event_time),
    public.party_end_at(p.event_date, p.event_time, p.duration_minutes),
    p.id
  )
  from public.parties p
  where p.id = p_party;
$$;

-- Joining, requesting, or rejoining. A row that is already active (pending or
-- confirmed) is not re-checked, so the host approving a request never trips this.
create or replace function public.enforce_member_time_conflict()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.parties%rowtype;
begin
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status in ('pending', 'confirmed') then
    return new;
  end if;

  select * into p
  from public.parties
  where id = new.party_id;

  -- The party being joined is excluded, so the host row added by parties_add_owner
  -- does not collide with its own party.
  if public.has_time_conflict(
    new.user_id,
    public.party_start_at(p.event_date, p.event_time),
    public.party_end_at(p.event_date, p.event_time, p.duration_minutes),
    new.party_id
  ) then
    raise exception 'Time conflict';
  end if;

  return new;
end;
$$;

create trigger party_members_time_conflict
  before insert or update of status on public.party_members
  for each row execute function public.enforce_member_time_conflict();

-- Creating a party on top of the host's own commitments.
create or replace function public.enforce_party_time_conflict()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_time_conflict(
    new.owner_id,
    public.party_start_at(new.event_date, new.event_time),
    public.party_end_at(new.event_date, new.event_time, new.duration_minutes),
    null
  ) then
    raise exception 'Time conflict';
  end if;

  return new;
end;
$$;

create trigger parties_time_conflict
  before insert on public.parties
  for each row execute function public.enforce_party_time_conflict();

-- ---------------------------------------------------------------------------
-- Skips (hide a card from the feed) and party chat
-- ---------------------------------------------------------------------------

create table public.skips (
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

create index skips_user_idx on public.skips (user_id);

-- Live chat on /party/[id]. Readable and writable only by pending or confirmed members.
create table public.party_messages (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index party_messages_party_idx
  on public.party_messages (party_id, created_at);

-- ---------------------------------------------------------------------------
-- Chat expiry
-- A chat lives 7 days after the party ends, or 7 days after the host cancelled it
-- (parties.updated_at is set when status became cancelled and is not bumped by
-- headcount changes). The insert policy refuses messages after this moment and
-- the nightly job deletes the rows.
-- ---------------------------------------------------------------------------

create or replace function public.chat_expires_at(p public.parties)
returns timestamptz
language sql
immutable
as $$
  select case
    when p.status = 'cancelled' then p.updated_at + interval '7 days'
    else public.party_end_at(p.event_date, p.event_time, p.duration_minutes) + interval '7 days'
  end;
$$;

-- Deletes every message whose chat has expired. Returns the number of rows removed.
-- Permanent; there is no export. Only the scheduler (postgres) may call it.
create or replace function public.purge_expired_chats()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.party_messages m
  using public.parties p
  where m.party_id = p.id
    and public.chat_expires_at(p) <= now();

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function public.purge_expired_chats() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Counts used by home, detail (3/4), and manage party
-- current_members and is_full come from parties.confirmed_count; the other counts
-- respect RLS, so pending_count is only complete for the owner.
-- ---------------------------------------------------------------------------

create or replace view public.party_counts
with (security_invoker = true) as
select
  p.id as party_id,
  p.max_members,
  p.confirmed_count as current_members,
  count(m.id) filter (where m.status = 'pending') as pending_count,
  count(m.id) filter (where m.status = 'rejected') as rejected_count,
  count(m.id) filter (where m.status = 'cancelled') as cancelled_count,
  p.confirmed_count >= p.max_members as is_full
from public.parties p
left join public.party_members m on m.party_id = p.id
group by p.id;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Skipped when only confirmed_count changes (headcount refresh), so updated_at
-- still means "the host or an admin edited the party" (used by chat_expires_at).
create trigger parties_updated_at
  before update on public.parties
  for each row
  when (old.confirmed_count is not distinct from new.confirmed_count)
  execute function public.set_updated_at();

create trigger party_members_updated_at
  before update on public.party_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Permissive policies are OR-ed per command. For update, the USING clauses are
-- OR-ed together and the WITH CHECK clauses are OR-ed together, so each member
-- policy below is written so that no cross-combination opens an unwanted move
-- (for example, a rejected row is not matched by any member USING clause).
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.skips enable row level security;
alter table public.party_messages enable row level security;

-- profiles ------------------------------------------------------------------

create policy "profiles are public"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and not public.is_banned());

create policy "admins update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- parties -------------------------------------------------------------------

-- Admins are covered by this too. Banned hosts' parties are filtered by the app feed query.
create policy "parties are public"
  on public.parties for select
  to anon, authenticated
  using (true);

create policy "users create their own parties"
  on public.parties for insert
  to authenticated
  with check (owner_id = auth.uid() and not public.is_banned());

create policy "owners update their parties"
  on public.parties for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and not public.is_banned());

create policy "owners delete their parties"
  on public.parties for delete
  to authenticated
  using (owner_id = auth.uid() and not public.is_banned());

create policy "admins update any party"
  on public.parties for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete any party"
  on public.parties for delete
  to authenticated
  using (public.is_admin());

-- party_members -------------------------------------------------------------

create policy "confirmed members are public"
  on public.party_members for select
  to anon, authenticated
  using (status = 'confirmed');

create policy "users see their own request"
  on public.party_members for select
  to authenticated
  using (user_id = auth.uid());

create policy "owners see every request"
  on public.party_members for select
  to authenticated
  using (
    exists (
      select 1 from public.parties p
      where p.id = party_id and p.owner_id = auth.uid()
    )
  );

create policy "admins see every member row"
  on public.party_members for select
  to authenticated
  using (public.is_admin());

-- Join (public party -> confirmed) or request (approve party -> pending).
-- Capacity and time conflicts are enforced by the triggers above.
create policy "users request to join"
  on public.party_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not public.is_banned()
    and public.join_allowed(party_id, status)
  );

create policy "owner approves or rejects"
  on public.party_members for update
  to authenticated
  using (
    exists (
      select 1 from public.parties p
      where p.id = party_id and p.owner_id = auth.uid()
    )
  )
  with check (
    status in ('confirmed', 'rejected')
    and not public.is_banned()
    and exists (
      select 1 from public.parties p
      where p.id = party_id and p.owner_id = auth.uid()
    )
  );

-- Leave: a pending or confirmed member sets their own row to cancelled.
create policy "member cancels their own spot"
  on public.party_members for update
  to authenticated
  using (user_id = auth.uid() and status in ('pending', 'confirmed'))
  with check (user_id = auth.uid() and status = 'cancelled' and not public.is_banned());

-- Rejoin: a cancelled row goes back to the status the join mode dictates, under the
-- same conditions as a first join. A rejected row stays closed until the host changes it.
create policy "member rejoins after leaving"
  on public.party_members for update
  to authenticated
  using (user_id = auth.uid() and status = 'cancelled')
  with check (
    user_id = auth.uid()
    and not public.is_banned()
    and public.join_allowed(party_id, status)
  );

-- skips ---------------------------------------------------------------------

create policy "users read their skips"
  on public.skips for select
  to authenticated
  using (user_id = auth.uid());

create policy "users record a skip"
  on public.skips for insert
  to authenticated
  with check (user_id = auth.uid() and not public.is_banned());

-- party_messages ------------------------------------------------------------

create policy "active members and admins read chat"
  on public.party_messages for select
  to authenticated
  using (public.is_active_member(party_id) or public.is_admin());

create policy "active members send chat"
  on public.party_messages for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not public.is_banned()
    and public.is_active_member(party_id)
    and now() < (
      select public.chat_expires_at(p)
      from public.parties p
      where p.id = party_id
    )
  );

create policy "users delete their own message while in the party"
  on public.party_messages for delete
  to authenticated
  using (user_id = auth.uid() and public.is_active_member(party_id) and not public.is_banned());

create policy "owners delete any message in their party"
  on public.party_messages for delete
  to authenticated
  using (
    exists (
      select 1 from public.parties p
      where p.id = party_id and p.owner_id = auth.uid()
    )
  );

create policy "admins delete any message"
  on public.party_messages for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime
-- parties: live slot counts and cancel on the feed (readable by anon too).
-- party_messages: live chat; Realtime applies the select policy per subscriber.
-- party_members stays off Realtime.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.parties, public.party_messages;

-- ---------------------------------------------------------------------------
-- Avatar storage
-- Upload path: avatars/<user id>/<filename>
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) update
set file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "avatar images are public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "users upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users replace their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Scheduled jobs (pg_cron)
-- Kept last on purpose: everything above is already applied if this part fails.
-- If "create extension" errors, enable pg_cron in the Supabase dashboard
-- (Database > Extensions) and re-run these two statements.
-- Runs at 20:00 UTC = 03:00 Asia/Bangkok. Scheduling again with the same job
-- name replaces the existing job.
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('purge-expired-chats', '0 20 * * *', $$select public.purge_expired_chats()$$);
