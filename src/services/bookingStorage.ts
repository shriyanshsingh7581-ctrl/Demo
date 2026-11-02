import {
  EDEN_ROSES_LOGOS,
  EDEN_ROSES_PORTFOLIO_GALLERY,
  EDEN_ROSES_SERVICE_THUMBNAILS,
  OFFICIAL_UPLOADED_LOGO_URL,
  EdenRoseImage,
} from '../config/edenRosesImages';
import {
  db,
  rtdb,
  isFirebaseConfigured,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  ref,
  set,
  onValue,
  runTransaction,
  handleFirestoreError,
  OperationType,
} from './firebaseConfig';

export const AVAILABLE_TIME_SLOTS = [
  '06:00 AM',
  '08:00 AM',
  '11:00 AM',
  '02:00 PM',
  '05:00 PM',
  '07:00 PM',
] as const;

export type TimeSlot = (typeof AVAILABLE_TIME_SLOTS)[number] | string;

export type BookingStatus =
  | 'Confirmed'
  | 'Visit Scheduled'
  | 'Journey Started'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Reported';

export type BookingSource =
  | 'Customer Website'
  | 'Admin Manual'
  | 'Instagram'
  | 'WhatsApp'
  | 'Phone Call'
  | 'Walk-in';

export type EventType =
  | 'Wedding'
  | 'Engagement'
  | 'Reception'
  | 'Party'
  | 'Photoshoot'
  | 'Other';

export interface BookingServiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'Assistant Makeup Artist' | 'Hairstylist' | 'Saree Drapist' | 'Other Team Member';
  phone: string;
  active: boolean;
  userId?: string;
  password?: string;
  createdAt?: string;
}

export interface PartnerSessionUser {
  id: string;
  name: string;
  role: string;
  userId: string;
  phone?: string;
  isAdmin: boolean;
}

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  locality?: string;
  eventType: EventType;
  services: BookingServiceItem[];
  date: string; // YYYY-MM-DD
  time: string; // e.g., "08:00 AM"
  itemsTotal: number;
  discount: number;
  advancePaid: number;
  amountToCollect: number;
  notes: string;
  status: BookingStatus;
  bookingSource: BookingSource;
  assignedTeam: TeamMember[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  reportReason?: string;
  badgeType?: 'VISIT' | 'CALL' | 'FOLLOWUP' | 'JOB';
}

export interface CustomerLead {
  id: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  locality?: string;
  eventType: string;
  message: string;
  lastBookingId?: string;
  totalSpend?: number;
  source: string;
  createdAt: string;
}

export type MakeupSubCategory =
  | 'Party Makeup'
  | 'Engagement Makeup'
  | 'Bridal Makeup'
  | 'Wedding Guest Makeup'
  | 'Saree Draping'
  | 'Hair Styling'
  | 'Packages'
  | 'Add-ons'
  | 'Salon for Women'
  | 'Salon for Men';

export type MakeupLandingGroup =
  | 'Makeup & Styling for Women'
  | 'Saree Draping'
  | 'Hair Styling for Women'
  | 'Salon for Women'
  | 'Salon for Men';

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category:
    | 'Bridal & Makeup Packages'
    | 'Makeup Services'
    | 'Hair & Styling'
    | 'Skin & Facial'
    | 'Permanent Makeup'
    | 'Spa & Nails';
  makeupSubCategory?: MakeupSubCategory;
  landingGroup?: MakeupLandingGroup;
  description: string;
  price: number | null;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  whatsIncluded?: string[];
  additionalInfo?: string[];
  image: string;
  isPackage: boolean;
  airbrushAvailable?: boolean;
  duration?: string;
}

export interface BusinessSettings {
  businessName: string;
  makeupBrand: string;
  artistName: string;
  businessCategory: string;
  logoUrl: string;
  footerLogoUrl: string;
  phonePrimary: string;
  phoneSecondary: string;
  whatsappNumber: string;
  email: string;
  address: string;
  location: string;
  googleMapsLink: string;
  openingHours: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  description: string;
  serviceArea: string;
  heroImageUrl: string;
  headerTagline?: string;
  defaultCity?: string;
  heroBannerTitle?: string;
  heroBannerSubtitle?: string;
  heroBannerTagline?: string;
  heroCtaText?: string;
  ratingScore?: string;
  ratingCountText?: string;
  trustBadgeTitle?: string;
  trustBadgeSubtitle?: string;
  offer1Title?: string;
  offer1Code?: string;
  offer1DiscountAmount?: number;
  offer2Title?: string;
  offer2Code?: string;
  offer2DiscountPercent?: number;
  aboutKicker?: string;
  aboutHighlight1Title?: string;
  aboutHighlight1Sub?: string;
  aboutHighlight2Title?: string;
  aboutHighlight2Sub?: string;
  aboutHighlight3Title?: string;
  aboutHighlight3Sub?: string;
  blockedDates: string[];
  timeSlots: string[];
  updatedAt?: string;
}

export interface PartnerSelfieLog {
  id: string;
  bookingId?: string;
  imageUrl: string;
  timestamp: string;
  note: string;
}

const STORAGE_KEYS = {
  SEED_VERSION: 'eden_roses_seed_v5',
  BOOKINGS: 'eden_roses_bookings_v4',
  CUSTOMERS: 'eden_roses_customers_v4',
  SERVICES: 'eden_roses_services_v5',
  SETTINGS: 'eden_roses_business_settings_v5',
  TEAM: 'eden_roses_team_members_v5',
  GALLERY: 'eden_roses_gallery_images_v5',
  SELFIES: 'eden_roses_partner_selfies_v4',
};

export const INITIAL_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: 'Eden Roses Unisex Salon',
  makeupBrand: 'Eden Roses Makeover',
  artistName: 'Subba Lakshmi',
  businessCategory: 'Professional Makeup Artist, Bridal Makeup Studio, Beauty and Salon Services',
  logoUrl: OFFICIAL_UPLOADED_LOGO_URL,
  footerLogoUrl: OFFICIAL_UPLOADED_LOGO_URL,
  phonePrimary: '+91 7019135530',
  phoneSecondary: '+91 9606076647',
  whatsappNumber: import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER || '917019135530',
  email: 'contact@edenroses.in',
  address:
    'No.11, 1st Floor, 4th Cross, Kaggadasapura Main Road, C V Raman Nagar, Bengaluru, Karnataka 560093',
  location: 'Nagavarapalya / C V Raman Nagar, Bengaluru, Karnataka, India',
  googleMapsLink:
    'https://www.google.com/maps/search/?api=1&query=No.11+1st+Floor+4th+Cross+Kaggadasapura+Main+Road+C+V+Raman+Nagar+Bengaluru+Karnataka+560093',
  openingHours: 'Monday – Sunday: 09:00 AM – 08:30 PM (Bridal On-Venue Slots from 05:00 AM)',
  websiteUrl: 'https://www.edenroses.in/',
  instagramUrl: 'https://www.instagram.com/subbalakshmi.s_makeup_artist/',
  facebookUrl: 'https://www.edenroses.in/',
  description:
    'At Eden Roses Makeover, beauty is more than makeup. It is about confidence, individuality, and creating unforgettable memories. Subba Lakshmi specializes in professional makeup artistry, bridal transformations, hairstyling, and personalized beauty services designed to complement every client’s personality and special occasion.',
  serviceArea:
    'Indiranagar, Varthur, Yelahanka, Kaggadasapura, C V Raman Nagar, Nagavarapalya, Brookefield, Whitefield, Jayanagar, Koramangala, HSR Layout, Marathahalli, Domlur, Banaswadi, Hebbal, Malleswaram, Electronic City',
  heroImageUrl:
    'https://edenroses.in/wp-content/uploads/2024/12/Short-and-sweet-just-like-a-perfect-love-story.-.A-touch-of-makeup-a-touch-of-magicWe-are-here-to-doll-you-up-for.your-best-day.jpg',
  headerTagline: 'Studio & On-Venue Service Across Bengaluru',
  defaultCity: 'Bangalore',
  heroBannerTitle: 'Professional Makeup',
  heroBannerSubtitle: 'Beauty services for every special occasion',
  heroBannerTagline: 'Flawless HD & Airbrush beauty · Effortless bridal confidence',
  heroCtaText: 'Book Appointment',
  ratingScore: '4.9',
  ratingCountText: '(520+ Brides)',
  trustBadgeTitle: '100% Authentic Luxury Products',
  trustBadgeSubtitle: 'MAC · Huda Beauty · NARS · Silicone Airbrush',
  offer1Title: 'Flat ₹500 OFF on Bridal & Engagement',
  offer1Code: 'BRIDAL500',
  offer1DiscountAmount: 500,
  offer2Title: 'Save 10% on Party Makeup & Combos',
  offer2Code: 'EDEN10',
  offer2DiscountPercent: 10,
  aboutKicker: 'Principal Makeup & Styling Artist',
  aboutHighlight1Title: 'HD & Airbrush',
  aboutHighlight1Sub: 'Waterproof 16-hr skin finish',
  aboutHighlight2Title: 'Venue Travel',
  aboutHighlight2Sub: '5:00 AM Muhurtham slots available',
  aboutHighlight3Title: '4.9 ★ Rated',
  aboutHighlight3Sub: 'Loved by Bengaluru brides',
  blockedDates: [],
  timeSlots: [...AVAILABLE_TIME_SLOTS],
};

