# The Snack Hut 🍔

A modern, fully responsive fast-food ordering website built with **React**, **React Router**, and **Tailwind CSS**. It ships with a polished customer storefront and a password-protected admin panel — all powered by in-memory mock data so it's demo-ready out of the box and easy to wire to a real backend later.

## ✨ Features

### Customer Side
- **Home** — auto-playing hero slider (admin-managed), category browser, best sellers, hot deals, and a WhatsApp order CTA.
- **Menu** — items grouped by category, live search, and per-item customization (extras + spice level that adjust the price).
- **Deals & Offers** — dedicated combos page with a live discount/offer banner.
- **Cart & Checkout** — quantity controls, order type (Delivery / Take Away / Dine-in), customer details, **live delivery-fee calculation** from admin rules, discount codes, and payment method selection.
- **Order Confirmation** — generated order number and full summary.
- **Order Tracking** — enter an order number to see live status (Pending → Preparing → Out for Delivery → Delivered).
- **Open/Closed status** — ordering is disabled when the restaurant is toggled closed.
- **WhatsApp ordering** — opens WhatsApp with the order pre-filled.

### Admin Panel (`/admin`)
Demo login — **`admin` / `admin123`**

- Dashboard with revenue, order and menu stats
- Manage **menu items** (add / edit / delete)
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
├── components/     # Reusable UI (Navbar, Footer, cards, modals, icons…)
├── context/        # Cart, Auth, Store (data) and Toast providers
├── data/           # Mock/seed data (menu, deals, slides, orders, rules)
├── pages/          # Customer pages + admin/ subfolder
├── utils/          # Currency formatting + WhatsApp helpers
├── App.jsx         # Routes
└── main.jsx        # App entry + provider composition
```

## 🔌 Backend (Supabase)
All shared data flows through `src/context/StoreContext.jsx`, which loads from
and mirrors every change back to **Supabase** via `src/lib/db.js`
(`src/lib/supabase.js` holds the client). `localStorage` is kept as an instant
first-paint / offline cache. On first run the tables seed themselves from
`src/data/mockData.js`. Tables: `menu_items`, `deals`, `slides`, `discounts`,
`orders`, `expenses`, `suppliers`, `businesses`, and a key/value `settings`
table (restaurant info, delivery rules, offer banner, order counter).

> Currency is shown in PKR (Rs.) throughout.
