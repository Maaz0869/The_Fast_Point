// ---------------------------------------------------------------------------
// Mock / seed data for The Snack Hut.
// Everything here is loaded into StoreContext state on first render, so the
// admin panel can mutate it in-memory during the session. Swap these arrays
// for real API calls when a backend is wired up.
// ---------------------------------------------------------------------------

// Photos are hosted on Unsplash's CDN so the demo looks realistic out of the
// box. Replace with your own uploads / backend URLs later.
const img = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const CATEGORIES = [
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'fries', name: 'Fries & Sides', icon: '🍟' },
  { id: 'sandwiches', name: 'Sandwiches', icon: '🥪' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
]

export const MENU_ITEMS = [
  {
    id: 'm1',
    name: 'Classic Beef Burger',
    category: 'burgers',
    price: 550,
    description: 'Juicy grilled beef patty, cheddar, lettuce, tomato & house sauce.',
    image: img('1568901346375-23c9450c58cd'),
    bestSeller: true,
  },
  {
    id: 'm2',
    name: 'Zinger Chicken Burger',
    category: 'burgers',
    price: 480,
    description: 'Crispy fried chicken fillet, mayo, lettuce in a soft brioche bun.',
    image: img('1606755962773-d324e0a13086'),
    bestSeller: true,
  },
  {
    id: 'm3',
    name: 'Double Cheese Melt',
    category: 'burgers',
    price: 690,
    salePrice: 590,
    description: 'Two beef patties, double cheese, caramelised onions & pickles.',
    image: img('1550547660-d9450f859349'),
  },
  {
    id: 'm4',
    name: 'Pepperoni Pizza',
    category: 'pizza',
    price: 799,
    description: 'Loaded pepperoni, mozzarella & our signature tomato base.',
    image: img('1628840042765-356cda07504e'),
    bestSeller: true,
    sizes: [
      { id: 'small', name: 'Small', price: 799 },
      { id: 'medium', name: 'Medium', price: 970 },
      { id: 'large', name: 'Large', price: 1150 },
      { id: 'xl', name: 'Extra Large', price: 1450 },
    ],
  },
  {
    id: 'm5',
    name: 'Chicken Tikka Pizza',
    category: 'pizza',
    price: 899,
    description: 'Spiced chicken tikka, onions, capsicum & extra cheese.',
    image: img('1513104890138-7c749659a591'),
    sizes: [
      { id: 'small', name: 'Small', price: 899 },
      { id: 'medium', name: 'Medium', price: 1075 },
      { id: 'large', name: 'Large', price: 1250 },
      { id: 'xl', name: 'Extra Large', price: 1550 },
    ],
  },
  {
    id: 'm6',
    name: 'Veggie Supreme Pizza',
    category: 'pizza',
    price: 780,
    description: 'Mushrooms, olives, capsicum, onion & sweet corn.',
    image: img('1565299624946-b28f40a0ae38'),
    sizes: [
      { id: 'small', name: 'Small', price: 780 },
      { id: 'medium', name: 'Medium', price: 930 },
      { id: 'large', name: 'Large', price: 1080 },
      { id: 'xl', name: 'Extra Large', price: 1380 },
    ],
  },
  {
    id: 'm7',
    name: 'Loaded Cheese Fries',
    category: 'fries',
    price: 350,
    description: 'Crispy fries smothered in cheese sauce & jalapeños.',
    image: img('1573080496219-bb080dd4f877'),
    bestSeller: true,
  },
  {
    id: 'm8',
    name: 'Peri Peri Fries',
    category: 'fries',
    price: 280,
    description: 'Golden fries tossed in tangy peri peri seasoning.',
    image: img('1630384060421-cb20d0e0649d'),
  },
  {
    id: 'm9',
    name: 'Crispy Chicken Wings',
    category: 'fries',
    price: 420,
    description: '6 pcs of crunchy wings with a smoky BBQ glaze.',
    image: img('1608039755401-742074f0548d'),
  },
  {
    id: 'm10',
    name: 'Grilled Chicken Sandwich',
    category: 'sandwiches',
    price: 460,
    description: 'Grilled chicken, cheese, lettuce & mayo in toasted bread.',
    image: img('1553909489-cd47e0ef937f'),
  },
  {
    id: 'm11',
    name: 'Club Sandwich',
    category: 'sandwiches',
    price: 520,
    description: 'Triple-decker with chicken, egg, cheese & fresh veggies.',
    image: img('1528735602780-2552fd46c7af'),
  },
  {
    id: 'm12',
    name: 'Fresh Lime Soda',
    category: 'drinks',
    price: 150,
    description: 'Chilled sparkling lime soda — sweet or salty.',
    image: img('1437418747212-8d9709afab22'),
  },
  {
    id: 'm13',
    name: 'Chocolate Milkshake',
    category: 'drinks',
    price: 320,
    description: 'Thick, creamy chocolate shake topped with whipped cream.',
    image: img('1572490122747-3968b75cc699'),
    bestSeller: true,
  },
  {
    id: 'm14',
    name: 'Soft Drink (500ml)',
    category: 'drinks',
    price: 120,
    description: 'Your choice of chilled cola, lemon or orange.',
    image: img('1554866585-cd94860890b7'),
  },
  {
    id: 'm15',
    name: 'Molten Lava Cake',
    category: 'desserts',
    price: 380,
    description: 'Warm chocolate cake with a gooey molten centre.',
    image: img('1606313564200-e75d5e30476c'),
  },
  {
    id: 'm16',
    name: 'Oreo Brownie',
    category: 'desserts',
    price: 340,
    description: 'Fudgy brownie loaded with Oreo chunks & chocolate drizzle.',
    image: img('1607920591413-4ec007e70023'),
  },
]

