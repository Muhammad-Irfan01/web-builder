import { salonHtml, salonCss } from './salonTemplate';
import { spaHtml, spaCss } from './spaTemplate';
import { bakeryHtml, bakeryCss } from './bakeryTemplate';
import { carwashHtml, carwashCss } from './carwashTemplate';
import {
  christmasHtml, christmasCss,
  newyearHtml, newyearCss,
  eidHtml, eidCss,
  ramadanHtml, ramadanCss,
} from './occasionsTemplates';

export interface NicheTemplateDefinition {
  id: string;
  title: string;
  niche: 'Salon' | 'Spa' | 'Bakery' | 'Car Wash' | 'Seasonal';
  occasion: 'CHRISTMAS' | 'NEW_YEAR' | 'EID' | 'RAMADAN' | 'GENERAL';
  description: string;
  screenshotUrl: string;
  previewImageUrl: string;
  html: string;
  css: string;
}

export const NICHE_TEMPLATES: NicheTemplateDefinition[] = [
  {
    id: 'template-niche-salon',
    title: 'Aura Luxury Coiffure & Beauty Studio',
    niche: 'Salon',
    occasion: 'GENERAL',
    description: 'Gold & black minimalist aesthetic, haircut & color service grids, stylist rosters, and appointment booking form.',
    screenshotUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    previewImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    html: salonHtml,
    css: salonCss,
  },
  {
    id: 'template-niche-spa',
    title: 'Solace Botanical Wellness & Holistic Spa',
    niche: 'Spa',
    occasion: 'GENERAL',
    description: 'Serene eucalyptus green palette, therapeutic hydrotherapy rituals, organic treatment menus, and quiet reservation form.',
    screenshotUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    previewImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    html: spaHtml,
    css: spaCss,
  },
  {
    id: 'template-niche-bakery',
    title: 'La Croissanterie Artisan French Bakery',
    niche: 'Bakery',
    occasion: 'GENERAL',
    description: 'Warm terracotta & honey tones, wood-fired daily viennoiserie showcases, sourdough loaves, and pre-order inquiry forms.',
    screenshotUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    previewImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    html: bakeryHtml,
    css: bakeryCss,
  },
  {
    id: 'template-niche-carwash',
    title: 'Apex Auto Spa & Ceramic Studio',
    niche: 'Car Wash',
    occasion: 'GENERAL',
    description: 'High-contrast midnight slate & cyan aesthetic, multi-tier precision detailing packages, and bay reservation selector.',
    screenshotUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
    previewImageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
    html: carwashHtml,
    css: carwashCss,
  },
  {
    id: 'template-seasonal-xmas',
    title: 'Christmas Wonderland Holiday Boutique',
    niche: 'Seasonal',
    occasion: 'CHRISTMAS',
    description: 'Festive crimson red & snowy gold accents, seasonal countdown deals, curated gift bundles, and holiday flash discounts.',
    screenshotUrl: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=800&q=80',
    previewImageUrl: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=800&q=80',
    html: christmasHtml,
    css: christmasCss,
  },
  {
    id: 'template-seasonal-newyear',
    title: 'Midnight Sparkle New Year Pop-Up',
    niche: 'Seasonal',
    occasion: 'NEW_YEAR',
    description: 'Electric celebratory midnight obsidian, champagne sparkle gold, countdown drop highlights, and fresh season specials.',
    screenshotUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    previewImageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    html: newyearHtml,
    css: newyearCss,
  },
  {
    id: 'template-seasonal-eid',
    title: 'Al-Barakah Festive Eid Bazaar',
    niche: 'Seasonal',
    occasion: 'EID',
    description: 'Emerald green, regal sapphire & radiant gold arabesque typography, curated gift hampers, Medjool dates, and attire.',
    screenshotUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
    previewImageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
    html: eidHtml,
    css: eidCss,
  },
  {
    id: 'template-seasonal-ramadan',
    title: 'Noor Al-Hidayah Ramadan Kareem Essentials',
    niche: 'Seasonal',
    occasion: 'RAMADAN',
    description: 'Serene midnight indigo & warm amber lantern typography, blessed iftar boxes, family gift sets, and prayer accessories.',
    screenshotUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
    previewImageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
    html: ramadanHtml,
    css: ramadanCss,
  },
];

export function getTemplateById(id: string): NicheTemplateDefinition | undefined {
  return NICHE_TEMPLATES.find(t => t.id === id);
}
