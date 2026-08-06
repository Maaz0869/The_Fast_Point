-- ===========================================================================
-- The Snack Hut — customer accounts, personal coupons & order history
--
-- Run this ONCE in the Supabase dashboard → SQL Editor → New query → Run.
-- Everything here is idempotent, so running it twice is harmless.
--
-- It adds:
--   1. public.profiles            — the customer's saved name / phone / address
--   2. orders.user_id             — links an order to the account that placed it
--   3. discounts.user_id + limits — personal coupons with expiry and use limits
--   4. redeem_discount(text)      — counts a coupon as used after checkout
--   5. read policies for the `authenticated` role, so a signed-in customer can
--      still see the catalogue (the old policies only covered `anon`)
--
-- AFTER running it, turn sign-ups on:
--   Authentication → Sign In / Providers → Email
--     • "Allow new users to sign up"  → ON      (required)
--     • "Confirm email"               → OFF     (recommended: the free built-in
--       mailer only sends a couple of messages an hour, so leaving confirmation
--       on will block real customers. With it off, sign-up logs them straight in.)
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Customer profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  name       text,
  phone      text,
  address    text,
  area_id    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A customer sees and edits exactly one row: their own.
drop policy if exists profiles_own_select on public.profiles;
create policy profiles_own_select on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_own_insert on public.profiles;
create policy profiles_own_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- The shop owner reads them all (the admin "Customers" page).
drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select on public.profiles
  for select to authenticated using (public.is_admin());

-- Every new sign-up gets a profile row, seeded from the name/phone typed on the
-- sign-up form (supabase-js sends those as user metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before this script ran (including the admin).
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;


-- ---------------------------------------------------------------------------
-- 2. Link orders to accounts
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists orders_user_id_idx on public.orders (user_id);

-- `place_order` is a security-definer function, so we can't rely on a column
-- default being applied by it. A BEFORE INSERT trigger stamps the caller's id
-- whichever way the row arrives — and stays null for a guest checkout.
create or replace function public.set_order_user()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_set_user on public.orders;
create trigger orders_set_user
  before insert on public.orders
  for each row execute function public.set_order_user();

-- A signed-in customer may read their own orders (and nobody else's).
drop policy if exists orders_own_select on public.orders;
create policy orders_own_select on public.orders
  for select to authenticated using (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 3. Personal coupons
--    user_id null  = public promo code, visible to everyone (as before)
--    user_id set   = private coupon, only that customer can see or use it
-- ---------------------------------------------------------------------------
alter table public.discounts
  add column if not exists user_id    uuid references auth.users (id) on delete cascade,
  add column if not exists expires_at timestamptz,
  add column if not exists max_uses   integer,
  add column if not exists used_count integer not null default 0;

create index if not exists discounts_user_id_idx on public.discounts (user_id);

-- Replace every policy on `discounts`: the old "anyone can read" rule would
-- have exposed one customer's private coupon codes to everybody.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'discounts'
  loop
    execute format('drop policy %I on public.discounts', pol.policyname);
  end loop;
end;
$$;

create policy discounts_public_select on public.discounts
  for select to anon, authenticated using (user_id is null);

create policy discounts_own_select on public.discounts
  for select to authenticated using (user_id = auth.uid());

create policy discounts_admin_all on public.discounts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------------
-- 4. Counting a coupon as used
--    Customers have no write access to `discounts`, so checkout calls this
--    definer function instead. It can only ever touch a code the caller is
--    actually allowed to use.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_discount(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.discounts
     set used_count = coalesce(used_count, 0) + 1
   where upper(code) = upper(trim(p_code))
     and (user_id is null or user_id = auth.uid());
end;
$$;

revoke all on function public.redeem_discount(text) from public;
grant execute on function public.redeem_discount(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 5. Keep the site working for signed-in visitors
--    The original policies were written for `anon`. Once a customer signs in
--    their role becomes `authenticated`, so the catalogue needs to be readable
--    for that role too. These are additive (permissive) policies on tables that
--    are already world-readable.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select unnest(array['menu_items', 'deals', 'slides', 'settings'])
  loop
    execute format('drop policy if exists %I on public.%I', t || '_read_all', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_read_all', t
    );
  end loop;
end;
$$;

-- Contact form, same length bounds as the anon policy.
drop policy if exists contact_messages_insert_auth on public.contact_messages;
create policy contact_messages_insert_auth on public.contact_messages
  for insert to authenticated
  with check (
    char_length(coalesce(name, '')) between 1 and 120
    and char_length(coalesce(email, '')) between 3 and 200
    and char_length(coalesce(message, '')) between 1 and 4000
  );

-- And make sure a signed-in customer can still place and track an order.
do $$
declare fn record;
begin
  for fn in
    select oid::regprocedure as sig from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in ('place_order', 'track_order', 'is_admin')
  loop
    execute format('grant execute on function %s to anon, authenticated', fn.sig);
  end loop;
end;
$$;