// Configurable Demo Service Catalog (Editable anytime from Admin Panel -> More -> Services)
export const INITIAL_SERVICES_CATALOG: ServiceCatalogItem[] = [
  // ==================== 1. PARTY MAKEUP ====================
  {
    id: 'pkg-party-makeup',
    name: 'Basic Party Makeup',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Party Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Glow effortlessly with a fresh, party-ready makeover tailored for birthdays, family functions, baby showers, and evening celebrations.',
    price: 1599,
    originalPrice: 1999,
    rating: 4.8,
    reviewCount: 64,
    duration: '1 hr 15 mins',
    highlights: [
      'Glow effortlessly with a fresh, long-wear party-ready base',
      'Includes basic hairstyling (blow-dry/curls) and outfit/saree draping',
    ],
    whatsIncluded: [
      'Skin prep, hydrating primer & colour correction',
      'Flawless medium-to-full coverage party foundation base',
      'Customized eye makeup (shimmer, soft smokey, or winged liner)',
      'Basic hairstyling (soft curls, straightening, or simple bun)',
      'Complimentary basic saree or dupatta draping',
    ],
    additionalInfo: [
      'Available at our C V Raman Nagar studio or at your home/venue across Bengaluru',
      'High-hygiene sanitized brushes and authentic international cosmetics used',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.34.17.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },
  {
    id: 'srv-hd-party-makeup',
    name: 'HD Finish Party Makeup',
    category: 'Makeup Services',
    makeupSubCategory: 'Party Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Experience high-definition, camera-ready radiance with premium HD foundation, sculpted contouring, lashes, and advance hairstyling.',
    price: 2299,
    originalPrice: 2799,
    rating: 4.9,
    reviewCount: 52,
    duration: '1 hr 30 mins',
    highlights: [
      'Experience high-definition, photo-ready radiance under all lighting',
      'Includes hairstyling, false eyelashes & saree/lehenga draping',
    ],
    whatsIncluded: [
      'Luxury skin prep & pore-blurring HD primer',
      'High-Definition foundation & soft dimensional contouring',
      'Defined eye artistry with premium Mink/Natural false eyelashes',
      'Advance party hairstyling (curls, half-updo, or braided styling)',
      'Professional saree or lehenga dupatta draping',
    ],
    additionalInfo: [
      'Ideal for cocktail nights, sangeet, receptions, and studio photoshoots',
      'Long-wear sweat-resistant setting spray included',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.34.17-1.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },
  {
    id: 'srv-luxury-party-makeup',
    name: 'Luxury Party Makeup',
    category: 'Makeup Services',
    makeupSubCategory: 'Party Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Step into the spotlight with a high-glam luxury makeover featuring international luxury brands, statement eye makeup, and signature hairstyling.',
    price: 2999,
    originalPrice: 3599,
    rating: 4.9,
    reviewCount: 41,
    duration: '1 hr 45 mins',
    highlights: [
      'Step into the spotlight with a high-glam luxury international brand look',
      'Complete with advance hairstyling, premium lashes & flawless draping',
    ],
    whatsIncluded: [
      '100% luxury international cosmetics (MAC, Huda Beauty, NARS, Estée Lauder)',
      'Waterproof, transfer-resistant luminous glass-skin or matte finish',
      'Intricate eye makeup (halo eyes, glitter cut-crease, or smokey glam)',
      'Signature advance hairstyling & accessory placement',
      'Precision saree pleating & silhouette draping',
    ],
    additionalInfo: [
      'Recommended for close family weddings, milestone anniversaries & red-carpet events',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2024/12/Purple-or-pink-Makeup-by-@subbalakshmi.s_makeup_artist-Outfit-@fashionnova-2.jpg',
    isPackage: true,
    airbrushAvailable: true,
  },

  // ==================== 2. ENGAGEMENT MAKEUP ====================
  {
    id: 'pkg-engagement-makeup',
    name: 'Engagement Makeup',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Engagement Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Radiant, photo-perfect engagement makeover crafted to complement your ring ceremony saree, gown, or pastel lehenga.',
    price: 4499,
    originalPrice: 5499,
    rating: 4.9,
    reviewCount: 58,
    duration: '2 hrs',
    highlights: [
      'Soft-glam or traditional engagement look tailored to your outfit palette',
      'Includes advance hairstyling, false lashes, draping & jewellery setting',
    ],
    whatsIncluded: [
      'In-depth skin prep & luminous priming for close-up ring ceremony photography',
      'Seamless full-coverage base with soft blush & collarbone highlight',
      'Customized engagement eye makeup + premium false eyelashes',
      'Advance engagement hairstyling (half-up curls, floral bun, or waves)',
      'Complete saree/lehenga draping & jewellery pinning',
    ],
    additionalInfo: [
      'Available at studio or on-venue across Indiranagar, Varthur, Yelahanka, Kaggadasapura & all Bengaluru',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.32.28.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },
  {
    id: 'srv-hd-engagement-makeup',
    name: 'HD Engagement Makeup',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Engagement Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Ultra-refined 4K High-Definition engagement transformation by Subba Lakshmi with pro hairstyling, lashes, and dupatta/saree styling.',
    price: 5499,
    originalPrice: 6499,
    rating: 5.0,
    reviewCount: 47,
    duration: '2 hrs 15 mins',
    highlights: [
      '4K camera-ready HD finish that looks like second skin in stage lighting',
      'Includes signature hairstyling, mink lashes, draping & floral/accessory setting',
    ],
    whatsIncluded: [
      'Luxury hydrating prep + 4K HD international foundation system',
      'Precision facial sculpting, dewy highlight & long-wear lip artistry',
      'Bespoke eye styling with mink/silk lashes & brow architecture',
      'Advance bridal-grade hairstyling with padding/extensions support',
      'Crisp box-pleated saree draping or double-dupatta lehenga styling',
    ],
    additionalInfo: [
      'Includes complimentary touch-up kit for your ceremony',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.09-1.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },

  // ==================== 3. BRIDAL MAKEUP ====================
  {
    id: 'srv-bridal-makeover',
    name: 'Bridal Makeup',
    category: 'Makeup Services',
    makeupSubCategory: 'Bridal Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Timeless traditional or contemporary bridal makeover designed to keep you glowing through every ritual from Muhurtham to Reception.',
    price: 6999,
    originalPrice: 8499,
    rating: 4.9,
    reviewCount: 86,
    duration: '2 hrs 30 mins',
    highlights: [
      'Complete bridal look with long-lasting waterproof base & expressive eyes',
      'Includes bridal hairstyling, Kanjeevaram/bridal draping & jewellery setting',
    ],
    whatsIncluded: [
      'Bridal skin preparation, under-eye correction & sweat-lock priming',
      'Long-wear bridal base tailored to your skin undertone',
      'Traditional or modern bridal eye artistry + premium lashes',
      'Bridal hairstyling (traditional bun, braid, or reception waves)',
      'Bridal saree pre-pleating, draping & full temple/bridal jewellery setting',
    ],
    additionalInfo: [
      'Early morning Muhurtham slots available from 04:30 AM / 05:00 AM onwards',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.07.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },
  {
    id: 'pkg-luxury-bridal',
    name: 'HD Bridal Makeup',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Bridal Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Signature High-Definition bridal transformation by Subba Lakshmi including luxury HD skin finish, bespoke bridal hairstyling, saree draping, and jewellery setting.',
    price: 8999,
    originalPrice: 10999,
    rating: 5.0,
    reviewCount: 112,
    duration: '3 hrs',
    highlights: [
      'Signature 4K HD bridal transformation by Lead Artist Subba Lakshmi',
      'Includes intricate bridal hairstyling, silk saree box-draping & maang tikka setting',
    ],
    whatsIncluded: [
      '1-on-1 bridal look consultation & luxury dermal prep',
      'Ultra-HD waterproof, tear-proof & flash-friendly bridal skin finish',
      'Detailed bridal eye artistry, 3D lashes & custom lip layering',
      'Traditional Poola Jada / Jasmine Veni bridal hairstyling or sculptural updo',
      'Master Kanjeevaram silk saree box-pleating, belt & veil/pallu pinning',
    ],
    additionalInfo: [
      'Most popular bridal choice for South Indian Muhurtham & Grand Receptions',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.08.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },
  {
    id: 'srv-airbrush-makeup',
    name: 'Premium Bridal Makeup',
    category: 'Makeup Services',
    makeupSubCategory: 'Bridal Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Ultra-luxury Silicone Airbrush & International Couture Bridal Makeover for a weightless, porcelain 16-hour waterproof glow.',
    price: 11999,
    originalPrice: 14999,
    rating: 5.0,
    reviewCount: 74,
    duration: '3 hrs 15 mins',
    highlights: [
      'Silicone Airbrush + Luxury Couture cosmetics for 16-hour weightless perfection',
      'Complete bridal hair architecture, luxury lashes, draping & full jewellery styling',
    ],
    whatsIncluded: [
      'Advanced Silicone Airbrush system for a featherlight, poreless finish',
      '100% luxury couture palette (Charlotte Tilbury, Dior, NARS, Huda Beauty)',
      'Multi-dimensional eye artistry with luxury mink lashes & coloured lens support',
      'Bespoke bridal hairstyling with hair padding & floral/jewellery integration',
      'Complimentary bridal pre-pleating, draping & bridal touch-up kit',
    ],
    additionalInfo: [
      'Includes dedicated senior stylist assistance for rapid outfit/look transitions',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.32.30.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },

  // ==================== 4. WEDDING GUEST MAKEUP ====================
  {
    id: 'srv-wedding-guest-makeup',
    name: 'Wedding Guest Makeup',
    category: 'Makeup Services',
    makeupSubCategory: 'Wedding Guest Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Look radiant as the sister, mother, or bridesmaid of the bride/groom with a long-wear festive makeover, hairstyling, and draping.',
    price: 1899,
    originalPrice: 2399,
    rating: 4.8,
    reviewCount: 49,
    duration: '1 hr 15 mins',
    highlights: [
      'Specially curated for bridesmaids, sisters & close family members',
      'Includes festive eye makeup, hairstyling & saree/lehenga draping',
    ],
    whatsIncluded: [
      'Skin prep & long-wear festive foundation base',
      'Soft glam or traditional eye makeup with liner & mascara',
      'Festive hairstyling (curls, braid, or bun with floral pin placement)',
      'Saree pleating or lehenga dupatta pinning',
    ],
    additionalInfo: [
      'Group bookings supported for bridal families at wedding venues or home',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.24.57.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },
  {
    id: 'srv-hd-wedding-guest-makeup',
    name: 'HD Wedding Guest Makeup',
    category: 'Makeup Services',
    makeupSubCategory: 'Wedding Guest Makeup',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'High-definition wedding guest makeover with premium HD base, false eyelashes, advance hairstyling, and crisp saree draping.',
    price: 2599,
    originalPrice: 3199,
    rating: 4.9,
    reviewCount: 38,
    duration: '1 hr 30 mins',
    highlights: [
      'Camera-ready HD finish for wedding stage photos & videography',
      'Includes false eyelashes, advance hairstyling & complete outfit draping',
    ],
    whatsIncluded: [
      'HD primer & high-definition photo-friendly foundation',
      'Sculpted contour, luminous blush & waterproof eye makeup',
      'Pair of natural/glam false eyelashes included',
      'Advance hairstyling & traditional/modern saree draping',
    ],
    additionalInfo: [
      'Ideal for Haldi, Mehendi, Sangeet, Muhurtham & Reception guests',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.24.50.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },

  // ==================== 5. SAREE DRAPING ====================
  {
    id: 'pkg-saree-draping',
    name: 'Basic Saree Draping',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Saree Draping',
    landingGroup: 'Saree Draping',
    description:
      'Crisp, structured pleating, pallu pinning, and silhouette draping for silk, Kanjeevaram, organza, georgette, and designer sarees.',
    price: 599,
    originalPrice: 799,
    rating: 4.9,
    reviewCount: 94,
    duration: '30 mins',
    highlights: [
      'Crisp center pleats & narrow/broad pallu pinning tailored to your height',
      'Secure, comfortable pinning that stays intact through hours of rituals',
    ],
    whatsIncluded: [
      'Professional pallu & center pleat alignment',
      'Flattering hip-hugging silhouette pinning (safety pins included)',
      'Supports Kanjeevaram, Banarasi, Organza, Tissue, Net & Nauvari styles',
    ],
    additionalInfo: [
      'Can be booked standalone or combined with any hairstyling or makeup service',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-saree-draping'].url,
    isPackage: true,
  },
  {
    id: 'srv-bridal-saree-draping',
    name: 'Bridal Saree Draping',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Saree Draping',
    landingGroup: 'Saree Draping',
    description:
      'Master bridal Kanjeevaram silk saree pre-pleating, iron-pressed box folding, waist-belt (Oddiyanam) setting, and Muhurtham draping.',
    price: 999,
    originalPrice: 1299,
    rating: 5.0,
    reviewCount: 67,
    duration: '45 mins',
    highlights: [
      'Precision bridal box-pleating & iron-pressed Kanjeevaram silk alignment',
      'Includes Oddiyanam (waist belt) setting & double-pallu / veil draping',
    ],
    whatsIncluded: [
      'Steam/iron-pressed micro-pleating for heavy bridal silk sarees',
      'Traditional South Indian Muhurtham, Coorgi, Tamil Madisar, or Gujarati drape',
      'Bridal waist-belt & blouse shoulder pinning for zero-slip security',
    ],
    additionalInfo: [
      'Pre-pleating service also available a day prior to the wedding',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.07-1.jpeg',
    isPackage: true,
  },

  // ==================== 6. HAIR STYLING ====================
  {
    id: 'pkg-hair-half-up',
    name: 'Basic Hair Styling',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Hair Styling',
    landingGroup: 'Hair Styling for Women',
    description:
      'Sculpted crown volume paired with soft, long-lasting cascading waves, curls, or sleek blow-dry—ideal for engagements, parties, and sangeet.',
    price: 799,
    originalPrice: 999,
    rating: 4.8,
    reviewCount: 72,
    duration: '45 mins',
    highlights: [
      'Heat-protected soft Hollywood waves, bouncy curls, or half-up & down styling',
      'Includes volume crimping, back-combing & long-hold setting spray',
    ],
    whatsIncluded: [
      'Thermal heat-protectant prep & crown volume texturizing',
      'Choice of Half-up & down curls, soft open waves, or sleek classic bun',
      'Complimentary pinning of client-provided hair accessories or flowers',
    ],
    additionalInfo: [
      'Please ensure hair is washed and completely dry prior to appointment',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-hair-half-up'].url,
    isPackage: true,
  },
  {
    id: 'pkg-hair-braid-curls',
    name: 'Bridal Hair Styling',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Hair Styling',
    landingGroup: 'Hair Styling for Women',
    description:
      'Intricate bridal braid, traditional South Indian Poola Jada, or sculptural bridal updo adorned with jasmine veni, jadai billai, and hair extensions support.',
    price: 1499,
    originalPrice: 1899,
    rating: 5.0,
    reviewCount: 83,
    duration: '1 hr',
    highlights: [
      'Traditional bridal braid, Poola Jada, or multi-textured reception updo',
      'Includes donut padding, extension blending & bridal floral/jewellery pinning',
    ],
    whatsIncluded: [
      'Full crown architecture & volume padding for bridal Maang Tikka / Matha Patti',
      'Intricate bridal braid with curls or traditional South Indian Jada styling',
      'Secure pinning of fresh jasmine garlands, baby’s breath, or golden Rakodi/Billai',
    ],
    additionalInfo: [
      'Supports clip-in hair extensions and long bridal braids',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-hair-braid-curls'].url,
    isPackage: true,
  },
  {
    id: 'pkg-hair-messy-updo',
    name: 'Party Hair Styling',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Hair Styling',
    landingGroup: 'Hair Styling for Women',
    description:
      'Romantic textured messy bun, Russian updo, or braided crown with delicate face-framing tendrils that complements both sarees and modern gowns.',
    price: 999,
    originalPrice: 1299,
    rating: 4.9,
    reviewCount: 61,
    duration: '45 mins',
    highlights: [
      'Romantic textured messy up-do or braided party hairstyle with tendrils',
      'Designed to stay voluminous and frizz-free for 8+ hours',
    ],
    whatsIncluded: [
      'Texture crimping & sculptural pin-work for effortless volume',
      'Face-framing curls tailored to your jawline and neckline',
      'Accessory & floral baby’s breath / pearl pin placement',
    ],
    additionalInfo: [
      'Perfect for cocktail nights, receptions, bridesmaids & festive parties',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-hair-messy-updo'].url,
    isPackage: true,
  },

  // ==================== 7. PACKAGES ====================
  {
    id: 'pkg-makeup-hair-combo',
    name: 'Makeup + Hairstyling Package',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Packages',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'All-in-one value combo combining HD Party/Festive Makeup, Advance Hairstyling (Curls/Updo/Braid), False Eyelashes, and Saree Draping.',
    price: 2499,
    originalPrice: 3299,
    rating: 4.9,
    reviewCount: 91,
    duration: '1 hr 45 mins',
    highlights: [
      'Complete head-to-toe makeover: HD Makeup + Advance Hair + Saree Draping',
      'Save ₹800 compared to booking individual services separately',
    ],
    whatsIncluded: [
      'Full HD Party / Festive Makeup with skin prep & contouring',
      'Pair of premium false eyelashes & long-wear lip color',
      'Advance Hairstyling (Messy Updo, Half-up Curls, or Braid with Curls)',
      'Complete Saree Draping or Lehenga Dupatta styling',
    ],
    additionalInfo: [
      'Bestseller combo for wedding guests, housewarmings, naming ceremonies & parties',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.28.14.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },
  {
    id: 'srv-special-bridal',
    name: 'Bridal Package',
    category: 'Makeup Services',
    makeupSubCategory: 'Packages',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Complete 2-Look Wedding Combo (Muhurtham + Reception) by Subba Lakshmi including HD/Airbrush Bridal Makeup, 2 Advance Hairstyles, Saree Box-Draping & Pre-Bridal Skin Prep.',
    price: 14999,
    originalPrice: 18999,
    rating: 5.0,
    reviewCount: 63,
    duration: '5 hrs (2 Looks)',
    highlights: [
      'Covers both Wedding Muhurtham Look + Grand Reception Transformation',
      'Includes 2 HD Bridal Makeovers, 2 Bridal Hairstyles, Saree Pre-Pleating & Lashes',
    ],
    whatsIncluded: [
      'Look 1: Traditional Muhurtham HD Bridal Makeup, Poola Jada/Bun & Silk Saree Draping',
      'Look 2: Glamorous Reception HD Makeover, Voluminous Waves/Updo & Gown/Lehenga Styling',
      'Luxury international cosmetics, 2 pairs of mink lashes & hair padding',
      'Complete jewellery setting and look-change assistance at the venue',
    ],
    additionalInfo: [
      'Custom multi-event packages (Haldi + Mehendi + Sangeet + Muhurtham) also available',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.10.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },
  {
    id: 'pkg-engagement-combo',
    name: 'Engagement Package',
    category: 'Bridal & Makeup Packages',
    makeupSubCategory: 'Packages',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Complete Engagement Makeover + Pre-Event Hydra/Glow Facial Prep + Advance Hairstyling + Saree Pre-Pleating & Draping.',
    price: 5999,
    originalPrice: 7499,
    rating: 4.9,
    reviewCount: 44,
    duration: '2 hrs 30 mins',
    highlights: [
      'Includes HD Engagement Makeup + Advance Hair + Saree Pre-Pleating + Lashes',
      'Plus complimentary Bridesmaid/Mother basic saree draping',
    ],
    whatsIncluded: [
      '4K HD Engagement Makeup with dewy/matte skin finish',
      'Advance Engagement Hairstyling with floral or crystal accessory setting',
      'Silk Saree Pre-Pleating & Box Draping',
      '1 Complimentary Basic Saree Draping for Mother or Sister',
    ],
    additionalInfo: [
      'Available at studio or at your engagement venue in Bengaluru',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.32.31.jpeg',
    isPackage: true,
    airbrushAvailable: true,
  },

  // ==================== 8. ADD-ONS ====================
  {
    id: 'addon-false-eyelashes',
    name: 'False Eyelashes',
    category: 'Makeup Services',
    makeupSubCategory: 'Add-ons',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Pair of lightweight, reusable luxury 3D Mink or Natural Silk false eyelashes with waterproof lash adhesive application.',
    price: 299,
    originalPrice: 450,
    rating: 4.9,
    reviewCount: 108,
    duration: '15 mins',
    highlights: [
      'Featherlight 3D Mink or Natural Wispy lashes for expressive eyes',
      'Includes custom trimming and waterproof latex-free lash glue application',
    ],
    whatsIncluded: [
      '1 Pair of premium false eyelashes (Natural, Wispy, or Bridal Volume)',
      'Seamless lash-line blending with liner & mascara',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.08-2.jpeg',
    isPackage: false,
  },
  {
    id: 'addon-hair-accessories',
    name: 'Hair Accessories',
    category: 'Hair & Styling',
    makeupSubCategory: 'Add-ons',
    landingGroup: 'Hair Styling for Women',
    description:
      'Fresh Jasmine Veni / Baby’s Breath floral arrangement, pearl pins, crystal hair vines, or South Indian Jadai Billai placement.',
    price: 399,
    originalPrice: 599,
    rating: 4.9,
    reviewCount: 79,
    duration: '20 mins',
    highlights: [
      'Artistic placement of floral venis, baby’s breath, pearls & bridal hair jewellery',
      'Secured with invisible interlocking pins for zero movement',
    ],
    whatsIncluded: [
      'Decorative pearl/crystal pins or floral styling arrangement',
      'Secure pinning of Maang Tikka, Matha Patti, Jhumar, or Rakodi',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.25.00.jpeg',
    isPackage: false,
  },
  {
    id: 'addon-premium-hairstyle-upgrade',
    name: 'Premium Hairstyle Upgrade',
    category: 'Hair & Styling',
    makeupSubCategory: 'Add-ons',
    landingGroup: 'Hair Styling for Women',
    description:
      'Upgrade any basic hairstyling to an intricate 3D Russian Updo, Hollywood Waves, or Long Bridal Poola Jada with extension blending.',
    price: 499,
    originalPrice: 799,
    rating: 4.9,
    reviewCount: 54,
    duration: '30 mins',
    highlights: [
      'Upgrade basic curls/blow-dry to advanced sculptural braids or Hollywood waves',
      'Includes hair donut padding and clip-in extension blending',
    ],
    whatsIncluded: [
      'Full hair texturizing, volume crimping & structural updo/braid crafting',
      'Blending and securing of client’s hair extensions',
    ],
    image: 'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.28.15.jpeg',
    isPackage: false,
  },
  {
    id: 'addon-additional-makeup-services',
    name: 'Additional Makeup Services',
    category: 'Makeup Services',
    makeupSubCategory: 'Add-ons',
    landingGroup: 'Makeup & Styling for Women',
    description:
      'Silicone Airbrush Base Upgrade, Saree Pre-Pleating & Box Folding, or Quick Groom Touch-up & Beard Styling.',
    price: 999,
    originalPrice: 1499,
    rating: 4.9,
    reviewCount: 46,
    duration: '30 mins',
    highlights: [
      'Upgrade HD base to Silicone Airbrush or add pre-wedding Saree Pre-Pleating',
      'Also supports Groom HD photo-ready touch-up & hair styling',
    ],
    whatsIncluded: [
      'Choice of Airbrush Base Upgrade, 2 Saree Pre-Pleatings, or Groom Touch-up',
      'Performed at studio or at your event venue',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-airbrush-makeup'].url,
    isPackage: false,
    airbrushAvailable: true,
  },

  // ==================== 9. SALON FOR WOMEN & SALON FOR MEN ====================
  {
    id: 'srv-hydra-facial',
    name: 'Hydra Facial & Bridal Glow Facial',
    category: 'Skin & Facial',
    makeupSubCategory: 'Salon for Women',
    landingGroup: 'Salon for Women',
    description:
      'Experience the ultimate 7-step skin rejuvenation with HydraFacial at Eden Roses Unisex Salon for instant glass-skin bridal radiance.',
    price: 1999,
    originalPrice: 2999,
    rating: 4.9,
    reviewCount: 88,
    duration: '1 hr',
    highlights: [
      'Deep hydro-dermabrasion cleansing, pore extraction & hyaluronic infusion',
      'Instant dewy bridal glow with zero downtime',
    ],
    whatsIncluded: [
      'Vortex cleansing, gentle peel, painless suction extraction & LED therapy',
      'Antioxidant & peptide serum infusion',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-hydra-facial'].url,
    isPackage: false,
  },
  {
    id: 'srv-skin-care',
    name: 'Luxury Skin Care & Detan Rituals',
    category: 'Skin & Facial',
    makeupSubCategory: 'Salon for Women',
    landingGroup: 'Salon for Women',
    description:
      'Revitalize your skin with O3+ Bridal Facial, Kanpeki Japanese Facial, Gold Facial, and organic detan rituals at our C V Raman Nagar studio.',
    price: 1299,
    originalPrice: 1699,
    rating: 4.8,
    reviewCount: 62,
    duration: '1 hr',
    highlights: [
      'Brightening facial & detan treatments tailored for dry, oily, or sensitive skin',
      'Performed by certified aestheticians in private studio suites',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-skin-care'].url,
    isPackage: false,
  },
  {
    id: 'srv-hair-spa',
    name: 'Deep Nourishing Hair Spa & Keratin Ritual',
    category: 'Hair & Styling',
    makeupSubCategory: 'Salon for Women',
    landingGroup: 'Salon for Women',
    description:
      'Deep nourishing L’Oréal / Moroccan Oil hair spa, Dandruff Control, Botox, and Keratin smoothing rituals for silky, frizz-free shine.',
    price: 999,
    originalPrice: 1399,
    rating: 4.9,
    reviewCount: 75,
    duration: '1 hr',
    highlights: [
      'Repairs heat-damaged and dry hair with deep steam conditioning & head massage',
      'Leaves hair silky, manageable, and wedding-ready',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-hair-spa'].url,
    isPackage: false,
  },
  {
    id: 'srv-mani-pedi',
    name: 'Luxury Manicure, Pedicure & Nail Art',
    category: 'Spa & Nails',
    makeupSubCategory: 'Salon for Women',
    landingGroup: 'Salon for Women',
    description:
      'Pamper your hands and feet with crystal spa manicure, pedicure, bridal gel nail extensions, and custom French/chrome nail art.',
    price: 899,
    originalPrice: 1199,
    rating: 4.8,
    reviewCount: 53,
    duration: '1 hr',
    highlights: [
      'Spa manicure & pedicure with cuticle care, heel buffing & relaxing foot massage',
      'Bridal gel polish & nail extension upgrades available',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-mani-pedi'].url,
    isPackage: false,
  },
  {
    id: 'srv-waxing',
    name: 'Rica & Roll-On Hygienic Waxing',
    category: 'Spa & Nails',
    makeupSubCategory: 'Salon for Women',
    landingGroup: 'Salon for Women',
    description:
      'Smooth and flawless skin with gentle Italian Rica liposoluble waxing for full arms, full legs, and underarms.',
    price: 799,
    originalPrice: 999,
    rating: 4.8,
    reviewCount: 69,
    duration: '45 mins',
    highlights: [
      'Single-use cartridges & soothing post-wax oil for zero redness',
      'Removes tan and leaves skin velvety smooth',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-waxing'].url,
    isPackage: false,
  },
  {
    id: 'srv-bb-glow',
    name: 'Permanent Makeup · Microblading & BB Glow',
    category: 'Permanent Makeup',
    makeupSubCategory: 'Salon for Women',
    landingGroup: 'Salon for Women',
    description:
      'Semi-permanent BB Glow foundation facial, Eyebrow Microblading, Ombre Brows, and Lip Neutralization by certified cosmetologists.',
    price: 2999,
    originalPrice: 3999,
    rating: 4.9,
    reviewCount: 39,
    duration: '1 hr 30 mins',
    highlights: [
      'Certified pigments & precision micro-needling / brow architecture',
      'Wake up with naturally defined brows, tinted lips, and luminous skin',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-bb-glow'].url,
    isPackage: false,
  },
  {
    id: 'srv-haircuts',
    name: 'Men’s Grooming, Haircut, Beard & Groom Package',
    category: 'Hair & Styling',
    makeupSubCategory: 'Salon for Men',
    landingGroup: 'Salon for Men',
    description:
      'Precision men’s haircut, fade styling, beard sculpting, detan facial, and HD Groom Makeover at Eden Roses Unisex Salon.',
    price: 699,
    originalPrice: 999,
    rating: 4.9,
    reviewCount: 84,
    duration: '1 hr',
    highlights: [
      'Includes Men’s Designer Haircut, Beard Styling & Refreshing Detan Clean-up',
      'Groom Wedding & Engagement HD Makeover packages also available',
    ],
    whatsIncluded: [
      'Consultation, hair wash, precision haircut & blow-dry styling',
      'Beard trim/shaping with hot towel compress',
      'Face detan pack or Express Glow cleanup',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-haircuts'].url,
    isPackage: false,
  },
  {
    id: 'srv-men-groom-facial',
    name: 'Men’s HydraFacial, Hair Spa & Head Massage',
    category: 'Skin & Facial',
    makeupSubCategory: 'Salon for Men',
    landingGroup: 'Salon for Men',
    description:
      'Complete men’s revitalizing ritual featuring Deep Cleansing Facial / Detan, Anti-Dandruff Hair Spa, and Stress-Relief Head & Shoulder Massage.',
    price: 1299,
    originalPrice: 1699,
    rating: 4.8,
    reviewCount: 47,
    duration: '1 hr 15 mins',
    highlights: [
      'Removes sun tan, unclogs pores, and nourishes scalp & hair',
      'Ideal pre-event grooming package for grooms and wedding guests',
    ],
    whatsIncluded: [
      'Men’s Deep Pore Cleansing / O3+ Detan Facial',
      'Nourishing Hair Spa with steam & 20-min head/shoulder massage',
    ],
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-massage'].url,
    isPackage: false,
  },
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Kavya Nair',
    role: 'Hairstylist',
    phone: '+91 9845011223',
    active: true,
    userId: 'kavya',
    password: 'eden123',
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'tm-2',
    name: 'Deepika R',
    role: 'Saree Drapist',
    phone: '+91 9845044556',
    active: true,
    userId: 'deepika',
    password: 'eden123',
    createdAt: '2026-10-02T09:00:00.000Z',
  },
  {
    id: 'tm-3',
    name: 'Anusha Gowda',
    role: 'Assistant Makeup Artist',
    phone: '+91 9845077889',
    active: true,
    userId: 'anusha',
    password: 'eden123',
    createdAt: '2026-10-03T09:00:00.000Z',
  },
  {
    id: 'tm-4',
    name: 'Meghana S',
    role: 'Other Team Member',
    phone: '+91 9845099001',
    active: true,
    userId: 'meghana',
    password: 'eden123',
    createdAt: '2026-10-04T09:00:00.000Z',
  },
];

// Date helper for YYYY-MM-DD in local time
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayISO(): string {
  return formatDateISO(new Date());
}

export function getOffsetDateISO(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatDateISO(d);
}

// Defensive sanitizer matching firebase-blueprint.json & firestore.rules
function sanitizeBookingForFirestore(b: Booking): Booking {
  const cleaned: Booking = {
    id: String(b.id).slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, '-'),
    customerName: String(b.customerName || 'Client').slice(0, 120),
    phone: String(b.phone || '+91 7019135530').slice(0, 30),
    whatsapp: String(b.whatsapp || b.phone || '917019135530').slice(0, 30),
    address: String(b.address || 'Bengaluru').slice(0, 500),
    eventType: (
      ['Wedding', 'Engagement', 'Reception', 'Party', 'Photoshoot', 'Other'].includes(
        b.eventType
      )
        ? b.eventType
        : 'Other'
    ) as EventType,
    services: (b.services || []).slice(0, 30).map((s) => ({
      id: String(s.id || 'srv'),
      name: String(s.name || 'Service'),
      price: Math.max(0, Number(s.price || 0)),
      quantity: Math.max(1, Number(s.quantity || 1)),
    })),
    date: String(b.date || getTodayISO()).slice(0, 20),
    time: String(b.time || '08:00 AM').slice(0, 20),
    itemsTotal: Math.max(0, Number(b.itemsTotal || 0)),
    discount: Math.max(0, Number(b.discount || 0)),
    advancePaid: Math.max(0, Number(b.advancePaid || 0)),
    amountToCollect: Math.max(0, Number(b.amountToCollect || 0)),
    notes: String(b.notes || '').slice(0, 1000),
    status: (
      [
        'Confirmed',
        'Visit Scheduled',
        'Journey Started',
        'In Progress',
        'Completed',
        'Cancelled',
        'Reported',
      ].includes(b.status)
        ? b.status
        : 'Confirmed'
    ) as BookingStatus,
    bookingSource: (
      [
        'Customer Website',
        'Admin Manual',
        'Instagram',
        'WhatsApp',
        'Phone Call',
        'Walk-in',
      ].includes(b.bookingSource)
        ? b.bookingSource
        : 'Customer Website'
    ) as BookingSource,
    assignedTeam: (b.assignedTeam || []).slice(0, 20),
    createdAt: String(b.createdAt || new Date().toISOString()).slice(0, 50),
    updatedAt: String(b.updatedAt || new Date().toISOString()).slice(0, 50),
  };

  if (b.locality) cleaned.locality = String(b.locality).slice(0, 120);
  if (b.completedAt) cleaned.completedAt = String(b.completedAt).slice(0, 50);
  if (b.reportReason) cleaned.reportReason = String(b.reportReason).slice(0, 500);
  if (b.badgeType) cleaned.badgeType = b.badgeType;

  return cleaned;
}

function sanitizeCustomerLeadForFirestore(lead: CustomerLead): CustomerLead {
  const cleaned: CustomerLead = {
    id: String(lead.id).slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, '-'),
    customerName: String(lead.customerName || 'Client').slice(0, 120),
    phone: String(lead.phone || '+91 0000000000').slice(0, 30),
    whatsapp: String(lead.whatsapp || lead.phone || '').slice(0, 30),
    address: String(lead.address || 'Bengaluru').slice(0, 500),
    eventType: String(lead.eventType || 'Wedding').slice(0, 60),
    message: String(lead.message || '').slice(0, 1000),
    source: String(lead.source || 'Customer Website').slice(0, 50),
    createdAt: String(lead.createdAt || new Date().toISOString()).slice(0, 50),
  };
  if (lead.locality) cleaned.locality = String(lead.locality).slice(0, 120);
  if (lead.lastBookingId) cleaned.lastBookingId = String(lead.lastBookingId).slice(0, 64);
  if (lead.totalSpend !== undefined)
    cleaned.totalSpend = Math.max(0, Number(lead.totalSpend));
  return cleaned;
}

function sanitizeServiceForFirestore(s: ServiceCatalogItem): ServiceCatalogItem {
  const cleaned: ServiceCatalogItem = {
    id: String(s.id || `srv-${Date.now()}`).slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '-'),
    name: String(s.name || 'Makeup Service').slice(0, 160),
    category: s.category || 'Makeup Services',
    description: String(
      s.description || 'Professional makeup & beauty service at Eden Roses Makeover.'
    ).slice(0, 1500),
    price: s.price === null || s.price === undefined ? null : Math.max(0, Number(s.price)),
    image: String(s.image || '').slice(0, 1500),
    isPackage: Boolean(s.isPackage),
  };

  if (s.makeupSubCategory) cleaned.makeupSubCategory = s.makeupSubCategory;
  if (s.landingGroup) cleaned.landingGroup = s.landingGroup;
  if (s.originalPrice !== undefined && s.originalPrice !== null && Number(s.originalPrice) > 0) {
    cleaned.originalPrice = Math.max(0, Number(s.originalPrice));
  }
  if (s.rating !== undefined) cleaned.rating = Number(s.rating);
  if (s.reviewCount !== undefined) cleaned.reviewCount = Number(s.reviewCount);
  if (s.duration) cleaned.duration = String(s.duration).slice(0, 80);
  if (s.airbrushAvailable !== undefined) cleaned.airbrushAvailable = Boolean(s.airbrushAvailable);
  if (Array.isArray(s.highlights) && s.highlights.length > 0) {
    cleaned.highlights = s.highlights.map((h) => String(h).slice(0, 300)).slice(0, 12);
  }
  if (Array.isArray(s.whatsIncluded) && s.whatsIncluded.length > 0) {
    cleaned.whatsIncluded = s.whatsIncluded.map((w) => String(w).slice(0, 300)).slice(0, 15);
  }
  if (Array.isArray(s.additionalInfo) && s.additionalInfo.length > 0) {
    cleaned.additionalInfo = s.additionalInfo.map((a) => String(a).slice(0, 300)).slice(0, 10);
  }

  return cleaned;
}

function sanitizeTeamMemberForFirestore(m: TeamMember): TeamMember {
  const defaultUserId = String(m.name || 'team')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24) || 'member';
  const cleaned: TeamMember = {
    id: String(m.id || `tm-${Date.now()}`).slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '-'),
    name: String(m.name || 'Team Member').slice(0, 120),
    role: (
      [
        'Assistant Makeup Artist',
        'Hairstylist',
        'Saree Drapist',
        'Other Team Member',
      ].includes(m.role)
        ? m.role
        : 'Assistant Makeup Artist'
    ) as TeamMember['role'],
    phone: String(m.phone || '+91 7019135530').slice(0, 40),
    active: m.active !== false,
    userId: String(m.userId || defaultUserId)
      .trim()
      .toLowerCase()
      .slice(0, 80),
    password: String(m.password || 'eden123').trim().slice(0, 120),
    createdAt: String(m.createdAt || new Date().toISOString()).slice(0, 50),
  };
  return cleaned;
}

function sanitizeBusinessSettingsForFirestore(s: BusinessSettings): BusinessSettings {
  const merged = { ...INITIAL_BUSINESS_SETTINGS, ...s };
  return {
    businessName: String(merged.businessName || INITIAL_BUSINESS_SETTINGS.businessName).slice(0, 150),
    makeupBrand: String(merged.makeupBrand || INITIAL_BUSINESS_SETTINGS.makeupBrand).slice(0, 150),
    artistName: String(merged.artistName || INITIAL_BUSINESS_SETTINGS.artistName).slice(0, 120),
    businessCategory: String(merged.businessCategory || INITIAL_BUSINESS_SETTINGS.businessCategory).slice(0, 300),
    logoUrl: String(merged.logoUrl || OFFICIAL_UPLOADED_LOGO_URL).slice(0, 450000),
    footerLogoUrl: String(merged.footerLogoUrl || merged.logoUrl || OFFICIAL_UPLOADED_LOGO_URL).slice(0, 450000),
    phonePrimary: String(merged.phonePrimary || INITIAL_BUSINESS_SETTINGS.phonePrimary).slice(0, 40),
    phoneSecondary: String(merged.phoneSecondary || '').slice(0, 40),
    whatsappNumber: String(merged.whatsappNumber || INITIAL_BUSINESS_SETTINGS.whatsappNumber).slice(0, 40),
    email: String(merged.email || '').slice(0, 120),
    address: String(merged.address || INITIAL_BUSINESS_SETTINGS.address).slice(0, 500),
    location: String(merged.location || INITIAL_BUSINESS_SETTINGS.location).slice(0, 250),
    googleMapsLink: String(merged.googleMapsLink || INITIAL_BUSINESS_SETTINGS.googleMapsLink).slice(0, 1000),
    openingHours: String(merged.openingHours || INITIAL_BUSINESS_SETTINGS.openingHours).slice(0, 250),
    websiteUrl: String(merged.websiteUrl || INITIAL_BUSINESS_SETTINGS.websiteUrl).slice(0, 250),
    instagramUrl: String(merged.instagramUrl || INITIAL_BUSINESS_SETTINGS.instagramUrl).slice(0, 250),
    facebookUrl: String(merged.facebookUrl || INITIAL_BUSINESS_SETTINGS.facebookUrl).slice(0, 250),
    description: String(merged.description || INITIAL_BUSINESS_SETTINGS.description).slice(0, 3000),
    serviceArea: String(merged.serviceArea || INITIAL_BUSINESS_SETTINGS.serviceArea).slice(0, 1000),
    heroImageUrl: String(merged.heroImageUrl || INITIAL_BUSINESS_SETTINGS.heroImageUrl).slice(0, 450000),
    headerTagline: String(merged.headerTagline || INITIAL_BUSINESS_SETTINGS.headerTagline).slice(0, 200),
    defaultCity: String(merged.defaultCity || INITIAL_BUSINESS_SETTINGS.defaultCity).slice(0, 80),
    heroBannerTitle: String(merged.heroBannerTitle || INITIAL_BUSINESS_SETTINGS.heroBannerTitle).slice(0, 160),
    heroBannerSubtitle: String(merged.heroBannerSubtitle || INITIAL_BUSINESS_SETTINGS.heroBannerSubtitle).slice(0, 250),
    heroBannerTagline: String(merged.heroBannerTagline || INITIAL_BUSINESS_SETTINGS.heroBannerTagline).slice(0, 250),
    heroCtaText: String(merged.heroCtaText || INITIAL_BUSINESS_SETTINGS.heroCtaText).slice(0, 80),
    ratingScore: String(merged.ratingScore || INITIAL_BUSINESS_SETTINGS.ratingScore).slice(0, 20),
    ratingCountText: String(merged.ratingCountText || INITIAL_BUSINESS_SETTINGS.ratingCountText).slice(0, 60),
    trustBadgeTitle: String(merged.trustBadgeTitle || INITIAL_BUSINESS_SETTINGS.trustBadgeTitle).slice(0, 150),
    trustBadgeSubtitle: String(merged.trustBadgeSubtitle || INITIAL_BUSINESS_SETTINGS.trustBadgeSubtitle).slice(0, 250),
    offer1Title: String(merged.offer1Title || INITIAL_BUSINESS_SETTINGS.offer1Title).slice(0, 150),
    offer1Code: String(merged.offer1Code || INITIAL_BUSINESS_SETTINGS.offer1Code).toUpperCase().slice(0, 40),
    offer1DiscountAmount: Math.max(0, Number(merged.offer1DiscountAmount ?? INITIAL_BUSINESS_SETTINGS.offer1DiscountAmount ?? 500)),
    offer2Title: String(merged.offer2Title || INITIAL_BUSINESS_SETTINGS.offer2Title).slice(0, 150),
    offer2Code: String(merged.offer2Code || INITIAL_BUSINESS_SETTINGS.offer2Code).toUpperCase().slice(0, 40),
    offer2DiscountPercent: Math.min(100, Math.max(0, Number(merged.offer2DiscountPercent ?? INITIAL_BUSINESS_SETTINGS.offer2DiscountPercent ?? 10))),
    aboutKicker: String(merged.aboutKicker || INITIAL_BUSINESS_SETTINGS.aboutKicker).slice(0, 120),
    aboutHighlight1Title: String(merged.aboutHighlight1Title || INITIAL_BUSINESS_SETTINGS.aboutHighlight1Title).slice(0, 80),
    aboutHighlight1Sub: String(merged.aboutHighlight1Sub || INITIAL_BUSINESS_SETTINGS.aboutHighlight1Sub).slice(0, 160),
    aboutHighlight2Title: String(merged.aboutHighlight2Title || INITIAL_BUSINESS_SETTINGS.aboutHighlight2Title).slice(0, 80),
    aboutHighlight2Sub: String(merged.aboutHighlight2Sub || INITIAL_BUSINESS_SETTINGS.aboutHighlight2Sub).slice(0, 160),
    aboutHighlight3Title: String(merged.aboutHighlight3Title || INITIAL_BUSINESS_SETTINGS.aboutHighlight3Title).slice(0, 80),
    aboutHighlight3Sub: String(merged.aboutHighlight3Sub || INITIAL_BUSINESS_SETTINGS.aboutHighlight3Sub).slice(0, 160),
    blockedDates: Array.isArray(merged.blockedDates) ? merged.blockedDates.map(String) : [],
    timeSlots:
      Array.isArray(merged.timeSlots) && merged.timeSlots.length > 0
        ? merged.timeSlots.map(String)
        : [...AVAILABLE_TIME_SLOTS],
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeGalleryItemForFirestore(img: EdenRoseImage): EdenRoseImage {
  return {
    id: String(img.id || `gal-${Date.now()}`).slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '-'),
    url: String(img.url || '').slice(0, 450000),
    alt: String(img.alt || 'Eden Roses Makeover Portfolio').slice(0, 300),
    category: (img.category || 'Bridal Portfolio') as EdenRoseImage['category'],
    galleryCategory: img.galleryCategory || 'Bridal Makeup',
    description: String(img.description || '').slice(0, 500),
    displayPosition: img.displayPosition || 'Gallery Grid',
  };
}

function buildInitialSeedBookings(): Booking[] {
  const todayISO = getTodayISO();
  const tomorrowISO = getOffsetDateISO(1);
  const prarthanaDate = tomorrowISO === '2026-11-01' ? '2026-11-01' : tomorrowISO;
  const upcomingDate1 = getOffsetDateISO(4);
  const upcomingDate2 = getOffsetDateISO(7);
  const reportedDate = getOffsetDateISO(-2);

  const seedBookings: Booking[] = [
    {
      id: 'ID-1473826',
      customerName: 'Prarthana',
      phone: '+91 9845123401',
      whatsapp: '919845123401',
      address:
        '#37 Flat 202 Bhadra Landmark, # 37, Jayanagar 4th Block, 293, 7th Main Rd, Bengaluru, Karnataka, 560011, India',
      locality: 'Jayanagar 4th Block',
      eventType: 'Engagement',
      services: [
        {
          id: 'pkg-hair-half-up',
          name: 'Half - up & down Advance Hairstyling',
          price: 999,
          quantity: 1,
        },
        {
          id: 'pkg-hair-braid-curls',
          name: 'Braid with curls Advance Hairstyling',
          price: 999,
          quantity: 1,
        },
      ],
      date: prarthanaDate,
      time: '08:00 AM',
      itemsTotal: 1998,
      discount: 25,
      advancePaid: 197,
      amountToCollect: 1776,
      notes: 'Client requested floral pins readiness for both advance hairstyling looks.',
      status: 'Confirmed',
      bookingSource: 'Customer Website',
      assignedTeam: [INITIAL_TEAM_MEMBERS[0]],
      createdAt: '2026-10-28T10:15:00.000Z',
      updatedAt: '2026-10-28T10:15:00.000Z',
      badgeType: 'VISIT',
    },
    {
      id: 'ID-1475108',
      customerName: 'Kumari Madhumita',
      phone: '+91 9880456712',
      whatsapp: '919880456712',
      address: 'A2 813, Knights Bridge Apartments, Brookefield, Bengaluru, 560037',
      locality: 'Brookefield',
      eventType: 'Party',
      services: [
        {
          id: 'pkg-saree-draping',
          name: 'Basic Saree Draping',
          price: 599,
          quantity: 1,
        },
        {
          id: 'pkg-hair-messy-updo',
          name: 'Messy up-do Advance Hairstyling',
          price: 999,
          quantity: 1,
        },
        {
          id: 'pkg-party-makeup',
          name: 'Basic Party Makeup',
          price: 1599,
          quantity: 1,
        },
      ],
      date: prarthanaDate,
      time: '11:00 AM',
      itemsTotal: 3197,
      discount: 0,
      advancePaid: 500,
      amountToCollect: 2697,
      notes: 'Silk saree draping with soft romantic messy up-do and dewy party makeup.',
      status: 'Confirmed',
      bookingSource: 'Customer Website',
      assignedTeam: [INITIAL_TEAM_MEMBERS[1]],
      createdAt: '2026-10-29T14:30:00.000Z',
      updatedAt: '2026-10-29T14:30:00.000Z',
      badgeType: 'VISIT',
    },
    {
      id: 'ID-1472904',
      customerName: 'Akshara Prasanth',
      phone: '+91 9741239870',
      whatsapp: '919741239870',
      address:
        'Flat 404, Purva Season Apartments, Kaggadasapura Main Rd, C V Raman Nagar, Bengaluru, Karnataka 560093',
      locality: 'C V Raman Nagar',
      eventType: 'Reception',
      services: [
        {
          id: 'pkg-engagement-makeup',
          name: 'Engagement Makeup & Hair Package',
          price: 4999,
          quantity: 1,
        },
        {
          id: 'pkg-saree-draping',
          name: 'Basic Saree Draping',
          price: 599,
          quantity: 1,
        },
      ],
      date: todayISO,
      time: '05:00 PM',
      itemsTotal: 5598,
      discount: 198,
      advancePaid: 1500,
      amountToCollect: 3900,
      notes: 'Evening reception look with HD glow and Kanjeevaram saree draping.',
      status: 'Confirmed',
      bookingSource: 'WhatsApp',
      assignedTeam: [INITIAL_TEAM_MEMBERS[0], INITIAL_TEAM_MEMBERS[1]],
      createdAt: '2026-10-25T09:00:00.000Z',
      updatedAt: '2026-10-30T11:00:00.000Z',
      badgeType: 'VISIT',
    },
    {
      id: 'ID-1478210',
      customerName: 'Divya Lakshmi Rao',
      phone: '+91 9900112233',
      whatsapp: '919900112233',
      address:
        'Villa 14, Adarsh Vista, Basavanagar Main Rd, Near C V Raman Nagar, Bengaluru, Karnataka 560037',
      locality: 'C V Raman Nagar',
      eventType: 'Wedding',
      services: [
        {
          id: 'pkg-luxury-bridal',
          name: 'Luxury Bridal Makeup Package',
          price: 8999,
          quantity: 1,
        },
        {
          id: 'pkg-saree-draping',
          name: 'Basic Saree Draping',
          price: 599,
          quantity: 2,
        },
      ],
      date: upcomingDate1,
      time: '06:00 AM',
      itemsTotal: 10197,
      discount: 197,
      advancePaid: 3000,
      amountToCollect: 7000,
      notes: 'Early morning Muhurtham bridal makeover + bridesmaid saree draping.',
      status: 'Confirmed',
      bookingSource: 'Customer Website',
      assignedTeam: [INITIAL_TEAM_MEMBERS[0], INITIAL_TEAM_MEMBERS[1], INITIAL_TEAM_MEMBERS[2]],
      createdAt: '2026-10-27T16:20:00.000Z',
      updatedAt: '2026-10-27T16:20:00.000Z',
      badgeType: 'VISIT',
    },
    {
      id: 'ID-1478992',
      customerName: 'Sneha Kulkarni',
      phone: '+91 9611223344',
      whatsapp: '919611223344',
      address:
        '108, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      locality: 'Indiranagar',
      eventType: 'Engagement',
      services: [
        {
          id: 'pkg-engagement-makeup',
          name: 'Engagement Makeup & Hair Package',
          price: 4999,
          quantity: 1,
        },
      ],
      date: upcomingDate2,
      time: '11:00 AM',
      itemsTotal: 4999,
      discount: 0,
      advancePaid: 1000,
      amountToCollect: 3999,
      notes: 'Soft rose-gold eye makeup and half-up curls.',
      status: 'Confirmed',
      bookingSource: 'Instagram',
      assignedTeam: [INITIAL_TEAM_MEMBERS[2]],
      createdAt: '2026-10-30T12:10:00.000Z',
      updatedAt: '2026-10-30T12:10:00.000Z',
      badgeType: 'CALL',
    },
    {
      id: 'ID-1469012',
      customerName: 'Ritu Sharma',
      phone: '+91 9844556677',
      whatsapp: '919844556677',
      address: 'Tower B-602, Gopalan Grandeur, Hoodi, Bengaluru, Karnataka 560048',
      locality: 'Hoodi / Whitefield',
      eventType: 'Party',
      services: [
        {
          id: 'pkg-party-makeup',
          name: 'Basic Party Makeup',
          price: 1599,
          quantity: 1,
        },
      ],
      date: reportedDate,
      time: '02:00 PM',
      itemsTotal: 1599,
      discount: 0,
      advancePaid: 300,
      amountToCollect: 1299,
      notes: 'Client requested postponement due to event date change at venue.',
      status: 'Reported',
      reportReason: 'Client postponed event at last minute — follow-up scheduled for new date.',
      bookingSource: 'Phone Call',
      assignedTeam: [],
      createdAt: '2026-10-20T10:00:00.000Z',
      updatedAt: '2026-10-29T15:00:00.000Z',
      badgeType: 'FOLLOWUP',
    },
  ];

  const pastClients = [
    { name: 'Nandini Reddy', locality: 'C V Raman Nagar', pkgIdx: 6, dayOffset: -1, time: '06:00 AM' },
    { name: 'Pooja Hegde', locality: 'Nagavarapalya', pkgIdx: 5, dayOffset: -3, time: '11:00 AM' },
    { name: 'Aishwarya Menon', locality: 'Indiranagar', pkgIdx: 4, dayOffset: -4, time: '05:00 PM' },
    { name: 'Shruti Haasan', locality: 'Kaggadasapura', pkgIdx: 6, dayOffset: -6, time: '08:00 AM' },
    { name: 'Pallavi Joshi', locality: 'Whitefield', pkgIdx: 5, dayOffset: -8, time: '11:00 AM' },
    { name: 'Chaitra Vasudev', locality: 'Jayanagar', pkgIdx: 4, dayOffset: -10, time: '02:00 PM' },
    { name: 'Sindhu Loknath', locality: 'Brookefield', pkgIdx: 1, dayOffset: -12, time: '08:00 AM' },
    { name: 'Bhavana Rao', locality: 'C V Raman Nagar', pkgIdx: 6, dayOffset: -14, time: '06:00 AM' },
    { name: 'Rachita Ram', locality: 'Marathahalli', pkgIdx: -1, dayOffset: -16, time: '05:00 PM' },
    { name: 'Hariprriya S', locality: 'Nagavarapalya', pkgIdx: 5, dayOffset: -18, time: '11:00 AM' },
    { name: 'Ashika Ranganath', locality: 'Indiranagar', pkgIdx: 4, dayOffset: -20, time: '02:00 PM' },
    { name: 'Sreeleela K', locality: 'Koramangala', pkgIdx: 6, dayOffset: -22, time: '08:00 AM' },
    { name: 'Rukmini Vasanth', locality: 'C V Raman Nagar', pkgIdx: 2, dayOffset: -24, time: '11:00 AM' },
    { name: 'Shanvi Srivastava', locality: 'Domlur', pkgIdx: 5, dayOffset: -26, time: '05:00 PM' },
    { name: 'Nabha Natesh', locality: 'Kaggadasapura', pkgIdx: 0, dayOffset: -28, time: '08:00 AM' },
  ];

  pastClients.forEach((client, index) => {
    const pkg =
      client.pkgIdx >= 0
        ? INITIAL_SERVICES_CATALOG[client.pkgIdx]
        : INITIAL_SERVICES_CATALOG[4];
    const price = pkg.price || 1599;
    const dateStr = getOffsetDateISO(client.dayOffset);
    const idNum = 1461000 + index * 317;
    const advance = Math.round(price * 0.3);

    seedBookings.push({
      id: `ID-${idNum}`,
      customerName: client.name,
      phone: `+91 98450${10000 + index * 111}`,
      whatsapp: `9198450${10000 + index * 111}`,
      address: `No. ${12 + index}, 2nd Main, ${client.locality}, Bengaluru, Karnataka`,
      locality: client.locality,
      eventType: price >= 8000 ? 'Wedding' : price >= 4000 ? 'Engagement' : 'Party',
      services: [
        {
          id: pkg.id,
          name: pkg.name,
          price,
          quantity: 1,
        },
      ],
      date: dateStr,
      time: client.time,
      itemsTotal: price,
      discount: 0,
      advancePaid: advance,
      amountToCollect: 0,
      notes: 'Completed on-time with 5-star client feedback.',
      status: 'Completed',
      bookingSource: index % 2 === 0 ? 'Customer Website' : 'WhatsApp',
      assignedTeam: [INITIAL_TEAM_MEMBERS[index % INITIAL_TEAM_MEMBERS.length]],
      createdAt: `${dateStr}T04:00:00.000Z`,
      updatedAt: `${dateStr}T14:00:00.000Z`,
      completedAt: `${dateStr}T14:00:00.000Z`,
      badgeType: 'JOB',
    });
  });

  return seedBookings;
}

const SYNC_EVENT_NAME = 'eden_roses_data_updated';
let firebaseListenersAttached = false;
let isFirebaseLiveConnected = false;

export function getFirebaseConnectionStatus(): boolean {
  return isFirebaseLiveConnected || isFirebaseConfigured;
}

export function notifyDataUpdated() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
}

export function subscribeToDataUpdates(callback: () => void): () => void {
  startFirebaseRealtimeSync();
  const handleStorage = (e: StorageEvent) => {
    if (!e.key || Object.values(STORAGE_KEYS).includes(e.key)) {
      callback();
    }
  };
  window.addEventListener(SYNC_EVENT_NAME, callback);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, callback);
    window.removeEventListener('storage', handleStorage);
  };
}

let isSeedingBookings = false;
let isSeedingCustomers = false;
let isSeedingServices = false;

/**
 * Starts real-time Firebase listeners (`onSnapshot`) on `/bookings`, `/customers`, and `/services`.
 * Automatically seeds initial bookings and services into Firebase if the cloud collection is empty!
 */
export function startFirebaseRealtimeSync(): void {
  if (firebaseListenersAttached || !isFirebaseConfigured) return;
  firebaseListenersAttached = true;

  // 1. Real-time Bookings listener
  const bookingsPath = 'bookings';
  onSnapshot(
    collection(db, bookingsPath),
    async (snapshot) => {
      isFirebaseLiveConnected = true;
      if (isSeedingBookings) return;

      const cloudSeededKey = 'eden_roses_cloud_seeded_v2';
      if (snapshot.empty || (snapshot.size <= 1 && !localStorage.getItem(cloudSeededKey))) {
        isSeedingBookings = true;
        try {
          const initial = buildInitialSeedBookings();
          localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(initial));
          await Promise.all(
            initial.map((item) => {
              const clean = sanitizeBookingForFirestore(item);
              return setDoc(doc(db, bookingsPath, clean.id), clean).catch((err) => {
                console.warn('Initial booking seed warning:', err);
              });
            })
          );
          localStorage.setItem(cloudSeededKey, 'true');
        } finally {
          isSeedingBookings = false;
          notifyDataUpdated();
        }
        return;
      }

      const remoteBookings: Booking[] = [];
      snapshot.forEach((docSnap) => {
        remoteBookings.push(docSnap.data() as Booking);
      });

      if (remoteBookings.length > 0) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(remoteBookings));
        notifyDataUpdated();
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, bookingsPath);
    }
  );

  // 2. Real-time Customer Leads listener
  const customersPath = 'customers';
  onSnapshot(
    collection(db, customersPath),
    async (snapshot) => {
      isFirebaseLiveConnected = true;
      if (isSeedingCustomers) return;

      if (snapshot.empty) {
        isSeedingCustomers = true;
        try {
          const seedBookings = buildInitialSeedBookings().slice(0, 5);
          const seedLeads: CustomerLead[] = seedBookings.map((b) =>
            sanitizeCustomerLeadForFirestore({
              id: `LEAD-${b.id}`,
              customerName: b.customerName,
              phone: b.phone,
              whatsapp: b.whatsapp,
              address: b.address,
              locality: b.locality,
              eventType: b.eventType,
              message: `Booked ${b.services.map((s) => `${s.name} ×${s.quantity}`).join(', ')} on ${b.date} at ${b.time}`,
              lastBookingId: b.id,
              totalSpend: Math.max(0, b.itemsTotal - b.discount),
              source: b.bookingSource,
              createdAt: b.createdAt,
            })
          );
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(seedLeads));
          await Promise.all(
            seedLeads.map((lead) =>
              setDoc(doc(db, customersPath, lead.id), lead).catch((err) => {
                console.warn('Initial customer lead seed warning:', err);
              })
            )
          );
        } finally {
          isSeedingCustomers = false;
          notifyDataUpdated();
        }
        return;
      }

      const remoteLeads: CustomerLead[] = [];
      snapshot.forEach((docSnap) => {
        remoteLeads.push(docSnap.data() as CustomerLead);
      });
      remoteLeads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(remoteLeads));
      notifyDataUpdated();
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, customersPath);
    }
  );

  // 3. Real-time Services & Pricing Catalog listener
  const servicesPath = 'services';
  onSnapshot(
    collection(db, servicesPath),
    async (snapshot) => {
      isFirebaseLiveConnected = true;
      if (isSeedingServices) return;

      const servicesSeededKey = 'eden_roses_services_cloud_seeded_v5';
      if (snapshot.empty || (snapshot.size < 10 && !localStorage.getItem(servicesSeededKey))) {
        isSeedingServices = true;
        try {
          const initialCatalog = getServicesCatalog();
          await Promise.all(
            initialCatalog.map((item) => {
              const clean = sanitizeServiceForFirestore(item);
              return setDoc(doc(db, servicesPath, clean.id), clean).catch((err) => {
                console.warn('Initial service seed warning:', err);
              });
            })
          );
          localStorage.setItem(servicesSeededKey, 'true');
        } finally {
          isSeedingServices = false;
          notifyDataUpdated();
        }
        return;
      }

      const remoteServicesMap = new Map<string, ServiceCatalogItem>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ServiceCatalogItem;
        if (data && data.id) {
          remoteServicesMap.set(data.id, data);
        }
      });

      if (remoteServicesMap.size > 0) {
        // Keep initial catalog ordering for known IDs, and put newly added custom products at the top
        const knownOrderIds = new Set(INITIAL_SERVICES_CATALOG.map((s) => s.id));
        const customServices: ServiceCatalogItem[] = [];
        remoteServicesMap.forEach((srv, id) => {
          if (!knownOrderIds.has(id)) {
            customServices.push(srv);
          }
        });
        const orderedKnown: ServiceCatalogItem[] = [];
        INITIAL_SERVICES_CATALOG.forEach((seedSrv) => {
          const remoteSrv = remoteServicesMap.get(seedSrv.id);
          if (remoteSrv) {
            orderedKnown.push({ ...seedSrv, ...remoteSrv });
          }
        });
        const merged = [...customServices, ...orderedKnown];
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(merged));
        notifyDataUpdated();
      }
    },
    (error) => {
      console.warn('Services sync listener warning:', error);
    }
  );

  // 4. Real-time Team Members & Login Accounts listener
  const teamPath = 'team';
  let isSeedingTeam = false;
  onSnapshot(
    collection(db, teamPath),
    async (snapshot) => {
      isFirebaseLiveConnected = true;
      if (isSeedingTeam) return;

      const teamSeededKey = 'eden_roses_team_cloud_seeded_v5';
      if (snapshot.empty && !localStorage.getItem(teamSeededKey)) {
        isSeedingTeam = true;
        try {
          const initialTeam = getTeamMembers();
          await Promise.all(
            initialTeam.map((member) => {
              const clean = sanitizeTeamMemberForFirestore(member);
              return setDoc(doc(db, teamPath, clean.id), clean).catch((err) => {
                console.warn('Initial team seed warning:', err);
              });
            })
          );
          localStorage.setItem(teamSeededKey, 'true');
        } finally {
          isSeedingTeam = false;
          notifyDataUpdated();
        }
        return;
      }

      const remoteTeam: TeamMember[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as TeamMember;
        if (data && data.id) {
          remoteTeam.push(sanitizeTeamMemberForFirestore(data));
        }
      });

      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(remoteTeam));
      notifyDataUpdated();
    },
    (error) => {
      console.warn('Team sync listener warning:', error);
    }
  );

  // 5. Real-time Website Settings & CMS Content listener (/settings/businessProfile)
  let isSeedingSettings = false;
  onSnapshot(
    doc(db, 'settings', 'businessProfile'),
    async (docSnap) => {
      isFirebaseLiveConnected = true;
      if (isSeedingSettings) return;

      const settingsSeededKey = 'eden_roses_settings_cloud_seeded_v5';
      if (!docSnap.exists() || (!docSnap.data()?.heroBannerTitle && !localStorage.getItem(settingsSeededKey))) {
        isSeedingSettings = true;
        try {
          const initialSettings = sanitizeBusinessSettingsForFirestore(getBusinessSettings());
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
          await setDoc(doc(db, 'settings', 'businessProfile'), initialSettings).catch((err) => {
            console.warn('Initial settings seed warning:', err);
          });
          localStorage.setItem(settingsSeededKey, 'true');
        } finally {
          isSeedingSettings = false;
          notifyDataUpdated();
        }
        return;
      }

      const remoteData = docSnap.data() as Partial<BusinessSettings>;
      if (remoteData && remoteData.businessName) {
        const merged = sanitizeBusinessSettingsForFirestore({
          ...INITIAL_BUSINESS_SETTINGS,
          ...remoteData,
        });
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        notifyDataUpdated();
      }
    },
    (error) => {
      console.warn('Settings sync listener warning:', error);
    }
  );

  // 6. Real-time Portfolio Gallery listener (/gallery)
  const galleryPath = 'gallery';
  let isSeedingGallery = false;
  onSnapshot(
    collection(db, galleryPath),
    async (snapshot) => {
      isFirebaseLiveConnected = true;
      if (isSeedingGallery) return;

      const gallerySeededKey = 'eden_roses_gallery_cloud_seeded_v5';
      if (snapshot.empty && !localStorage.getItem(gallerySeededKey)) {
        isSeedingGallery = true;
        try {
          const initialGallery = getGalleryImages();
          await Promise.all(
            initialGallery.map((img) => {
              const clean = sanitizeGalleryItemForFirestore(img);
              return setDoc(doc(db, galleryPath, clean.id), clean).catch((err) => {
                console.warn('Initial gallery seed warning:', err);
              });
            })
          );
          localStorage.setItem(gallerySeededKey, 'true');
        } finally {
          isSeedingGallery = false;
          notifyDataUpdated();
        }
        return;
      }

      const remoteGalleryMap = new Map<string, EdenRoseImage>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as EdenRoseImage;
        if (data && data.id && data.url) {
          remoteGalleryMap.set(data.id, sanitizeGalleryItemForFirestore(data));
        }
      });

      if (remoteGalleryMap.size > 0) {
        const knownIds = new Set(EDEN_ROSES_PORTFOLIO_GALLERY.map((g) => g.id));
        const customUploaded: EdenRoseImage[] = [];
        remoteGalleryMap.forEach((img, id) => {
          if (!knownIds.has(id)) {
            customUploaded.push(img);
          }
        });
        const orderedKnown: EdenRoseImage[] = [];
        EDEN_ROSES_PORTFOLIO_GALLERY.forEach((seedImg) => {
          const remoteImg = remoteGalleryMap.get(seedImg.id);
          if (remoteImg) {
            orderedKnown.push(remoteImg);
          }
        });
        const mergedGallery = [...customUploaded, ...orderedKnown];
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(mergedGallery));
        notifyDataUpdated();
      }
    },
    (error) => {
      console.warn('Gallery sync listener warning:', error);
    }
  );

  // Optional Realtime Database (RTDB) live listeners if configured
  if (rtdb) {
    try {
      onValue(ref(rtdb, 'settings/businessProfile'), (snap) => {
        const val = snap.val();
        if (val && val.businessName) {
          const merged = sanitizeBusinessSettingsForFirestore({
            ...INITIAL_BUSINESS_SETTINGS,
            ...val,
          });
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
          notifyDataUpdated();
        }
      });
    } catch (err) {
      console.warn('RTDB settings listener skipped:', err);
    }
  }
}

export function ensureSeedDataInitialized(): void {
  try {
    const seeded = localStorage.getItem(STORAGE_KEYS.SEED_VERSION);
    if (!seeded) {
      const seedBookings = buildInitialSeedBookings();
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(seedBookings));
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES_CATALOG));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_BUSINESS_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(INITIAL_TEAM_MEMBERS));
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(EDEN_ROSES_PORTFOLIO_GALLERY));
      localStorage.setItem(STORAGE_KEYS.SELFIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SEED_VERSION, 'true');
    } else {
      // Ensure the uploaded Eden Roses logo is applied even if settings were previously saved
      const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings) as BusinessSettings;
        if (
          !parsed.logoUrl ||
          parsed.logoUrl.includes('edenroses.in/wp-content/uploads/2024/12')
        ) {
          parsed.logoUrl = OFFICIAL_UPLOADED_LOGO_URL;
          parsed.footerLogoUrl = OFFICIAL_UPLOADED_LOGO_URL;
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
        }
      }
    }
    startFirebaseRealtimeSync();
  } catch (err) {
    console.error('Failed to initialize seed data:', err);
  }
}

