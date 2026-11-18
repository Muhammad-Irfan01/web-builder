/**
 * GrapesJS Block Manifest & Generator for AI Assistant
 * Maps merchant design requests into concrete GrapesJS HTML/CSS blocks
 * automatically wired with real products, bookings, rentals, or cart triggers.
 */

import type { StoreKnowledge, StoreProductItem } from './storeKnowledge.server';
import type { StoreProfile } from './storeProfiler';

export interface GeneratedBlockPreview {
  blockId: string;
  category: string;
  title: string;
  description: string;
  html: string;
  css?: string;
}

export function generateBlockForIntent(
  intent: string,
  knowledge: StoreKnowledge | StoreProfile
): GeneratedBlockPreview {
  const lower = intent.toLowerCase();
  const storeName = knowledge.storeName || 'Paiish';
  const currency = ('currency' in knowledge ? knowledge.currency : 'PKR') || 'PKR';

  // Get physical products & services from knowledge
  const allProducts: StoreProductItem[] = ('allProducts' in knowledge ? knowledge.allProducts : []) || [];
  const physicalProducts: StoreProductItem[] = ('physicalProducts' in knowledge ? knowledge.physicalProducts : []) || [];
  const services: StoreProductItem[] = ('services' in knowledge ? knowledge.services : []) || [];

  // Fallback defaults if items list was empty
  const defaultHoodies = [
    {
      title: 'Unisex Heavyweight Full-Zip Hoodie',
      price: '5,900',
      slug: 'unisex-heavyweight-full-zip-hoodie',
      desc: 'Durable full-zip hoodie with custom antique nickel YKK metal zipper and thermal ribbed waistband.',
      tag: 'Best Seller',
    },
    {
      title: 'Women Cropped Fleece Hoodie',
      price: '5,400',
      slug: 'women-cropped-fleece-hoodie',
      desc: 'Chic cropped streetwear silhouette with relaxed dropped shoulders and plush brushed interior.',
      tag: 'Trending',
    },
    {
      title: 'Men Pullover Hoodie',
      price: '4,900',
      slug: 'men-pullover-hoodie',
      desc: 'Premium 400 GSM heavyweight cotton fleece pullover hoodie with double-lined drawstring hood.',
      tag: 'Essential',
    },
  ];

  // 1. REVIEWS / TESTIMONIALS
  if (lower.includes('review') || lower.includes('testimonial') || lower.includes('rating') || lower.includes('trust')) {
    return {
      blockId: 'ai-store-testimonials',
      category: 'Trust & Social Proof',
      title: `${storeName} Verified Customer Reviews`,
      description: 'Customer stories, 5-star ratings, and trust badges.',
      html: `
        <section style="padding: 70px 24px; background: #fafafa; font-family: Inter, sans-serif; text-align: center;">
          <div style="max-width: 1100px; margin: 0 auto;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; background: #e2e8f0; padding: 4px 12px; border-radius: 20px;">Real Experiences</span>
            <h2 style="font-size: 32px; color: #0f172a; margin: 16px 0 36px; font-weight: 800; letter-spacing: -0.5px;">Loved by Thousands of Customers</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; text-align: left;">
              <div style="background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">"The quality of the Heavyweight Full-Zip Hoodie exceeded all my expectations. The fabric is thick, durable, and holds its shape after dozens of washes."</p>
                <strong style="color: #0f172a; display: block; font-size: 14px;">Hamza R.</strong>
                <span style="color: #94a3b8; font-size: 12px;">Verified Buyer · Lahore</span>
              </div>
              <div style="background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">"Ordered custom celebration treats and the attention to detail was immaculate! Fast delivery and outstanding customer support on WhatsApp."</p>
                <strong style="color: #0f172a; display: block; font-size: 14px;">Ayesha M.</strong>
                <span style="color: #94a3b8; font-size: 12px;">Custom Order Client</span>
              </div>
              <div style="background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">"Seamless shopping experience from checkout to delivery. Easily one of the best independent streetwear & bespoke brands in the country."</p>
                <strong style="color: #0f172a; display: block; font-size: 14px;">Zaid K.</strong>
                <span style="color: #94a3b8; font-size: 12px;">Verified Buyer · Islamabad</span>
              </div>
            </div>
          </div>
        </section>
      `,
    };
  }

  // 2. CAKE / BESPOKE CRAFT / CELEBRATION CONSULTATION
  if (lower.includes('cake') || lower.includes('bake') || lower.includes('tasting') || lower.includes('topper') || lower.includes('bespoke order')) {
    const cakeItems = allProducts.filter(p => /cake|baking|tier|topper|tasting/i.test(p.title));
    const mainCake = cakeItems[0] || { title: 'Bespoke Celebration Cake Baking & Decorating', price: 60 };

    return {
      blockId: 'ai-custom-cake-showcase',
      category: 'Bespoke Services',
      title: `${storeName} Bespoke Celebration Cakes & Tasting`,
      description: 'Showcases custom cake designs, tasting sessions, and direct WhatsApp consultations.',
      html: `
        <section style="padding: 70px 24px; background: #fffcf9; font-family: Inter, sans-serif;">
          <div style="max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; align-items: center;">
            <div>
              <span style="background: #fef3c7; color: #b45309; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Artisan Confectionery</span>
              <h2 style="font-size: 36px; color: #1c1917; margin: 18px 0 16px; font-weight: 800; line-height: 1.2;">Handcrafted Celebration Cakes & Custom Tiers</h2>
              <p style="color: #57534e; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">From luxurious multi-tier wedding centerpieces to personalized birthday themes, our bespoke cake artists craft every creation with signature sponge recipes and handcrafted gold toppers.</p>
              <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                <a href="/storefront/bookings" style="background: #1c1917; color: #ffffff; padding: 14px 26px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Book Tasting Consultation (${currency} 50)</a>
                <a href="https://wa.me/?text=Hi%20${encodeURIComponent(storeName)}%2C%20I%20would%20like%20to%20inquire%20about%20a%20custom%20celebration%20cake" target="_blank" style="background: #16a34a; color: #ffffff; padding: 14px 26px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">Order via WhatsApp</a>
              </div>
            </div>
            <div style="background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #f2ece4; box-shadow: 0 10px 30px rgba(0,0,0,0.04); text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎂</div>
              <h3 style="font-size: 20px; color: #1c1917; margin: 0 0 8px; font-weight: 700;">${mainCake.title}</h3>
              <p style="color: #78716c; font-size: 14px; margin: 0 0 20px; line-height: 1.5;">Custom sponge tiers, velvet cream fillings, and personalized acrylic toppers tailored for your event.</p>
              <div style="font-size: 24px; font-weight: 800; color: #b45309; margin-bottom: 20px;">Starting at ${currency} ${mainCake.price}</div>
              <a href="/storefront/bookings" style="display: block; background: #b45309; color: #ffffff; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reserve Custom Cake Slot</a>
            </div>
          </div>
        </section>
      `,
    };
  }

  // 3. APPOINTMENTS / SALON / CLINIC / SERVICES
  if (lower.includes('appoint') || lower.includes('book') || lower.includes('salon') || lower.includes('hair') || lower.includes('styling') || lower.includes('service')) {
    const serviceItems = services.length > 0 ? services : [
      { title: 'Classic Haircut & Styling', price: 30, duration: 45 },
      { title: 'Custom Cake Consultation & Tasting', price: 50, duration: 45 },
    ];

    return {
      blockId: 'ai-appointment-services-block',
      category: 'Appointments & Booking',
      title: `${storeName} Service Menu & Booking Slots`,
      description: 'Service cards with live booking slots and duration details.',
      html: `
        <section style="padding: 70px 24px; background: #f8fafc; font-family: Inter, sans-serif; text-align: center;">
          <div style="max-width: 1040px; margin: 0 auto;">
            <span style="color: #0284c7; text-transform: uppercase; letter-spacing: 1.5px; font-size: 12px; font-weight: 700; background: #e0f2fe; padding: 4px 12px; border-radius: 20px;">Reserve a Slot</span>
            <h2 style="font-size: 34px; color: #0f172a; margin: 16px 0 12px; font-weight: 800;">Professional Services & Consultations</h2>
            <p style="color: #64748b; font-size: 16px; max-width: 600px; margin: 0 auto 40px;">Select your desired service, pick a convenient time slot, and receive instant confirmation.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 24px; text-align: left;">
              ${serviceItems.map(s => `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                  <h3 style="font-size: 18px; color: #0f172a; margin: 0 0 8px; font-weight: 700;">${s.title}</h3>
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 18px;">45 Minutes • Dedicated Specialist Session</p>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 22px; font-weight: 800; color: #0f172a;">${currency} ${s.price}</span>
                    <a href="/storefront/bookings" style="background: #0f172a; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">Book Now</a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `,
    };
  }

  // 4. DEFAULT & EXPLICIT: FEATURED APPAREL & PRODUCTS GRID
  // Uses the merchant's real hoodies or physical products
  const sortedPhysical = [...physicalProducts].sort((a, b) => {
    const aIsApparel = /hoodie|fleece|pullover|shirt|apparel/i.test(a.title) ? 1 : 0;
    const bIsApparel = /hoodie|fleece|pullover|shirt|apparel/i.test(b.title) ? 1 : 0;
    return bIsApparel - aIsApparel;
  });

  const displayProducts = physicalProducts.length > 0
    ? sortedPhysical.slice(0, 3).map((p, idx) => ({
        title: p.title,
        price: Number(p.price).toLocaleString(),
        slug: p.slug,
        desc: p.description || 'Premium heavyweight craftsmanship designed for daily comfort.',
        tag: idx === 0 ? 'Best Seller' : idx === 1 ? 'Trending' : 'Essential',
      }))
    : defaultHoodies;

  return {
    blockId: 'ai-featured-apparel-grid',
    category: 'Product Showcase',
    title: `${storeName} Featured Streetwear & Apparel Grid`,
    description: 'Grid of real store apparel items with pricing, badges, and quick-add links.',
    html: `
      <section style="padding: 70px 24px; background: #ffffff; font-family: Inter, sans-serif;">
        <div style="max-width: 1140px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; flex-wrap: wrap; gap: 16px;">
            <div>
              <span style="color: #4f46e5; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; background: #eef2ff; padding: 4px 12px; border-radius: 20px;">New Season Drop</span>
              <h2 style="font-size: 32px; color: #0f172a; margin: 12px 0 0; font-weight: 800; letter-spacing: -0.5px;">Featured Apparel Collection</h2>
            </div>
            <a href="/storefront/products" style="color: #0f172a; font-weight: 600; font-size: 14px; text-decoration: none;">View All Products →</a>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px;">
            ${displayProducts.map(item => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s;">
                <div style="height: 240px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; position: relative;">
                  <span style="position: absolute; top: 12px; left: 12px; background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;">${item.tag}</span>
                  <div style="font-size: 54px; opacity: 0.85;">🧥</div>
                </div>
                <div style="padding: 22px; flex: 1; display: flex; flex-direction: column;">
                  <h3 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">${item.title}</h3>
                  <p style="font-size: 13px; color: #64748b; margin: 0 0 16px; line-height: 1.5; flex: 1;">${item.desc}</p>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid #e2e8f0;">
                    <span style="font-size: 18px; font-weight: 800; color: #0f172a;">${currency} ${item.price}</span>
                    <a href="/storefront/product/${item.slug}" style="background: #0f172a; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">View Details</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `,
  };
}

