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

### Admin Panel (`/admin`)
Sign in with the **Supabase Auth** email + password of a user listed in the
`admins` table (see *Admin access* below). Public sign-ups are disabled, so an
account can only be created from the Supabase dashboard.

- Dashboard with revenue, order and menu stats
- **Messages** — inbox for contact-form submissions (unread badge, mark read, reply by email)
- Manage **menu items** (add / edit / delete), with image upload to Supabase Storage
- Manage **deals & offers** and the offer banner
- Manage **discount codes**
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
The repo is Vercel-ready (`vercel.json` sets the Vite framework, build command,
and SPA rewrites so deep links like `/menu` and `/admin` work on refresh).

1. Push the repo to GitHub (already done).
2. On [vercel.com](https://vercel.com), **Add New → Project** and import this repo.
3. Vercel auto-detects Vite — no build settings to change
   (build `npm run build`, output `dist`).
4. *(Optional)* Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under
   **Settings → Environment Variables** to override the built-in defaults.
5. **Deploy.** Every push to the connected branch redeploys automatically.

## 📁 Project Structure

```
src/
├── components/     # Reusable UI (Navbar, Footer, cards, modals, ImageField…)
├── context/        # Cart, Auth, Store (data) and Toast providers
├── lib/            # Supabase client + data-access layer (db.js)
├── data/           # Mock/seed data (menu, deals, slides, orders, rules)
├── pages/          # Customer pages + admin/ subfolder
├── utils/          # Currency formatting + WhatsApp helpers
├── App.jsx         # Routes
└── main.jsx        # App entry + provider composition
```

## 🔌 Backend (Supabase)
All shared data flows through `src/context/StoreContext.jsx`, which loads from
and mirrors every change back to **Supabase** via `src/lib/db.js`
(`src/lib/supabase.js` holds the client).

**Tables** — `menu_items`, `deals`, `slides`, `discounts`, `orders`, `expenses`,
`suppliers`, `businesses`, `contact_messages`, `admins`, and a key/value
`settings` table (restaurant info, delivery rules, offer banner, order counter,
`seeded` flag).

**What loads when** — the catalogue (menu, deals, slides, discount codes,
settings) is world-readable and cached in `localStorage` for an instant first
paint. Orders, finances and messages are admin-only, so they are fetched fresh
after sign-in and never written to disk.

**Seeding** — on a brand-new project the first admin sign-in seeds the tables
from `src/data/mockData.js` and sets `settings.seeded`. That flag makes it a
one-shot: clearing every expense or supplier later can't bring demo rows back.

### 🔐 Security model
Row Level Security is on for every table, and the policies are split in two:

| | Visitor (`anon`) | Admin (signed in + in `admins`) |
|---|---|---|
| Catalogue + settings | read | read / write |
| Orders, expenses, suppliers, businesses | none | read / write |
| Contact messages | insert only (length-bounded) | read / write |
| `images` bucket | read | read / write |

Two `security definer` functions give visitors exactly the two writes they need
without any table access:

- **`place_order(jsonb)`** — assigns the next order number atomically from
  `settings.order_counter` and inserts the order.
- **`track_order(text)`** — returns one order's status, type and total.

`is_admin()` (used by every admin policy) checks the caller against the `admins`
table, and public sign-ups are disabled — so "authenticated" can only ever mean
the shop owner.

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