// Add-on extras available in the item customization modal.
export const EXTRAS = [
  { id: 'cheese', name: 'Extra Cheese', price: 80 },
  { id: 'patty', name: 'Extra Patty', price: 150 },
  { id: 'sauce', name: 'Extra Sauce', price: 40 },
  { id: 'fries', name: 'Add Fries', price: 120 },
]

export const SPICE_LEVELS = [
  { id: 'mild', name: 'Mild', price: 0 },
  { id: 'medium', name: 'Medium', price: 0 },
  { id: 'hot', name: 'Hot 🌶️', price: 20 },
]

export const DEALS = [
  {
    id: 'd1',
    name: 'Family Feast',
    description: '2 Beef Burgers + 1 Large Pizza + 4 Drinks + Large Fries.',
    price: 2499,
    oldPrice: 3200,
    image: img('1594007654729-407eedc4be65'),
    tag: 'Best Value',
  },
  {
    id: 'd2',
    name: 'Solo Combo',
    description: '1 Zinger Burger + Regular Fries + 1 Drink.',
    price: 699,
    oldPrice: 850,
    image: img('1571091718767-18b5b1457add'),
    tag: 'Popular',
  },
  {
    id: 'd3',
    name: 'Pizza Party',
    description: '2 Large Pizzas + Garlic Bread + 1.5L Drink.',
    price: 1999,
    oldPrice: 2600,
    image: img('1513104890138-7c749659a591'),
    tag: 'Save 23%',
  },
  {
    id: 'd4',
    name: 'Wings & Fries Box',
    description: '12 Crispy Wings + Loaded Cheese Fries + 2 Drinks.',
    price: 1099,
    oldPrice: 1400,
    image: img('1608039755401-742074f0548d'),
    tag: 'New',
  },
]

export const SLIDES = [
  {
    id: 's1',
    heading: 'Big Flavours, Bigger Cravings',
    text: 'Handcrafted burgers grilled to perfection. Taste the difference in every bite.',
    buttonText: 'Order Now',
    buttonLink: '/menu',
    image: img('1571091718767-18b5b1457add', 1600),
  },
  {
    id: 's2',
    heading: '20% OFF This Week 🔥',
    text: 'Grab our Family Feast combo and feed the whole crew for less.',
    buttonText: 'View Deals',
    buttonLink: '/deals',
    image: img('1594007654729-407eedc4be65', 1600),
  },
  {
    id: 's3',
    heading: 'Wood-Fired Pizzas',
    text: 'Fresh dough, premium toppings, melted cheese. Delivered hot to your door.',
    buttonText: 'Order Pizza',
    buttonLink: '/menu',
    image: img('1513104890138-7c749659a591', 1600),
  },
]

export const DISCOUNT_CODES = [
  { code: 'SNACK10', type: 'percent', value: 10, description: '10% off your order' },
  { code: 'FLAT200', type: 'flat', value: 200, description: 'Rs. 200 off orders over Rs. 1500', minOrder: 1500 },
  { code: 'WELCOME15', type: 'percent', value: 15, description: '15% off for new customers' },
]

// Delivery fee rules. `charge` applies when the order subtotal is BELOW
// `freeAbove`; at or above `freeAbove` delivery is free.
export const DELIVERY_RULES = {
  // 'zone'  → fee by the delivery area/place the customer picks (admin-managed);
  // 'distance' → fee by km from the shop; 'order' → fee by order subtotal.
  mode: 'zone',
  freeAbove: 0, // 0 = no free-delivery threshold (area charge always applies)
  charge: 120, // fallback charge when no area is matched
  // Delivery areas (jagah). Each place has its own charge. The customer picks
  // their area at checkout and sees that charge; the admin manages this list.
  areas: [
    { id: 'barikot', name: 'Barikot', charge: 40 },
    { id: 'ghalegay', name: 'Ghalegay', charge: 70 },
    { id: 'shamozai', name: 'Shamozai', charge: 90 },
    { id: 'kanju', name: 'Kanju', charge: 130 },
    { id: 'mingora', name: 'Mingora', charge: 180 },
    { id: 'saidu', name: 'Saidu Sharif', charge: 200 },
  ],
  // Order-total tiers (subtotal < upTo → charge). Used in 'order' mode.
  tiers: [
    { upTo: 500, charge: 150 },
    { upTo: 1500, charge: 100 },
  ],
  // Distance tiers (km <= uptoKm → charge). Used in 'distance' mode.
  distanceTiers: [
    { uptoKm: 3, charge: 50 },
    { uptoKm: 6, charge: 100 },
    { uptoKm: 10, charge: 180 },
  ],
  distanceBeyond: 250, // charge when farther than the last tier
}

