/**
 * Official Eden Roses Makeover & Unisex Salon Image Configuration
 * Hosted on Cloudinary CDN (Cloud Name: dxeuzdwkz) for fast, permanent global delivery
 * across edenroses.in, Vercel deployments, and mobile browsers.
 */

export type EdenImageCategory =
  | 'Logo'
  | 'Hero Images'
  | 'Bridal Portfolio'
  | 'Makeup Services'
  | 'Hairstyling'
  | 'Saree Draping'
  | 'Salon Gallery'
  | 'About Section'
  | 'Testimonials'
  | 'Service Thumbnails';

export type GalleryFilterCategory =
  | 'All'
  | 'Bridal Makeup'
  | 'Party Makeup'
  | 'Engagement Makeup'
  | 'Hairstyling'
  | 'Salon'
  | 'Beauty Services';

export interface EdenRoseImage {
  id: string;
  url: string;
  alt: string;
  category: EdenImageCategory;
  galleryCategory?: Exclude<GalleryFilterCategory, 'All'>;
  description: string;
  displayPosition: string;
}

// Verified Cloudinary CDN Assets uploaded by Eden Roses Admin (dxeuzdwkz)
export const CLOUDINARY_ASSETS = {
  logo: 'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793799832/jg6foxlf543i4vjleaqr.jpg',
  partyBasic1:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793689626/x2ziqndjwogvsp5qpalb.jpg',
  partyBasic2:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793689677/ljjoyylndnb2kefnleak.jpg',
  partyBasic3:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793689901/bgefncvvehfh2f0eyxwh.jpg',
  partyBasic4:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793693843/ufq33pymfcakkkiw6iwd.jpg',
  partyHd:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793690154/npt0rzqnrpa7s2rnvfyb.jpg',
  partyLuxury1:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793690505/lqyvvwj5cvhegnvkhfxu.jpg',
  partyLuxury2:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793690964/io1z1hxrf1yeqcpfnjrz.png',
  engagement1:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793693875/kpundrofruiuhzixwxir.jpg',
  engagement2:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793692122/ointp5vl4hbqa0wexltx.jpg',
  engagementHd:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793693919/s24gzmurpk1jmparbgx8.jpg',
  bridalClassic:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793694209/zyvtlndxxf3ewo8ooqts.png',
  bridalHd:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793700026/clbuu45rvrxbc15n5ikx.jpg',
  bridalPremium:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793694437/ftszil5i4qanquzpxsbb.png',
  bridalPackage:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793699271/jyzj6wbfsjompfujr6c7.jpg',
  weddingGuest1:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793695380/emrj3cvw2dzhil44wqvp.jpg',
  weddingGuest2:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793694630/boietenvzjz4ryw8eb0g.jpg',
  weddingGuest3:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793695161/utr5ue2tat47ygpwrfwf.jpg',
  weddingGuest4:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793695341/qhu9dtlvrbyaxet2i0ds.jpg',
  weddingGuestHd:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793695126/fpvlrc48cxqafgcwpzpd.jpg',
  sareeBasic:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793695687/ueqjlwmerizxjkhuocef.jpg',
  sareeAdvance:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793697083/z8mqrwcwfc5kpvwc05et.jpg',
  hairBasic1:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793697490/ux6uck4cdk7g6nwi5nid.jpg',
  hairBasic2:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793697146/jcraddijjljfh5z4xabw.jpg',
  hairAdvance:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793698313/mfgkgixsr7cxkio0vikh.jpg',
  comboPackage:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793699136/yb3qzhack1ewponu1eyn.jpg',
  addonLashes:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793700632/xhmkxlauyfnjttj2dbww.webp',
  addonMakeup:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793700953/yjefolthkx3pdfulx5qp.jpg',
  hydraFacial:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793701364/ct5xeos5ue6znr1exxrk.jpg',
  skinCare:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793701681/nyvo3ytyhkxl3etrwjeb.jpg',
  salonExtra:
    'https://res.cloudinary.com/dxeuzdwkz/image/upload/f_auto,q_auto/v1793702210/xfjgwj47ajot9yjgmsbt.jpg',
} as const;

