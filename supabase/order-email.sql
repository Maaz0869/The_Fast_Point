-- ===========================================================================
-- The Snack Hut — email every new order to the shop, from the database itself.
--
-- OPTIONAL. Checkout already calls /api/order-email the moment an order is
-- stored, which covers the normal case. This adds a database-side trigger so
-- the email still goes out when the browser never got the chance — the customer
-- closed the tab, lost signal, or the order was created from the admin panel.
--
-- Running both is safe: /api/order-email claims each order with
--   UPDATE ... WHERE emailed_at IS NULL
-- so exactly one caller can ever win, and the shop gets exactly one email.
--
-- BEFORE RUNNING, replace the two placeholders below:
--   YOUR-SITE       your deployed domain, e.g. thesnackhut.vercel.app
--   YOUR-SECRET     any long random string — put the SAME value in Vercel as
--                   the ORDER_EMAIL_SECRET environment variable
--
-- Then: Supabase dashboard → SQL Editor → New query → Run. Idempotent.
-- ===========================================================================

-- pg_net posts the request in the background, so the customer's checkout is
-- never held up waiting for an HTTP call.
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_order_email()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
begin
  -- Only the id travels: the API function reads the real order back with the
  -- service role, so the email can't be fed made-up amounts.
  perform net.http_post(
    url     := 'https://YOUR-SITE/api/order-email',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-order-email-secret', 'YOUR-SECRET'
               ),
    body    := jsonb_build_object('record', jsonb_build_object('id', new.id))
  );
  return new;
exception
  when others then
    -- An unreachable endpoint must never stop an order being placed. The order
    -- is what matters; the email is a convenience.
    return new;
end;
$$;

drop trigger if exists orders_email_on_insert on public.orders;
create trigger orders_email_on_insert
  after insert on public.orders
  for each row execute function public.notify_order_email();


-- ---------------------------------------------------------------------------
-- Handy checks
-- ---------------------------------------------------------------------------
-- Which orders have been emailed?
--   select id, created_at, emailed_at from public.orders order by created_at desc limit 20;
--
-- What did pg_net actually get back? (Supabase keeps a short response log.)
--   select id, status_code, content from net._http_response order by id desc limit 10;
--
-- Re-send one order (clears the claim, then insert-trigger or a manual POST):
--   update public.orders set emailed_at = null where id = 'ORDER-ID';
