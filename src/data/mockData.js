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
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'chicken', name: 'Fried Chicken', icon: '🍗' },
  { id: 'shawarma', name: 'Shawarma & Rolls', icon: '🌯' },
  { id: 'fries', name: 'Fries', icon: '🍟' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
]

// Pizza sizes come straight off the printed menu: R 7", M 11", L 13", EL 16".
// Two price ladders — Classic and Premium — so they are written once here and
// spread into each pizza rather than repeated fourteen times.
const classicSizes = [
  { id: 'r', name: 'Regular 7"', price: 600 },
  { id: 'm', name: 'Medium 11"', price: 1100 },
  { id: 'l', name: 'Large 13"', price: 1550 },
  { id: 'el', name: 'Extra Large 16"', price: 2100 },
]

const premiumSizes = [
  { id: 'r', name: 'Regular 7"', price: 650 },
  { id: 'm', name: 'Medium 11"', price: 1200 },
  { id: 'l', name: 'Large 13"', price: 1800 },
  { id: 'el', name: 'Extra Large 16"', price: 2200 },
]

// `price` is always the Regular size — it's what the menu card shows as the
// starting price, and what the cart uses before a size is picked.
const classic = (id, name, description, image, bestSeller = false) => ({
  id,
  name,
  category: 'pizza',
  price: 600,
  description,
  image: img(image),
  ...(bestSeller ? { bestSeller: true } : {}),
  sizes: classicSizes,
})

const premium = (id, name, description, image, bestSeller = false) => ({
  id,
  name,
  category: 'pizza',
  price: 650,
  description,
  image: img(image),
  ...(bestSeller ? { bestSeller: true } : {}),
  sizes: premiumSizes,
})

