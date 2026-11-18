/**
 * Server-side Store Knowledge Engine
 * Dynamically queries Store, Products, and Booking services via direct PostgreSQL
 * and REST APIs to construct an accurate, up-to-date business knowledge profile.
 */

import { prisma } from '../../lib/database.server';

export interface StoreProductItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price: number | string;
  productType: 'PHYSICAL' | 'SERVICE' | 'RENTAL' | string;
  category?: string;
  imageUrl?: string;
  bookable?: boolean;
  duration?: number;
  durationUnit?: string;
  providerName?: string;
}

export interface StoreKnowledge {
  storeId: string;
  storeName: string;
  businessName: string;
  industry: string;
  businessType: string;
  description: string;
  currency: string;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  allProducts: StoreProductItem[];
  physicalProducts: StoreProductItem[];
  services: StoreProductItem[];
  categories: string[];
  primaryBusiness: 'PHYSICAL_COMMERCE' | 'CUSTOM_SERVICES' | 'APPOINTMENT_SERVICES' | 'RENTALS' | 'HYBRID';
  detectedNiche: string;
  suggestedPromptChips: string[];
  cachedAt: number;
}

const knowledgeCache = new Map<string, StoreKnowledge>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function getStoreKnowledge(
  storeId: string,
  forceRefresh: boolean = false
): Promise<StoreKnowledge> {
  const cached = knowledgeCache.get(storeId);
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  let storeData: any = {};
  let productsRaw: any[] = [];

  // 1. Direct PostgreSQL Query (Instant & resilient)
  try {
    const storeRows: any = await prisma.$queryRawUnsafe(
      'SELECT id, name, "businessName", industry, "businessType", description, "preferredCurrency" as currency ' +
      'FROM store."store.stores" WHERE id = $1 LIMIT 1',
      storeId
    );
    if (Array.isArray(storeRows) && storeRows.length > 0) {
      storeData = storeRows[0];
    }

    const prodRows: any = await prisma.$queryRawUnsafe(
      'SELECT p.id, p.title, p.slug, p.description, p."productType", p.bookable, ' +
      'pv.price, pi.src as image_url ' +
      'FROM products.products p ' +
      'LEFT JOIN LATERAL (SELECT price FROM products.product_variants WHERE "productId" = p.id LIMIT 1) pv ON true ' +
      'LEFT JOIN LATERAL (SELECT src FROM products.product_images WHERE "productId" = p.id LIMIT 1) pi ON true ' +
      'WHERE p."storeId" = $1 ORDER BY p."createdAt" DESC',
      storeId
    );
    if (Array.isArray(prodRows) && prodRows.length > 0) {
      productsRaw = prodRows;
    }
  } catch (dbErr: any) {
    console.warn('[storeKnowledge] Direct DB query failed, trying microservices:', dbErr.message);
  }

  // 2. Microservice REST Fallbacks if DB was empty
  if (!storeData.name) {
    try {
      const sRes = await fetch(`http://127.0.0.1:3010/api/store/${encodeURIComponent(storeId)}`, {
        headers: {
          'x-store-id': storeId,
          'x-user-id': 'system',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (sRes.ok) {
        const json = await sRes.json();
        storeData = json.data || {};
      }
    } catch {}
  }

  if (productsRaw.length === 0) {
    try {
      const pRes = await fetch(`http://127.0.0.1:3006/api/products?page=1&limit=50`, {
        headers: {
          'x-store-id': storeId,
          'x-user-id': storeData.userId || 'system',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (pRes.ok) {
        const json = await pRes.json();
        productsRaw = json.data || [];
      }
    } catch {}
  }

  // Normalize products
  const categoriesSet = new Set<string>();
  const allProducts: StoreProductItem[] = productsRaw.map((p: any) => {
    const title = p.title || p.name || 'Product';
    const catName = p.category?.name || p.categoryName || (typeof p.category === 'string' ? p.category : undefined);
    if (catName) categoriesSet.add(catName);

    let price = 0;
    if (p.variants && p.variants.length > 0) {
      price = Number(p.variants[0].price) || 0;
    } else if (p.price !== undefined) {
      price = Number(p.price) || 0;
    }

    let imageUrl = '';
    if (p.images && p.images.length > 0) {
      imageUrl = p.images[0].src || p.images[0].url || '';
    } else if (p.image_url) {
      imageUrl = p.image_url;
    } else if (p.imageUrl) {
      imageUrl = p.imageUrl;
    }

    const rawType = (p.productType || p.product_type || (p.typeService ? 'SERVICE' : 'PHYSICAL')).toUpperCase();
    const isService = rawType.includes('SERVICE') || Boolean(p.bookable);

    return {
      id: p.id || '',
      title,
      slug: p.slug || p.id || '',
      description: p.description || '',
      price,
      productType: isService ? 'SERVICE' : 'PHYSICAL',
      category: catName,
      imageUrl: imageUrl || undefined,
      bookable: Boolean(p.bookable || isService),
      duration: p.typeService?.duration,
      durationUnit: p.typeService?.durationUnit || 'minutes',
      providerName: p.typeService?.providerName,
    };
  });

  const physicalProducts = allProducts.filter(p => p.productType === 'PHYSICAL');
  const services = allProducts.filter(p => p.productType === 'SERVICE' || p.bookable);

  const storeName = storeData.name || storeData.businessName || 'Paiish';
  const industry = storeData.industry || (physicalProducts.length > 0 ? 'Wholesale & Retail' : 'Custom Services');

  // Determine dynamic business classification & intelligent chips
  let primaryBusiness: StoreKnowledge['primaryBusiness'] = 'PHYSICAL_COMMERCE';
  let detectedNiche = `${storeName} (${industry})`;
  let chips: string[] = [];

  const hasApparel = physicalProducts.some(p => /hoodie|fleece|pullover|shirt|apparel/i.test(p.title));
  const hasCakes = allProducts.some(p => /cake|baking|topper|velvet/i.test(p.title));
  const hasSalon = services.some(p => /hair|styling|salon|cut/i.test(p.title));

  if (hasApparel && (hasCakes || hasSalon)) {
    primaryBusiness = 'HYBRID';
    detectedNiche = `${storeName} (Apparel & Bespoke Services)`;
    chips = [
      `Add a Featured Apparel Grid showcasing ${physicalProducts.filter(p => /hoodie/i.test(p.title)).slice(0, 2).map(p => p.title).join(' & ')}`,
      `Add a Bespoke Cake & Consultation booking showcase`,
      `Add Customer Reviews & Client Testimonials`,
    ];
  } else if (hasApparel) {
    primaryBusiness = 'PHYSICAL_COMMERCE';
    detectedNiche = `${storeName} (Streetwear & Apparel)`;
    chips = [
      `Add a Featured Products grid with quick-buy links`,
      `Add an Announcement Banner with seasonal discount`,
      `Add Customer Reviews and Quality guarantees`,
    ];
  } else if (hasCakes) {
    primaryBusiness = 'CUSTOM_SERVICES';
    detectedNiche = `${storeName} (Custom Cakes & Studio)`;
    chips = [
      `Add a Custom Cake Flavor & Size Consultation section`,
      `Add a Portfolio Gallery of custom celebration cakes`,
      `Add a WhatsApp direct ordering button`,
    ];
  } else if (hasSalon) {
    primaryBusiness = 'APPOINTMENT_SERVICES';
    detectedNiche = `${storeName} (Salon & Styling)`;
    chips = [
      `Add an appointment booking section with service menu`,
      `Add a Meet the Specialists / Team gallery`,
      `Add client transformations and testimonials`,
    ];
  } else {
    primaryBusiness = physicalProducts.length > 0 ? 'PHYSICAL_COMMERCE' : 'CUSTOM_SERVICES';
    detectedNiche = `${storeName} (${industry})`;
    chips = [
      `Add a Featured Showcase of our top offerings`,
      `Add an Inquiry & Contact form`,
      `Add Customer Testimonials and trust badges`,
    ];
  }

  const knowledge: StoreKnowledge = {
    storeId,
    storeName,
    businessName: storeData.businessName || storeName,
    industry,
    businessType: storeData.businessType || 'store',
    description: storeData.description || '',
    currency: storeData.currency || 'PKR',
    allProducts,
    physicalProducts,
    services,
    categories: Array.from(categoriesSet),
    primaryBusiness,
    detectedNiche,
    suggestedPromptChips: chips,
    cachedAt: Date.now(),
  };

  knowledgeCache.set(storeId, knowledge);
  return knowledge;
}

