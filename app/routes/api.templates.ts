import { requireAuth } from '../lib/auth.server';
import { prisma } from '../lib/database.server';
import { normalizeThemeLayout } from '../lib/component-tree';
import { NICHE_TEMPLATES } from '../builder/templates';

const SALON_SECTIONS_DEFAULT = [
  { 
    id: 'section-hero', 
    type: 'hero', 
    label: 'Hero Banner', 
    visible: true, 
    settings: {}, 
    blocks: [
      { id: 'hero-block-headline', type: 'headline', settings: { text: 'Elevate Your Look. Define Your Style.', fontSize: 48, color: '#f1f5ff' } },
      { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Expert artistic cutting, premium color, and personalized care.', fontSize: 16, color: '#9ba3c0' } },
      { id: 'hero-block-button', type: 'button', settings: { text: 'Book Appointment →', link: '/storefront/bookings', color: '#6366f1', textColor: '#ffffff', borderRadius: 8 } }
    ] 
  },
  { 
    id: 'section-services', 
    type: 'services-list', 
    label: 'Services Menu', 
    visible: true, 
    settings: {
      title: 'Signature Treatments',
      subtitle: 'Experience our professional, luxurious options',
      services: [
        { name: 'Signature Cut & Styling', price: '$85', description: 'Precision dry or wet cut, deep clarifying wash, and signature blowout.' },
        { name: 'Luxury Eyelash Full-Set', price: '$150', description: 'Couture full-set silk lash extensions hand-crafted for daily definition.' },
        { name: 'Organic Hydration Facial', price: '$95', description: 'Double cleanse, botanical enzyme peel, facial massage, and moisture mask.' },
        { name: 'Balayage Color Melt', price: '$180+', description: 'Custom hand-painted multidimensional highlights and gloss treatment.' }
      ]
    }
  },
  { id: 'section-booking',    type: 'booking-calendar',  label: 'Booking Calendar',    visible: true,  settings: {} },
  { id: 'section-products',   type: 'featured-products', label: 'Featured Products',   visible: true,  settings: { count: 4 } },
  { id: 'section-testimonials', type: 'testimonials',    label: 'Testimonials',        visible: true,  settings: {} },
  { id: 'section-footer',     type: 'footer',            label: 'Footer',              visible: true,  settings: {} },
];

const PREMIUM_TEMPLATES = [
  {
    title: 'Christmas Wonderland Holiday Sale',
    description: 'Festive crimson red, pine green & snowy gold accents. High-converting seasonal flash sale countdown, gift bundles, and winter holiday hero.',
    occasion: 'CHRISTMAS',
    themeData: JSON.stringify({
      occasion: 'CHRISTMAS',
      colorPrimary: '#c41e3a',
      colorSecondary: '#165b33',
      colorAccent: '#f8b229',
      colorBackground: '#0b1610',
      colorSurface: '#12261a',
      colorText: '#ffffff',
      colorTextMuted: '#a3c2b0',
      fontBody: 'Inter',
      fontHeading: 'Playfair Display',
      baseFontSize: 15,
      borderRadius: 12,
      buttonRadius: 99,
      containerWidth: 1200,
      headerSticky: true,
      glassStrength: 80,
      storeName: 'Christmas Holiday Boutique',
      logoUrl: '',
      heroHeadline: 'Magical Holiday Savings are Here 🎄',
      heroSubheadline: 'Unwrap up to 50% off holiday gift bundles, exclusive festive items, and limited-edition seasonal treats.',
      heroImage: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?q=80&w=1200&auto=format&fit=crop',
      sections: [
        {
          id: 'section-hero',
          type: 'hero',
          label: 'Holiday Hero Banner',
          visible: true,
          settings: {},
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'Magical Holiday Savings are Here 🎄', fontSize: 50, color: '#f8b229', textAlign: 'center' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Unwrap up to 50% off holiday bundles and limited-edition seasonal favorites.', fontSize: 16, color: '#ffffff', textAlign: 'center' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Shop Holiday Deals 🎁', link: '/storefront/products', color: '#c41e3a', textColor: '#ffffff', borderRadius: 99, textAlign: 'center' } }
          ]
        },
        { id: 'section-products', type: 'featured-products', label: 'Holiday Gift Ideas', visible: true, settings: { count: 8 } },
        { id: 'section-testimonials', type: 'testimonials', label: 'Holiday Reviews', visible: true, settings: {} },
        { id: 'section-footer', type: 'footer', label: 'Footer', visible: true, settings: {} }
      ],
      productsPageHeaderTitle: 'Christmas Gift Guide',
      productsPageHeaderDesc: 'Special limited seasonal stock and holiday promotional discounts.',
    }),
  },
  {
    title: 'New Year Countdown Flash Store',
    description: 'Electric celebratory midnight obsidian, champagne sparkle gold, and neon silver styling. Perfect for new year resolutions and celebratory sales.',
    occasion: 'NEW_YEAR',
    themeData: JSON.stringify({
      occasion: 'NEW_YEAR',
      colorPrimary: '#ffd700',
      colorSecondary: '#c0c0c0',
      colorAccent: '#ff3366',
      colorBackground: '#0a0a0f',
      colorSurface: '#14141e',
      colorText: '#ffffff',
      colorTextMuted: '#9e9eb0',
      fontBody: 'Plus Jakarta Sans',
      fontHeading: 'Space Grotesk',
      baseFontSize: 15,
      borderRadius: 8,
      buttonRadius: 8,
      containerWidth: 1240,
      headerSticky: true,
      glassStrength: 85,
      storeName: 'New Year Grand Sale',
      logoUrl: '',
      heroHeadline: 'Step into the New Year in Style ✨',
      heroSubheadline: 'Ring in the year with exclusive discounts, fresh collections, and celebratory storewide specials.',
      heroImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
      sections: [
        {
          id: 'section-hero',
          type: 'hero',
          label: 'New Year Celebration Banner',
          visible: true,
          settings: {},
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'New Year, New Energy ✨', fontSize: 52, color: '#ffd700', textAlign: 'center' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Limited-time countdown discounts across all our top products.', fontSize: 16, color: '#c0c0c0', textAlign: 'center' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Explore New Year Deals →', link: '/storefront/products', color: '#ffd700', textColor: '#0a0a0f', borderRadius: 8, textAlign: 'center' } }
          ]
        },
        { id: 'section-products', type: 'featured-products', label: 'Featured Collections', visible: true, settings: { count: 8 } },
        { id: 'section-footer', type: 'footer', label: 'Footer', visible: true, settings: {} }
      ],
      productsPageHeaderTitle: 'New Year Collection',
      productsPageHeaderDesc: 'Curated promotional specials to kick off the new season.',
    }),
  },
  {
    title: 'Eid Mubarak Festive Bazaar',
    description: 'Emerald green, regal sapphire & radiant gold arabesque typography. Designed for Eid-ul-Fitr and Eid-ul-Adha festive collections and family gift sales.',
    occasion: 'EID',
    themeData: JSON.stringify({
      occasion: 'EID',
      colorPrimary: '#046307',
      colorSecondary: '#c8963e',
      colorAccent: '#e8c547',
      colorBackground: '#041d08',
      colorSurface: '#08320e',
      colorText: '#ffffff',
      colorTextMuted: '#97c79a',
      fontBody: 'Lora',
      fontHeading: 'Playfair Display',
      baseFontSize: 16,
      borderRadius: 16,
      buttonRadius: 99,
      containerWidth: 1200,
      headerSticky: true,
      glassStrength: 75,
      storeName: 'Eid Festive Boutique',
      logoUrl: '',
      heroHeadline: 'Eid Mubarak! Celebrate With Festive Deals 🌙',
      heroSubheadline: 'Handpicked festive attire, premium gift baskets, and joy-filled discounts for family and friends.',
      heroImage: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?q=80&w=1200&auto=format&fit=crop',
      sections: [
        {
          id: 'section-hero',
          type: 'hero',
          label: 'Festive Eid Banner',
          visible: true,
          settings: {},
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'Eid Mubarak! Celebrate with Us 🌙', fontSize: 48, color: '#e8c547', textAlign: 'center' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Explore premium festive specials, holiday gift sets, and joyous savings.', fontSize: 16, color: '#ffffff', textAlign: 'center' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Browse Eid Collection ✦', link: '/storefront/products', color: '#c8963e', textColor: '#041d08', borderRadius: 99, textAlign: 'center' } }
          ]
        },
        { id: 'section-products', type: 'featured-products', label: 'Eid Specials', visible: true, settings: { count: 8 } },
        { id: 'section-testimonials', type: 'testimonials', label: 'Festive Testimonials', visible: true, settings: {} },
        { id: 'section-footer', type: 'footer', label: 'Footer', visible: true, settings: {} }
      ],
      productsPageHeaderTitle: 'Eid Festive Goods',
      productsPageHeaderDesc: 'Curated collections to celebrate Eid in elegance and joy.',
    }),
  },
  {
    title: 'Ramadan Kareem Spiritual Essentials',
    description: 'Serene midnight indigo & warm crescent lantern amber. Designed for Ramadan specials, iftar goods, prayer accessories, and charitable shopping.',
    occasion: 'RAMADAN',
    themeData: JSON.stringify({
      occasion: 'RAMADAN',
      colorPrimary: '#d4af37',
      colorSecondary: '#1e3d59',
      colorAccent: '#f5f0e1',
      colorBackground: '#0c141f',
      colorSurface: '#152232',
      colorText: '#f5f0e1',
      colorTextMuted: '#94a7bd',
      fontBody: 'Inter',
      fontHeading: 'Playfair Display',
      baseFontSize: 15,
      borderRadius: 12,
      buttonRadius: 10,
      containerWidth: 1200,
      headerSticky: true,
      glassStrength: 70,
      storeName: 'Ramadan Kareem Store',
      logoUrl: '',
      heroHeadline: 'Welcoming the Blessed Month of Ramadan 🌙',
      heroSubheadline: 'Experience peaceful serenity with our Ramadan specials, curated gift boxes, and daily essentials.',
      heroImage: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=1200&auto=format&fit=crop',
      sections: [
        {
          id: 'section-hero',
          type: 'hero',
          label: 'Ramadan Kareem Banner',
          visible: true,
          settings: {},
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'Ramadan Kareem Specials 🌙', fontSize: 48, color: '#d4af37', textAlign: 'center' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Blessings & discounts on curated seasonal items and family gift sets.', fontSize: 16, color: '#f5f0e1', textAlign: 'center' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Shop Ramadan Essentials', link: '/storefront/products', color: '#d4af37', textColor: '#0c141f', borderRadius: 10, textAlign: 'center' } }
          ]
        },
        { id: 'section-products', type: 'featured-products', label: 'Blessed Deals', visible: true, settings: { count: 8 } },
        { id: 'section-footer', type: 'footer', label: 'Footer', visible: true, settings: {} }
      ],
      productsPageHeaderTitle: 'Ramadan Specials',
      productsPageHeaderDesc: 'Quality items curated for the blessed month of Ramadan.',
    }),
  },

  {
    title: 'Jacqueline Jet Black Luxury',
    description: 'High-contrast black & royal metallic gold, serif Playfair headlines, and premium minimal outlines. Built for elite salons.',
    themeData: JSON.stringify({
      colorPrimary: '#d4af37',
      colorSecondary: '#aa7c11',
      colorAccent: '#f3e5ab',
      colorBackground: '#0a0a0c',
      colorSurface: '#121216',
      colorText: '#fafafa',
      colorTextMuted: '#8e8e93',
      fontBody: 'Inter',
      fontHeading: 'Playfair Display',
      baseFontSize: 15,
      borderRadius: 4,
      buttonRadius: 0,
      containerWidth: 1200,
      headerSticky: true,
      glassStrength: 80,
      storeName: 'Jacqueline Jet Black',
      logoUrl: '',
      heroHeadline: 'Luxury Defined. Beauty Redefined.',
      heroSubheadline: 'Indulge in a bespoke pampering experience crafted by elite master artists in our private sanctuary.',
      heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop',
      sections: [
        { 
          id: 'section-hero', 
          type: 'hero', 
          label: 'Hero Banner', 
          visible: true, 
          settings: {}, 
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'Luxury Defined. Beauty Redefined.', fontSize: 52, color: '#fafafa', textAlign: 'center' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Indulge in a bespoke pampering experience crafted by elite master artists.', fontSize: 16, color: '#8e8e93', textAlign: 'center' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Reserve Appointment', link: '/storefront/bookings', color: '#d4af37', textColor: '#0a0a0c', borderRadius: 0, textAlign: 'center' } }
          ] 
        },
        { 
          id: 'section-services', 
          type: 'services-list', 
          label: 'Services Menu', 
          visible: true, 
          settings: {
            title: 'Signature Salon Treatments',
            subtitle: 'Bespoke precision beauty options',
            services: [
              { name: 'Master Artist Precision Cut', price: '$95', description: 'Wet cut, structural styling, deep wash, and custom texturized styling blowout.' },
              { name: 'French Balayage & Melt', price: '$180+', description: 'Multi-tonal hand-painted highlights, custom toner, and shine lock therapy.' },
              { name: 'Couture Full-Set Extensions', price: '$350', description: 'Premium premium weightless hair extensions applied by certified specialists.' },
              { name: 'Aromatic Scalp Nourish Ritual', price: '$65', description: 'Scalp stimulation massage, herbal oils, steam detox, and blowout styling.' }
            ]
          }
        },
        { id: 'section-booking',    type: 'booking-calendar',  label: 'Booking Calendar',    visible: true,  settings: {} },
        { id: 'section-products',   type: 'featured-products', label: 'Featured Products',   visible: true,  settings: { count: 4 } },
        { id: 'section-testimonials', type: 'testimonials',    label: 'Testimonials',        visible: true,  settings: {} },
        { id: 'section-footer',     type: 'footer',            label: 'Footer',              visible: true,  settings: {} },
      ],
      productsPageHeaderTitle: 'Luxury Salon Care',
      productsPageHeaderDesc: 'Curated premium items used and recommended by our elite master stylists.',
      aboutPageTitle: 'Our Heritage',
      aboutPageDesc: 'Sanctuary of exceptional style and artistry.',
      aboutPageStory: 'For over two decades, Jacqueline has been the premier destination for discerning individuals seeking a sanctuary of style. Our philosophy blends technical mastery with tailored artistic vision to deliver high-touch service.',
      aboutPageMission: 'To design a flawless, custom pampering experience that leaves you refreshed, fully confident, and meticulously styled.',
      contactPageHeadline: 'Enter the Sanctuary',
      contactPageAddress: '500 Park Avenue, Penthouse Level, New York, NY',
      contactPagePhone: '+1 (212) 555-0199',
      contactPageEmail: 'concierge@jacqueline-black.com'
    }),
  },
  {
    title: "L'Elixir Calm Wellness Spa",
    description: 'Calming botanical eucalyptus sage & organic sand beige. Highly rounded borders and relaxing cormorant serif headers. Built for wellness spas.',
    themeData: JSON.stringify({
      colorPrimary: '#4a5d4e',
      colorSecondary: '#8ba893',
      colorAccent: '#d9c3b0',
      colorBackground: '#faf8f5',
      colorSurface: '#ffffff',
      colorText: '#2c3531',
      colorTextMuted: '#708070',
      fontBody: 'Lora',
      fontHeading: 'Cormorant Garamond',
      baseFontSize: 16,
      borderRadius: 24,
      buttonRadius: 99,
      containerWidth: 1100,
      headerSticky: true,
      glassStrength: 45,
      storeName: "L'Elixir Wellness & Spa",
      logoUrl: '',
      heroHeadline: 'Tranquility for the Body & Mind',
      heroSubheadline: 'A modern organic sanctuary dedicated to restoring your inner equilibrium with therapeutic, clean botanical treatments.',
      heroImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop',
      sections: [
        { 
          id: 'section-hero', 
          type: 'hero', 
          label: 'Hero Banner', 
          visible: true, 
          settings: {}, 
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'Tranquility for the Body & Mind', fontSize: 48, color: '#2c3531', textAlign: 'center' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'A modern organic sanctuary dedicated to restoring your inner equilibrium with clean botanical care.', fontSize: 16, color: '#708070', textAlign: 'center' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Reserve Session', link: '/storefront/bookings', color: '#4a5d4e', textColor: '#ffffff', borderRadius: 99, textAlign: 'center' } }
          ] 
        },
        { 
          id: 'section-services', 
          type: 'services-list', 
          label: 'Services Menu', 
          visible: true, 
          settings: {
            title: 'Holistic Spa Menu',
            subtitle: 'Naturally restorative botanical wellness sessions',
            services: [
              { name: 'Aromatherapy Deep Massage', price: '$125', description: 'Swedish-style therapeutic massage infused with clean organic lavender and eucalyptus oils.' },
              { name: 'Botanical Skin Renewal Facial', price: '$110', description: 'Double clarify, herbal extract vapor steam, natural fruit enzyme peel, and floral mask.' },
              { name: 'Hot Stone Laurel Ritual', price: '$145', description: 'Penetrating heated basalt stones paired with full-body muscle tension release therapy.' },
              { name: 'Detoxifying Clay Foot Soak', price: '$65', description: 'Mineral-rich Dead Sea clay soak, organic lavender exfoliation, and targeted massage.' }
            ]
          }
        },
        { id: 'section-booking',    type: 'booking-calendar',  label: 'Booking Calendar',    visible: true,  settings: {} },
        { id: 'section-products',   type: 'featured-products', label: 'Featured Products',   visible: true,  settings: { count: 4 } },
        { id: 'section-testimonials', type: 'testimonials',    label: 'Testimonials',        visible: true,  settings: {} },
        { id: 'section-footer',     type: 'footer',            label: 'Footer',              visible: true,  settings: {} },
      ],
      productsPageHeaderTitle: 'Clean Organic Apothecary',
      productsPageHeaderDesc: 'Pure botanicals, chemical-free body scrubs, and clean essential oils crafted with love.',
      aboutPageTitle: 'Our Philosophy',
      aboutPageDesc: 'Connecting body, soul, and botanical harmony.',
      aboutPageStory: 'L\'Elixir was born from a simple desire: to reconnect the busy modern soul with the restorative power of nature. We use exclusively certified organic, cruelty-free botanicals.',
      aboutPageMission: 'To provide a calm, botanical haven that heals the spirit, calms the mind, and revitalizes the skin naturally.',
      contactPageHeadline: 'Find Your Haven',
      contactPageAddress: '120 Whispering Pines Lane, Boulder, CO',
      contactPagePhone: '+1 (303) 555-0144',
      contactPageEmail: 'calm@lelixirspa.com'
    }),
  },
  {
    title: 'FreeVision Chic Hair Studio',
    description: 'Electric rose gold & ultraviolet neon. Indigo canvas, space-age grooved borders, and modern layout. Designed for trendy hair salons.',
    themeData: JSON.stringify({
      colorPrimary: '#ff4b7d',
      colorSecondary: '#8a2be2',
      colorAccent: '#00f5ff',
      colorBackground: '#0c0714',
      colorSurface: '#1b112c',
      colorText: '#ffffff',
      colorTextMuted: '#b3a2cd',
      fontBody: 'Plus Jakarta Sans',
      fontHeading: 'Space Grotesk',
      baseFontSize: 15,
      borderRadius: 10,
      buttonRadius: 8,
      containerWidth: 1240,
      headerSticky: false,
      glassStrength: 65,
      storeName: 'FreeVision Hair Studio',
      logoUrl: '',
      heroHeadline: 'Own Your Style. Rock Your Vibe.',
      heroSubheadline: 'Next-gen cuts, custom vibrant color melts, and luxury extensions. The ultimate hub for trendsetters.',
      heroImage: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1200&auto=format&fit=crop',
      sections: [
        { 
          id: 'section-hero', 
          type: 'hero', 
          label: 'Hero Banner', 
          visible: true, 
          settings: {}, 
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'Own Your Style. Rock Your Vibe.', fontSize: 48, color: '#ffffff' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Next-gen cuts, custom vibrant color melts, and luxury extensions designed for trendsetters.', fontSize: 16, color: '#b3a2cd' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Lock In My Spot ⚡', link: '/storefront/bookings', color: '#ff4b7d', textColor: '#ffffff', borderRadius: 8 } }
          ] 
        },
        { 
          id: 'section-services', 
          type: 'services-list', 
          label: 'Services Menu', 
          visible: true, 
          settings: {
            title: 'Studio Creative Menu',
            subtitle: 'Bold color melting and high-fashion styling',
            services: [
              { name: 'Vibrant Neon Color Melt', price: '$210', description: 'Bleach out, custom vivid color formulations, gloss glaze, and lock-in protect treatment.' },
              { name: 'Architectural Edge Cut', price: '$85', description: 'Texturized fringe cuts, precision layers, quick conditioning, and high-volume style.' },
              { name: 'Couture Tape-In Extensions', price: '$350', description: 'Premium human-hair tape-ins, blending cut, styling, and care kit.' },
              { name: 'Keratin Damage Recovery', price: '$130', description: 'Deep fiber re-bouding treatment, blow dry styling, and post-care mask.' }
            ]
          }
        },
        { id: 'section-booking',    type: 'booking-calendar',  label: 'Booking Calendar',    visible: true,  settings: {} },
        { id: 'section-products',   type: 'featured-products', label: 'Featured Products',   visible: true,  settings: { count: 4 } },
        { id: 'section-testimonials', type: 'testimonials',    label: 'Testimonials',        visible: true,  settings: {} },
        { id: 'section-footer',     type: 'footer',            label: 'Footer',              visible: true,  settings: {} },
      ],
      productsPageHeaderTitle: 'Vibrant Styling Lab',
      productsPageHeaderDesc: 'Vivid color-safe sprays, structural texturizers, and extreme-performance shine oils.',
      aboutPageTitle: 'Who We Are',
      aboutPageDesc: 'Award-winning colorists and trendsetting stylists.',
      aboutPageStory: 'FreeVision is more than a hair studio; it\'s a creative playground. Founded by award-winning colorists, we break standard styling rules and set global hair trends.',
      aboutPageMission: 'To empower our clients to express their boldest unique identity through vibrant, high-performance hair art.',
      contactPageHeadline: 'Get Loud',
      contactPageAddress: '842 Broadway Street, East Village, New York, NY',
      contactPagePhone: '+1 (646) 555-0182',
      contactPageEmail: 'hello@freevisionsalon.com'
    }),
  },
  {
    title: 'Chérie Vintage Beauty Bar',
    description: 'Soft terracotta & blush peach. editorial beige linen background, vintage borders, and classic elegant spacing. Designed for eyelash and makeup studios.',
    themeData: JSON.stringify({
      colorPrimary: '#c97f78',
      colorSecondary: '#e2b49a',
      colorAccent: '#4a3e3d',
      colorBackground: '#fdfbf7',
      colorSurface: '#f7f1eb',
      colorText: '#2a2423',
      colorTextMuted: '#8c7b79',
      fontBody: 'Lora',
      fontHeading: 'Playfair Display',
      baseFontSize: 16,
      borderRadius: 0,
      buttonRadius: 0,
      containerWidth: 1200,
      headerSticky: true,
      glassStrength: 50,
      storeName: 'Chérie Beauty Bar',
      logoUrl: '',
      heroHeadline: 'Timeless Charm. Exquisite Details.',
      heroSubheadline: 'Curated brow architecture, delicate lash extensions, and custom skin rituals designed for the classic romantic.',
      heroImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop',
      sections: [
        { 
          id: 'section-hero', 
          type: 'hero', 
          label: 'Hero Banner', 
          visible: true, 
          settings: {}, 
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'Timeless Charm. Exquisite Details.', fontSize: 48, color: '#2a2423', textAlign: 'center' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Bespoke brow curation, couture eyelash extensions, and natural skin rituals.', fontSize: 16, color: '#8c7b79', textAlign: 'center' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Book A Consultation', link: '/storefront/bookings', color: '#c97f78', textColor: '#fdfbf7', borderRadius: 0, textAlign: 'center' } }
          ] 
        },
        { 
          id: 'section-services', 
          type: 'services-list', 
          label: 'Services Menu', 
          visible: true, 
          settings: {
            title: 'Bespoke Beauty Menu',
            subtitle: 'Exquisite attention to classic, delicate features',
            services: [
              { name: 'Brow Lamination & Tint', price: '$85', description: 'Precise architectural mapping, gentle lamination, organic custom tinting, and botanical wax.' },
              { name: 'Custom Lash Lift & Tint', price: '$70', description: 'Keratin-infused lifting process paired with organic dark lash tint for effortless length.' },
              { name: 'Couture Eyelash Full-Set', price: '$160', description: 'Delicate silk extensions individually applied for premium, weightless definition.' },
              { name: 'Rosewater Glow Ritual', price: '$105', description: 'Double rosewater facial cleanse, herbal massage, and deep moisture botanical glow.' }
            ]
          }
        },
        { id: 'section-booking',    type: 'booking-calendar',  label: 'Booking Calendar',    visible: true,  settings: {} },
        { id: 'section-products',   type: 'featured-products', label: 'Featured Products',   visible: true,  settings: { count: 4 } },
        { id: 'section-testimonials', type: 'testimonials',    label: 'Testimonials',        visible: true,  settings: {} },
        { id: 'section-footer',     type: 'footer',            label: 'Footer',              visible: true,  settings: {} },
      ],
      productsPageHeaderTitle: 'Editorial Cosmetics Shelf',
      productsPageHeaderDesc: 'Nourishing organic botanical eyelash serums, organic cheek stains, and classic beauty tools.',
      aboutPageTitle: 'Our Story',
      aboutPageDesc: 'Escape the city rush into natural romantic elegance.',
      aboutPageStory: 'Chérie is an editorial beauty lounge designed as a quiet escape from the city rush. We believe beauty is in the delicate details—a perfect brow line, a subtle glow, a quiet offline moment.',
      aboutPageMission: 'To celebrate your natural elegance by providing highly precise, high-fashion beauty enhancements.',
      contactPageHeadline: 'Visit Chérie',
      contactPageAddress: '412 Melrose Ave, West Hollywood, CA',
      contactPagePhone: '+1 (310) 555-0163',
      contactPageEmail: 'muse@cheriebeauty.com'
    }),
  },
  {
    title: 'Curls & Co. Barber Boutique',
    description: 'Deep roasted hazelnut & warm honey amber. Espresso black canvas, mahogany borders, and heritage traditional styling. Designed for barbers and curl salons.',
    themeData: JSON.stringify({
      colorPrimary: '#895129',
      colorSecondary: '#c08a3e',
      colorAccent: '#e7c8a0',
      colorBackground: '#1c120c',
      colorSurface: '#2c1e15',
      colorText: '#fcf9f6',
      colorTextMuted: '#a99282',
      fontBody: 'Inter',
      fontHeading: 'Playfair Display',
      baseFontSize: 15,
      borderRadius: 8,
      buttonRadius: 4,
      containerWidth: 1200,
      headerSticky: true,
      glassStrength: 75,
      storeName: 'Curls & Co. Boutique',
      logoUrl: '',
      heroHeadline: 'Celebrate Your Natural Textures',
      heroSubheadline: 'Premium specialized curl care, artisan beard grooming, and custom organic moisture therapy. Crafted for natural beauty.',
      heroImage: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200&auto=format&fit=crop',
      sections: [
        { 
          id: 'section-hero', 
          type: 'hero', 
          label: 'Hero Banner', 
          visible: true, 
          settings: {}, 
          blocks: [
            { id: 'hero-block-headline', type: 'headline', settings: { text: 'Celebrate Your Natural Textures', fontSize: 48, color: '#fcf9f6', textAlign: 'center' } },
            { id: 'hero-block-paragraph', type: 'paragraph', settings: { text: 'Specialized curl hydration treatments, hot towel shaves, and custom heritage styling.', fontSize: 16, color: '#a99282', textAlign: 'center' } },
            { id: 'hero-block-button', type: 'button', settings: { text: 'Secure Seat 🥃', link: '/storefront/bookings', color: '#c08a3e', textColor: '#1c120c', borderRadius: 4, textAlign: 'center' } }
          ] 
        },
        { 
          id: 'section-services', 
          type: 'services-list', 
          label: 'Services Menu', 
          visible: true, 
          settings: {
            title: 'Specialized Curl Menu',
            subtitle: 'Precision curl texture styling and grooming',
            services: [
              { name: 'DevaCurl Architectural Cut', price: '$110', description: 'Texture mapping dry cut, curl botanical wash, and customized hydration shaping.' },
              { name: 'Deep Moisture Coil Therapy', price: '$85', description: 'Organic botanical steam bath, deep conditioning mask, and curl locking styling.' },
              { name: 'Hot Towel Artisan Groom', price: '$60', description: 'Precision beard trim, essential oil pre-shave, straight razor clean edges, and cooling compress.' },
              { name: 'Scalp Invigorating Detox', price: '$45', description: 'Scalp scrub exfoliation, tea tree oil massage, and targeted moisture mask.' }
            ]
          }
        },
        { id: 'section-booking',    type: 'booking-calendar',  label: 'Booking Calendar',    visible: true,  settings: {} },
        { id: 'section-products',   type: 'featured-products', label: 'Featured Products',   visible: true,  settings: { count: 4 } },
        { id: 'section-testimonials', type: 'testimonials',    label: 'Testimonials',        visible: true,  settings: {} },
        { id: 'section-footer',     type: 'footer',            label: 'Footer',              visible: true,  settings: {} },
      ],
      productsPageHeaderTitle: 'Heritage Grooming Goods',
      productsPageHeaderDesc: 'Curl-defining cremes, high-hydration botanical conditioners, and organic roasted-hazelnut beard elixirs.',
      aboutPageTitle: 'Our Heritage',
      aboutPageDesc: 'Artistic textured curl care and high-end grooming.',
      aboutPageStory: 'Curls & Co. began with a simple mission: to master the art of natural textured hair and traditional barber grooming. Our texture specialists are trained in the advanced science of curl architecture.',
      aboutPageMission: 'To foster a cozy, welcoming community hub where every curl, coil, and beard is treated with absolute respect and advanced styling care.',
      contactPageHeadline: 'Find the Shop',
      contactPageAddress: '710 Heritage Boulevard, Suite B, Austin, TX',
      contactPagePhone: '+1 (512) 555-0177',
      contactPageEmail: 'shop@curlsandco.com'
    }),
  }
];