export function resetDemoData(): void {
  localStorage.removeItem(STORAGE_KEYS.SEED_VERSION);
  ensureSeedDataInitialized();
  notifyDataUpdated();
}

// ==================== BOOKING & CUSTOMER LEAD FUNCTIONS ====================

export function getBookings(): Booking[] {
  ensureSeedDataInitialized();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) return [];
    return JSON.parse(raw) as Booking[];
  } catch {
    return [];
  }
}

export function getCustomerLeads(): CustomerLead[] {
  ensureSeedDataInitialized();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) return [];
    return JSON.parse(raw) as CustomerLead[];
  } catch {
    return [];
  }
}

export async function saveCustomerLead(
  input: Omit<CustomerLead, 'id' | 'createdAt'> & { id?: string }
): Promise<CustomerLead> {
  const lead: CustomerLead = sanitizeCustomerLeadForFirestore({
    ...input,
    id: input.id || `CUST-${Date.now()}`,
    createdAt: new Date().toISOString(),
  });

  const existing = getCustomerLeads();
  const filtered = existing.filter((c) => c.id !== lead.id);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([lead, ...filtered]));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    const path = `customers/${lead.id}`;
    try {
      await setDoc(doc(db, 'customers', lead.id), lead);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  if (rtdb) {
    try {
      await set(ref(rtdb, `customers/${lead.id}`), lead);
    } catch (err) {
      console.warn('RTDB customer write skipped:', err);
    }
  }

  return lead;
}

