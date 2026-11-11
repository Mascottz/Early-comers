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

-- ---------------------------------------------------------------------------
-- Sign-in: approved email + shared team password + personal six-digit PIN
-- ---------------------------------------------------------------------------
-- The shared team password lives only in the `TEAM_ACCESS_PASSWORD` edge
-- function secret. It is checked by `pin-auth`; the PIN is hashed here.

create table public.staff_pins (
  worker_id uuid primary key references public.staff_profiles(id) on delete cascade,
  pin_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table public.auth_throttle (
  key text primary key,
  failures integer not null default 0,
  window_start timestamptz not null default now(),
  blocked_until timestamptz
);

alter table public.staff_pins enable row level security;
alter table public.auth_throttle enable row level security;
revoke all on public.staff_pins from anon, authenticated;
revoke all on public.auth_throttle from anon, authenticated;

create or replace function public.set_my_pin(p_pin text)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_temp'
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if p_pin !~ '^[0-9]{6}$' then
    raise exception 'PIN must be exactly six digits';
  end if;
  if not public.is_active_staff() then
    raise exception 'Active staff only';
  end if;

  insert into public.staff_pins(worker_id, pin_hash, failed_attempts, locked_until, updated_at)
  values (auth.uid(), crypt(p_pin, gen_salt('bf', 10)), 0, null, now())
  on conflict (worker_id) do update
    set pin_hash = excluded.pin_hash,
        failed_attempts = 0,
        locked_until = null,
        updated_at = now();
  return true;
end;
$$;

create or replace function public.my_pin_status()
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select exists (
    select 1 from public.staff_pins where worker_id = auth.uid()
  );
$$;

-- Server-only. Called by the `pin-auth` edge function with the service role.
create or replace function public.verify_staff_pin(p_email text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_temp'
as $$
declare
  profile public.staff_profiles;
  stored public.staff_pins;
  next_failures integer;
begin
  select * into profile
  from public.staff_profiles
  where lower(email) = lower(trim(p_email)) and active = true;

  if profile.id is null then
    return jsonb_build_object('status', 'email_not_allowed');
  end if;

  select * into stored
  from public.staff_pins
  where worker_id = profile.id
  for update;

  if stored.worker_id is null then
    return jsonb_build_object('status', 'pin_not_set');
  end if;

  if stored.locked_until is not null and stored.locked_until > now() then
    return jsonb_build_object(
      'status', 'locked',
      'retry_after', ceil(extract(epoch from (stored.locked_until - now())))::int
    );
  end if;

  if stored.locked_until is not null then
    update public.staff_pins
    set failed_attempts = 0, locked_until = null
    where worker_id = profile.id;
    stored.failed_attempts := 0;
    stored.locked_until := null;
  end if;

  if stored.pin_hash = crypt(p_pin, stored.pin_hash) then
    update public.staff_pins
    set failed_attempts = 0, locked_until = null
    where worker_id = profile.id;
    return jsonb_build_object('status', 'ok');
  end if;

  next_failures := stored.failed_attempts + 1;
  if next_failures >= 5 then
    update public.staff_pins
    set failed_attempts = 0, locked_until = now() + interval '15 minutes'
    where worker_id = profile.id;
    return jsonb_build_object('status', 'locked', 'retry_after', 900);
  end if;

  update public.staff_pins
  set failed_attempts = next_failures
  where worker_id = profile.id;
  return jsonb_build_object('status', 'invalid', 'attempts_left', 5 - next_failures);
end;
$$;

-- Server-only throttle helpers. Called only by the `pin-auth` edge function.
create or replace function public.check_auth_throttle(p_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  throttle public.auth_throttle;
begin
  select * into throttle from public.auth_throttle where key = p_key;
  if throttle.key is null then
    return jsonb_build_object('blocked', false);
  end if;
  if throttle.blocked_until is not null and throttle.blocked_until > now() then
    return jsonb_build_object(
      'blocked', true,
      'retry_after', ceil(extract(epoch from (throttle.blocked_until - now())))::int
    );
  end if;
  return jsonb_build_object('blocked', false);
end;
$$;

create or replace function public.record_auth_failure(p_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  throttle public.auth_throttle;
  next_failures integer;
begin
  select * into throttle from public.auth_throttle where key = p_key for update;

  if throttle.key is null or throttle.window_start < now() - interval '15 minutes' then
    insert into public.auth_throttle(key, failures, window_start, blocked_until)
    values (p_key, 1, now(), null)
    on conflict (key) do update
      set failures = 1, window_start = now(), blocked_until = null;
    return jsonb_build_object('blocked', false, 'failures', 1);
  end if;

  next_failures := throttle.failures + 1;
  if next_failures >= 10 then
    update public.auth_throttle
    set failures = 0, window_start = now(), blocked_until = now() + interval '15 minutes'
    where key = p_key;
    return jsonb_build_object('blocked', true, 'retry_after', 900);
  end if;

  update public.auth_throttle set failures = next_failures where key = p_key;
  return jsonb_build_object('blocked', false, 'failures', next_failures);
end;
$$;

create or replace function public.clear_auth_failures(p_key text)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  delete from public.auth_throttle where key = p_key;
  return true;
end;
$$;

revoke all on function public.set_my_pin(text) from public, anon;
revoke all on function public.my_pin_status() from public, anon;
revoke all on function public.verify_staff_pin(text, text) from public, anon, authenticated;
revoke all on function public.check_auth_throttle(text) from public, anon, authenticated;
revoke all on function public.record_auth_failure(text) from public, anon, authenticated;
revoke all on function public.clear_auth_failures(text) from public, anon, authenticated;
grant execute on function public.set_my_pin(text) to authenticated, service_role;
grant execute on function public.my_pin_status() to authenticated, service_role;
grant execute on function public.verify_staff_pin(text, text) to service_role;
grant execute on function public.check_auth_throttle(text) to service_role;
grant execute on function public.record_auth_failure(text) to service_role;
grant execute on function public.clear_auth_failures(text) to service_role;