export const RESTAURANT = {
  name: 'The Snack Hut',
  tagline: 'Fresh. Fast. Delicious.',
  phone: '+92 340 963 1994',
  phone2: '+92 313 963 1894',
  whatsapp: '923409631994',
  // CallMeBot API key — lets orders auto-send to the WhatsApp number above
  // without the customer opening WhatsApp. Set it from Admin → Settings.
  // Get a free key: WhatsApp "I allow callmebot to send me messages" to
  // +34 644 44 21 07 and it replies with your apikey.
  callmebotApiKey: '',
  email: 'hello@thesnackhut.pk',
  address: 'The Snack Hut Barikot',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=The+Snack+Hut+Barikot',
  isOpen: true,
  hours: [
    { day: 'Monday – Thursday', time: '12:00 PM – 12:00 AM' },
    { day: 'Friday – Sunday', time: '12:00 PM – 2:00 AM' },
  ],
  socials: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
  },
}

export const OFFER_BANNER = {
  active: true,
  text: '🔥 20% OFF this week on all combo deals — use code SNACK10 at checkout!',
}

export const ORDER_STATUSES = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered']

// No demo orders — the admin "View Orders" screen starts empty and fills up
// with real customer orders as they come in.
export const SEED_ORDERS = []

// Categories used when recording a business expense.
export const EXPENSE_CATEGORIES = [
  'Ingredients / Stock',
  'Rent',
  'Utilities (Electricity/Gas/Water)',
  'Salaries / Wages',
  'Packaging',
  'Marketing',
  'Maintenance / Repairs',
  'Transport / Fuel',
  'Other',
]

// General business expenses (kharche) shown in the Expenses report.
export const SEED_EXPENSES = [
  {
    id: 'exp1001',
    date: '2026-07-15',
    category: 'Utilities (Electricity/Gas/Water)',
    description: 'Electricity bill — July',
    paidTo: 'PESCO',
    method: 'Cash',
    amount: 18500,
  },
  {
    id: 'exp1002',
    date: '2026-07-13',
    category: 'Packaging',
    description: 'Burger boxes & bags (500 pcs)',
    paidTo: 'Swat Packaging',
    method: 'Cash',
    amount: 9200,
  },
]

// Income categories used inside a business account's profit/loss ledger.
export const INCOME_CATEGORIES = ['Sales', 'Services', 'Catering', 'Other Income']

// Separate business accounts (multiple kaam). Each keeps its own income +
// expense entries so you can see whether that business is in profit or loss,
// and a day-by-day record. net = totalIncome − totalExpense.
export const SEED_BUSINESSES = [
  {
    id: 'biz1001',
    name: 'The Snack Hut (Main)',
    note: 'Barikot branch',
    createdAt: '2026-06-01T10:00:00',
    entries: [
      {
        id: 'be1001',
        date: '2026-07-15',
        type: 'income',
        category: 'Sales',
        description: 'Daily counter sales',
        amount: 42000,
      },
      {
        id: 'be1002',
        date: '2026-07-15',
        type: 'expense',
        category: 'Ingredients / Stock',
        description: 'Vegetables & buns',
        amount: 9500,
      },
      {
        id: 'be1003',
        date: '2026-07-14',
        type: 'income',
        category: 'Sales',
        description: 'Daily counter sales',
        amount: 38000,
      },
      {
        id: 'be1004',
        date: '2026-07-14',
        type: 'expense',
        category: 'Salaries / Wages',
        description: 'Staff daily wage',
        amount: 6000,
      },
    ],
  },
]

// Supplier accounts. Each keeps a ledger of purchases (udhaar — increases what
// we owe) and payments (paisay diye — reduces what we owe). Balance =
// openingBalance + purchases − payments. A positive balance means we still owe
// the supplier that amount.
export const SEED_SUPPLIERS = [
  {
    id: 'sup1001',
    name: 'Khan Meat Suppliers',
    company: 'Khan & Sons',
    phone: '0301 2345678',
    address: 'Mingora Main Bazaar, Swat',
    note: 'Beef & chicken — delivers every Monday.',
    openingBalance: 0,
    createdAt: '2026-06-01T10:00:00',
    ledger: [
      {
        id: 'txn1001',
        date: '2026-07-05',
        type: 'purchase',
        invoiceNo: 'KMS-221',
        description: '40 kg beef @ 1200/kg',
        amount: 48000,
      },
      {
        id: 'txn1002',
        date: '2026-07-10',
        type: 'payment',
        description: 'Cash payment',
        amount: 30000,
      },
    ],
  },
]