function persistBookingsList(bookings: Booking[]): void {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  notifyDataUpdated();
}

export function getBookingById(bookingId: string): Booking | undefined {
  const all = getBookings();
  return all.find((b) => b.id.toLowerCase() === bookingId.toLowerCase());
}

export function getBookingsByDate(date: string): Booking[] {
  return getBookings()
    .filter((b) => b.date === date && b.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getBookingsByStatus(status: BookingStatus): Booking[] {
  return getBookings().filter((b) => b.status === status);
}

export function getUpcomingBookings(): Booking[] {
  const today = getTodayISO();
  return getBookings()
    .filter(
      (b) =>
        b.date >= today &&
        b.status !== 'Completed' &&
        b.status !== 'Cancelled' &&
        b.status !== 'Reported'
    )
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export function getCompletedBookings(): Booking[] {
  return getBookings()
    .filter((b) => b.status === 'Completed')
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function isSlotAvailable(
  date: string,
  time: string,
  excludeBookingId?: string
): boolean {
  const settings = getBusinessSettings();
  if (settings.blockedDates.includes(date)) {
    return false;
  }
  const existing = getBookings().find(
    (b) =>
      b.date === date &&
      b.time === time &&
      b.id !== excludeBookingId &&
      b.status !== 'Cancelled' &&
      b.status !== 'Reported'
  );
  return !existing;
}

export function getAvailableSlots(
  date: string,
  excludeBookingId?: string
): { time: string; available: boolean; bookedBy?: string }[] {
  const settings = getBusinessSettings();
  const slots = settings.timeSlots?.length ? settings.timeSlots : [...AVAILABLE_TIME_SLOTS];
  const dayBookings = getBookings().filter(
    (b) =>
      b.date === date &&
      b.id !== excludeBookingId &&
      b.status !== 'Cancelled' &&
      b.status !== 'Reported'
  );
  const isBlockedDate = settings.blockedDates.includes(date);

  return slots.map((time) => {
    const match = dayBookings.find((b) => b.time === time);
    return {
      time,
      available: !isBlockedDate && !match,
      bookedBy: match?.customerName,
    };
  });
}

export function generateUniqueBookingId(): string {
  const existingIds = new Set(getBookings().map((b) => b.id));
  let candidate = '';
  do {
    const randomNum = Math.floor(1470000 + Math.random() * 29999);
    candidate = `ID-${randomNum}`;
  } while (existingIds.has(candidate));
  return candidate;
}

export async function saveBooking(
  newBookingInput: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  if (!isSlotAvailable(newBookingInput.date, newBookingInput.time, newBookingInput.id)) {
    return {
      success: false,
      error: `The slot on ${newBookingInput.date} at ${newBookingInput.time} is already booked. Please choose another time slot.`,
    };
  }

  const now = new Date().toISOString();
  const bookingId = newBookingInput.id || generateUniqueBookingId();
  const itemsTotal = newBookingInput.services.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
  const discount = Number(newBookingInput.discount || 0);
  const advancePaid = Number(newBookingInput.advancePaid || 0);
  const amountToCollect = Math.max(0, itemsTotal - discount - advancePaid);

  const rawBooking: Booking = {
    ...newBookingInput,
    id: bookingId,
    itemsTotal,
    discount,
    advancePaid,
    amountToCollect,
    badgeType: newBookingInput.badgeType || 'VISIT',
    createdAt: now,
    updatedAt: now,
  };

  const booking = sanitizeBookingForFirestore(rawBooking);

  const all = getBookings();
  persistBookingsList([booking, ...all]);

  // Write to provisioned Firebase Firestore database
  if (isFirebaseConfigured) {
    const path = `bookings/${booking.id}`;
    try {
      await setDoc(doc(db, 'bookings', booking.id), booking);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  // Also write to Realtime Database if configured
  if (rtdb) {
    try {
      const slotRef = ref(rtdb, `bookings/${booking.id}`);
      await runTransaction(slotRef, (current) => {
        if (current !== null) return;
        return booking;
      });
    } catch (err) {
      console.warn('RTDB booking write skipped:', err);
    }
  }

  // Also sync customer's full details to `/customers` so Admin Panel Customer Directory updates live
  await saveCustomerLead({
    id: `LEAD-${booking.id}`,
    customerName: booking.customerName,
    phone: booking.phone,
    whatsapp: booking.whatsapp,
    address: booking.address,
    locality: booking.locality,
    eventType: booking.eventType,
    message: `Booked ${booking.services.map((s) => `${s.name} ×${s.quantity}`).join(', ')} on ${booking.date} at ${booking.time}${booking.notes ? ` | Notes: ${booking.notes}` : ''}`,
    lastBookingId: booking.id,
    totalSpend: Math.max(0, booking.itemsTotal - booking.discount),
    source: booking.bookingSource,
  });

  return { success: true, booking };
}

export async function updateBooking(
  bookingId: string,
  updates: Partial<Booking>
): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  const all = getBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx === -1) {
    return { success: false, error: 'Booking not found' };
  }

  const current = all[idx];
  const targetDate = updates.date ?? current.date;
  const targetTime = updates.time ?? current.time;

  if (
    (updates.date || updates.time) &&
    !isSlotAvailable(targetDate, targetTime, bookingId)
  ) {
    return {
      success: false,
      error: `Slot ${targetDate} at ${targetTime} is already booked by another client.`,
    };
  }

  const updatedServices = updates.services ?? current.services;
  const itemsTotal =
    updates.itemsTotal !== undefined
      ? Number(updates.itemsTotal)
      : updatedServices.reduce(
          (sum, item) => sum + Number(item.price) * Number(item.quantity),
          0
        );
  const discount =
    updates.discount !== undefined ? Number(updates.discount) : current.discount;
  const advancePaid =
    updates.advancePaid !== undefined
      ? Number(updates.advancePaid)
      : current.advancePaid;

  const isCompleted = (updates.status ?? current.status) === 'Completed';
  const amountToCollect = isCompleted
    ? 0
    : Math.max(0, itemsTotal - discount - advancePaid);

  const rawUpdatedBooking: Booking = {
    ...current,
    ...updates,
    services: updatedServices,
    itemsTotal,
    discount,
    advancePaid,
    amountToCollect,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    completedAt:
      updates.status === 'Completed' && !current.completedAt
        ? new Date().toISOString()
        : current.completedAt,
  };

  const updatedBooking = sanitizeBookingForFirestore(rawUpdatedBooking);
  all[idx] = updatedBooking;
  persistBookingsList(all);

  if (isFirebaseConfigured) {
    const path = `bookings/${bookingId}`;
    try {
      await setDoc(doc(db, 'bookings', bookingId), updatedBooking);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  if (rtdb) {
    try {
      await set(ref(rtdb, `bookings/${bookingId}`), updatedBooking);
    } catch (err) {
      console.warn('RTDB update skipped:', err);
    }
  }

  return { success: true, booking: updatedBooking };
}

export async function deleteBooking(bookingId: string): Promise<boolean> {
  const all = getBookings();
  const filtered = all.filter((b) => b.id !== bookingId);
  persistBookingsList(filtered);

  if (isFirebaseConfigured) {
    const path = `bookings/${bookingId}`;
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  if (rtdb) {
    try {
      await set(ref(rtdb, `bookings/${bookingId}`), null);
    } catch (err) {
      console.warn('RTDB delete skipped:', err);
    }
  }
  return true;
}

export interface DashboardStats {
  today: number;
  tomorrow: number;
  upcoming: number;
  overdue: number;
  closed: number;
  report: number;
  totalEarnings: number;
  availableBalance: number;
  advancePaymentsTotal: number;
  pendingCollectionsTotal: number;
  completedPaymentsTotal: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

export function getDashboardStats(): DashboardStats {
  const all = getBookings();
  const todayISO = getTodayISO();
  const tomorrowISO = getOffsetDateISO(1);
  const weekAgoISO = getOffsetDateISO(-7);
  const monthAgoISO = getOffsetDateISO(-30);

  let today = 0;
  let tomorrow = 0;
  let upcoming = 0;
  let overdue = 0;
  let closed = 0;
  let report = 0;

  let advancePaymentsTotal = 0;
  let pendingCollectionsTotal = 0;
  let completedPaymentsTotal = 0;
  let dailyEarnings = 0;
  let weeklyEarnings = 0;
  let monthlyEarnings = 0;

  for (const b of all) {
    if (b.status === 'Cancelled') continue;

    const netOrderValue = Math.max(0, b.itemsTotal - b.discount);

    if (b.status === 'Reported') {
      report += 1;
      advancePaymentsTotal += b.advancePaid;
      continue;
    }

    if (b.status === 'Completed') {
      closed += 1;
      completedPaymentsTotal += netOrderValue;
      if (b.date === todayISO) dailyEarnings += netOrderValue;
      if (b.date >= weekAgoISO) weeklyEarnings += netOrderValue;
      if (b.date >= monthAgoISO) monthlyEarnings += netOrderValue;
      continue;
    }

    advancePaymentsTotal += b.advancePaid;
    pendingCollectionsTotal += b.amountToCollect;

    if (b.date === todayISO) {
      today += 1;
      dailyEarnings += b.advancePaid;
      weeklyEarnings += b.advancePaid;
      monthlyEarnings += b.advancePaid;
    } else if (b.date === tomorrowISO) {
      tomorrow += 1;
      weeklyEarnings += b.advancePaid;
      monthlyEarnings += b.advancePaid;
    } else if (b.date > tomorrowISO) {
      upcoming += 1;
      monthlyEarnings += b.advancePaid;
    } else if (b.date < todayISO) {
      overdue += 1;
    }
  }

  const totalEarnings = completedPaymentsTotal + advancePaymentsTotal;
  const availableBalance = totalEarnings;

  return {
    today,
    tomorrow,
    upcoming,
    overdue,
    closed,
    report,
    totalEarnings,
    availableBalance,
    advancePaymentsTotal,
    pendingCollectionsTotal,
    completedPaymentsTotal,
    dailyEarnings,
    weeklyEarnings,
    monthlyEarnings,
  };
}

// ==================== SETTINGS, SERVICES, TEAM & GALLERY ====================

export function getBusinessSettings(): BusinessSettings {
  ensureSeedDataInitialized();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return INITIAL_BUSINESS_SETTINGS;
    return { ...INITIAL_BUSINESS_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_BUSINESS_SETTINGS;
  }
}

export async function saveBusinessSettings(settings: BusinessSettings): Promise<void> {
  const cleanSettings = sanitizeBusinessSettingsForFirestore(settings);
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cleanSettings));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    const path = 'settings/businessProfile';
    try {
      await setDoc(doc(db, 'settings', 'businessProfile'), cleanSettings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  if (rtdb) {
    try {
      await set(ref(rtdb, 'settings/businessProfile'), cleanSettings);
    } catch (err) {
      console.warn('RTDB saveBusinessSettings skipped:', err);
    }
  }
}

export function getServicesCatalog(): ServiceCatalogItem[] {
  ensureSeedDataInitialized();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!raw) return INITIAL_SERVICES_CATALOG;
    return JSON.parse(raw);
  } catch {
    return INITIAL_SERVICES_CATALOG;
  }
}

export async function saveServicesCatalog(services: ServiceCatalogItem[]): Promise<void> {
  const cleanedList = services.map((s) => sanitizeServiceForFirestore(s));
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(cleanedList));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    try {
      await Promise.all(
        cleanedList.map((item) => setDoc(doc(db, 'services', item.id), item))
      );
    } catch (error) {
      console.warn('Firestore saveServicesCatalog warning:', error);
    }
  }
}

export async function upsertServiceCatalogItem(item: ServiceCatalogItem): Promise<ServiceCatalogItem> {
  const cleanItem = sanitizeServiceForFirestore(item);
  const current = getServicesCatalog();
  const exists = current.some((s) => s.id === cleanItem.id);
  const nextList = exists
    ? current.map((s) => (s.id === cleanItem.id ? cleanItem : s))
    : [cleanItem, ...current];

  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(nextList));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    const path = `services/${cleanItem.id}`;
    try {
      await setDoc(doc(db, 'services', cleanItem.id), cleanItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  return cleanItem;
}

export async function deleteServiceCatalogItem(serviceId: string): Promise<void> {
  const current = getServicesCatalog();
  const nextList = current.filter((s) => s.id !== serviceId);
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(nextList));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    const path = `services/${serviceId}`;
    try {
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

export function getTeamMembers(): TeamMember[] {
  ensureSeedDataInitialized();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
    if (!raw) return INITIAL_TEAM_MEMBERS;
    const parsed = JSON.parse(raw) as TeamMember[];
    return parsed.map((m) => sanitizeTeamMemberForFirestore(m));
  } catch {
    return INITIAL_TEAM_MEMBERS;
  }
}

export async function saveTeamMembers(members: TeamMember[]): Promise<void> {
  const cleaned = members.map((m) => sanitizeTeamMemberForFirestore(m));
  localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(cleaned));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    try {
      await Promise.all(
        cleaned.map((member) => setDoc(doc(db, 'team', member.id), member))
      );
    } catch (error) {
      console.warn('Firestore saveTeamMembers warning:', error);
    }
  }
}

export async function upsertTeamMember(member: TeamMember): Promise<TeamMember> {
  const cleanMember = sanitizeTeamMemberForFirestore(member);
  const current = getTeamMembers();
  const exists = current.some((m) => m.id === cleanMember.id);
  const nextList = exists
    ? current.map((m) => (m.id === cleanMember.id ? cleanMember : m))
    : [cleanMember, ...current];

  localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(nextList));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    const path = `team/${cleanMember.id}`;
    try {
      await setDoc(doc(db, 'team', cleanMember.id), cleanMember);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  return cleanMember;
}

export async function deleteTeamMember(memberId: string): Promise<void> {
  const current = getTeamMembers();
  const nextList = current.filter((m) => m.id !== memberId);
  localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(nextList));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    const path = `team/${memberId}`;
    try {
      await deleteDoc(doc(db, 'team', memberId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

export function authenticatePartnerLogin(
  userIdInput: string,
  passwordInput: string
): {
  success: boolean;
  user?: PartnerSessionUser;
  error?: string;
} {
  const cleanId = userIdInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanId || !cleanPass) {
    return {
      success: false,
      error: 'Please enter both User ID and Password.',
    };
  }

  // 1. Check Master Admin credentials (Subba Lakshmi)
  const adminIds = ['admin', 'subbalakshmi', 'edenroses', '7019135530'];
  const adminPasswords = ['7777', 'eden7777', 'admin123', '1234'];
  if (adminIds.includes(cleanId) && adminPasswords.includes(cleanPass)) {
    return {
      success: true,
      user: {
        id: 'admin-master',
        name: 'Subba Lakshmi',
        role: 'Founder & Lead Makeup Artist (Admin)',
        userId: cleanId,
        phone: '+91 7019135530',
        isAdmin: true,
      },
    };
  }

  // 2. Check Team Member accounts
  const team = getTeamMembers();
  const normalizedPhoneInput = cleanId.replace(/[^0-9]/g, '');
  const matchedMember = team.find((m) => {
    const memberUserId = (m.userId || '').trim().toLowerCase();
    const memberPhoneDigits = (m.phone || '').replace(/[^0-9]/g, '');
    return (
      memberUserId === cleanId ||
      (normalizedPhoneInput.length >= 10 &&
        memberPhoneDigits.endsWith(normalizedPhoneInput.slice(-10)))
    );
  });

  if (!matchedMember) {
    return {
      success: false,
      error:
        'User ID not found or account has been deleted by Admin. Please contact Subba Lakshmi.',
    };
  }

  if (matchedMember.active === false) {
    return {
      success: false,
      error: `Account "${matchedMember.userId || matchedMember.name}" is currently disabled by Admin.`,
    };
  }

  if ((matchedMember.password || 'eden123') !== cleanPass) {
    return {
      success: false,
      error: 'Incorrect password for this Team User ID. Please try again.',
    };
  }

  return {
    success: true,
    user: {
      id: matchedMember.id,
      name: matchedMember.name,
      role: matchedMember.role,
      userId: matchedMember.userId || cleanId,
      phone: matchedMember.phone,
      isAdmin: false,
    },
  };
}

export function getGalleryImages(): EdenRoseImage[] {
  ensureSeedDataInitialized();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GALLERY);
    if (!raw) return EDEN_ROSES_PORTFOLIO_GALLERY;
    return JSON.parse(raw);
  } catch {
    return EDEN_ROSES_PORTFOLIO_GALLERY;
  }
}

export async function saveGalleryImages(images: EdenRoseImage[]): Promise<void> {
  const cleaned = images.map((img) => sanitizeGalleryItemForFirestore(img));
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(cleaned));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    try {
      await Promise.all(
        cleaned.map((img) => setDoc(doc(db, 'gallery', img.id), img))
      );
    } catch (error) {
      console.warn('Firestore saveGalleryImages warning:', error);
    }
  }

  if (rtdb) {
    try {
      await set(ref(rtdb, 'gallery'), cleaned);
    } catch (err) {
      console.warn('RTDB saveGalleryImages skipped:', err);
    }
  }
}

export async function upsertGalleryImage(image: EdenRoseImage): Promise<EdenRoseImage> {
  const cleanImg = sanitizeGalleryItemForFirestore(image);
  const current = getGalleryImages();
  const exists = current.some((g) => g.id === cleanImg.id);
  const nextList = exists
    ? current.map((g) => (g.id === cleanImg.id ? cleanImg : g))
    : [cleanImg, ...current];

  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(nextList));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    const path = `gallery/${cleanImg.id}`;
    try {
      await setDoc(doc(db, 'gallery', cleanImg.id), cleanImg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  return cleanImg;
}

export async function deleteGalleryImage(imageId: string): Promise<void> {
  const current = getGalleryImages();
  const nextList = current.filter((g) => g.id !== imageId);
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(nextList));
  notifyDataUpdated();

  if (isFirebaseConfigured) {
    const path = `gallery/${imageId}`;
    try {
      await deleteDoc(doc(db, 'gallery', imageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

export function getPartnerSelfies(): PartnerSelfieLog[] {
  ensureSeedDataInitialized();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELFIES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePartnerSelfie(
  selfie: Omit<PartnerSelfieLog, 'id' | 'timestamp'>
): PartnerSelfieLog {
  const current = getPartnerSelfies();
  const entry: PartnerSelfieLog = {
    ...selfie,
    id: `SELFIE-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.SELFIES, JSON.stringify([entry, ...current]));
  notifyDataUpdated();
  return entry;
}

export function buildWhatsAppBookingUrl(booking: Booking, whatsappNumber?: string): string {
  const settings = getBusinessSettings();
  const targetPhone = (whatsappNumber || settings.whatsappNumber || '917019135530').replace(
    /[^0-9]/g,
    ''
  );
  const servicesLines = booking.services
    .map((s) => `• ${s.name} (${s.quantity} × ₹${s.price}) = ₹${s.price * s.quantity}`)
    .join('\n');

  const message = [
    `🌸 *EDEN ROSES MAKEOVER — APPOINTMENT CONFIRMED* 🌸`,
    `By Subba Lakshmi | Bengaluru`,
    ``,
    `*Booking ID:* ${booking.id}`,
    `*Client Name:* ${booking.customerName}`,
    `*Phone:* ${booking.phone}`,
    `*Event Type:* ${booking.eventType}`,
    `*Date:* ${booking.date}`,
    `*Time Slot:* ${booking.time}`,
    `*Venue / Address:* ${booking.address}`,
    ``,
    `*Selected Services:*`,
    servicesLines,
    ``,
    `*Items Total:* ₹${booking.itemsTotal}`,
    booking.discount > 0 ? `*Discount:* -₹${booking.discount}` : null,
    `*Advance Paid:* ₹${booking.advancePaid}`,
    `*Balance To Be Collected:* ₹${booking.amountToCollect}`,
    booking.notes ? `\n*Special Notes:* ${booking.notes}` : null,
    ``,
    `📍 Studio: ${settings.address}`,
    `🌐 ${settings.websiteUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}
