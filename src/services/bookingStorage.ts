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
  description: string;
  price: number | null;
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
  blockedDates: string[];
  timeSlots: string[];
}

export interface PartnerSelfieLog {
  id: string;
  bookingId?: string;
  imageUrl: string;
  timestamp: string;
  note: string;
}

const STORAGE_KEYS = {
  SEED_VERSION: 'eden_roses_seed_v4',
  BOOKINGS: 'eden_roses_bookings_v4',
  CUSTOMERS: 'eden_roses_customers_v4',
  SERVICES: 'eden_roses_services_v4',
  SETTINGS: 'eden_roses_business_settings_v4',
  TEAM: 'eden_roses_team_members_v4',
  GALLERY: 'eden_roses_gallery_images_v4',
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
    'C V Raman Nagar, Nagavarapalya, Kaggadasapura, Indiranagar, Brookefield, Whitefield, Jayanagar & All Across Bengaluru',
  heroImageUrl:
    'https://edenroses.in/wp-content/uploads/2024/12/Short-and-sweet-just-like-a-perfect-love-story.-.A-touch-of-makeup-a-touch-of-magicWe-are-here-to-doll-you-up-for.your-best-day.jpg',
  blockedDates: [],
  timeSlots: [...AVAILABLE_TIME_SLOTS],
};