// Legacy WordPress URL -> Cloudinary URL deterministic map (prevents 404 when edenroses.in points to Vercel)
const LEGACY_WP_TO_CLOUDINARY_MAP: Record<string, string> = {
  'Short-and-sweet-just-like-a-perfect-love-story': CLOUDINARY_ASSETS.bridalHd,
  'Purple-or-pink-Makeup-by-@subbalakshmi': CLOUDINARY_ASSETS.partyLuxury2,
  'WhatsApp-Image-2025-02-11-at-05.30.07.jpeg': CLOUDINARY_ASSETS.bridalClassic,
  'WhatsApp-Image-2025-02-11-at-05.30.07-1.jpeg': CLOUDINARY_ASSETS.sareeAdvance,
  'WhatsApp-Image-2025-02-11-at-05.30.07-2.jpeg': CLOUDINARY_ASSETS.sareeBasic,
  'WhatsApp-Image-2025-02-11-at-05.30.08.jpeg': CLOUDINARY_ASSETS.bridalHd,
  'WhatsApp-Image-2025-02-11-at-05.30.08-2.jpeg': CLOUDINARY_ASSETS.addonLashes,
  'WhatsApp-Image-2025-02-11-at-05.30.09-1.jpeg': CLOUDINARY_ASSETS.engagementHd,
  'WhatsApp-Image-2025-02-11-at-05.30.10.jpeg': CLOUDINARY_ASSETS.bridalPackage,
  'WhatsApp-Image-2025-02-11-at-05.32.28.jpeg': CLOUDINARY_ASSETS.engagement1,
  'WhatsApp-Image-2025-02-11-at-05.32.30.jpeg': CLOUDINARY_ASSETS.bridalPremium,
  'WhatsApp-Image-2025-02-11-at-05.32.31.jpeg': CLOUDINARY_ASSETS.engagement2,
  'WhatsApp-Image-2025-02-11-at-05.34.17.jpeg': CLOUDINARY_ASSETS.partyBasic1,
  'WhatsApp-Image-2025-02-11-at-05.34.17-1.jpeg': CLOUDINARY_ASSETS.partyHd,
  'WhatsApp-Image-2025-02-11-at-05.26.53.jpeg': CLOUDINARY_ASSETS.hairBasic1,
  'WhatsApp-Image-2025-02-11-at-05.26.54.jpeg': CLOUDINARY_ASSETS.hairAdvance,
  'WhatsApp-Image-2025-02-11-at-05.28.14.jpeg': CLOUDINARY_ASSETS.comboPackage,
  'WhatsApp-Image-2025-02-11-at-05.28.15.jpeg': CLOUDINARY_ASSETS.hairBasic2,
  'WhatsApp-Image-2025-02-11-at-05.24.50.jpeg': CLOUDINARY_ASSETS.weddingGuestHd,
  'WhatsApp-Image-2025-02-11-at-05.24.57.jpeg': CLOUDINARY_ASSETS.weddingGuest1,
  'WhatsApp-Image-2025-02-11-at-05.25.00.jpeg': CLOUDINARY_ASSETS.sareeAdvance,
  '120023.379.png': CLOUDINARY_ASSETS.hydraFacial,
  '233442.733.png': CLOUDINARY_ASSETS.skinCare,
  '233252.398.png': CLOUDINARY_ASSETS.hairAdvance,
  '233621.888.png': CLOUDINARY_ASSETS.bridalClassic,
  '234019.685.png': CLOUDINARY_ASSETS.skinCare,
  '234302.816.png': CLOUDINARY_ASSETS.salonExtra,
  '233836.951.png': CLOUDINARY_ASSETS.hydraFacial,
  '114128.894.png': CLOUDINARY_ASSETS.hairBasic1,
  'haircut.jpg': CLOUDINARY_ASSETS.salonExtra,
  '114503.394.png': CLOUDINARY_ASSETS.salonExtra,
  '114633.474.png': CLOUDINARY_ASSETS.addonMakeup,
  '1-2.png': CLOUDINARY_ASSETS.hydraFacial,
  '2-2.png': CLOUDINARY_ASSETS.skinCare,
  '3-2.png': CLOUDINARY_ASSETS.addonLashes,
  '4-2.png': CLOUDINARY_ASSETS.addonMakeup,
  '5-2.png': CLOUDINARY_ASSETS.addonLashes,
  '6-2.png': CLOUDINARY_ASSETS.partyLuxury1,
  '31.png': CLOUDINARY_ASSETS.bridalHd,
  '073403.167.png': CLOUDINARY_ASSETS.partyBasic1,
  '073428.671.png': CLOUDINARY_ASSETS.bridalPackage,
  '073439.813.png': CLOUDINARY_ASSETS.bridalPremium,
  '114357.922.png': CLOUDINARY_ASSETS.partyBasic2,
};

