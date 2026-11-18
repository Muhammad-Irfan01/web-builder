import { API_ORIGIN } from '../../lib/origins';
/**
 * Store Profiler & Intent Detection Engine
 * Proactively classifies what the store sells:
 * - Physical Products (e-commerce catalog, variations)
 * - Bespoke Custom Services (cake making, custom crafts, tailored orders)
 * - Appointment Services (salons, spas, consultations, health)
 * - Rentals (equipment, event gear, spaces, vehicles)
 * - Hybrid Businesses
 */

export interface StoreProfile {
  storeId: string;
  storeName: string;
  primaryBusiness: 'PHYSICAL_COMMERCE' | 'CUSTOM_SERVICES' | 'APPOINTMENT_SERVICES' | 'RENTALS' | 'HYBRID';
  detectedNiche: string;
  capabilities: {
    hasProducts: boolean;
    hasCustomOrders: boolean;
    hasBookings: boolean;
    hasRentals: boolean;
    productCount: number;
    bookingSlotsCount: number;
    rentalAssetsCount: number;
  };
  sampleItems: {
    products: Array<{ id: string; title: string; price: number; category?: string }>;
    services: Array<{ title: string; duration?: string }>;
    rentals: Array<{ title: string; dailyRate?: number }>;
  };
  actionableLinks: {
    catalog: string;
    bookings: string;
    rentals: string;
    cart: string;
    checkout: string;
    chat: string;
  };
  suggestedPromptChips: string[];
}

export async function profileStore(
  storeId: string,
  apiBaseUrl: string = API_ORIGIN,
  token?: string | null
): Promise<StoreProfile> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-store-id': storeId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let productsList: any[] = [];
  let bookingSlotsList: any[] = [];
  let rentalsList: any[] = [];
  let storeDetails: any = null;

  try {
    const [prodRes, bookRes, rentRes, storeRes] = await Promise.allSettled([
      fetch(`${apiBaseUrl}/api/products?limit=50`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${apiBaseUrl}/api/booking-slots`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${apiBaseUrl}/api/rentals/assets`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${apiBaseUrl}/api/store/me`, { headers }).then(r => r.ok ? r.json() : null),
    ]);

    if (prodRes.status === 'fulfilled' && prodRes.value) {
      productsList = Array.isArray(prodRes.value.data) ? prodRes.value.data : Array.isArray(prodRes.value) ? prodRes.value : [];
    }
    if (bookRes.status === 'fulfilled' && bookRes.value) {
      bookingSlotsList = Array.isArray(bookRes.value.data) ? bookRes.value.data : Array.isArray(bookRes.value) ? bookRes.value : [];
    }
    if (rentRes.status === 'fulfilled' && rentRes.value) {
      rentalsList = Array.isArray(rentRes.value.data) ? rentRes.value.data : Array.isArray(rentRes.value) ? rentRes.value : [];
    }
    if (storeRes.status === 'fulfilled' && storeRes.value) {
      storeDetails = storeRes.value.data || storeRes.value;
    }
  } catch (err) {
    console.warn('[StoreProfiler] Fetch fallback used due to network/auth error:', err);
  }

  const productTitles = productsList.map(p => (p.title || p.name || '').toLowerCase());
  const categoryNames = productsList.map(p => (p.category?.name || p.categoryName || '').toLowerCase());
  const combinedKeywords = [...productTitles, ...categoryNames].join(' ');

  // Heuristics for bespoke custom made-to-order services (cakes, catering, tailoring)
  const isCustomBespoke = /cake|bakery|bake|pastry|custom order|bespoke|catering|tailor|craft|portrait|commission/.test(combinedKeywords);
  
  // Heuristics for appointments (salons, beauty, clinics, haircuts)
  const isAppointmentService = bookingSlotsList.length > 0 || /salon|hair|facial|nail|massage|spa|barber|clinic|consultation|therapy/.test(combinedKeywords);

  // Heuristics for rentals (vehicles, cameras, equipment, event items)
  const isRentalService = rentalsList.length > 0 || /rental|rent|hire|daily rate|hourly rate|deposit/.test(combinedKeywords);

  const hasPhysicalGoods = productsList.length > 0 && !isCustomBespoke;

  let primaryBusiness: StoreProfile['primaryBusiness'] = 'PHYSICAL_COMMERCE';
  let detectedNiche = 'Retail & E-Commerce Store';
  let chips: string[] = [
    'Add a Featured Products showcase with quick-add to cart',
    'Add an Announcement bar with sale banner',
    'Add Customer Reviews and Trust badges',
  ];

  if (isCustomBespoke) {
    primaryBusiness = 'CUSTOM_SERVICES';
    detectedNiche = 'Custom Cake & Bespoke Craft Studio';
    chips = [
      'Design a custom cake flavor & size inquiry section',
      'Add a portfolio gallery of celebration cakes with reviews',
      'Add a direct WhatsApp consultation and ordering button',
    ];
  } else if (isAppointmentService) {
    primaryBusiness = 'APPOINTMENT_SERVICES';
    detectedNiche = 'Salon & Appointment Studio';
    chips = [
      'Add an Appointment booking section with service menu',
      'Add a Meet the Specialists / Team gallery',
      'Showcase client transformations and testimonials',
    ];
  } else if (isRentalService) {
    primaryBusiness = 'RENTALS';
    detectedNiche = 'Equipment & Item Rental Service';
    chips = [
      'Add an Equipment rental card grid with daily/weekly rates',
      'Add a Date reservation inquiry & security deposit form',
      'Add FAQ about rental pickup, return, and terms',
    ];
  } else if (hasPhysicalGoods && isAppointmentService) {
    primaryBusiness = 'HYBRID';
    detectedNiche = 'Hybrid Retail & Service Store';
    chips = [
      'Add both Product Storefront and Booking Appointment sections',
      'Highlight bestsellers alongside top-rated services',
      'Add customer support live chat and WhatsApp ordering',
    ];
  }

  const sampleProducts = productsList.slice(0, 6).map(p => ({
    id: p.id || '',
    title: p.title || p.name || 'Featured Item',
    price: Number(p.price) || 0,
    category: p.category?.name || p.categoryName || undefined,
  }));

  return {
    storeId,
    storeName: storeDetails?.storeName || storeDetails?.name || 'Orcayo Store',
    primaryBusiness,
    detectedNiche,
    capabilities: {
      hasProducts: productsList.length > 0,
      hasCustomOrders: isCustomBespoke,
      hasBookings: bookingSlotsList.length > 0 || isAppointmentService,
      hasRentals: rentalsList.length > 0 || isRentalService,
      productCount: productsList.length,
      bookingSlotsCount: bookingSlotsList.length,
      rentalAssetsCount: rentalsList.length,
    },
    sampleItems: {
      products: sampleProducts,
      services: bookingSlotsList.slice(0, 4).map(b => ({ title: b.name || b.title || 'Service Slot', duration: b.duration || '45 mins' })),
      rentals: rentalsList.slice(0, 4).map(r => ({ title: r.name || r.title || 'Rental Asset', dailyRate: r.dailyRate || r.price || 50 })),
    },
    actionableLinks: {
      catalog: '/storefront/products',
      bookings: '/storefront/bookings',
      rentals: '/storefront/products?category=rentals',
      cart: '#cart',
      checkout: '/storefront/checkout',
      chat: '#customer-chat',
    },
    suggestedPromptChips: chips,
  };
}