export const MENU_ITEMS = [
  // ---- Pizza · Classic Collection ----------------------------------------
  classic('p1', 'Chicken Tikka B.B.Q', 'Spiced chicken tikka, onions & capsicum on our smoky B.B.Q base.', '1513104890138-7c749659a591', true),
  classic('p2', 'Chicken Fajita', 'Fajita-marinated chicken with peppers, onions & mozzarella.', '1628840042765-356cda07504e'),
  classic('p3', 'Chicken Supreme', 'Loaded with chicken, olives, capsicum, onion & sweetcorn.', '1565299624946-b28f40a0ae38'),
  classic('p4', 'Tandoori Pizza', 'Tandoori chicken, green chillies & a kick of desi masala.', '1513104890138-7c749659a591'),
  classic('p5', 'Fajita Sicilian', 'Sicilian-style fajita chicken with a herby tomato base.', '1628840042765-356cda07504e'),
  classic('p6', 'Hot-N-Spicy', 'For the brave — chilli chicken, jalapeños & hot sauce.', '1565299624946-b28f40a0ae38'),
  classic('p7', 'Margarita Pizza', 'The simple classic: tomato, basil & a whole lot of mozzarella.', '1513104890138-7c749659a591'),

  // ---- Pizza · Premium Collection ----------------------------------------
  premium('p8', 'Snack Hut Special', 'Our signature — chicken, pepperoni, veggies & a triple cheese blend.', '1628840042765-356cda07504e', true),
  premium('p9', 'Lazani Pizza', 'Creamy lasagne-style layers of chicken, sauce & melted cheese.', '1565299624946-b28f40a0ae38'),
  premium('p10', 'Pepperoni Pizza', 'Generous pepperoni over mozzarella and our signature tomato base.', '1628840042765-356cda07504e'),
  premium('p11', 'Cheese Gold Pizza', 'Four cheeses, golden and bubbling, edge to edge.', '1513104890138-7c749659a591'),
  premium('p12', 'Chicken Lover', 'Tikka, fajita and B.B.Q chicken together on one pizza.', '1565299624946-b28f40a0ae38'),
  premium('p13', 'Vegetarian Pizza', 'Mushroom, olives, capsicum, onion, sweetcorn & tomato.', '1565299624946-b28f40a0ae38'),
  premium('p14', 'Mushroom Pizza', 'Sautéed mushrooms, garlic butter & mozzarella.', '1513104890138-7c749659a591'),

  // ---- Burgers -------------------------------------------------------------
  {
    id: 'b1',
    name: 'Zinger Burger',
    category: 'burgers',
    price: 350,
    description: 'Crispy fried chicken fillet, mayo & lettuce in a soft bun.',
    image: img('1606755962773-d324e0a13086'),
    bestSeller: true,
  },
  {
    id: 'b2',
    name: 'Zinger with Cheese Burger',
    category: 'burgers',
    price: 400,
    description: 'The Zinger, with a slice of melted cheddar over the fillet.',
    image: img('1550547660-d9450f859349'),
  },
  {
    id: 'b3',
    name: 'Tikka Burger',
    category: 'burgers',
    price: 300,
    description: 'Chargrilled tikka-spiced patty with fresh salad & sauce.',
    image: img('1568901346375-23c9450c58cd'),
  },
  {
    id: 'b4',
    name: 'Chicken Patti Burger',
    category: 'burgers',
    price: 300,
    description: 'Classic chicken patty, mayo, lettuce & tomato.',
    image: img('1606755962773-d324e0a13086'),
  },
  {
    id: 'b5',
    name: 'Double Decker Burger',
    category: 'burgers',
    price: 560,
    description: 'Two chicken fillets, double cheese and a double appetite.',
    image: img('1550547660-d9450f859349'),
    bestSeller: true,
  },

  // ---- Fried Chicken -------------------------------------------------------
  {
    id: 'c1',
    name: '1 Piece Chicken',
    category: 'chicken',
    price: 250,
    description: 'Hand-breaded, pressure-fried, crispy on the outside and juicy inside.',
    image: img('1608039755401-742074f0548d'),
  },
  {
    id: 'c2',
    name: '10 Pieces Hot Wings',
    category: 'chicken',
    price: 500,
    description: 'Ten fiery wings tossed in our hot spice mix.',
    image: img('1608039755401-742074f0548d'),
    bestSeller: true,
  },
  {
    id: 'c3',
    name: '10 Pieces Nuggets',
    category: 'chicken',
    price: 450,
    description: 'Ten golden chicken nuggets with a dip of your choice.',
    image: img('1608039755401-742074f0548d'),
  },
  {
    id: 'c4',
    name: '10 Pieces BBQ Wings',
    category: 'chicken',
    price: 500,
    description: 'Ten wings glazed in sticky smoked B.B.Q sauce.',
    image: img('1608039755401-742074f0548d'),
  },

  // ---- Shawarma & Rolls ----------------------------------------------------
  {
    id: 's1',
    name: 'Chicken Shawarma (Large)',
    category: 'shawarma',
    price: 200,
    description: 'Slow-roasted chicken, garlic sauce & salad in a warm wrap.',
    image: img('1528735602780-2552fd46c7af'),
    bestSeller: true,
  },
  {
    id: 's2',
    name: 'Chicken Cheese Shawarma (Large)',
    category: 'shawarma',
    price: 250,
    description: 'The classic shawarma with cheese melted right through it.',
    image: img('1553909489-cd47e0ef937f'),
  },
  {
    id: 's3',
    name: 'Zinger Shawarma (Large)',
    category: 'shawarma',
    price: 250,
    description: 'Crispy zinger strips wrapped up with sauce and fresh salad.',
    image: img('1528735602780-2552fd46c7af'),
  },
  {
    id: 's4',
    name: 'Pratha Roll (Large)',
    category: 'shawarma',
    price: 320,
    description: 'Flaky pratha rolled around spiced chicken and chutney.',
    image: img('1553909489-cd47e0ef937f'),
  },
  {
    id: 's5',
    name: 'Zinger Pratha Roll',
    category: 'shawarma',
    price: 400,
    description: 'Zinger fillet in a buttery pratha with sauce and salad.',
    image: img('1528735602780-2552fd46c7af'),
  },

  // ---- Fries ---------------------------------------------------------------
  {
    id: 'f1',
    name: 'French Fries (Regular)',
    category: 'fries',
    price: 150,
    description: 'Freshly fried, salted and served hot.',
    image: img('1630384060421-cb20d0e0649d'),
  },
  {
    id: 'f2',
    name: 'Large Fries',
    category: 'fries',
    price: 250,
    description: 'The regular, but with a good deal more of it.',
    image: img('1630384060421-cb20d0e0649d'),
  },
  {
    id: 'f3',
    name: 'Family Fries',
    category: 'fries',
    price: 450,
    description: 'A sharing basket — enough for the whole table.',
    image: img('1630384060421-cb20d0e0649d'),
  },
  {
    id: 'f4',
    name: 'Loaded Fries',
    category: 'fries',
    price: 500,
    description: 'Oven-baked and buried under cheese, chicken & sauces.',
    image: img('1573080496219-bb080dd4f877'),
    bestSeller: true,
  },
  {
    id: 'f5',
    name: 'Pizza Fries',
    category: 'fries',
    price: 450,
    description: 'Oven-baked fries with pizza toppings and molten mozzarella.',
    image: img('1573080496219-bb080dd4f877'),
  },
  {
    id: 'f6',
    name: 'Garlic Mayo Fries',
    category: 'fries',
    price: 350,
    description: 'Oven-baked fries drenched in our garlic mayo.',
    image: img('1573080496219-bb080dd4f877'),
  },

  // ---- Drinks --------------------------------------------------------------
  {
    id: 'dr1',
    name: 'Regular Drink',
    category: 'drinks',
    price: 80,
    description: 'Chilled soft drink, regular glass.',
    image: img('1554866585-cd94860890b7'),
  },
  {
    id: 'dr2',
    name: 'Tin Can',
    category: 'drinks',
    price: 120,
    description: 'Your favourite soft drink, straight from the can.',
    image: img('1554866585-cd94860890b7'),
  },
  {
    id: 'dr3',
    name: '500ml Drink',
    category: 'drinks',
    price: 120,
    description: 'Half-litre bottle, ice cold.',
    image: img('1554866585-cd94860890b7'),
  },
  {
    id: 'dr4',
    name: '1 Litre Drink',
    category: 'drinks',
    price: 180,
    description: 'One litre — enough to share, if you feel like it.',
    image: img('1554866585-cd94860890b7'),
  },
  {
    id: 'dr5',
    name: '1.5 Litre Drink',
    category: 'drinks',
    price: 220,
    description: 'The family bottle.',
    image: img('1554866585-cd94860890b7'),
  },
  {
    id: 'dr6',
    name: 'Mint Margarita',
    category: 'drinks',
    price: 200,
    description: 'Blended fresh mint, lemon and ice — properly refreshing.',
    image: img('1437418747212-8d9709afab22'),
    bestSeller: true,
  },
  {
    id: 'dr7',
    name: 'Fresh Lime',
    category: 'drinks',
    price: 100,
    description: 'Freshly squeezed lime, sweet and sharp.',
    image: img('1437418747212-8d9709afab22'),
  },
  {
    id: 'dr8',
    name: 'Blue Lime',
    category: 'drinks',
    price: 250,
    description: 'Fresh lime with blue curaçao syrup over crushed ice.',
    image: img('1572490122747-3968b75cc699'),
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

// Straight off the printed deal menu. No `oldPrice` here on purpose: the menu
// quotes a deal price only, so inventing a "was" figure would be inventing a
// discount. DealCard simply omits the strike-through when it isn't set.
export const DEALS = [
  // ---- Super Deals ---------------------------------------------------------
  {
    id: 'sd1',
    name: 'Super Deal 1',
    description: '3 Small Pizzas (Tikka B.B.Q) + 1 Ltr Drink.',
    price: 1800,
    image: img('1513104890138-7c749659a591'),
    tag: 'Super Deal',
  },
  {
    id: 'sd2',
    name: 'Super Deal 2',
    description: '3 Medium Pizzas (Tikka B.B.Q) + 1.5 Ltr Drink.',
    price: 3300,
    image: img('1628840042765-356cda07504e'),
    tag: 'Super Deal',
  },
  {
    id: 'sd3',
    name: 'Super Deal 3',
    description: '3 Large Pizzas (Tikka B.B.Q) + 2 × 1 Ltr Drinks.',
    price: 4600,
    image: img('1565299624946-b28f40a0ae38'),
    tag: 'Super Deal',
  },
  {
    id: 'sd4',
    name: 'Super Deal 4',
    description: '3 Extra Large Pizzas (Tikka B.B.Q) + 2 × 1.5 Ltr Drinks.',
    price: 6300,
    image: img('1594007654729-407eedc4be65'),
    tag: 'Super Deal',
  },

  // ---- Family Deals --------------------------------------------------------
  {
    id: 'fd1',
    name: 'Family Deal 1',
    description: '2 Snack Hut Special Pizzas (Small) + 4 Zinger Burgers + 4 Pieces Chicken.',
    price: 3600,
    image: img('1594007654729-407eedc4be65'),
    tag: 'Family',
  },
  {
    id: 'fd2',
    name: 'Family Deal 2',
    description: '1 Snack Hut Special Pizza (Large) + 4 Chicken Burgers + 1.5 Ltr Cold Drink.',
    price: 2750,
    image: img('1571091718767-18b5b1457add'),
    tag: 'Family',
  },

  // ---- Special Deals -------------------------------------------------------
  {
    id: 'spd1',
    name: 'Special Deal 1',
    description: '1 Small Pizza (Chicken Tikka B.B.Q) + 1 Zinger Burger + 5 Hot Wings + 1 Ltr Drink.',
    price: 1280,
    image: img('1513104890138-7c749659a591'),
    tag: 'Special',
  },
  {
    id: 'spd2',
    name: 'Special Deal 2',
    description: '1 Medium Pizza (Chicken Tikka B.B.Q) + 1 Patty Burger + 1 Chicken Shawarma + 1 Ltr Drink.',
    price: 1650,
    image: img('1628840042765-356cda07504e'),
    tag: 'Special',
  },
  {
    id: 'spd3',
    name: 'Special Deal 3',
    description:
      '1 Large Pizza (Chicken Tikka B.B.Q) + 5 Wings + 1 Chicken Piece + 1 Pratha Roll + 1.5 Ltr Drink.',
    price: 2900,
    image: img('1565299624946-b28f40a0ae38'),
    tag: 'Special',
  },

  // ---- Burger Deals --------------------------------------------------------
  {
    id: 'bd1',
    name: 'Burger Deal 1',
    description: '1 Zinger Burger + Regular Fries + Regular Cold Drink.',
    price: 500,
    image: img('1571091718767-18b5b1457add'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd2',
    name: 'Burger Deal 2',
    description: '1 Chicken Burger + 1 Chicken Piece + Regular Fries + Regular Cold Drink.',
    price: 700,
    image: img('1568901346375-23c9450c58cd'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd3',
    name: 'Burger Deal 3',
    description: '1 Zinger Burger + 1 Chicken Piece + Regular Fries + Regular Cold Drink.',
    price: 750,
    image: img('1606755962773-d324e0a13086'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd4',
    name: 'Burger Deal 4',
    description: '1 Tikka Burger + 1 Chicken Burger + Regular Fries + Regular Cold Drink.',
    price: 750,
    image: img('1550547660-d9450f859349'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd5',
    name: 'Burger Deal 5',
    description: '1 Tower Burger + 10 Hot Wings + Regular Fries + Regular Cold Drink.',
    price: 1600,
    image: img('1608039755401-742074f0548d'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd6',
    name: 'Burger Deal 6',
    description: '2 Zinger Burgers + 2 Chicken Pieces + Regular Fries + 500ml Cold Drink.',
    price: 1350,
    image: img('1606755962773-d324e0a13086'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd7',
    name: 'Burger Deal 7',
    description: '4 Chicken Pieces + French Fries + 1 Ltr Cold Drink.',
    price: 1200,
    image: img('1608039755401-742074f0548d'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd8',
    name: 'Burger Deal 8',
    description: '8 Zinger Burgers + 1.5 Ltr Drink.',
    price: 2800,
    image: img('1550547660-d9450f859349'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd9',
    name: 'Burger Deal 9',
    description: '3 Zinger Burgers + 3 Chicken Pieces + 5 Hot Shots + French Fries + 1.5 Ltr Cold Drink.',
    price: 2400,
    image: img('1571091718767-18b5b1457add'),
    tag: 'Burger Deal',
  },
  {
    id: 'bd10',
    name: 'Burger Deal 10',
    description:
      '6 Zinger Burgers + 6 Chicken Pieces + 10 Hot Wings + Regular Fries + 1.5 Ltr Cold Drink.',
    price: 3800,
    image: img('1594007654729-407eedc4be65'),
    tag: 'Burger Deal',
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
  email: 'thesnackhut001@gmail.com',
  address: 'Barikot Bridge, Near Daewoo Stand, Opp. Govt Primary School, Barikot, Swat',
  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=Barikot+Bridge+Daewoo+Stand+Barikot+Swat',
  isOpen: true,
  // Accounts customers can transfer to. Each one becomes a payment option at
  // checkout (Cash on Delivery is always the first option). Editable from
  // Admin → Settings, so the shop can add or change accounts without a deploy.
  paymentAccounts: [
    {
      id: 'easypaisa',
      method: 'Easypaisa',
      icon: '📱',
      bank: '',
      title: 'Fayaz Ahmed',
      number: '0346 9559380',
      iban: 'PK35TMFB0000000027265728',
      branch: '',
      note: 'IBAN account title: THE SNACK HUT',
    },
    {
      id: 'meezan',
      method: 'Bank Transfer',
      icon: '🏦',
      bank: 'Meezan Bank',
      title: 'The Snack Hut',
      number: '26990114582799',
      iban: 'PK21MEZN0026990114582799',
      branch: 'Barikot Branch, Swat',
      note: '',
    },
  ],
  hours: [{ day: 'Every day', time: '11:00 AM – 2:00 AM' }],
  socials: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
  },
}

export const OFFER_BANNER = {
  active: true,
  text: '🛵 Free home delivery within 1 km on orders above Rs 1000 — open daily 11:00 AM – 2:00 AM',
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