const ALL_CLOUDINARY_GALLERY_LIST: string[] = [
  CLOUDINARY_ASSETS.bridalHd,
  CLOUDINARY_ASSETS.bridalClassic,
  CLOUDINARY_ASSETS.bridalPremium,
  CLOUDINARY_ASSETS.bridalPackage,
  CLOUDINARY_ASSETS.engagement1,
  CLOUDINARY_ASSETS.engagementHd,
  CLOUDINARY_ASSETS.engagement2,
  CLOUDINARY_ASSETS.partyBasic1,
  CLOUDINARY_ASSETS.partyHd,
  CLOUDINARY_ASSETS.partyLuxury2,
  CLOUDINARY_ASSETS.partyLuxury1,
  CLOUDINARY_ASSETS.partyBasic2,
  CLOUDINARY_ASSETS.partyBasic3,
  CLOUDINARY_ASSETS.partyBasic4,
  CLOUDINARY_ASSETS.weddingGuest1,
  CLOUDINARY_ASSETS.weddingGuestHd,
  CLOUDINARY_ASSETS.weddingGuest2,
  CLOUDINARY_ASSETS.weddingGuest3,
  CLOUDINARY_ASSETS.weddingGuest4,
  CLOUDINARY_ASSETS.sareeBasic,
  CLOUDINARY_ASSETS.sareeAdvance,
  CLOUDINARY_ASSETS.hairBasic1,
  CLOUDINARY_ASSETS.hairAdvance,
  CLOUDINARY_ASSETS.hairBasic2,
  CLOUDINARY_ASSETS.comboPackage,
  CLOUDINARY_ASSETS.addonLashes,
  CLOUDINARY_ASSETS.addonMakeup,
  CLOUDINARY_ASSETS.hydraFacial,
  CLOUDINARY_ASSETS.skinCare,
  CLOUDINARY_ASSETS.salonExtra,
];

/**
 * Ensures any image URL is 100% browser-renderable on edenroses.in and mobile devices:
 * 1. Normalizes Cloudinary URLs with `f_auto,q_auto` and converts `.heic`/`.heif` to `.jpg`.
 * 2. Replaces legacy `edenroses.in/wp-content/uploads/...` URLs (which 404 after pointing edenroses.in to Vercel)
 *    with the corresponding real Eden Roses Cloudinary image.
 */
export function resolveWorkingImageUrl(
  rawUrl?: string | null,
  fallbackUrl: string = CLOUDINARY_ASSETS.bridalHd
): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return fallbackUrl;
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return fallbackUrl;
  }

  // 1. Handle Cloudinary URLs: ensure f_auto,q_auto & convert .heic/.heif to .jpg for Chrome/Android compatibility
  if (trimmed.includes('res.cloudinary.com')) {
    let normalized = trimmed;
    if (
      normalized.includes('/image/upload/') &&
      !normalized.includes('/image/upload/f_auto')
    ) {
      normalized = normalized.replace(
        '/image/upload/',
        '/image/upload/f_auto,q_auto/'
      );
    }
    normalized = normalized.replace(/\.(heic|heif)$/i, '.jpg');
    return normalized;
  }

  // 2. Handle legacy WordPress URLs on edenroses.in/wp-content/uploads/...
  if (trimmed.includes('edenroses.in/wp-content/uploads/')) {
    for (const [key, cloudUrl] of Object.entries(LEGACY_WP_TO_CLOUDINARY_MAP)) {
      if (trimmed.includes(key)) {
        return cloudUrl;
      }
    }
    // Deterministic hash fallback across the 30 real Cloudinary photos
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
    }
    return ALL_CLOUDINARY_GALLERY_LIST[hash % ALL_CLOUDINARY_GALLERY_LIST.length];
  }

  return trimmed;
}

export const OFFICIAL_UPLOADED_LOGO_URL = CLOUDINARY_ASSETS.logo;

export const EDEN_ROSES_LOGOS = {
  primary: {
    id: 'logo-primary',
    url: OFFICIAL_UPLOADED_LOGO_URL,
    alt: 'Eden Roses Unisex Salon — Luxury Redefined • Beauty with Soul',
    category: 'Logo' as EdenImageCategory,
    description: 'Official Eden Roses Unisex Salon butterfly-lotus gold emblem',
    displayPosition: 'Header & Brand Lockup',
  },
  footer: {
    id: 'logo-footer',
    url: OFFICIAL_UPLOADED_LOGO_URL,
    alt: 'Eden Roses Unisex Salon Full Brand Emblem',
    category: 'Logo' as EdenImageCategory,
    description:
      'Official Eden Roses Unisex Salon emblem used in footer and Partner App',
    displayPosition: 'Footer & Partner Login',
  },
  icon: {
    id: 'logo-icon',
    url: OFFICIAL_UPLOADED_LOGO_URL,
    alt: 'Eden Roses Crest Icon',
    category: 'Logo' as EdenImageCategory,
    description: 'Official Eden Roses Unisex Salon icon',
    displayPosition: 'Favicon & App Badge',
  },
};