import { handlePreflight, jsonWithCors } from '../lib/cors.server';

export async function loader({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  // Ensure the request is authorized
  await requireAuth(request);

  try {
    // 1. Dynamic Upsert: Seed or update high-value niche templates with native GrapesJS v1 structure
    console.log('[Templates API] Synchronizing high-value niche templates database...');
    for (const t of NICHE_TEMPLATES) {
      const grapesThemeData = JSON.stringify({
        version: 'grapesjs-v1',
        storeName: t.title,
        occasion: t.occasion,
        niche: t.niche,
        html: t.html,
        css: t.css,
      });

      const existing = await prisma.template.findFirst({
        where: { title: t.title }
      });
      if (existing) {
        await prisma.template.update({
          where: { id: existing.id },
          data: {
            description: t.description,
            themeData: grapesThemeData,
          }
        });
      } else {
        await prisma.template.create({
          data: {
            title: t.title,
            description: t.description,
            themeData: grapesThemeData,
          }
        });
      }
    }

    // 2. Retrieve seeded templates
    const templates = await prisma.template.findMany({
      where: {
        title: { in: NICHE_TEMPLATES.map(nt => nt.title) }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Match exactly the property names expected by Next.js Frontend
    const formattedTemplates = templates.map((t: any) => {
      let occasion = 'GENERAL';
      let niche = 'General';
      let previewImageUrl = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';
      
      try {
        const parsed = JSON.parse(t.themeData);
        if (parsed.occasion) occasion = parsed.occasion;
        if (parsed.niche) niche = parsed.niche;
      } catch {}

      const def = NICHE_TEMPLATES.find(nt => nt.title === t.title);
      if (def) {
        previewImageUrl = def.previewImageUrl;
        occasion = def.occasion;
        niche = def.niche;
      }

      return {
        id: t.id,
        niche,
        occasion,
        previewImageUrl,
        screenshotUrl: previewImageUrl,
        title: t.title,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });

    return jsonWithCors({
      templates: formattedTemplates,
      pagination: {
        offset: 0,
        limit: 10,
        total: formattedTemplates.length,
        nextOffset: formattedTemplates.length,
      },
      hasMore: false,
    }, request);
  } catch (error: any) {
    console.error('[Templates API] Error:', error);
    return jsonWithCors({ error: error.message }, request, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return jsonWithCors({ error: 'Method Not Allowed' }, request, { status: 405 });
}
