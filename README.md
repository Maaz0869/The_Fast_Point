# The Snack Hut 🍔

A modern, fully responsive fast-food ordering website built with **React**, **React Router**, and **Tailwind CSS**. It pairs a polished customer storefront with a full admin panel, backed by **Supabase** — Postgres for the data, Supabase Auth for the admin login, and Supabase Storage for uploaded images.

## ✨ Features

### Customer Side
- **Home** — auto-playing hero slider (admin-managed), category browser, best sellers, hot deals, and a WhatsApp order CTA.
- **Menu** — items grouped by category, live search, and per-item customization (extras + spice level that adjust the price).
- **Deals & Offers** — dedicated combos page with a live discount/offer banner.
- **Cart & Checkout** — quantity controls, order type (Delivery / Take Away / Dine-in), customer details, **live delivery-fee calculation** from admin rules, discount codes, and payment method selection.
- **Order Confirmation** — generated order number and full summary.
- **Order Tracking** — enter an order number to see live status (Pending → Preparing → Out for Delivery → Delivered). Served by a `track_order` database function that returns the status only, so no customer's details are ever readable from the browser.
- **Contact form** — messages are stored in Supabase and land in the admin inbox.
- **Open/Closed status** — ordering is disabled when the restaurant is toggled closed.
- **WhatsApp ordering** — opens WhatsApp with the order pre-filled.

### Customer Accounts (`/signup`, `/login`, `/account`)
Customers can create an account with **Supabase Auth** (email + password) and get
their own dashboard at `/account`:

- **Overview** — orders placed, total spent, coupons waiting, member since.
- **My Orders** — full history with items and totals, **Order Again** (rebuilds
  the cart at today's prices), invoice download and a link to tracking.
- **My Coupons** — the private coupons the shop has issued to them, with expiry
  and uses-left, plus the public promo codes.
- **Profile** — saved name / phone / address / usual delivery area, and a
  password change.

Signing in also improves checkout: details are filled in automatically, usable
coupons show as one-tap chips, and the order is linked to the account. Guest
checkout still works exactly as before — nothing is forced.

**Where a customer finds sign-up** — the navbar button (and the mobile menu), a
benefits block on the home page, a one-line strip on the cart and deals pages, a
prompt on checkout, and *My Account* in the footer. All of them carry the current
page along, so the customer lands back where they were afterwards, and they all
hide themselves once signed in (`src/components/JoinCta.jsx`).

> Ordering is never gated behind an account.

### Admin Panel (`/admin`)
Sign in with the **Supabase Auth** email + password of a user listed in the
`admins` table (see *Admin access* below). Public sign-ups are disabled, so an
account can only be created from the Supabase dashboard.

- Dashboard with revenue, order and menu stats
- **Customers** — every registered account with their orders, total spent and
  last order, plus two ways to hand out private discount codes (percentage or
  flat, minimum order, expiry, use limit):
  - **Give Coupon** — one code for one customer
  - **Coupon for Everyone** — one *unique* code per customer in a single batch,
    optionally skipping anyone who already has a live one. Because each code is
    tied to an account, a code passed on to a friend won't work for them.
- **Messages** — inbox for contact-form submissions (unread badge, mark read, reply by email)
- Manage **menu items** (add / edit / delete), with image upload to Supabase Storage
- Manage **deals & offers** and the offer banner
- Manage **discount codes**
- **WhatsApp Blast** — write an offer once and send it to every customer on
  WhatsApp, personalised per person. Optionally attach a private coupon (minted
  only when that customer is actually messaged), an existing public code, or no
  code at all. Includes guest customers (anyone who has ordered by phone),
  live preview, per-recipient progress, and copy tools for broadcast lists.

  **Attach a deal**, and the message carries its name, price and description —
  and every message ends with a link that lands the customer on the thing they
  were told about, not just the homepage:

  | What's attached | Where the link goes |
  | --- | --- |
  | A deal | `/deals?deal=<id>&code=<CODE>` — that deal, highlighted and scrolled to |
  | A coupon only | `/menu?code=<CODE>` |
  | Neither | the homepage |

  The code in the link is remembered for the visit (`sessionStorage`, see
  `src/utils/promoLink.js`) and **applies itself at checkout** — so the customer
  never retypes a code the shop already sent them. If the cart is below the
  coupon's minimum it simply waits and applies once the cart qualifies.

  Two ways to send, and the screen shows whichever is available:

  - **Send to all at once** — one click, no tapping, via the official WhatsApp
    Cloud API. Needs the one-time setup below.
  - **One tap per customer** — always available, free, no setup: each chat opens
    with the message ready and the admin presses send. Progress is tracked so
    nobody is messaged twice.

### 📧 Order emails (optional)
Every new order can also land in the shop's inbox, automatically — a backup for
WhatsApp, and a searchable record. Formatted HTML: order number, customer with a
tap-to-call phone link, the full item list and the totals.

1. Sign up at [resend.com](https://resend.com) **using the address you want the
   orders sent to** — then the default sender works right away, with no domain
   or DNS setup. Copy the API key.
2. In **Vercel → Settings → Environment Variables** add `RESEND_API_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API). Optionally
   `ORDER_EMAIL_TO` (defaults to `thesnackhut001@gmail.com`, comma-separate for
   several) and `ORDER_EMAIL_FROM`. Redeploy. See `.env.example`.

That's it — checkout calls `/api/order-email` as soon as the order is stored.

**Want it even when the browser can't help** (tab closed, signal lost, order
created from the admin panel)? Run `supabase/order-email.sql` to add a database
trigger that posts the same request. Both paths can be on at once: the function
claims each order with `UPDATE … WHERE emailed_at IS NULL`, so only one caller
ever wins and the shop gets exactly one email.

> The browser only ever sends an order **id**. The function reads the order back
> with the service role, so the amounts in the email come from the database —
> they can't be forged by a tampered client. Ids older than 30 minutes are
> ignored, so nobody can walk the table re-mailing old orders.

### 📣 One-click WhatsApp sending (optional)
WhatsApp does not let a website message arbitrary numbers unattended — that is a
platform rule, not a limitation here (and CallMeBot, used for order alerts, only
delivers to the shop's *own* number). Unattended sending needs Meta's official
**WhatsApp Business Cloud API**:

1. Create a **Meta Business** account and a **WhatsApp Business** account (free).
2. Add a sender phone number and copy its **Phone number ID**.
3. Create a **permanent access token** for a system user with `whatsapp_business_messaging`.
4. In **Vercel → Settings → Environment Variables** add `WHATSAPP_TOKEN` and
   `WHATSAPP_PHONE_ID` (optionally `WHATSAPP_TEMPLATE`, `WHATSAPP_LANGUAGE`),
   then redeploy. See `.env.example`.
5. Get one **marketing template** approved. Its body must use the variables in
   this order: `{{1}}` customer's first name, `{{2}}` the offer text (an attached
   deal is folded in here, since template variables must be single-line), `{{3}}`
   the coupon code, `{{4}}` the promo link. Enter the template's name on the
   WhatsApp Blast screen.

> Meta charges per marketing message, and a template is required for anyone who
> hasn't messaged the shop in the last 24 hours. The screen also offers plain-text
> mode, which only reaches people inside that 24-hour window — handy for testing
> on your own number.

The token is read only by the serverless function in `api/whatsapp-broadcast.js`
(no `VITE_` prefix, so it is never bundled into the browser), and that function
authorises the caller with the same `is_admin()` check the database uses — a
signed-in customer calling it directly gets a 403.
- Manage the **hero slider**
- Set **delivery charge rules** (free-above threshold + tiered charges) with a live preview
- **Settings** — restaurant info, opening hours, and open/close toggle
- View all **orders** and update their status

## 🛠️ Tech Stack
- React 18 + React Router 6
- Tailwind CSS 3
- Vite 5
- **Supabase** (Postgres) backend — menu, deals, orders, finance & settings
- State via React Context (cart, auth, store data, toasts)

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build
```

### Environment variables
The app connects to Supabase. The project URL + anon key have safe defaults
baked into `src/lib/supabase.js`, so it runs with no config. To point it at a
different Supabase project, copy `.env.example` → `.env` and set:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Only the **anon** key belongs in the browser/env — never the `service_role`
> key or a `sbp_` management token.

## ▲ Deploy to Vercel
The repo is Vercel-ready. `vercel.json` sets the Vite framework and build
command, SPA rewrites so deep links like `/menu` and `/admin` survive a refresh
(with `/api/*` excluded so the functions still route), a 60s limit for those
functions, long-lived caching for hashed assets, and a few baseline security
headers.

`sitemap.xml` is generated during the build (see `emitSitemap` in
`vite.config.js`) rather than kept as a file, because a sitemap may only contain
absolute URLs and the domain isn't known until deploy time. It lists the five
public pages — `/`, `/menu`, `/deals`, `/contact`, `/track` — and the build also
appends a `Sitemap:` line to `robots.txt`. Everything private (`/admin`,
`/account`, `/checkout`, `/order/`) stays out of both, and if no domain is
available the sitemap is skipped with a build warning instead of shipping
invalid relative URLs.

1. Push the repo to GitHub (already done).
2. On [vercel.com](https://vercel.com), **Add New → Project** and import this repo.
3. Vercel auto-detects Vite — no build settings to change
   (build `npm run build`, output `dist`).
4. Add the environment variables you need (below), then **Deploy**. Every push
   to the production branch redeploys automatically.

### Environment variables
Nothing is required — the app runs with built-in Supabase defaults. Each block
below simply switches on the feature next to it.

| Variable | Needed for |
| --- | --- |
| `VITE_SITE_URL` | A **custom domain**, e.g. `https://thesnackhut.com`. On a plain `*.vercel.app` deploy you can leave this unset — the build reads Vercel's own `VERCEL_PROJECT_PRODUCTION_URL`. It supplies the absolute URLs that the link-preview image and `sitemap.xml` both need. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Pointing at a different Supabase project than the built-in default. |
| `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Emailing each order to the shop. |
| `ORDER_EMAIL_TO`, `ORDER_EMAIL_FROM`, `ORDER_EMAIL_SECRET` | Overriding where order emails go, who they come from, and the database-webhook secret. |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | One-click WhatsApp broadcast. |
| `WHATSAPP_TEMPLATE`, `WHATSAPP_LANGUAGE` | Defaults for the broadcast screen. |

> Only `VITE_`-prefixed variables reach the browser. The Resend key, the service
> role key and the WhatsApp token deliberately have no prefix, so they stay on
> the server — never add one to them.

Changing an environment variable does **not** affect the running site until you
redeploy: `VITE_` ones are baked into the bundle at build time, and the rest are
read when a function cold-starts.

## 📁 Project Structure

```
src/
├── components/     # Reusable UI (Navbar, Footer, cards, modals, ImageField…)
├── context/        # Cart, Auth, Store (data) and Toast providers
├── lib/            # Supabase client + data-access layer (db.js)
├── data/           # Mock/seed data (menu, deals, slides, orders, rules)
├── pages/          # Customer pages + account/ and admin/ subfolders
├── utils/          # Currency formatting, invoices, reorder + WhatsApp helpers
├── App.jsx         # Routes
└── main.jsx        # App entry + provider composition
api/
├── order-email.js          # Serverless: emails each new order to the shop
└── whatsapp-broadcast.js   # Serverless: one-click WhatsApp send (admin only)
supabase/
└── user-accounts.sql       # One-time schema for customer accounts & coupons
```

## 🔌 Backend (Supabase)
All shared data flows through `src/context/StoreContext.jsx`, which loads from
and mirrors every change back to **Supabase** via `src/lib/db.js`
(`src/lib/supabase.js` holds the client).

**Tables** — `menu_items`, `deals`, `slides`, `discounts`, `orders`, `expenses`,
`suppliers`, `businesses`, `contact_messages`, `profiles`, `admins`, and a
key/value `settings` table (restaurant info, delivery rules, offer banner, order
counter, `seeded` flag).

`profiles` holds one row per customer account (name, phone, address, usual
delivery area). `orders.user_id` links an order to the account that placed it —
null for a guest checkout. `discounts.user_id` is what makes a coupon *personal*:
null means a public promo code, set means only that customer can see or use it.

**What loads when** — the catalogue (menu, deals, slides, discount codes,
settings) is world-readable and cached in `localStorage` for an instant first
paint. Orders, finances and messages are admin-only, so they are fetched fresh
after sign-in and never written to disk.

**Seeding** — on a brand-new project the first admin sign-in seeds the tables
from `src/data/mockData.js` and sets `settings.seeded`. That flag makes it a
one-shot: clearing every expense or supplier later can't bring demo rows back.

### 🔐 Security model
Row Level Security is on for every table, and the policies are split in two:

| | Visitor (`anon`) | Customer (signed in) | Admin (signed in + in `admins`) |
|---|---|---|---|
| Catalogue + settings | read | read | read / write |
| Discount codes | public codes only | public + **their own** | read / write |
| Orders | none | **their own**, read only | read / write |
| Profiles | none | **their own**, read / write | read |
| Expenses, suppliers, businesses | none | none | read / write |
| Contact messages | insert only (length-bounded) | insert only | read / write |
| `images` bucket | read | read | read / write |

Three `security definer` functions give visitors and customers exactly the writes
they need without any table access:

- **`place_order(jsonb)`** — assigns the next order number atomically from
  `settings.order_counter` and inserts the order.
- **`track_order(text)`** — returns one order's status, type and total.
- **`redeem_discount(text)`** — counts a coupon as used after a successful
  checkout, and only for a code the caller is allowed to use.

`is_admin()` (used by every admin policy) checks the caller against the `admins`
table — so a customer account can never reach the admin panel or anyone else's
data, no matter that it is also "authenticated".

### 🧾 Setup for customer accounts
> **Already applied to the live project** — this is the recipe for a fresh one.

1. **Run the schema.** SQL Editor → New query → paste
   [`supabase/user-accounts.sql`](supabase/user-accounts.sql) → **Run**. It creates
   `profiles`, adds `orders.user_id`, extends `discounts` with owner/expiry/use
   limits, adds `redeem_discount()`, and grants the signed-in (`authenticated`)
   role read access to the catalogue. It is idempotent — running it twice is safe.
2. **Allow sign-ups.** Authentication → *Sign In / Providers* → **Email**:
   - *Allow new users to sign up* → **ON** (it ships off)
   - *Confirm email* → **OFF** — the built-in mailer only sends a couple of
     messages an hour, which would block real customers. With it off, signing up
     logs the customer straight in. (Turn it back on once a real SMTP provider is
     configured under Authentication → Emails; the sign-up page already handles
     the "check your inbox" case.)

Without step 1, sign-up fails with a database error; without step 2, Supabase
rejects sign-ups with *"Signups not allowed for this instance"* — the app shows a
friendly message either way.

### 👤 Admin access
To add or replace an admin:

1. Supabase dashboard → **Authentication → Users → Add user** (tick *Auto
   Confirm User*).
2. Insert them into the allow-list:
   ```sql
   insert into public.admins (user_id, email)
   values ('<the-new-user-uuid>', '<their-email>');
   ```
3. Change a password any time under **Authentication → Users → … → Reset
   password**. Nothing needs redeploying.

### 🖼️ Images
Admin image pickers (`src/components/ImageField.jsx`) upload to the public
`images` Storage bucket — folders `menu/`, `deals/`, `slider/` — and store only
the resulting CDN URL. Pasting an external URL still works. Max 5 MB per file.

> Currency is shown in PKR (Rs.) throughout.