export const EDEN_ROSES_HERO_IMAGES: EdenRoseImage[] = [
  {
    id: 'hero-bridal-main',
    url: CLOUDINARY_ASSETS.bridalHd,
    alt: 'Signature South Indian Bridal Makeover by Subba Lakshmi at Eden Roses Makeover Bengaluru',
    category: 'Hero Images',
    galleryCategory: 'Bridal Makeup',
    description:
      'A touch of makeup, a touch of magic — original bridal transformation portrait from Eden Roses.',
    displayPosition: 'Hero Primary Showcase',
  },
  {
    id: 'hero-glam-secondary',
    url: CLOUDINARY_ASSETS.partyLuxury2,
    alt: 'Glamorous Makeover by Subba Lakshmi Makeup Artist',
    category: 'Hero Images',
    galleryCategory: 'Party Makeup',
    description:
      'Original glamorous makeover portrait by Subba Lakshmi (@subbalakshmi.s_makeup_artist).',
    displayPosition: 'Hero Secondary Portrait',
  },
  {
    id: 'hero-bridal-whatsapp-1',
    url: CLOUDINARY_ASSETS.bridalClassic,
    alt: 'Traditional Muhurtham Bridal Look by Subba Lakshmi',
    category: 'Hero Images',
    galleryCategory: 'Bridal Makeup',
    description:
      'Original bridal photography with traditional silk saree and temple jewellery.',
    displayPosition: 'Hero Carousel 3',
  },
  {
    id: 'hero-engagement-glam',
    url: CLOUDINARY_ASSETS.engagementHd,
    alt: 'HD Engagement Makeover by Subba Lakshmi',
    category: 'Hero Images',
    galleryCategory: 'Engagement Makeup',
    description: 'Radiant HD engagement look with bespoke hairstyling and draping.',
    displayPosition: 'Hero Carousel 4',
  },
];

export const EDEN_ROSES_ABOUT_IMAGES: EdenRoseImage[] = [
  {
    id: 'about-artist-primary',
    url: CLOUDINARY_ASSETS.bridalHd,
    alt: 'Makeup Artistry by Subba Lakshmi — Eden Roses Makeover',
    category: 'About Section',
    galleryCategory: 'Bridal Makeup',
    description: 'Original signature look by Subba Lakshmi featured on Eden Roses.',
    displayPosition: 'About Section Main Frame',
  },
  {
    id: 'about-bridal-story',
    url: CLOUDINARY_ASSETS.engagementHd,
    alt: 'Bridal Makeover Story on Eden Roses About Page',
    category: 'About Section',
    galleryCategory: 'Engagement Makeup',
    description: 'Featured photograph on the official Eden Roses About page.',
    displayPosition: 'About Section Accent Frame',
  },
  {
    id: 'about-bridal-detail',
    url: CLOUDINARY_ASSETS.bridalPremium,
    alt: 'Detailed Bridal Eye & Jewellery Styling by Subba Lakshmi',
    category: 'About Section',
    galleryCategory: 'Bridal Makeup',
    description:
      'Original bridal makeover close-up from Eden Roses Makeup Services portfolio.',
    displayPosition: 'About Section Gallery Inset',
  },
];

