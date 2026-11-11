-- Attendance by ProofsTech
-- Run this in the Supabase SQL editor before connecting the Elm client.

create extension if not exists pgcrypto;

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  nickname text not null,
  title text not null,
  initials text not null,
  color text not null default '#9aaf83',
  avatar integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_invites (
  email text primary key,
  full_name text not null,
  nickname text not null,
  title text not null,
  color text not null default '#9aaf83',
  avatar integer not null default 1,
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- This table has no authenticated read policy. Only trusted server code can read it.
create table public.admin_emails (
  email text primary key,
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.attendance_entries (
  id text primary key,
  worker_id uuid not null references public.staff_profiles(id) on delete cascade,
  occurred_at timestamptz not null,
  local_date date not null,
  local_time time not null,
  source text not null default 'Office QR',
  created_at timestamptz not null default now(),
  unique(worker_id, local_date)
);

create index attendance_wall_idx on public.attendance_entries(local_date, occurred_at);
create index attendance_worker_idx on public.attendance_entries(worker_id, local_date desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.staff_profiles
    where id = auth.uid() and active = true
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_active_staff() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_staff() to authenticated;

create or replace function public.create_profile_for_invited_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.staff_invites;
begin
  select * into invite from public.staff_invites where lower(email) = lower(new.email);
  if invite.email is null then
    raise exception 'This email has not been invited by ProofsTech';
  end if;

  insert into public.staff_profiles(id, email, full_name, nickname, title, initials, color, avatar)
  values (
    new.id,
    lower(new.email),
    invite.full_name,
    invite.nickname,
    invite.title,
    upper(left(split_part(invite.full_name, ' ', 1), 1) || left(coalesce(nullif(split_part(invite.full_name, ' ', 2), ''), ''), 1)),
    invite.color, invite.avatar
  );

  update public.staff_invites set accepted_at = now() where email = invite.email;
  return new;
end;
$$;

create trigger on_invited_user_created
after insert on auth.users
for each row execute function public.create_profile_for_invited_user();

alter table public.staff_profiles enable row level security;
alter table public.staff_invites enable row level security;
alter table public.admin_emails enable row level security;
alter table public.attendance_entries enable row level security;

create policy "Active staff can read team profiles"
on public.staff_profiles for select
to authenticated
using (public.is_active_staff());

create policy "Admins can update staff profiles"
on public.staff_profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read staff invites"
on public.staff_invites for select
to authenticated
using (public.is_admin());

create policy "Admins can create staff invites"
on public.staff_invites for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update staff invites"
on public.staff_invites for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Active staff can read the daily wall"
on public.attendance_entries for select
to authenticated
using (public.is_active_staff());

create policy "Workers can check themselves in"
on public.attendance_entries for insert
to authenticated
with check (
  public.is_active_staff()
  and worker_id = auth.uid()
);

create policy "Admins can correct attendance"
on public.attendance_entries for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can remove attendance"
on public.attendance_entries for delete
to authenticated
using (public.is_admin());

revoke all on public.admin_emails from anon, authenticated;
revoke insert, delete on public.staff_profiles from anon, authenticated;
revoke update on public.staff_profiles from anon;
revoke all on public.staff_invites from anon;
revoke all on public.attendance_entries from anon;

-- Add each approved admin email with a trusted SQL or service role session.
-- Example:
-- insert into public.admin_emails(email) values ('admin@yourcompany.com');

-- Enable the shared wall as a realtime publication if it is not already enabled.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'attendance_entries'
  ) then
    alter publication supabase_realtime add table public.attendance_entries;
  end if;
end;
$$;
