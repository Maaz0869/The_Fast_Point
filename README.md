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

## 🔌 Wiring Up a Backend
All shared data flows through `src/context/StoreContext.jsx`. Its CRUD helpers
(`addMenuItem`, `placeOrder`, `updateOrderStatus`, …) currently mutate local
state seeded from `src/data/mockData.js`. Swap those implementations for API
calls and the UI keeps working unchanged.

> Currency is shown in PKR (Rs.) throughout.