export const INITIAL_SERVICES_CATALOG: ServiceCatalogItem[] = [
  {
    id: 'pkg-saree-draping',
    name: 'Basic Saree Draping',
    category: 'Bridal & Makeup Packages',
    description:
      'Crisp, structured pleating, pallu pinning, and silhouette draping for silk, Kanjeevaram, organza, and designer sarees.',
    price: 599,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-saree-draping'].url,
    isPackage: true,
    duration: '30 mins',
  },
  {
    id: 'pkg-hair-half-up',
    name: 'Half - up & down Advance Hairstyling',
    category: 'Bridal & Makeup Packages',
    description:
      'Sculpted crown volume paired with soft, long-lasting cascading waves—ideal for engagements, receptions, and sangeet.',
    price: 999,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-hair-half-up'].url,
    isPackage: true,
    duration: '45 mins',
  },
  {
    id: 'pkg-hair-braid-curls',
    name: 'Braid with curls Advance Hairstyling',
    category: 'Bridal & Makeup Packages',
    description:
      'Intricate bridal or festive braid woven with defined curls, ready for fresh floral veni, poola jada, or hair accessories.',
    price: 999,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-hair-braid-curls'].url,
    isPackage: true,
    duration: '45 mins',
  },
  {
    id: 'pkg-hair-messy-updo',
    name: 'Messy up-do Advance Hairstyling',
    category: 'Bridal & Makeup Packages',
    description:
      'Romantic textured messy bun with delicate face-framing tendrils that complements both traditional sarees and modern gowns.',
    price: 999,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-hair-messy-updo'].url,
    isPackage: true,
    duration: '45 mins',
  },
  {
    id: 'pkg-party-makeup',
    name: 'Basic Party Makeup',
    category: 'Bridal & Makeup Packages',
    description:
      'Wedding in the family, birthday, baby shower, graduation, or theme party? Look glamorous and dazzle on every special occasion.',
    price: 1599,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-party-makeup'].url,
    isPackage: true,
    airbrushAvailable: true,
    duration: '60 mins',
  },
  {
    id: 'pkg-engagement-makeup',
    name: 'Engagement Makeup & Hair Package',
    category: 'Bridal & Makeup Packages',
    description:
      'Complete HD engagement makeover with skin prep, customized eye artistry, eyelashes, advance hairstyling, and outfit draping.',
    price: 4999,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-engagement-makeup'].url,
    isPackage: true,
    airbrushAvailable: true,
    duration: '120 mins',
  },
  {
    id: 'pkg-luxury-bridal',
    name: 'Luxury Bridal Makeup Package',
    category: 'Bridal & Makeup Packages',
    description:
      'Signature bridal transformation by Subba Lakshmi including luxury HD skin finish, bespoke bridal hairstyling, saree draping, and jewellery setting.',
    price: 8999,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-luxury-bridal'].url,
    isPackage: true,
    airbrushAvailable: true,
    duration: '180 mins',
  },
  {
    id: 'srv-basic-makeover',
    name: 'Basic Make Over',
    category: 'Makeup Services',
    description:
      'Natural, radiant makeover tailored for intimate gatherings, corporate events, and daytime celebrations.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-basic-makeover'].url,
    isPackage: false,
  },
  {
    id: 'srv-party-makeover',
    name: 'Party Make Over',
    category: 'Makeup Services',
    description:
      'Wedding in the family, birthday, baby shower, graduation, or attending a theme party? Come in for a transformation that leaves everyone in awe.',
    price: 1599,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-party-makeup'].url,
    isPackage: false,
    airbrushAvailable: true,
  },
  {
    id: 'srv-bridal-makeover',
    name: 'Bridal Make Over',
    category: 'Makeup Services',
    description:
      'Getting married? Look mesmerizing every step of the way! From your engagement and pre-bridal shoot to pre-wedding ceremonies and the final wedding look.',
    price: 8999,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['pkg-luxury-bridal'].url,
    isPackage: false,
    airbrushAvailable: true,
  },
  {
    id: 'srv-special-bridal',
    name: 'Special Bridal Packages',
    category: 'Makeup Services',
    description:
      'We offer special tailor-made packages to suit your unique requirements for all your events. Let us create the perfect look for your special day!',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-special-bridal'].url,
    isPackage: false,
    airbrushAvailable: true,
  },
  {
    id: 'srv-airbrush-makeup',
    name: 'Airbrush Makeup',
    category: 'Makeup Services',
    description:
      'We use the latest equipment and silicone-based formulas to create High-Definition makeup. Can be requested for party or bridal looks at an additional cost.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-airbrush-makeup'].url,
    isPackage: false,
    airbrushAvailable: true,
  },
  {
    id: 'srv-hair-treatments',
    name: 'Hair Treatments',
    category: 'Hair & Styling',
    description:
      'Transform your hair with our expert treatments at Eden Roses Unisex Salon in Bengaluru. Perfect for all hair types.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-hair-treatments'].url,
    isPackage: false,
  },
  {
    id: 'srv-hair-spa',
    name: 'Hair Spa',
    category: 'Hair & Styling',
    description:
      'Deep nourishing and revitalizing hair spa rituals for silky, frizz-free, healthy shine.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-hair-spa'].url,
    isPackage: false,
  },
  {
    id: 'srv-haircuts',
    name: 'Haircuts for Men and Women',
    category: 'Hair & Styling',
    description:
      'Precision haircuts, layering, and contemporary styling for men and women by experienced stylists.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-haircuts'].url,
    isPackage: false,
  },
  {
    id: 'srv-skin-care',
    name: 'Skin Care',
    category: 'Skin & Facial',
    description:
      'Revitalize your skin with premium facials and treatments at our salon in C V Raman Nagar, Bengaluru.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-skin-care'].url,
    isPackage: false,
  },
  {
    id: 'srv-hydra-facial',
    name: 'Hydra Facial',
    category: 'Skin & Facial',
    description:
      'Experience the ultimate skin rejuvenation with HydraFacial at Eden Roses Unisex Salon. Say goodbye to dull skin and hello to a radiant complexion!',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-hydra-facial'].url,
    isPackage: false,
  },
  {
    id: 'srv-bridal-salon',
    name: 'Bridal Makeup (In-Studio & Venue)',
    category: 'Makeup Services',
    description:
      'Look stunning on your big day with bridal makeup by our experts in Bengaluru.',
    price: 8999,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-bridal-salon'].url,
    isPackage: false,
  },
  {
    id: 'srv-waxing',
    name: 'Waxing Services',
    category: 'Spa & Nails',
    description:
      'Smooth and flawless skin with our hygienic, gentle professional waxing services in Bangalore.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-waxing'].url,
    isPackage: false,
  },
  {
    id: 'srv-mani-pedi',
    name: 'Manicure and Pedicure',
    category: 'Spa & Nails',
    description:
      'Pamper your hands and feet with luxurious manicure and pedicure services at our salon.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-mani-pedi'].url,
    isPackage: false,
  },
  {
    id: 'srv-massage',
    name: 'Massage Therapies',
    category: 'Spa & Nails',
    description:
      'Relaxing head, shoulder, and body massage therapies tailored for complete stress relief and rejuvenation.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-massage'].url,
    isPackage: false,
  },
  {
    id: 'srv-nail-art',
    name: 'Nail Art',
    category: 'Spa & Nails',
    description:
      'Bridal nail extensions, gel polish, French tips, and custom nail art designs.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-nail-art'].url,
    isPackage: false,
  },
  {
    id: 'srv-permanent-makeup',
    name: 'Permanent Makeup',
    category: 'Permanent Makeup',
    description:
      'Long-lasting cosmetic artistry performed with precision equipment and certified pigments.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-permanent-makeup'].url,
    isPackage: false,
  },
  {
    id: 'srv-bb-glow',
    name: 'BB Glow',
    category: 'Permanent Makeup',
    description:
      'Semi-permanent foundation glow facial for even-toned, radiant, pore-refined skin.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-bb-glow'].url,
    isPackage: false,
  },
  {
    id: 'srv-cc-glow',
    name: 'CC Glow',
    category: 'Permanent Makeup',
    description:
      'Color-correcting luminous skin treatment targeting pigmentation and uneven skin tone.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-cc-glow'].url,
    isPackage: false,
  },
  {
    id: 'srv-microblading',
    name: 'Microblading',
    category: 'Permanent Makeup',
    description:
      'Natural hair-stroke eyebrow architecture customized to your facial proportions.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-microblading'].url,
    isPackage: false,
  },
  {
    id: 'srv-micro-shading',
    name: 'Micro Shading',
    category: 'Permanent Makeup',
    description:
      'Soft powdered brow definition ideal for all skin types and long-lasting fullness.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-micro-shading'].url,
    isPackage: false,
  },
  {
    id: 'srv-ombre-brows',
    name: 'Ombre Brows',
    category: 'Permanent Makeup',
    description:
      'Seamless gradient brow styling transitioning from a soft front to a defined tail.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-ombre-brows'].url,
    isPackage: false,
  },
  {
    id: 'srv-lip-pigment',
    name: 'Lip Pigment',
    category: 'Permanent Makeup',
    description:
      'Lip neutralization and natural tint enhancement for soft, youthful lip color.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-lip-pigment'].url,
    isPackage: false,
  },
  {
    id: 'srv-beauty-spot',
    name: 'Beauty Spot',
    category: 'Permanent Makeup',
    description:
      'Delicate cosmetic beauty mark placement tailored to your aesthetic preference.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-permanent-makeup'].url,
    isPackage: false,
  },
  {
    id: 'srv-permanent-blush',
    name: 'Permanent Blush',
    category: 'Permanent Makeup',
    description:
      'Subtle, natural-looking cheek tint treatment for a fresh everyday bridal flush.',
    price: null,
    image: EDEN_ROSES_SERVICE_THUMBNAILS['srv-bb-glow'].url,
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
  },
  {
    id: 'tm-2',
    name: 'Deepika R',
    role: 'Saree Drapist',
    phone: '+91 9845044556',
    active: true,
  },
  {
    id: 'tm-3',
    name: 'Anusha Gowda',
    role: 'Assistant Makeup Artist',
    phone: '+91 9845077889',
    active: true,
  },
  {
    id: 'tm-4',
    name: 'Meghana S',
    role: 'Other Team Member',
    phone: '+91 9845099001',
    active: true,
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

/**
 * Starts real-time Firebase listeners (`onSnapshot`) on `/bookings` and `/customers`.
 * Automatically seeds initial bookings into Firebase if the cloud collection is empty!
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
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  notifyDataUpdated();
  if (isFirebaseConfigured) {
    const path = 'settings/businessProfile';
    try {
      await setDoc(doc(db, 'settings', 'businessProfile'), {
        businessName: String(settings.businessName).slice(0, 150),
        makeupBrand: String(settings.makeupBrand).slice(0, 150),
        artistName: String(settings.artistName).slice(0, 120),
        phonePrimary: String(settings.phonePrimary).slice(0, 40),
        address: String(settings.address).slice(0, 500),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
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
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  notifyDataUpdated();
}

export function getTeamMembers(): TeamMember[] {
  ensureSeedDataInitialized();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
    if (!raw) return INITIAL_TEAM_MEMBERS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEAM_MEMBERS;
  }
}

export async function saveTeamMembers(members: TeamMember[]): Promise<void> {
  localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(members));
  notifyDataUpdated();
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
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(images));
  notifyDataUpdated();
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
