-- MaTee (มาตี้กัน) — Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.
-- Login and register use Supabase Auth (auth.users). This file does not create a users table.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.party_category as enum (
  'sport',       -- กีฬา
  'board_game',  -- บอร์ดเกม
  'study',       -- ติวสอบ
  'cafe',        -- คาเฟ่
  'other'        -- อื่นๆ
);

-- Party lifecycle. "Full" is not stored: it is current confirmed count >= max_members.
create type public.party_status as enum (
  'open',
  'cancelled',
  'completed'
);

-- Stage of one person in a party. This is what the approve page reads and writes.
create type public.member_status as enum (
  'pending',    -- ขอเข้า รอเจ้าของตี้ยืนยัน
  'confirmed',  -- ยืนยันแล้ว นับรวมในจำนวนคน
  'rejected',   -- เจ้าของตี้ปฏิเสธ
  'cancelled'   -- ผู้ใช้ยกเลิกเอง หรือออกจากตี้
);

-- ---------------------------------------------------------------------------
-- Profiles (register, login, avatar)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
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

-- ---------------------------------------------------------------------------
-- Parties
-- ---------------------------------------------------------------------------

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category public.party_category not null,
  event_date date not null,
  event_time time not null,
  location text not null check (char_length(location) between 1 and 120),
  max_members integer not null check (max_members between 2 and 30),
  detail text not null default '' check (char_length(detail) <= 1000),
  status public.party_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index parties_feed_idx
  on public.parties (status, created_at desc);

create index parties_category_idx
  on public.parties (category, status, event_date);

create index parties_owner_idx
  on public.parties (owner_id);

-- ---------------------------------------------------------------------------
-- Members: headcount stage, confirm, cancel
-- The owner is inserted as confirmed when the party is created.
-- Everyone else starts as pending until the owner approves them.
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
  confirmed_count integer;
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

  select count(*) into confirmed_count
  from public.party_members
  where party_id = new.party_id
    and status = 'confirmed'
    and id <> new.id;

  if confirmed_count + 1 > cap then
    raise exception 'Party is full';
  end if;

  return new;
end;
$$;

create trigger party_members_capacity
  before insert or update of status on public.party_members
  for each row execute function public.enforce_party_capacity();

-- ---------------------------------------------------------------------------
-- Skips (swipe left) and comments
-- ---------------------------------------------------------------------------

create table public.skips (
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

create index skips_user_idx on public.skips (user_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_party_idx
  on public.comments (party_id, created_at);

-- ---------------------------------------------------------------------------
-- Counts used by home, detail (3/4), and manage party
-- ---------------------------------------------------------------------------

create or replace view public.party_counts
with (security_invoker = true) as
select
  p.id as party_id,
  p.max_members,
  count(*) filter (where m.status = 'confirmed') as current_members,
  count(*) filter (where m.status = 'pending') as pending_count,
  count(*) filter (where m.status = 'rejected') as rejected_count,
  count(*) filter (where m.status = 'cancelled') as cancelled_count,
  count(*) filter (where m.status = 'confirmed') >= p.max_members as is_full
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

create trigger parties_updated_at
  before update on public.parties
  for each row execute function public.set_updated_at();

create trigger party_members_updated_at
  before update on public.party_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.skips enable row level security;
alter table public.comments enable row level security;

create policy "profiles are public"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "parties are public"
  on public.parties for select
  to anon, authenticated
  using (true);

create policy "users create their own parties"
  on public.parties for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owners update their parties"
  on public.parties for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners delete their parties"
  on public.parties for delete
  to authenticated
  using (owner_id = auth.uid());

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

create policy "users request to join"
  on public.party_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.parties p
      where p.id = party_id
        and p.owner_id <> auth.uid()
        and p.status = 'open'
    )
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
    exists (
      select 1 from public.parties p
      where p.id = party_id and p.owner_id = auth.uid()
    )
  );

create policy "member can cancel their own spot"
  on public.party_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'cancelled');

create policy "users read their skips"
  on public.skips for select
  to authenticated
  using (user_id = auth.uid());

create policy "users record a skip"
  on public.skips for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "comments are public"
  on public.comments for select
  to anon, authenticated
  using (true);

create policy "users comment while signed in"
  on public.comments for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users delete their own comments"
  on public.comments for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Avatar storage
-- Upload path: avatars/<user id>/<filename>
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

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