export const EDEN_ROSES_SERVICE_THUMBNAILS: Record<string, EdenRoseImage> = {
  'pkg-saree-draping': {
    id: 'thumb-saree-draping',
    url: CLOUDINARY_ASSETS.sareeBasic,
    alt: 'Basic Saree Draping by Subba Lakshmi at Eden Roses Makeover',
    category: 'Service Thumbnails',
    galleryCategory: 'Bridal Makeup',
    description: 'Crisp, flawless traditional & modern saree pleating and draping.',
    displayPosition: 'Package Card 1',
  },
  'pkg-hair-half-up': {
    id: 'thumb-hair-half-up',
    url: CLOUDINARY_ASSETS.hairBasic1,
    alt: 'Half - up & down Advance Hairstyling at Eden Roses Makeover',
    category: 'Service Thumbnails',
    galleryCategory: 'Hairstyling',
    description:
      'Soft cascading curls with structured crown volume for engagements and receptions.',
    displayPosition: 'Package Card 2',
  },
  'pkg-hair-braid-curls': {
    id: 'thumb-hair-braid-curls',
    url: CLOUDINARY_ASSETS.hairAdvance,
    alt: 'Braid with curls Advance Hairstyling by Subba Lakshmi',
    category: 'Service Thumbnails',
    galleryCategory: 'Hairstyling',
    description:
      'Intricate bridal braid adorned with textured curls and floral/accessory placement.',
    displayPosition: 'Package Card 3',
  },
  'pkg-hair-messy-updo': {
    id: 'thumb-hair-messy-updo',
    url: CLOUDINARY_ASSETS.hairBasic2,
    alt: 'Messy up-do Advance Hairstyling at Eden Roses Makeover',
    category: 'Service Thumbnails',
    galleryCategory: 'Hairstyling',
    description:
      'Romantic textured messy bun and face-framing tendrils for sarees and gowns.',
    displayPosition: 'Package Card 4',
  },
  'pkg-party-makeup': {
    id: 'thumb-party-makeup',
    url: CLOUDINARY_ASSETS.partyBasic1,
    alt: 'Basic Party Makeup at Eden Roses Makeover Bengaluru',
    category: 'Service Thumbnails',
    galleryCategory: 'Party Makeup',
    description: 'Party Make Over feature image from Eden Roses Makeover.',
    displayPosition: 'Package Card 5',
  },
  'pkg-engagement-makeup': {
    id: 'thumb-engagement-makeup',
    url: CLOUDINARY_ASSETS.engagement1,
    alt: 'Engagement Makeup & Hair Package by Subba Lakshmi',
    category: 'Service Thumbnails',
    galleryCategory: 'Engagement Makeup',
    description:
      'Complete HD engagement makeover with advance hairstyling, lashes, and draping.',
    displayPosition: 'Package Card 6',
  },
  'pkg-luxury-bridal': {
    id: 'thumb-luxury-bridal',
    url: CLOUDINARY_ASSETS.bridalHd,
    alt: 'Luxury Bridal Makeup Package by Subba Lakshmi',
    category: 'Service Thumbnails',
    galleryCategory: 'Bridal Makeup',
    description: 'Bridal Make Over feature image from Eden Roses Makeover.',
    displayPosition: 'Package Card 7',
  },
  'srv-special-bridal': {
    id: 'thumb-special-bridal',
    url: CLOUDINARY_ASSETS.bridalPackage,
    alt: 'Special Bridal Packages at Eden Roses Makeover',
    category: 'Makeup Services',
    galleryCategory: 'Bridal Makeup',
    description: 'Special Bridal Packages image from Eden Roses Makeover.',
    displayPosition: 'Makeup Service Card',
  },
  'srv-airbrush-makeup': {
    id: 'thumb-airbrush-makeup',
    url: CLOUDINARY_ASSETS.bridalPremium,
    alt: 'Airbrush High-Definition Makeup by Subba Lakshmi',
    category: 'Makeup Services',
    galleryCategory: 'Bridal Makeup',
    description: 'Airbrush Makeup image from Eden Roses Makeover.',
    displayPosition: 'Makeup Service Card',
  },
  'srv-basic-makeover': {
    id: 'thumb-basic-makeover',
    url: CLOUDINARY_ASSETS.partyBasic2,
    alt: 'Basic Make Over at Eden Roses Makeover',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Makeup Basic to Advance image from Eden Roses.',
    displayPosition: 'Makeup Service Card',
  },
  'srv-hair-treatments': {
    id: 'thumb-hair-treatments',
    url: CLOUDINARY_ASSETS.hairAdvance,
    alt: 'Hair Treatments by Eden Roses Best Salon in Bangalore',
    category: 'Salon Gallery',
    galleryCategory: 'Salon',
    description: 'Hair Treatments service card image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-skin-care': {
    id: 'thumb-skin-care',
    url: CLOUDINARY_ASSETS.skinCare,
    alt: 'Skin Care Services by Eden Roses Unisex Salon in Bangalore',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Skin Care service card image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-bridal-salon': {
    id: 'thumb-bridal-salon',
    url: CLOUDINARY_ASSETS.bridalClassic,
    alt: 'Bridal Makeup Studio Services at Eden Roses Bengaluru',
    category: 'Salon Gallery',
    galleryCategory: 'Bridal Makeup',
    description: 'Bridal Makeup service card image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-hydra-facial': {
    id: 'thumb-hydra-facial',
    url: CLOUDINARY_ASSETS.hydraFacial,
    alt: 'Hydra Facial by Eden Roses Unisex Salon',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Hydra Facial service image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-waxing': {
    id: 'thumb-waxing',
    url: CLOUDINARY_ASSETS.skinCare,
    alt: 'Waxing Services at Eden Roses Unisex Salon Bangalore',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Waxing Services image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-mani-pedi': {
    id: 'thumb-mani-pedi',
    url: CLOUDINARY_ASSETS.salonExtra,
    alt: 'Manicure and Pedicure by Eden Roses Unisex Salon in Bangalore',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Manicure and Pedicure service image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-massage': {
    id: 'thumb-massage',
    url: CLOUDINARY_ASSETS.hydraFacial,
    alt: 'Massage Therapies by Eden Roses Unisex Salon in Bangalore',
    category: 'Salon Gallery',
    galleryCategory: 'Salon',
    description: 'Massage Therapies image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-hair-spa': {
    id: 'thumb-hair-spa',
    url: CLOUDINARY_ASSETS.hairBasic1,
    alt: 'Hair Spa & Care at Eden Roses Salon Bengaluru',
    category: 'Salon Gallery',
    galleryCategory: 'Salon',
    description: 'Hair Care image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-haircuts': {
    id: 'thumb-haircuts',
    url: CLOUDINARY_ASSETS.salonExtra,
    alt: 'Haircuts for Men and Women at Eden Roses Unisex Salon',
    category: 'Salon Gallery',
    galleryCategory: 'Salon',
    description: 'Haircut service photo from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-nail-art': {
    id: 'thumb-nail-art',
    url: CLOUDINARY_ASSETS.salonExtra,
    alt: 'Nail Art Services at Eden Roses Salon Bengaluru',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Nail Art feature image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-permanent-makeup': {
    id: 'thumb-permanent-makeup',
    url: CLOUDINARY_ASSETS.addonMakeup,
    alt: 'Permanent Makeup by Eden Roses Bengaluru',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Permanent Makeup image from Eden Roses.',
    displayPosition: 'Salon Service Card',
  },
  'srv-bb-glow': {
    id: 'thumb-bb-glow',
    url: CLOUDINARY_ASSETS.hydraFacial,
    alt: 'BB Glow Semi-Permanent Skin Treatment at Eden Roses',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Permanent Makeup & BB Glow treatment at Eden Roses.',
    displayPosition: 'Permanent Makeup Card',
  },
  'srv-cc-glow': {
    id: 'thumb-cc-glow',
    url: CLOUDINARY_ASSETS.skinCare,
    alt: 'CC Glow Skin Complexion Treatment at Eden Roses',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'CC Glow Skin Complexion treatment at Eden Roses.',
    displayPosition: 'Permanent Makeup Card',
  },
  'srv-microblading': {
    id: 'thumb-microblading',
    url: CLOUDINARY_ASSETS.addonLashes,
    alt: 'Microblading Eyebrow Architecture at Eden Roses',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Microblading Eyebrow Architecture at Eden Roses.',
    displayPosition: 'Permanent Makeup Card',
  },
  'srv-micro-shading': {
    id: 'thumb-micro-shading',
    url: CLOUDINARY_ASSETS.addonMakeup,
    alt: 'Micro Shading Brow Artistry at Eden Roses',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Micro Shading Brow Artistry at Eden Roses.',
    displayPosition: 'Permanent Makeup Card',
  },
  'srv-ombre-brows': {
    id: 'thumb-ombre-brows',
    url: CLOUDINARY_ASSETS.addonLashes,
    alt: 'Ombre Brows Treatment at Eden Roses Bengaluru',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Ombre Brows Treatment at Eden Roses Bengaluru.',
    displayPosition: 'Permanent Makeup Card',
  },
  'srv-lip-pigment': {
    id: 'thumb-lip-pigment',
    url: CLOUDINARY_ASSETS.partyLuxury1,
    alt: 'Lip Pigment & Permanent Blush at Eden Roses Bengaluru',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Lip Pigment & Permanent Blush at Eden Roses Bengaluru.',
    displayPosition: 'Permanent Makeup Card',
  },
};

export const EDEN_ROSES_PORTFOLIO_GALLERY: EdenRoseImage[] = [
  {
    id: 'cloud-1793700026769',
    url: CLOUDINARY_ASSETS.bridalHd,
    alt: 'HD Bridal Makeup by Subba Lakshmi',
    category: 'Bridal Portfolio',
    galleryCategory: 'Bridal Makeup',
    description: 'Royal silk saree bridal transformation with temple jewellery and HD glow.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793694209731',
    url: CLOUDINARY_ASSETS.bridalClassic,
    alt: 'Traditional South Indian Bridal Makeup',
    category: 'Bridal Portfolio',
    galleryCategory: 'Bridal Makeup',
    description: 'Timeless bridal elegance crafted at Eden Roses Makeover studio.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793694437220',
    url: CLOUDINARY_ASSETS.bridalPremium,
    alt: 'Premium Airbrush Bridal Makeup',
    category: 'Bridal Portfolio',
    galleryCategory: 'Bridal Makeup',
    description: 'High-definition bridal makeover with waterproof, long-wear finish.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793699271255',
    url: CLOUDINARY_ASSETS.bridalPackage,
    alt: 'Complete Bridal Makeover Package',
    category: 'Bridal Portfolio',
    galleryCategory: 'Bridal Makeup',
    description: 'Complete Muhurtham & Reception bridal look by Subba Lakshmi.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793693876063',
    url: CLOUDINARY_ASSETS.engagement1,
    alt: 'Signature Engagement Makeup',
    category: 'Makeup Services',
    galleryCategory: 'Engagement Makeup',
    description: 'Signature engagement makeover with soft glam eyes and sculpted hairstyling.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793693919292',
    url: CLOUDINARY_ASSETS.engagementHd,
    alt: 'HD Engagement Makeup & Hairstyling',
    category: 'Makeup Services',
    galleryCategory: 'Engagement Makeup',
    description: '4K camera-ready engagement look tailored to complement bridal attire.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793692122480',
    url: CLOUDINARY_ASSETS.engagement2,
    alt: 'Engagement Glam & Saree Styling',
    category: 'Makeup Services',
    galleryCategory: 'Engagement Makeup',
    description: 'Radiant engagement makeover from Eden Roses Makeover portfolio.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793689626500',
    url: CLOUDINARY_ASSETS.partyBasic1,
    alt: 'Basic Party Makeup & Styling',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Fresh, long-wear party makeover for family celebrations and evening events.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793690155166',
    url: CLOUDINARY_ASSETS.partyHd,
    alt: 'HD Finish Party Makeup',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'High-definition party radiance with sculpted contouring and lashes.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793690964668',
    url: CLOUDINARY_ASSETS.partyLuxury2,
    alt: 'Luxury Party Makeover by Subba Lakshmi',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Glamorous evening reception and cocktail look with international cosmetics.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793690505182',
    url: CLOUDINARY_ASSETS.partyLuxury1,
    alt: 'Evening Glam Party Makeup',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Luminous party transformation with soft waves and statement eyes.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793689676990',
    url: CLOUDINARY_ASSETS.partyBasic2,
    alt: 'Festive Party Makeover',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Natural festive glow with traditional draping and hairstyling.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793689901386',
    url: CLOUDINARY_ASSETS.partyBasic3,
    alt: 'Party Makeover & Hair Styling',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Contemporary party styling for birthdays and special occasions.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793693843455',
    url: CLOUDINARY_ASSETS.partyBasic4,
    alt: 'Soft Glam Party Look',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Flawless party base with defined eyes and lip artistry.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793695380082',
    url: CLOUDINARY_ASSETS.weddingGuest1,
    alt: 'Wedding Guest Makeup & Draping',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Specially curated wedding guest look for bridesmaids and family members.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793695126511',
    url: CLOUDINARY_ASSETS.weddingGuestHd,
    alt: 'HD Wedding Guest Makeup & Advance Hair',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Camera-ready HD finish for wedding stage photography.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793694630538',
    url: CLOUDINARY_ASSETS.weddingGuest2,
    alt: 'Bridesmaid & Family Festive Makeover',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Long-wear festive makeover for Haldi, Mehendi, and Sangeet.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793695161843',
    url: CLOUDINARY_ASSETS.weddingGuest3,
    alt: 'Traditional Wedding Guest Styling',
    category: 'Makeup Services',
    galleryCategory: 'Bridal Makeup',
    description: 'Traditional silk saree guest styling with floral hair accessories.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793695341993',
    url: CLOUDINARY_ASSETS.weddingGuest4,
    alt: 'Reception Guest Makeover',
    category: 'Makeup Services',
    galleryCategory: 'Party Makeup',
    description: 'Elegant evening look with soft curls and saree pleating.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793695687560',
    url: CLOUDINARY_ASSETS.sareeBasic,
    alt: 'Precision Saree Draping',
    category: 'Saree Draping',
    galleryCategory: 'Bridal Makeup',
    description: 'Crisp center pleats and silhouette pinning for silk and designer sarees.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793697083747',
    url: CLOUDINARY_ASSETS.sareeAdvance,
    alt: 'Bridal Kanjeevaram Saree Box-Draping',
    category: 'Saree Draping',
    galleryCategory: 'Bridal Makeup',
    description: 'Master bridal silk saree pre-pleating and waist-belt setting.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793697490469',
    url: CLOUDINARY_ASSETS.hairBasic1,
    alt: 'Floral Bun & Jasmine Veni Hairstyling',
    category: 'Hairstyling',
    galleryCategory: 'Hairstyling',
    description: 'Traditional bridal bun adorned with fresh jasmine garland and golden rakodi.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793698313503',
    url: CLOUDINARY_ASSETS.hairAdvance,
    alt: 'Advance Bridal Braid & Floral Styling',
    category: 'Hairstyling',
    galleryCategory: 'Hairstyling',
    description: 'South Indian bridal Poola Jada and structured braid artistry.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793697146025',
    url: CLOUDINARY_ASSETS.hairBasic2,
    alt: 'Romantic Up-Do & Baby’s Breath Hairstyling',
    category: 'Hairstyling',
    galleryCategory: 'Hairstyling',
    description: 'Soft textured up-do with delicate curls and floral pin placement.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793699136683',
    url: CLOUDINARY_ASSETS.comboPackage,
    alt: 'Makeup + Hairstyling Combo Look',
    category: 'Makeup Services',
    galleryCategory: 'Engagement Makeup',
    description: 'Complete head-to-toe makeover with HD makeup, advance hair, and draping.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793700632051',
    url: CLOUDINARY_ASSETS.addonLashes,
    alt: 'Bridal Eye Artistry & 3D Mink Lashes',
    category: 'Makeup Services',
    galleryCategory: 'Bridal Makeup',
    description: 'Expressive bridal eye makeup with featherlight false eyelashes.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793700953679',
    url: CLOUDINARY_ASSETS.addonMakeup,
    alt: 'Airbrush & Luxury Skin Finish',
    category: 'Makeup Services',
    galleryCategory: 'Beauty Services',
    description: 'Silicone airbrush base upgrade and luxury skin preparation.',
    displayPosition: 'Portfolio Grid',
  },
  {
    id: 'cloud-1793701365003',
    url: CLOUDINARY_ASSETS.hydraFacial,
    alt: 'HydraFacial & Pre-Bridal Skin Glow',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: '7-step HydraFacial skin rejuvenation at Eden Roses Unisex Salon.',
    displayPosition: 'Salon Gallery',
  },
  {
    id: 'cloud-1793701681478',
    url: CLOUDINARY_ASSETS.skinCare,
    alt: 'Luxury Skin Care & Detan Rituals',
    category: 'Salon Gallery',
    galleryCategory: 'Beauty Services',
    description: 'Brightening facial and organic detan treatments at our Bengaluru studio.',
    displayPosition: 'Salon Gallery',
  },
  {
    id: 'cloud-1793702210755',
    url: CLOUDINARY_ASSETS.salonExtra,
    alt: 'Eden Roses Unisex Salon Studio Services',
    category: 'Salon Gallery',
    galleryCategory: 'Salon',
    description: 'Complete hair, skin, nail, and grooming services in C V Raman Nagar.',
    displayPosition: 'Salon Gallery',
  },
];

export const EDEN_ROSES_TESTIMONIAL_IMAGES: EdenRoseImage[] = [
  {
    id: 'test-akshara',
    url: CLOUDINARY_ASSETS.bridalHd,
    alt: 'Client Makeover at Eden Roses Bengaluru',
    category: 'Testimonials',
    description: 'Original client transformation photo from Eden Roses portfolio.',
    displayPosition: 'Testimonials Section',
  },
  {
    id: 'test-prarthana',
    url: CLOUDINARY_ASSETS.hairBasic1,
    alt: 'Advance Hairstyling Client at Eden Roses Makeover',
    category: 'Testimonials',
    description: 'Original advance hairstyling client photo from Eden Roses portfolio.',
    displayPosition: 'Testimonials Section',
  },
  {
    id: 'test-madhumita',
    url: CLOUDINARY_ASSETS.partyBasic1,
    alt: 'Party Makeover & Saree Draping Client at Eden Roses',
    category: 'Testimonials',
    description: 'Original party makeover and draping photo from Eden Roses portfolio.',
    displayPosition: 'Testimonials Section',
  },
];
