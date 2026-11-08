import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Sparkles,
  Award,
  Heart,
  ShieldCheck,
  X,
  ExternalLink,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Menu,
  Check,
  Tag,
  Search,
  ListFilter,
  Info,
  Home,
  Image as ImageIcon,
} from 'lucide-react';
import { SmartImage } from '../components/SmartImage';
import {
  CLOUDINARY_ASSETS,
  EDEN_ROSES_ABOUT_IMAGES,
  EDEN_ROSES_HERO_IMAGES,
  EDEN_ROSES_TESTIMONIAL_IMAGES,
  GalleryFilterCategory,
  EdenRoseImage,
} from '../config/edenRosesImages';
import {
  Booking,
  BookingServiceItem,
  BusinessSettings,
  EventType,
  MakeupLandingGroup,
  MakeupSubCategory,
  ServiceCatalogItem,
  buildWhatsAppBookingUrl,
  formatDateISO,
  getAvailableSlots,
  getBookings,
  getBusinessSettings,
  getCustomAreas,
  getGalleryImages,
  getServicesCatalog,
  getTodayISO,
  saveBooking,
  saveCustomerLead,
  subscribeToDataUpdates,
} from '../services/bookingStorage';
import { uploadImageAsset } from '../services/firebaseConfig';

const MANDATORY_ADVANCE_AMOUNT = 99;
const OFFICIAL_UPI_QR_IMAGE = '/assets/aistudio/IMG-20261107-WA0046_3abcf341.jpg';
const OFFICIAL_UPI_ID = 'sublakshmisjec-2@oksbi';
const OFFICIAL_UPI_PAY_LINK =
  'upi://pay?pa=sublakshmisjec-2@oksbi&pn=Subha%20Eden%20Roses&am=99&cu=INR&tn=Eden%20Roses%20Advance%20Booking';

// Configurable Service Areas in Bangalore (Editable / extensible via Business Settings)
const BENGALURU_LOCALITIES = [
  'All Bangalore (Engagement & Wedding)',
  'Ulsoor',
  'Marathahalli',
  'Kaggadaspura',
  'Whitefield',
  'Brookefield',
  'Varthur',
  'Hoodi',
  'KR Puram',
  'Hebbal',
  'Yelahanka',
  'Malleshwaram',
  'Vijayanagar',
  'Rajajinagar',
  'Koramangala',
  'HSR Layout',
  'HBR Layout',
  'Banashankari',
  'BTM Layout',
  'Residency Road',
  'MG Road',
  'Ashok Nagar',
  'Jayanagar',
  'JP Nagar',
  'Electronic City (E City)',
  'Hennur',
  'Indiranagar',
  'Chikkaballapur',
  'Hoskote',
  'Kolar',
  'Dodballapur',
  'Vijayapura (Devanahalli)',
  'Vidyapeeta',
  'Girinagar',
  'Bankcolony',
  'Hanumanth Nagar',
  'Nayandahalli',
  'Raja Rajeshwari Nagar',
  'Hosakerahalli',
  'Gandi Bazar',
  'Basvangudi',
  'VV Puram',
  'Yediur',
  'Chamrajpet',
  'Padmanab Nagar',
  'Kumarswamy Layout',
  'Uttrahalli',
  'Srinagar',
  'Avalahalli',
  'Kanakapura',
  'Kamakhya Outer Ring Road',
  'Konanakunte',
  'Mysore Road Circle',
  'Deepanjali Nagar',
  'Magdi Road',
  'Nagarbhavi',
  'Housing Board',
  'Mudalapalya',
];

const EVENT_TYPES: EventType[] = [
  'Wedding',
  'Engagement',
  'Reception',
  'Party',
  'Photoshoot',
  'Other',
];

// 2. MAKEUP & STYLING LANDING PAGE CATEGORIES (Matches Reference Video 0:00 - 0:10)
interface LandingCategoryCard {
  id: MakeupLandingGroup;
  title: string;
  group: 'MAKEUP' | 'MEN SALON';
  image: string;
  targetSubCategory?: MakeupSubCategory;
  badge?: string;
}

const MAKEUP_STYLING_LANDING_CATEGORIES: LandingCategoryCard[] = [
  {
    id: 'Makeup & Styling for Women',
    title: 'Makeup & Styling for Women',
    group: 'MAKEUP',
    image:
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80',
    targetSubCategory: 'Party Makeup',
    badge: 'Popular',
  },
  {
    id: 'Saree Draping',
    title: 'Saree Draping',
    group: 'MAKEUP',
    image: CLOUDINARY_ASSETS.sareeBasic,
    targetSubCategory: 'Saree Draping',
  },
  {
    id: 'Hair Styling for Women',
    title: 'Hair Styling for Women',
    group: 'MAKEUP',
    image:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    targetSubCategory: 'Hair Styling',
  },
  {
    id: 'Salon for Women',
    title: 'Salon for Women',
    group: 'MAKEUP',
    image:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    targetSubCategory: 'Salon for Women',
  },
  {
    id: 'Salon for Men',
    title: 'Salon for Men',
    group: 'MEN SALON',
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    targetSubCategory: 'Salon for Men',
  },
];

// 3. 100% EXACT LOCKED SIGNATURE SERVICE CARDS (Strict Title, Description & Verified Image Mapping)
interface SignatureServiceCard {
  id: string;
  title: string;
  description: string;
  image: string;
  badge: string;
  serviceIdToBook: string;
  defaultPrice: number;
  targetSubCategory: MakeupSubCategory;
}

const LOCKED_SIGNATURE_SERVICE_CARDS: SignatureServiceCard[] = [
  {
    id: 'sig-card-1-bridal-party-makeup',
    title: 'Bridal & Party Makeup',
    description:
      'HD, Airbrush, and traditional bridal & party makeup by expert artists—available in-studio and on-location across Bangalore.',
    image:
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80',
    badge: 'In-Studio & On-Location Across Bangalore',
    serviceIdToBook: 'pkg-party-makeup',
    defaultPrice: 1599,
    targetSubCategory: 'Bridal Makeup',
  },
  {
    id: 'sig-card-2-mens-grooming',
    title: "Men's Grooming & Styling",
    description:
      "Precision men's haircuts, beard trimming, luxury shaves, and men's detan facials at our Kaggadaspura & Electronic City salons.",
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    badge: 'Kaggadaspura & Electronic City Salons',
    serviceIdToBook: 'srv-haircuts',
    defaultPrice: 499,
    targetSubCategory: 'Salon for Men',
  },
  {
    id: 'sig-card-3-hair-spa',
    title: 'Hair Spa & Deep Conditioning',
    description:
      'Nourishing hair spa, deep conditioning, scalp massage, and keratin protein hair therapy for smooth, frizz-free hair.',
    image:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    badge: 'Deep Keratin & Protein Hair Therapy',
    serviceIdToBook: 'srv-hair-spa',
    defaultPrice: 1199,
    targetSubCategory: 'Salon for Women',
  },
  {
    id: 'sig-card-4-haircuts-styling',
    title: 'Haircuts & Advanced Hair Styling',
    description:
      'Professional haircuts, layer cuts, blow-dry, curls, and smooth hair styling tailored to your look.',
    image:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    badge: 'Precision Cuts & Advance Styling',
    serviceIdToBook: 'srv-skin-care',
    defaultPrice: 799,
    targetSubCategory: 'Hair Styling',
  },
  {
    id: 'sig-card-5-facial-mani-pedi',
    title: 'Facial, Manicure & Pedicure',
    description:
      'Rejuvenating skin facials, glow cleanups, luxury manicure, and spa pedicure services at our salon branches.',
    image:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    badge: 'Kaggadaspura & Electronic City Salons',
    serviceIdToBook: 'srv-mani-pedi',
    defaultPrice: 1299,
    targetSubCategory: 'Salon for Women',
  },
];

// Physical Walk-in Branches Configuration
const SALON_BRANCHES = [
  {
    id: 'branch-kaggadaspura',
    name: 'Eden Roses Unisex Salon — Kaggadaspura Branch, Bangalore, Karnataka',
    shortName: 'Kaggadaspura Branch',
    badge: 'Walk-in Unisex Salon & Bridal Studio',
    address:
      'No.11, 1st Floor, 4th Cross, Kaggadaspura Main Road, C V Raman Nagar, Bangalore, Karnataka 560093',
    phone: '+91 7619603016',
    PhoneHref: 'tel:+917619603016',
    hours: 'Mon – Sun: 09:00 AM – 08:30 PM',
    directionsUrl:
      'https://www.google.com/maps/search/?api=1&query=Eden+Roses+Unisex+Salon+Kaggadaspura+Main+Road+CV+Raman+Nagar+Bangalore+560093',
  },
  {
    id: 'branch-electronic-city',
    name: 'Eden Roses Unisex Salon — Electronic City Branch, Bangalore, Karnataka',
    shortName: 'Electronic City Branch',
    badge: 'Walk-in Unisex Salon & Bridal Studio',
    address:
      'Neeladri Road, Electronic City Phase 1, Bangalore, Karnataka 560100',
    phone: '+91 7619603016',
    PhoneHref: 'tel:+917619603016',
    hours: 'Mon – Sun: 09:00 AM – 08:30 PM',
    directionsUrl:
      'https://share.google/78Ld7qMoTiNC8HHKD',
  },
];

// 4. MAKEUP SERVICE CATEGORY GRID (8 Categories matching Reference Video 0:15 - 0:20)
interface MakeupGridCategory {
  id: MakeupSubCategory;
  label: string;
  shortLabel: string;
  image: string;
}

const MAKEUP_ARTIST_8_CATEGORIES: MakeupGridCategory[] = [
  {
    id: 'Party Makeup',
    label: 'Party Makeup',
    shortLabel: 'Party Makeup',
    image: CLOUDINARY_ASSETS.partyBasic1,
  },
  {
    id: 'Engagement Makeup',
    label: 'Engagement Makeup',
    shortLabel: 'Engagement Makeup',
    image: CLOUDINARY_ASSETS.engagement1,
  },
  {
    id: 'Bridal Makeup',
    label: 'Bridal Makeup',
    shortLabel: 'Bridal Makeup',
    image: CLOUDINARY_ASSETS.bridalClassic,
  },
  {
    id: 'Wedding Guest Makeup',
    label: 'Wedding Guest Makeup',
    shortLabel: 'Wedding Guest Makeup',
    image: CLOUDINARY_ASSETS.weddingGuest1,
  },
  {
    id: 'Saree Draping',
    label: 'Saree Draping',
    shortLabel: 'Saree Draping',
    image: CLOUDINARY_ASSETS.sareeBasic,
  },
  {
    id: 'Hair Styling',
    label: 'Hair Styling',
    shortLabel: 'Hair Styling',
    image: CLOUDINARY_ASSETS.hairAdvance,
  },
  {
    id: 'Packages',
    label: 'Packages',
    shortLabel: 'Packages',
    image: CLOUDINARY_ASSETS.bridalPackage,
  },
  {
    id: 'Add-ons',
    label: 'Add-ons',
    shortLabel: 'Add-ons',
    image: CLOUDINARY_ASSETS.addonLashes,
  },
];

const ALL_SERVICE_SECTIONS_ORDER: {
  id: MakeupSubCategory;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'Signature Makeup by Shubhalaxmi',
    title: 'Signature Makeup by Shubhalaxmi',
    subtitle: 'Exclusive luxury bridal, muhurtham & reception transformations handcrafted by founder Shubhalaxmi',
  },
  {
    id: 'Party Makeup',
    title: 'Party Makeup',
    subtitle: 'Flawless party, cocktail & festive looks with hairstyling and draping',
  },
  {
    id: 'Engagement Makeup',
    title: 'Engagement Makeup',
    subtitle: 'Camera-ready HD engagement makeovers tailored to your outfit palette',
  },
  {
    id: 'Bridal Makeup',
    title: 'Bridal Makeup',
    subtitle: '4K HD & Airbrush bridal artistry performed by Certified Eden Roses Artists',
  },
  {
    id: 'Wedding Guest Makeup',
    title: 'Wedding Guest Makeup',
    subtitle: 'Curated looks for bridesmaids, sisters & close family members',
  },
  {
    id: 'Saree Draping',
    title: 'Saree Draping',
    subtitle: 'Crisp Kanjeevaram box-pleating, silhouette pinning & bridal draping',
  },
  {
    id: 'Hair Styling',
    title: 'Hair Styling',
    subtitle: 'Curls, braided crowns, messy updos & traditional South Indian Poola Jada',
  },
  {
    id: 'Packages',
    title: 'Packages',
    subtitle: 'Value makeover combinations for Makeup, Hairstyling & Multi-Event Brides',
  },
  {
    id: 'Add-ons',
    title: 'Add-ons',
    subtitle: 'Enhance your booking with lashes, floral hair accessories & upgrades',
  },
  {
    id: 'Salon for Women',
    title: 'Salon for Women',
    subtitle: 'HydraFacial, luxury facials, hair spa, nail art, waxing & BB Glow',
  },
  {
    id: 'Salon for Men',
    title: 'Salon for Men',
    subtitle: 'Precision haircuts, beard styling, detan facials & groom packages',
  },
];

function inferMakeupSubCategory(srv: ServiceCatalogItem): MakeupSubCategory {
  if (srv.makeupSubCategory) return srv.makeupSubCategory;
  const nameLower = srv.name.toLowerCase();
  if (nameLower.includes('saree')) return 'Saree Draping';
  if (nameLower.includes('engagement')) return 'Engagement Makeup';
  if (nameLower.includes('party')) return 'Party Makeup';
  if (nameLower.includes('guest')) return 'Wedding Guest Makeup';
  if (nameLower.includes('package') || nameLower.includes('combo')) return 'Packages';
  if (
    nameLower.includes('hair') &&
    !nameLower.includes('men') &&
    !nameLower.includes('spa')
  ) {
    return 'Hair Styling';
  }
  if (nameLower.includes('bridal') || nameLower.includes('airbrush')) {
    return 'Bridal Makeup';
  }
  if (nameLower.includes('men')) return 'Salon for Men';
  if (
    srv.category === 'Skin & Facial' ||
    srv.category === 'Spa & Nails' ||
    srv.category === 'Permanent Makeup'
  ) {
    return 'Salon for Women';
  }
  return 'Party Makeup';
}

export const CustomerWebsite: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Live synced state from storage
  const [settings, setSettings] = useState<BusinessSettings>(() => getBusinessSettings());
  const [services, setServices] = useState<ServiceCatalogItem[]>(() => getServicesCatalog());
  const [galleryImages, setGalleryImages] = useState<EdenRoseImage[]>(() => getGalleryImages());
  const [allBookings, setAllBookings] = useState<Booking[]>(() => getBookings());

  useEffect(() => {
    const unsubscribe = subscribeToDataUpdates(() => {
      setSettings(getBusinessSettings());
      setServices(getServicesCatalog());
      setGalleryImages(getGalleryImages());
      setAllBookings(getBookings());
    });
    return unsubscribe;
  }, []);

  // App-like Screen & Navigation States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
  const [selectedServiceDetail, setSelectedServiceDetail] =
    useState<ServiceCatalogItem | null>(null);

  // Search & Category Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubCategory, setActiveSubCategory] = useState<MakeupSubCategory | 'All'>(
    'All'
  );
  const [activeLandingCategory, setActiveLandingCategory] =
    useState<MakeupLandingGroup>('Makeup & Styling for Women');
  const [showLandingCategoryModal, setShowLandingCategoryModal] = useState(false);

  // Gallery, Hero & Service Division Tab States
  const [activeGalleryCategory, setActiveGalleryCategory] =
    useState<GalleryFilterCategory>('All');
  const [lightboxImage, setLightboxImage] = useState<EdenRoseImage | null>(null);
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [serviceDivisionTab, setServiceDivisionTab] = useState<'both' | 'in-salon' | 'at-home'>(
    'both'
  );

  // Cart & Package Selection State (Persisted in localStorage so user can collect multiple items)
  const [cart, setCart] = useState<BookingServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('eden_roses_customer_cart_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [showFullCalendarGrid, setShowFullCalendarGrid] = useState<boolean>(false);
  const [quickAddServiceId, setQuickAddServiceId] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem('eden_roses_customer_cart_v2', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Interactive Monthly Booking Calendar State
  const todayISO = getTodayISO();
  const tomorrowISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateISO(d);
  }, []);
  const dayAfterISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return formatDateISO(d);
  }, []);

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateISO(d);
  });
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');

  // Single-Screen Fast Booking Form State
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('Kaggadaspura');
  const [eventType, setEventType] = useState<EventType>('Party');
  const [specialNotes, setSpecialNotes] = useState('');
  const [paymentProofType, setPaymentProofType] = useState<
    'UTR Number' | 'Reference Number' | 'Transaction ID'
  >('UTR Number');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(() => {
    try {
      const savedId = localStorage.getItem('eden_roses_active_verification_booking_id');
      if (savedId) {
        const found = getBookings().find((b) => b.id === savedId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);

  // Keep confirmedBooking live-synced with allBookings so Admin verification updates immediately
  const liveConfirmedBooking = useMemo(() => {
    if (!confirmedBooking) return null;
    return allBookings.find((b) => b.id === confirmedBooking.id) || confirmedBooking;
  }, [confirmedBooking, allBookings]);

  // Contact Inquiry Quick State
  const [contactSent, setContactSent] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryLocality, setInquiryLocality] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  // Dynamic Service Areas combining Master Area List + custom areas saved in localStorage
  const availableLocalities = useMemo(() => {
    const customStored = getCustomAreas().filter((a) => a !== 'All Areas');
    return Array.from(new Set([...BENGALURU_LOCALITIES, ...customStored]));
  }, [settings.serviceArea, allBookings]);

  const filteredLocalities = useMemo(() => {
    if (!locationSearchQuery.trim()) return availableLocalities;
    const q = locationSearchQuery.toLowerCase();
    return availableLocalities.filter((loc) => loc.toLowerCase().includes(q));
  }, [availableLocalities, locationSearchQuery]);

  // Enrich services with inferred subCategory & enforce STRICT deduplication by title + image
  const enrichedServices = useMemo(() => {
    const rawServices = services.map((s) => ({
      ...s,
      makeupSubCategory: inferMakeupSubCategory(s),
    }));

    const seenTitles = new Set<string>();
    const seenImages = new Set<string>();
    const uniqueServices = rawServices.filter((item) => {
      const normTitle = (item.name || '').trim().toLowerCase();
      const normImg = (item.image || '').trim().toLowerCase();
      if (seenTitles.has(normTitle) || (normImg && seenImages.has(normImg))) {
        return false;
      }
      seenTitles.add(normTitle);
      if (normImg) seenImages.add(normImg);
      return true;
    });

    return uniqueServices;
  }, [services]);

  // Search-filtered services
  const searchFilteredServices = useMemo(() => {
    if (!searchQuery.trim()) return enrichedServices;
    const q = searchQuery.toLowerCase().trim();
    return enrichedServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.makeupSubCategory && s.makeupSubCategory.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q) ||
        (s.highlights && s.highlights.some((h) => h.toLowerCase().includes(q)))
    );
  }, [enrichedServices, searchQuery]);

  // Grouped services by MakeupSubCategory
  const groupedServices = useMemo(() => {
    const map = new Map<MakeupSubCategory, ServiceCatalogItem[]>();
    for (const sec of ALL_SERVICE_SECTIONS_ORDER) {
      map.set(sec.id, []);
    }
    for (const srv of searchFilteredServices) {
      const sub = srv.makeupSubCategory || 'Party Makeup';
      const existing = map.get(sub) || [];
      existing.push(srv);
      map.set(sub, existing);
    }
    return map;
  }, [searchFilteredServices]);

  const filteredGallery = useMemo(() => {
    if (activeGalleryCategory === 'All') return galleryImages;
    return galleryImages.filter((img) => img.galleryCategory === activeGalleryCategory);
  }, [galleryImages, activeGalleryCategory]);

  // Cart Calculations (Mandatory ₹99 Advance Payment Required for Booking)
  const itemsSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const effectiveDiscount = Math.min(discountAmount, itemsSubtotal);
  const netPayable = Math.max(0, itemsSubtotal - effectiveDiscount);
  const effectiveAdvance =
    cart.length > 0 ? Math.min(MANDATORY_ADVANCE_AMOUNT, netPayable) : 0;
  const remainingAmount = Math.max(0, netPayable - effectiveAdvance);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePaymentScreenshotUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setIsUploadingScreenshot(true);
    try {
      const uploadedUrl = await uploadImageAsset(file);
      setPaymentScreenshot(uploadedUrl);
      triggerCartToast('✓ ₹99 Payment Screenshot Attached');
    } catch (err) {
      console.error('Screenshot upload error:', err);
      setFormError('Could not process screenshot. Please try again or enter your UTR / Transaction ID.');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handleCopyUpiId = () => {
    try {
      navigator.clipboard.writeText(OFFICIAL_UPI_ID);
      setCopiedUpi(true);
      window.setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      // ignore
    }
  };

  // Cart Handlers
  const getItemQuantity = (serviceId: string): number => {
    return cart.find((item) => item.id === serviceId)?.quantity || 0;
  };

  const triggerCartToast = (msg: string) => {
    setCartToast(msg);
    window.setTimeout(() => {
      setCartToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const handleAddOrIncrement = (srv: ServiceCatalogItem) => {
    const unitPrice = srv.price ?? 999;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === srv.id);
      if (existing) {
        return prev.map((i) =>
          i.id === srv.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: srv.id,
          name: srv.name,
          price: unitPrice,
          quantity: 1,
          category: srv.category,
        },
      ];
    });
    triggerCartToast(`✓ Added "${srv.name}" to Cart`);
  };

  const handleUpdateQuantity = (serviceId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === serviceId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (serviceId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== serviceId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const applyCodeValue = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    const dynOffer1Code = (settings.offer1Code || 'BRIDAL500').trim().toUpperCase();
    const dynOffer2Code = (settings.offer2Code || 'EDEN10').trim().toUpperCase();
    setPromoCode(code);
    if (code === dynOffer1Code || code === 'BRIDAL500' || code === 'EDEN500') {
      setDiscountAmount(settings.offer1DiscountAmount || 500);
    } else if (code === dynOffer2Code || code === 'EDEN10') {
      const pct = settings.offer2DiscountPercent || 10;
      setDiscountAmount(Math.round(itemsSubtotal * (pct / 100)));
    } else if (!isNaN(Number(code)) && Number(code) > 0) {
      setDiscountAmount(Math.min(Number(code), itemsSubtotal));
    }
  };

  const handleApplyDiscountCode = () => {
    applyCodeValue(promoCode);
  };

  const [activeNavTab, setActiveNavTab] = useState<
    'home' | 'services' | 'branches' | 'booking' | 'gallery' | 'cart'
  >('home');

  // Smooth jump to a specific Makeup Sub-Category section
  const jumpToCategorySection = (subCategory: MakeupSubCategory) => {
    setSearchQuery('');
    setActiveSubCategory(subCategory);
    setActiveNavTab('services');
    setFloatingMenuOpen(false);
    setShowLandingCategoryModal(false);
    setMobileMenuOpen(false);
    setCartDrawerOpen(false);
    setSelectedServiceDetail(null);
    const slug = `cat-section-${subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    setTimeout(() => {
      const el =
        document.getElementById(slug) ||
        document.getElementById('makeup-artist-page');
      if (el) {
        const yOffset = -135;
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 80);
  };

  // Handle clicking one of the 5 "Makeup & Styling" Landing Categories
  const handleSelectLandingCategory = (card: LandingCategoryCard) => {
    setActiveLandingCategory(card.id);
    setShowLandingCategoryModal(false);
    setMobileMenuOpen(false);
    setFloatingMenuOpen(false);
    setSearchQuery('');
    if (card.id === 'Makeup & Styling for Women') {
      setActiveSubCategory('All');
      setActiveNavTab('services');
      setTimeout(() => {
        const el = document.getElementById('makeup-artist-page');
        if (el) {
          const yOffset = -120;
          const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 60);
    } else if (card.targetSubCategory) {
      jumpToCategorySection(card.targetSubCategory);
    }
  };

  // Calendar Helpers
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: {
      dateISO: string | null;
      dayNumber: number | null;
      isPast: boolean;
      bookedCount: number;
      isFullyBooked: boolean;
    }[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({
        dateISO: null,
        dayNumber: null,
        isPast: false,
        bookedCount: 0,
        isFullyBooked: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateISO = formatDateISO(dateObj);
      const isPast = dateISO < todayISO;
      const slots = getAvailableSlots(dateISO);
      const bookedCount = slots.filter((s) => !s.available).length;
      const isFullyBooked = slots.every((s) => !s.available);

      cells.push({
        dateISO,
        dayNumber: day,
        isPast,
        bookedCount,
        isFullyBooked,
      });
    }

    return cells;
  }, [calendarMonth, todayISO, allBookings, settings]);

  const selectedDateSlots = useMemo(
    () => getAvailableSlots(selectedDate),
    [selectedDate, allBookings, settings]
  );

  useEffect(() => {
    const match = selectedDateSlots.find((s) => s.time === selectedTime);
    if (match && !match.available) {
      const firstAvailable = selectedDateSlots.find((s) => s.available);
      if (firstAvailable) {
        setSelectedTime(firstAvailable.time);
      }
    }
  }, [selectedDate, selectedDateSlots, selectedTime]);

  const heroImages = useMemo(() => {
    const customHero = settings.heroImageUrl
      ? [
          {
            ...EDEN_ROSES_HERO_IMAGES[0],
            url: settings.heroImageUrl,
          },
          ...EDEN_ROSES_HERO_IMAGES.slice(1),
        ]
      : EDEN_ROSES_HERO_IMAGES;
    return customHero;
  }, [settings.heroImageUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroImages.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  const currentHeroImg = heroImages[heroSlideIdx % heroImages.length];

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    setFloatingMenuOpen(false);
    setCartDrawerOpen(false);
    setLocationModalOpen(false);
    setShowLandingCategoryModal(false);
    setSelectedServiceDetail(null);

    if (
      sectionId === 'makeup-styling-landing' ||
      sectionId === 'service-separation-guide'
    ) {
      setActiveNavTab('home');
    } else if (sectionId === 'makeup-artist-page') {
      setActiveNavTab('services');
    } else if (sectionId === 'our-salon-branches' || sectionId === 'contact') {
      setActiveNavTab('branches');
    } else if (sectionId === 'booking' || sectionId === 'calendar') {
      setActiveNavTab('booking');
    } else if (sectionId === 'gallery') {
      setActiveNavTab('gallery');
    }

    setTimeout(() => {
      const fallbackMap: Record<string, string> = {
        'our-salon-branches': 'contact',
        'service-separation-guide': 'makeup-styling-landing',
      };
      const el =
        document.getElementById(sectionId) ||
        (fallbackMap[sectionId]
          ? document.getElementById(fallbackMap[sectionId])
          : null);
      if (el) {
        const yOffset = -125;
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 40);
  };

  const handleConfirmBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cart.length === 0) {
      setFormError(
        'कृपया बुकिंग कन्फर्म करने से पहले कम से कम 1 सर्विस Add to Cart करें। (Please add at least one service to your cart.)'
      );
      return;
    }

    if (!customerName.trim() || !phone.trim()) {
      setFormError(
        'कृपया अपना नाम और मोबाइल नंबर दर्ज करें। (Please enter your Name and Mobile Number.)'
      );
      return;
    }

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr && !paymentScreenshot) {
      setFormError(
        '⚠️ ₹99 एडवांस पेमेंट अनिवार्य (Mandatory) है! बिना पेमेंट के बुकिंग नहीं होती है। कृपया ₹99 पेमेंट करके उसका Screenshot अपलोड करें या UTR / Reference / Transaction ID दर्ज करें।'
      );
      return;
    }

    if (cleanUtr && cleanUtr.length < 4 && !paymentScreenshot) {
      setFormError(
        'कृपया सही UTR Number / Reference Number / Transaction ID दर्ज करें या पेमेंट का Screenshot अपलोड करें।'
      );
      return;
    }

    const effectiveDate = selectedDate || tomorrowISO;
    const effectiveTime = selectedTime || '10:00 AM';
    const rawAddress = address.trim() || `${locality} Branch / Area`;
    const fullAddress = rawAddress.toLowerCase().includes(locality.toLowerCase())
      ? rawAddress
      : `${rawAddress}, ${locality}, Bengaluru`;

    const proofNote = cleanUtr
      ? `[₹99 Advance ${paymentProofType}: ${cleanUtr}]`
      : '[₹99 Advance Screenshot Uploaded]';
    const combinedNotes = [proofNote, specialNotes.trim()].filter(Boolean).join(' ');

    setIsSubmitting(true);
    try {
      const result = await saveBooking({
        customerName: customerName.trim(),
        phone: phone.trim(),
        whatsapp: (whatsapp.trim() || phone.trim()).replace(/[^0-9]/g, ''),
        address: fullAddress,
        area: locality,
        locality,
        eventType,
        services: cart,
        date: effectiveDate,
        time: effectiveTime,
        itemsTotal: itemsSubtotal,
        discount: effectiveDiscount,
        advancePaid: MANDATORY_ADVANCE_AMOUNT,
        amountToCollect: Math.max(0, netPayable - MANDATORY_ADVANCE_AMOUNT),
        notes: combinedNotes,
        status: 'Pending Verification',
        paymentStatus: 'Pending Verification',
        utrNumber: cleanUtr || undefined,
        paymentProofType: cleanUtr ? paymentProofType : 'Screenshot',
        paymentScreenshot: paymentScreenshot || undefined,
        bookingSource: 'Customer Website',
        assignedTeam: [],
        badgeType: 'VISIT',
      });

      setIsSubmitting(false);

      if (!result.success || !result.booking) {
        setFormError(
          result.error || 'Could not submit booking. Please try another time slot.'
        );
        return;
      }

      try {
        localStorage.setItem(
          'eden_roses_active_verification_booking_id',
          result.booking.id
        );
      } catch {
        // ignore
      }

      setCartDrawerOpen(false);
      setConfirmedBooking(result.booking);
      setCart([]);
      setUtrNumber('');
      setPaymentScreenshot('');
    } catch (err) {
      console.error('Booking error:', err);
      setIsSubmitting(false);
      setFormError('Something went wrong while saving your booking. Please try again.');
    }
  };

  const primaryPhoneDisplay = '+91 7619603016';
  const primaryPhoneTel = 'tel:+917619603016';
  const whatsappInstantBookingUrl = useMemo(() => {
    if (cart.length > 0) {
      const lines = cart
        .map((c) => `• ${c.name} (×${c.quantity}) - ₹${c.price * c.quantity}`)
        .join('\n');
      const text = [
        `Hi Eden Roses Unisex Salon! 🌸`,
        `I want to book the following services:`,
        lines,
        `Total: ₹${netPayable}`,
        `Area / Branch: ${locality}, Bangalore`,
        `Preferred Date: ${selectedDate} at ${selectedTime}`,
        customerName.trim() ? `Name: ${customerName.trim()}` : '',
        phone.trim() ? `Phone: ${phone.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return `https://wa.me/917619603016?text=${encodeURIComponent(text)}`;
    }
    return `https://wa.me/917619603016?text=${encodeURIComponent(
      `Hi Eden Roses Unisex Salon! I would like to book an appointment / inquire about services in ${locality}, Bangalore.`
    )}`;
  }, [cart, netPayable, locality, selectedDate, selectedTime, customerName, phone]);

  return (
    <div className="min-h-screen couture-mesh-bg text-[#1C1619] relative pb-36 lg:pb-0 selection:bg-[#160824] selection:text-[#D6B77A] overflow-x-hidden">
      {/* Ambient Couture Light Orbs for True Glassmorphism Refraction */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-24 -left-20 w-80 h-80 sm:w-[440px] sm:h-[440px] rounded-full bg-gradient-to-br from-[#D6B77A]/25 via-[#E8C89B]/15 to-transparent blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-72 h-72 sm:w-[420px] sm:h-[420px] rounded-full bg-gradient-to-bl from-[#B76E79]/20 via-[#D6B77A]/12 to-transparent blur-3xl" />
        <div className="absolute bottom-16 left-1/4 w-80 h-80 sm:w-[460px] sm:h-[460px] rounded-full bg-gradient-to-tr from-[#26103B]/10 via-[#D6B77A]/16 to-transparent blur-3xl" />
      </div>

      {/* 0. ROYAL PLUM & CHAMPAGNE GOLD GLASS BRAND BAR */}
      <div className="relative z-40 glass-dark-royal text-[#F5E2B8] border-b border-[#D6B77A]/35 text-[11px] sm:text-xs">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D6B77A] shrink-0 shadow-xs">
              <SmartImage
                src={settings.logoUrl}
                alt={settings.businessName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-serif-luxury text-xs sm:text-sm font-bold tracking-wide text-[#F5E2B8] truncate">
              Eden Roses Unisex Salon
            </span>
            <span className="text-[#D6B77A]/60 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="text-[#D6B77A] font-medium truncate hidden sm:inline">
              Salons: Kaggadaspura &amp; Electronic City | Bridal Makeup: All Bangalore
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={primaryPhoneTel}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-[#F5E2B8] font-mono-num text-[11px] font-semibold transition-colors"
            >
              <Phone className="w-3 h-3 text-[#D6B77A]" />
              <span>{primaryPhoneDisplay}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 1. MOBILE-FIRST LUXURY GLASS STICKY HEADER (Location Selector + Search Bar + Cart Icon) */}
      <header className="sticky top-0 z-40 luxury-glass border-b border-white/80">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-2.5 pb-3 space-y-2.5">
          {/* Top Row: Location Selector (Left) + Desktop Navigation (Center) + Cart & Menu (Right) */}
          <div className="flex items-center justify-between gap-2">
            {/* Frosted Glass Location Selector Button */}
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="tap-scale flex items-center gap-2.5 text-left group min-w-0 max-w-[68%] sm:max-w-xs cursor-pointer py-1 px-2 -ml-2 rounded-2xl hover:bg-white/60 transition-colors"
            >
              <div className="w-9 h-9 rounded-2xl glass-dark-royal flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-4 h-4 text-[#D6B77A]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm sm:text-base text-[#160824] leading-tight truncate">
                    {settings.defaultCity || 'Bangalore'}
                  </span>
                  <span className="text-[#B76E79] font-bold text-xs">·</span>
                  <span className="text-xs sm:text-sm font-semibold text-[#8C4A56] truncate">
                    {locality}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0 transition-transform group-hover:translate-y-0.5" />
                </div>
                <p className="text-[11px] text-stone-500 truncate leading-tight">
                  {settings.headerTagline || 'Studio & On-Venue Service Across Bengaluru'}
                </p>
              </div>
            </button>

            {/* Desktop Clean Typography Navigation Links (Zero-Pill Discipline) */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-stone-700">
              <button
                type="button"
                onClick={() => scrollToSection('service-separation-guide')}
                className="hover:text-[#160824] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                In-Salon vs At-Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSubCategory('All');
                  setSearchQuery('');
                  scrollToSection('makeup-artist-page');
                }}
                className="hover:text-[#160824] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Services Menu
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('our-salon-branches')}
                className="hover:text-[#160824] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                2 Salon Branches
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('booking')}
                className="hover:text-[#160824] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Book Slot
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('gallery')}
                className="hover:text-[#160824] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Bridal Portfolio
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="hover:text-[#160824] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Contact
              </button>
            </nav>

            {/* Right Action Cluster: Categories Sheet Trigger + Cart Icon + Mobile Menu */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowLandingCategoryModal(true)}
                className="tap-scale hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-card text-[#160824] text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ListFilter className="w-3.5 h-3.5 text-[#8C4A56]" />
                <span>Categories</span>
              </button>

              {/* Cart Icon Button in Royal Dark Glass */}
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                aria-label="Open Booking Cart"
                className="tap-scale relative h-10 px-3 sm:px-3.5 rounded-xl glass-dark-royal text-[#F5E2B8] flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#D6B77A]" />
                <span className="font-mono-num text-xs font-bold">
                  ₹{itemsSubtotal.toLocaleString('en-IN')}
                </span>
                {totalCartItems > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-[#D6B77A] text-[#160824] font-mono-num text-[10px] font-extrabold">
                    {totalCartItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Open Menu"
                className="tap-scale lg:hidden w-10 h-10 rounded-xl glass-card text-[#160824] flex items-center justify-center cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Glassmorphic Search Bar Row: "What service do you need?" */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8C4A56] absolute left-3.5 pointer-events-none z-10" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  setActiveSubCategory('All');
                }
              }}
              placeholder="What service do you need? (e.g. Bridal, Party Makeup, Saree Draping)"
              className="w-full h-11 pl-10 pr-24 rounded-2xl glass-input text-xs sm:text-sm text-stone-900 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-20 p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('makeup-artist-page');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              aria-label="Search Services"
              className="tap-scale absolute right-1.5 h-8 px-3.5 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer z-10"
            >
              <span>Search</span>
            </button>
          </div>

          {/* 1-Tap Mobile Quick Search Suggestions in Frosted Glass */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <span className="text-[10px] font-semibold text-stone-500 shrink-0 pr-1">
              Popular:
            </span>
            {(
              [
                { label: 'Bridal Makeup', cat: 'Bridal Makeup' as MakeupSubCategory },
                { label: 'Party Makeup', cat: 'Party Makeup' as MakeupSubCategory },
                { label: 'Engagement', cat: 'Engagement Makeup' as MakeupSubCategory },
                { label: 'Saree Draping', cat: 'Saree Draping' as MakeupSubCategory },
                { label: 'Hair Styling', cat: 'Hair Styling' as MakeupSubCategory },
                { label: 'Value Packages', cat: 'Packages' as MakeupSubCategory },
              ] as const
            ).map((chip) => {
              const isSelected = activeSubCategory === chip.cat;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => jumpToCategorySection(chip.cat)}
                  className={`tap-scale px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'glass-dark-royal text-[#D6B77A]'
                      : 'bg-white/65 hover:bg-white/90 border border-white/80 text-stone-700 shadow-2xs backdrop-blur-md'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Quick Navigation Sheet in Frosted Glass */}
        {mobileMenuOpen && (
          <div className="lg:hidden glass-modal-sheet border-t border-white/80 px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'In-Salon vs At-Home Guide', id: 'service-separation-guide' },
                { label: 'All Services Menu', id: 'makeup-artist-page' },
                { label: '2 Salon Branches', id: 'our-salon-branches' },
                { label: 'Book Date & Slot', id: 'booking' },
                { label: 'Bridal Portfolio (30+)', id: 'gallery' },
                { label: 'Callback & Contact', id: 'contact' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'makeup-artist-page') {
                      setActiveSubCategory('All');
                      setSearchQuery('');
                    }
                    scrollToSection(item.id);
                  }}
                  className="text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#160824] glass-card cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          2. MAKEUP & STYLING LANDING PAGE SECTION (Glassmorphic Couture Surface)
          Shows ONLY the 5 required Makeup & Styling categories with strict aspect-[4/3] object-cover
      ===================================================================== */}
      <section
        id="makeup-styling-landing"
        className="relative z-10 pt-4 pb-2 sm:py-6"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-6">
          <div className="glass-panel rounded-3xl p-4 sm:p-6 space-y-5">
            {/* Section Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DAC8]/60 pb-3.5">
              <div>
                <p className="text-[11px] font-semibold text-[#8C4A56] tracking-wide">
                  Walk-in Salons: Kaggadaspura &amp; Electronic City · At-Home Bridal Makeup: All Bangalore
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#160824] tracking-tight">
                  Makeup &amp; Styling
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={primaryPhoneTel}
                  className="tap-scale px-3.5 py-2 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{primaryPhoneDisplay}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubCategory('All');
                    scrollToSection('makeup-artist-page');
                  }}
                  className="tap-scale px-3.5 py-2 rounded-xl glass-card text-[#160824] text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>All Services ({services.length})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C4A56]" />
                </button>
              </div>
            </div>

            {/* 5 Category Cards with strict aspect-[4/3] object-cover */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {MAKEUP_STYLING_LANDING_CATEGORIES.map((cat) => {
                const isSelected = activeLandingCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectLandingCategory(cat)}
                    className={`tap-scale group flex flex-col text-left rounded-2xl overflow-hidden glass-card p-2 transition-all cursor-pointer focus:outline-none ${
                      isSelected
                        ? 'ring-2 ring-[#160824] shadow-[0_12px_28px_-8px_rgba(22,8,36,0.22)]'
                        : 'hover:ring-1 hover:ring-[#B76E79]/60'
                    }`}
                  >
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-900">
                      <SmartImage
                        src={cat.image}
                        alt={cat.title}
                        eager
                        className="w-full h-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#160824]/85 text-[#D6B77A] text-[9px] font-bold tracking-wide backdrop-blur-md">
                        {cat.group === 'MEN SALON'
                          ? 'In-Salon Only'
                          : cat.id === 'Salon for Women'
                          ? 'In-Salon Only'
                          : 'Studio & At-Home'}
                      </span>
                    </div>
                    <div className="pt-2.5 px-1 flex items-center justify-between gap-1">
                      <span
                        className={`text-xs sm:text-sm leading-snug line-clamp-1 ${
                          isSelected
                            ? 'font-bold text-[#160824]'
                            : 'font-semibold text-stone-900'
                        }`}
                      >
                        {cat.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8C4A56] shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =====================================================================
              2B. CRITICAL SEPARATION: IN-SALON SERVICES (SECTION A) VS.
                  BANGALORE-WIDE AT-HOME MAKEUP (SECTION B)
          ===================================================================== */}
          <div
            id="service-separation-guide"
            className="glass-panel rounded-3xl p-4 sm:p-7 space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E6DAC8]/60 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C4A56]">
                  Service Availability Guide · Zero Confusion Guarantee
                </p>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#160824] mt-1">
                  In-Salon Walk-In Branches vs. Bangalore-Wide At-Home Makeup
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl">
                  Explore our full walk-in unisex salon services at{' '}
                  <strong className="text-[#160824]">Kaggadaspura</strong> &amp;{' '}
                  <strong className="text-[#160824]">Electronic City</strong>, or book our
                  on-location bridal &amp; party makeup team anywhere across Bangalore.
                </p>
              </div>

              {/* Interactive Section Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/75 border border-[#E6DAC8]/80 self-start">
                <button
                  type="button"
                  onClick={() => setServiceDivisionTab('both')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    serviceDivisionTab === 'both'
                      ? 'glass-dark-royal text-[#D6B77A]'
                      : 'text-stone-700 hover:text-[#160824]'
                  }`}
                >
                  Both Sections
                </button>
                <button
                  type="button"
                  onClick={() => setServiceDivisionTab('in-salon')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    serviceDivisionTab === 'in-salon'
                      ? 'glass-dark-royal text-[#D6B77A]'
                      : 'text-stone-700 hover:text-[#160824]'
                  }`}
                >
                  Section A: In-Salon
                </button>
                <button
                  type="button"
                  onClick={() => setServiceDivisionTab('at-home')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    serviceDivisionTab === 'at-home'
                      ? 'glass-dark-royal text-[#D6B77A]'
                      : 'text-stone-700 hover:text-[#160824]'
                  }`}
                >
                  Section B: At-Home
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* SECTION A: IN-SALON SERVICES */}
              {(serviceDivisionTab === 'both' || serviceDivisionTab === 'in-salon') && (
                <div
                  className={`rounded-3xl p-5 sm:p-6 glass-card border-2 border-[#D6B77A]/55 flex flex-col justify-between space-y-5 ${
                    serviceDivisionTab === 'in-salon' ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold tracking-wide">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>Walk-in Salon Services — Kaggadaspura &amp; Electronic City Only</span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C4A56]">
                        SECTION A · Physical Walk-In Branches
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-[#160824] mt-0.5">
                        In-Salon Services (Available Exclusively at Kaggadaspura &amp; Electronic City Branches)
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                        Visit our luxury unisex salon studios in{' '}
                        <strong className="text-[#160824]">Kaggadaspura (C V Raman Nagar)</strong> or{' '}
                        <strong className="text-[#160824]">Electronic City</strong> for complete
                        hair, skin, spa, and grooming treatments:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          title: 'Facial & Skin Treatments',
                          sub: 'HydraFacial, O3+ Bridal Glow, Detan & Cleanups',
                          cat: 'Salon for Women' as MakeupSubCategory,
                        },
                        {
                          title: 'Manicure & Pedicure',
                          sub: 'Crystal Spa Pedicure, Luxury Manicure & Nail Art',
                          cat: 'Salon for Women' as MakeupSubCategory,
                        },
                        {
                          title: 'Hair Spa & Deep Conditioning',
                          sub: 'Deep Keratin & Protein Hair Therapy & Scalp Massage',
                          cat: 'Salon for Women' as MakeupSubCategory,
                        },
                        {
                          title: "Women's Haircuts & Styling",
                          sub: 'Layer Cuts, Feather Cuts, Blow-Dry & Curls',
                          cat: 'Salon for Women' as MakeupSubCategory,
                        },
                        {
                          title: "Men's Grooming",
                          sub: "Precision Men's Haircuts, Beard Trim, Shaves & Detan",
                          cat: 'Salon for Men' as MakeupSubCategory,
                        },
                        {
                          title: 'In-Studio Bridal Makeup',
                          sub: 'Private Bridal Suite Makeovers at Both Branches',
                          cat: 'Bridal Makeup' as MakeupSubCategory,
                        },
                      ].map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => jumpToCategorySection(item.cat)}
                          className="p-3 rounded-2xl bg-white/85 hover:bg-white border border-[#E6DAC8]/80 text-left transition-all flex items-start gap-2.5 cursor-pointer group"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-[#160824] group-hover:text-[#8C4A56] transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
                              {item.sub}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6DAC8]/60 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection('our-salon-branches')}
                      className="text-xs font-bold text-[#8C4A56] hover:text-[#160824] underline cursor-pointer"
                    >
                      View Kaggadaspura &amp; Electronic City Branch Addresses →
                    </button>
                    <a
                      href={primaryPhoneTel}
                      className="tap-scale px-4 py-2.5 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Branch: {primaryPhoneDisplay}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* SECTION B: BRIDAL MAKEUP & SELECTED AT-HOME BEAUTY SERVICES (ALL ACROSS BANGALORE) */}
              {(serviceDivisionTab === 'both' || serviceDivisionTab === 'at-home') && (
                <div
                  className={`rounded-3xl p-5 sm:p-6 glass-dark-royal text-white border-2 border-[#D6B77A]/55 flex flex-col justify-between space-y-5 ${
                    serviceDivisionTab === 'at-home' ? 'lg:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E6C98F] via-[#D6B77A] to-[#C29B56] text-[#160824] text-xs font-extrabold tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>On-Location / At-Home Service Across Bangalore</span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#D6B77A]">
                        SECTION B · Doorstep &amp; Wedding Venue Artistry
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-[#FFF8EF] mt-0.5">
                        Bridal Makeup &amp; Selected At-Home Beauty Services (All Across Bangalore)
                      </h3>
                      <p className="text-xs sm:text-sm text-[#F5E2B8]/90 mt-1.5 leading-relaxed">
                        In areas such as{' '}
                        <strong className="text-white">
                          Varthur, Whitefield, Brookefield, Indiranagar, Koramangala
                        </strong>
                        , and all across Bangalore, we provide exclusively{' '}
                        <strong className="text-[#D6B77A]">
                          On-Location / At-Home Bridal Makeup, Party Makeup, Event Styling, and
                          selected doorstep beauty packages
                        </strong>{' '}
                        (physical walk-in salon branches are located only in Kaggadaspura and
                        Electronic City).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          title: 'On-Location Bridal Makeup',
                          sub: 'HD, Silicone Airbrush & Traditional Muhurtham Looks',
                          cat: 'Bridal Makeup' as MakeupSubCategory,
                        },
                        {
                          title: 'At-Home Party & Guest Makeup',
                          sub: 'Cocktail, Reception, Birthday & Bridesmaid Glam',
                          cat: 'Party Makeup' as MakeupSubCategory,
                        },
                        {
                          title: 'Engagement & Reception Makeup',
                          sub: '4K Camera-Ready HD Makeovers at Your Venue/Home',
                          cat: 'Engagement Makeup' as MakeupSubCategory,
                        },
                        {
                          title: 'Event Hair Styling & Poola Jada',
                          sub: 'Bridal Buns, Floral Braids, Curls & Up-dos',
                          cat: 'Hair Styling' as MakeupSubCategory,
                        },
                        {
                          title: 'Saree Draping & Box Pleating',
                          sub: 'Kanjeevaram Silk Draping & Pre-Pleating at Home',
                          cat: 'Saree Draping' as MakeupSubCategory,
                        },
                        {
                          title: 'Doorstep Bridal & Group Packages',
                          sub: 'Complete Bride + Family Venue Makeover Combos',
                          cat: 'Packages' as MakeupSubCategory,
                        },
                      ].map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => jumpToCategorySection(item.cat)}
                          className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all flex items-start gap-2.5 cursor-pointer group"
                        >
                          <Sparkles className="w-4 h-4 text-[#D6B77A] shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-[#FFF8EF] group-hover:text-[#D6B77A] transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-white/75 leading-snug mt-0.5">
                              {item.sub}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-[#F5E2B8]/85">
                      5:00 AM Early Morning Muhurtham Travel Available Across Bangalore
                    </span>
                    <a
                      href={whatsappInstantBookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-scale px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>Book At-Home Makeup</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =====================================================================
              2C. 5 LOCKED SIGNATURE SERVICE CARDS (100% Exact Title, Description & Image Mapping)
                  Strict aspect-[4/3] object-cover so photos never stretch or cut off on mobile
          ===================================================================== */}
          <div
            id="signature-services-showcase"
            className="glass-panel rounded-3xl p-4 sm:p-7 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E6DAC8]/60 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C4A56]">
                   Eden Roses Unisex Salon · Curated Signature Menu
                </p>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#160824] mt-0.5">
                  Our Core Salon &amp; Bridal Makeup Services
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Professionally matched treatments across our Kaggadaspura &amp; Electronic City
                  walk-in salons and Bangalore-wide bridal makeup team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollToSection('booking')}
                className="tap-scale px-4 py-2.5 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {LOCKED_SIGNATURE_SERVICE_CARDS.map((card) => {
                const matchedService =
                  services.find((s) => s.id === card.serviceIdToBook) ||
                  services.find((s) => s.name.toLowerCase() === card.title.toLowerCase());
                const effectiveService: ServiceCatalogItem = matchedService || {
                  id: card.serviceIdToBook || card.id,
                  name: card.title,
                  category: 'Makeup Services',
                  makeupSubCategory: card.targetSubCategory,
                  description: card.description,
                  price: card.defaultPrice,
                  image: card.image,
                  isPackage: false,
                };
                const cardQty = getItemQuantity(effectiveService.id);
                const displayPrice = effectiveService.price ?? card.defaultPrice;

                return (
                  <div
                    key={card.id}
                    className={`rounded-3xl glass-card overflow-hidden flex flex-col justify-between border shadow-md hover:shadow-xl transition-all group ${
                      cardQty > 0
                        ? 'ring-2 ring-[#D6B77A] border-[#D6B77A]'
                        : 'border-white/90'
                    }`}
                  >
                    <div>
                      {/* Strict aspect-[4/3] with object-cover */}
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-900">
                        <SmartImage
                          src={card.image}
                          alt={card.title}
                          eager
                          className="w-full h-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#160824]/85 text-[#D6B77A] text-[10px] font-bold tracking-wide backdrop-blur-md border border-[#D6B77A]/35">
                            {card.badge}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-white/95 text-[#160824] font-mono-num text-xs font-extrabold shadow-sm">
                            ₹{displayPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#160824] leading-snug">
                            {card.title}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2.5 border-t border-[#E6DAC8]/55 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => jumpToCategorySection(card.targetSubCategory)}
                        className="text-xs font-bold text-[#8C4A56] hover:text-[#160824] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Explore Menu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        {cardQty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleAddOrIncrement(effectiveService)}
                            className="tap-scale px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#160824] border border-[#D6B77A] text-xs font-extrabold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#8C4A56]" />
                            <span>Add to Cart</span>
                          </button>
                        ) : (
                          <div className="h-9 rounded-xl glass-dark-royal text-[#D6B77A] shadow-sm flex items-center gap-2 px-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(effectiveService.id, -1)}
                              className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono-num text-xs font-extrabold text-white px-0.5">
                              {cardQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(effectiveService.id, 1)}
                              className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (cardQty === 0) {
                              handleAddOrIncrement(effectiveService);
                            }
                            setCartDrawerOpen(true);
                          }}
                          className="tap-scale px-3.5 py-2 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Book Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3, 4, 5, 6, 7. MAKEUP ARTIST DEDICATED CATEGORY PAGE & SERVICE LISTINGS
          Matches Reference Video 0:11 - 0:44 with Couture Glassmorphic Polish
      ===================================================================== */}
      <section id="makeup-artist-page" className="relative z-10 py-3 sm:py-6">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-5">
          {/* 3. MAKEUP ARTIST PAGE GLASS CONTAINER */}
          <div className="glass-panel rounded-3xl p-4 sm:p-6 space-y-5">
            {/* Top Bar: Back Button + "Makeup Artist" Title + Rating + Search */}
            <div className="flex items-center justify-between gap-3 border-b border-[#E6DAC8]/60 pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubCategory('All');
                    setSearchQuery('');
                    scrollToSection('makeup-styling-landing');
                  }}
                  aria-label="Back to Makeup & Styling Categories"
                  className="tap-scale w-10 h-10 rounded-2xl glass-card text-[#160824] flex items-center justify-center shrink-0 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#160824] tracking-tight truncate">
                      Makeup Artist
                    </h1>
                    <span className="text-xs font-semibold text-stone-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-mono-num font-bold text-stone-900">
                        {settings.ratingScore || '4.9'}
                      </span>
                      <span className="text-stone-500">
                        ({settings.ratingCountText || '520+ Brides'})
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-stone-600 hover:text-[#160824] mt-0.5 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-[#B76E79]" />
                    <span className="truncate">
                      Serving {locality} &amp; All {settings.defaultCity || 'Bangalore'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => searchInputRef.current?.focus(), 300);
                  }}
                  aria-label="Search Makeup Services"
                  className="tap-scale w-10 h-10 rounded-2xl glass-card text-[#160824] flex items-center justify-center cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Frosted Glass Promotional Offers Strip (Editable from Admin Panel) */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => applyCodeValue(settings.offer1Code || 'BRIDAL500')}
                className={`tap-scale flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left shrink-0 transition-all cursor-pointer ${
                  promoCode === (settings.offer1Code || 'BRIDAL500').toUpperCase()
                    ? 'glass-dark-royal text-[#D6B77A] ring-2 ring-[#D6B77A]'
                    : 'glass-card'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p
                    className={`text-xs font-bold ${
                      promoCode === (settings.offer1Code || 'BRIDAL500').toUpperCase()
                        ? 'text-[#FFF8EF]'
                        : 'text-[#160824]'
                    }`}
                  >
                    {settings.offer1Title || 'Flat ₹500 OFF on Bridal & Engagement'}
                  </p>
                  <p
                    className={`text-[11px] ${
                      promoCode === (settings.offer1Code || 'BRIDAL500').toUpperCase()
                        ? 'text-[#D6B77A] font-bold'
                        : 'text-stone-600'
                    }`}
                  >
                    {promoCode === (settings.offer1Code || 'BRIDAL500').toUpperCase() ? (
                      <>✓ Code {settings.offer1Code || 'BRIDAL500'} Applied!</>
                    ) : (
                      <>
                        Tap to apply code{' '}
                        <span className="font-mono-num font-bold text-[#8C4A56]">
                          {settings.offer1Code || 'BRIDAL500'}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyCodeValue(settings.offer2Code || 'EDEN10')}
                className={`tap-scale flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left shrink-0 transition-all cursor-pointer ${
                  promoCode === (settings.offer2Code || 'EDEN10').toUpperCase()
                    ? 'glass-dark-royal text-[#D6B77A] ring-2 ring-[#D6B77A]'
                    : 'glass-card'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p
                    className={`text-xs font-bold ${
                      promoCode === (settings.offer2Code || 'EDEN10').toUpperCase()
                        ? 'text-[#FFF8EF]'
                        : 'text-[#160824]'
                    }`}
                  >
                    {settings.offer2Title || 'Save 10% on Party Makeup & Combos'}
                  </p>
                  <p
                    className={`text-[11px] ${
                      promoCode === (settings.offer2Code || 'EDEN10').toUpperCase()
                        ? 'text-[#D6B77A] font-bold'
                        : 'text-stone-600'
                    }`}
                  >
                    {promoCode === (settings.offer2Code || 'EDEN10').toUpperCase() ? (
                      <>✓ Code {settings.offer2Code || 'EDEN10'} Applied!</>
                    ) : (
                      <>
                        Tap to apply code{' '}
                        <span className="font-mono-num font-bold text-[#8C4A56]">
                          {settings.offer2Code || 'EDEN10'}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-card shrink-0">
                <div className="w-8 h-8 rounded-xl bg-[#160824]/10 text-[#160824] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#B76E79]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#160824]">
                    {settings.trustBadgeTitle || '100% Authentic Luxury Products'}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    {settings.trustBadgeSubtitle ||
                      'MAC · Huda Beauty · NARS · Silicone Airbrush'}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. COUTURE GLASSMORPHIC PROMOTIONAL BANNER ("Professional Makeup — Beauty services for every special occasion") */}
            <div className="relative rounded-3xl overflow-hidden glass-dark-royal text-white">
              {/* Subtle internal ambient sheen */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#D6B77A]/15 blur-3xl"
              />
              <div className="grid grid-cols-12 items-stretch min-h-[185px] sm:min-h-[235px]">
                <div className="col-span-7 sm:col-span-7 p-4 sm:p-8 flex flex-col justify-center space-y-2.5 z-10">
                  <p className="text-[11px] sm:text-xs font-semibold text-[#D6B77A] tracking-wide">
                    {settings.makeupBrand} · By {settings.artistName}
                  </p>
                  <h2 className="font-display text-2xl sm:text-4xl font-bold gold-gradient-text leading-tight">
                    {settings.heroBannerTitle || 'Professional Makeup'}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-[#F5E2B8]/95 leading-snug">
                    {settings.heroBannerSubtitle ||
                      'Beauty services for every special occasion'}
                  </p>
                  <p className="hidden sm:block text-xs text-white/75">
                    {settings.heroBannerTagline ||
                      'Flawless HD & Airbrush beauty · Effortless bridal confidence'}
                  </p>
                  <div className="pt-2 flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => scrollToSection('booking')}
                      className="tap-scale px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E6C98F] via-[#D6B77A] to-[#C29B56] hover:brightness-105 text-[#160824] text-xs font-extrabold flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{settings.heroCtaText || 'Book Appointment'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="hidden sm:flex items-center gap-1.5 pl-2">
                      {EDEN_ROSES_HERO_IMAGES.slice(0, 4).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setHeroSlideIdx(idx)}
                          aria-label={`Show bridal look ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            heroSlideIdx % 4 === idx
                              ? 'w-6 bg-[#D6B77A]'
                              : 'w-1.5 bg-white/35'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-span-5 sm:col-span-5 relative min-h-[185px] sm:min-h-[235px]">
                  <SmartImage
                    src={currentHeroImg.url}
                    alt="Professional Makeup by Subba Lakshmi"
                    eager
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-y-0 left-0 w-14 sm:w-24 bg-gradient-to-r from-[#220D36] via-[#220D36]/65 to-transparent" />
                </div>
              </div>
            </div>

            {/* 4. MAKEUP SERVICE CATEGORY GRID ("What service do you need?" — 8 Categories in Frosted Glass) */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#160824]">
                    What service do you need?
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-600">
                    Choose a category below to view packages, transparent pricing &amp; details
                  </p>
                </div>
                {activeSubCategory !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setActiveSubCategory('All')}
                    className="px-3.5 py-1.5 rounded-xl glass-card text-xs font-bold text-[#160824] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Show All ({services.length})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3.5">
                {MAKEUP_ARTIST_8_CATEGORIES.map((cat) => {
                  const isSelected = activeSubCategory === cat.id;
                  const count = (groupedServices.get(cat.id) || []).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => jumpToCategorySection(cat.id)}
                      className="tap-scale group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                    >
                      <div
                        className={`relative w-full aspect-square rounded-2xl overflow-hidden glass-card p-1.5 transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#160824] shadow-[0_12px_28px_-8px_rgba(22,8,36,0.22)]'
                            : 'group-hover:ring-1 group-hover:ring-[#B76E79]/60'
                        }`}
                      >
                        <SmartImage
                          src={cat.image}
                          alt={cat.label}
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        />
                        {count > 0 && (
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.2 rounded-md bg-[#160824]/80 border border-[#D6B77A]/40 text-[#F5E2B8] font-mono-num text-[9px] font-bold backdrop-blur-md">
                            {count}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] sm:text-xs mt-1.5 leading-tight line-clamp-2 ${
                          isSelected
                            ? 'font-bold text-[#160824]'
                            : 'font-semibold text-stone-800'
                        }`}
                      >
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Glassmorphic Horizontal Category Filter Bar */}
          <div className="sticky top-[148px] z-30 luxury-glass rounded-2xl py-2 px-3 border border-white/85">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveSubCategory('All')}
                className={`tap-scale px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  activeSubCategory === 'All'
                    ? 'glass-dark-royal text-[#D6B77A]'
                    : 'bg-white/75 text-stone-700 border border-white/90 hover:border-[#B76E79]/50 shadow-2xs'
                }`}
              >
                All Services ({searchFilteredServices.length})
              </button>
              {ALL_SERVICE_SECTIONS_ORDER.map((sec) => {
                const count = (groupedServices.get(sec.id) || []).length;
                if (count === 0) return null;
                const isActive = activeSubCategory === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => jumpToCategorySection(sec.id)}
                    className={`tap-scale px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'glass-dark-royal text-[#D6B77A]'
                        : 'bg-white/75 text-stone-700 border border-white/90 hover:border-[#B76E79]/50 shadow-2xs'
                    }`}
                  >
                    {sec.title} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6 & 7. SERVICE LISTINGS BY CATEGORY (Glassmorphic Couture Service Cards) */}
          {searchFilteredServices.length === 0 ? (
            <div className="glass-panel rounded-3xl p-10 text-center space-y-3">
              <p className="text-base font-bold text-[#160824]">
                No makeup or styling services matched &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-stone-600">
                Try searching for Bridal Makeup, Party Makeup, Saree Draping, Hair Styling, or Packages.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveSubCategory('All');
                }}
                className="px-4 py-2.5 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold cursor-pointer"
              >
                Show All Services
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {ALL_SERVICE_SECTIONS_ORDER.map((sectionMeta) => {
                if (
                  activeSubCategory !== 'All' &&
                  activeSubCategory !== sectionMeta.id
                ) {
                  return null;
                }
                const sectionItems = groupedServices.get(sectionMeta.id) || [];
                if (sectionItems.length === 0) return null;

                const sectionSlug = `cat-section-${sectionMeta.id
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')}`;

                return (
                  <div
                    key={sectionMeta.id}
                    id={sectionSlug}
                    className="glass-panel rounded-3xl p-4 sm:p-6 scroll-mt-40"
                  >
                    {/* Category Section Heading */}
                    <div className="border-b border-[#E6DAC8]/60 pb-3.5 mb-4 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold text-[#8C4A56]">
                          {settings.makeupBrand} · Verified Studio &amp; Venue Pricing
                        </p>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#160824]">
                          {sectionMeta.title}
                        </h2>
                        <p className="text-xs text-stone-600 mt-0.5">
                          {sectionMeta.subtitle}
                        </p>
                      </div>
                      <span className="font-mono-num text-xs font-semibold text-stone-600 shrink-0">
                        {sectionItems.length}{' '}
                        {sectionItems.length === 1 ? 'option' : 'options'}
                      </span>
                    </div>

                    {/* Glassmorphic Service Cards List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                      {sectionItems.map((srv) => {
                        const qty = getItemQuantity(srv.id);
                        const ratingVal = srv.rating ?? 4.9;
                        const reviewsVal = srv.reviewCount ?? 48;
                        const durationVal = srv.duration || '1 hr 15 mins';
                        const savingsVal =
                          srv.originalPrice && srv.price && srv.originalPrice > srv.price
                            ? srv.originalPrice - srv.price
                            : 0;
                        const bulletPoints =
                          srv.highlights && srv.highlights.length > 0
                            ? srv.highlights
                            : [
                                srv.description,
                                'Performed by certified Eden Roses Makeover artists using luxury cosmetics',
                              ];

                        return (
                          <div
                            key={srv.id}
                            className={`p-4 sm:p-5 rounded-2xl glass-card flex items-start justify-between gap-4 ${
                              qty > 0
                                ? 'ring-2 ring-[#D6B77A] bg-white/92'
                                : ''
                            }`}
                          >
                            {/* Left Column: Kicker, Service Name, Rating, Price + Savings + Duration, Bullets, View Details */}
                            <div className="flex-1 min-w-0 space-y-2">
                              {srv.airbrushAvailable && (
                                <p className="text-[11px] font-bold text-[#8C4A56] tracking-wide">
                                  HD &amp; Silicone Airbrush Available
                                </p>
                              )}

                              <h3 className="text-base sm:text-lg font-bold text-[#160824] leading-snug">
                                {srv.name}
                              </h3>

                              {/* Unboxed Rating, Review Count & Duration */}
                              <div className="flex items-center flex-wrap gap-1.5 text-xs text-stone-600">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                <span className="font-bold text-stone-900 font-mono-num">
                                  {ratingVal.toFixed(1)}
                                </span>
                                <span className="text-stone-500">
                                  ({reviewsVal} reviews)
                                </span>
                                <span className="text-stone-300" aria-hidden="true">
                                  ·
                                </span>
                                <span className="text-stone-600 font-medium inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#B76E79]" />
                                  <span>{durationVal}</span>
                                </span>
                              </div>

                              {/* Price, Original Price & Automatic Savings Row */}
                              <div className="flex items-baseline flex-wrap gap-2 pt-0.5">
                                {srv.price !== null ? (
                                  <span className="font-mono-num text-base sm:text-lg font-extrabold text-[#160824]">
                                    ₹{srv.price.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-[#8C4A56]">
                                    Custom Quote
                                  </span>
                                )}
                                {srv.originalPrice && srv.price && (
                                  <span className="font-mono-num text-xs text-stone-400 line-through">
                                    ₹{srv.originalPrice.toLocaleString('en-IN')}
                                  </span>
                                )}
                                {savingsVal > 0 && (
                                  <span className="text-[11px] font-bold text-emerald-700">
                                    Save ₹{savingsVal.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>

                              {/* Subtle Hairline Divider */}
                              <div className="border-t border-dashed border-[#D6B77A]/45 my-2" />

                              {/* Bullet Point Description */}
                              <ul className="space-y-1 text-xs text-stone-600 leading-relaxed">
                                {bulletPoints.slice(0, 2).map((pt, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-[#B76E79] font-bold mt-0.5">•</span>
                                    <span className="line-clamp-2">{pt}</span>
                                  </li>
                                ))}
                              </ul>

                              {/* "View details >" Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedServiceDetail(srv)}
                                className="pt-1 inline-flex items-center gap-1 text-xs font-bold text-[#8C4A56] hover:text-[#160824] cursor-pointer"
                              >
                                <span>View details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Right Column: High-Clarity Service Portrait (strict aspect-[4/3] object-cover) + Overlapping Frosted Glass "Add" Button */}
                            <div className="flex flex-col items-center shrink-0 w-32 sm:w-36">
                              <div
                                onClick={() => setSelectedServiceDetail(srv)}
                                className="w-32 sm:w-36 aspect-[4/3] rounded-2xl overflow-hidden bg-white/80 border border-white/90 shadow-md cursor-pointer relative group p-1"
                              >
                                <SmartImage
                                  src={srv.image}
                                  alt={srv.name}
                                  className="w-full h-full aspect-[4/3] object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>

                              {/* Overlapping Frosted Glass "Add to Cart" or "- qty +" Stepper Button */}
                              <div className="-mt-4 z-10 w-28 sm:w-32 flex flex-col items-center gap-1">
                                {qty === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAddOrIncrement(srv)}
                                    className="tap-scale w-full h-9 rounded-xl bg-white/95 backdrop-blur-xl hover:bg-white text-[#160824] border border-[#D6B77A] shadow-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-[#8C4A56]" />
                                    <span>Add to Cart</span>
                                  </button>
                                ) : (
                                  <>
                                    <div className="w-full h-9 rounded-xl glass-dark-royal text-[#D6B77A] shadow-lg flex items-center justify-between px-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuantity(srv.id, -1)}
                                        aria-label="Decrease quantity"
                                        className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="font-mono-num text-xs font-extrabold text-white">
                                        {qty} in Cart
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuantity(srv.id, 1)}
                                        aria-label="Increase quantity"
                                        className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setCartDrawerOpen(true)}
                                      className="text-[10px] font-extrabold text-[#8C4A56] hover:text-[#160824] underline cursor-pointer"
                                    >
                                      Checkout ({totalCartItems}) →
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          8. FAST 1-PAGE EXPRESS BOOKING & MULTI-ITEM CART CHECKOUT
      ===================================================================== */}
      <section
        id="booking"
        className="relative z-10 py-10 sm:py-16"
      >
        <div id="calendar" className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-7">
            <p className="text-xs font-semibold tracking-wider text-[#8C4A56]">
              Fast 1-Step Multi-Service Booking · Instant Confirmation
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#160824] mt-1">
              Quick Cart &amp; Appointment Booking
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
              Add multiple services to your cart, pick your date, time &amp; area in{' '}
              <strong className="text-stone-900">{locality}, Bangalore</strong>, and confirm in 1 click.
            </p>
          </div>

          {formError && (
            <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-red-50/95 backdrop-blur-md border border-red-300 text-red-800 text-xs sm:text-sm font-semibold flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-xs font-bold underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left / Main Single-Screen Express Booking Form (7 cols) */}
            <form
              onSubmit={handleConfirmBookingSubmit}
              className="lg:col-span-7 glass-panel rounded-3xl p-4 sm:p-7 space-y-6"
            >
              {/* PART 1: SELECTED CART ITEMS + QUICK ADD */}
              <div className="space-y-3.5 border-b border-[#E6DAC8]/60 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#160824] flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#8C4A56]" />
                      <span>1. Your Selected Services ({totalCartItems})</span>
                    </h3>
                    <p className="text-xs text-stone-600">
                      Add multiple services together and adjust quantities below
                    </p>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-[11px] font-bold text-red-700 hover:underline cursor-pointer"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                {/* Selected Cart Items List */}
                {cart.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-dashed border-[#D6B77A] text-center space-y-2">
                    <p className="text-xs sm:text-sm font-bold text-[#160824]">
                      Your cart is currently empty
                    </p>
                    <p className="text-xs text-stone-600">
                      Select any service from the dropdown below or tap &ldquo;+ Add to Cart&rdquo; on any service card above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl glass-card flex items-center justify-between gap-3 border border-[#D6B77A]/50 bg-white/95"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-[#160824] truncate">
                            {item.name}
                          </p>
                          <p className="font-mono-num text-xs text-stone-600">
                            ₹{item.price.toLocaleString('en-IN')} × {item.quantity} ={' '}
                            <strong className="text-[#160824]">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-800 hover:bg-stone-100 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono-num text-xs sm:text-sm font-bold w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg glass-dark-royal text-[#D6B77A] flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick "+ Add Service to Cart" Selector */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-[#8C4A56] mb-1.5">
                    + Add More Services to Your Booking Cart:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={quickAddServiceId}
                      onChange={(e) => {
                        const srvId = e.target.value;
                        setQuickAddServiceId('');
                        if (!srvId) return;
                        const found = enrichedServices.find((s) => s.id === srvId);
                        if (found) {
                          handleAddOrIncrement(found);
                        }
                      }}
                      className="flex-1 min-h-[42px] px-3 py-2 rounded-xl glass-input text-xs sm:text-sm font-semibold text-[#160824] bg-white/90"
                    >
                      <option value="">-- Tap here to add a service to cart --</option>
                      {enrichedServices
                        .filter((s) => s.price !== null)
                        .map((srv) => (
                          <option key={srv.id} value={srv.id}>
                            + {srv.name} — ₹{srv.price} ({srv.makeupSubCategory})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* PART 2: QUICK DATE & TIME SLOT SELECTION */}
              <div className="space-y-3.5 border-b border-[#E6DAC8]/60 pb-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-[#160824] flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#8C4A56]" />
                    <span>2. Select Date &amp; Time Slot</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowFullCalendarGrid((v) => !v)}
                    className="text-xs font-bold text-[#8C4A56] hover:underline cursor-pointer"
                  >
                    {showFullCalendarGrid ? 'Hide Monthly Calendar' : 'View Monthly Calendar'}
                  </button>
                </div>

                {/* Quick 1-Tap Date Pills + Native Date Input */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Today', iso: todayISO },
                    { label: 'Tomorrow', iso: tomorrowISO },
                    { label: 'Day After', iso: dayAfterISO },
                  ].map((d) => {
                    const active = selectedDate === d.iso;
                    return (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => setSelectedDate(d.iso)}
                        className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'glass-dark-royal text-[#D6B77A] shadow-sm'
                            : 'glass-card text-stone-800 hover:bg-white'
                        }`}
                      >
                        <span className="block">{d.label}</span>
                        <span className="font-mono-num text-[10px] opacity-80">{d.iso}</span>
                      </button>
                    );
                  })}

                  <div>
                    <input
                      type="date"
                      min={todayISO}
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value) setSelectedDate(e.target.value);
                      }}
                      className="w-full min-h-[42px] px-2.5 py-2 rounded-xl glass-input text-xs font-mono-num font-bold text-[#160824] bg-white/90"
                    />
                  </div>
                </div>

                {/* Optional Collapsible Full Month Calendar */}
                {showFullCalendarGrid && (
                  <div className="p-3.5 rounded-2xl glass-card space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth() - 1,
                              1
                            )
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-white cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs sm:text-sm font-bold text-[#160824]">
                        {calendarMonth.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth() + 1,
                              1
                            )
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-white cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-stone-500">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((cell, idx) => {
                        if (!cell.dateISO || !cell.dayNumber) {
                          return <div key={`empty-${idx}`} className="h-9" />;
                        }
                        const isSelected = cell.dateISO === selectedDate;
                        const isDisabled = cell.isPast || cell.isFullyBooked;
                        return (
                          <button
                            key={cell.dateISO}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setSelectedDate(cell.dateISO!)}
                            className={`h-9 rounded-lg font-mono-num text-xs flex items-center justify-center ${
                              isDisabled
                                ? 'bg-stone-200/45 text-stone-400 cursor-not-allowed'
                                : isSelected
                                ? 'glass-dark-royal text-[#D6B77A] font-bold cursor-pointer'
                                : 'bg-white/80 text-stone-900 cursor-pointer'
                            }`}
                          >
                            {cell.dayNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Time Slots Pills */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8C4A56]" />
                    <span>Choose Time Slot ({selectedDate}):</span>
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {selectedDateSlots.map((slot) => {
                      const isChosen = selectedTime === slot.time && slot.available;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2.5 px-2 rounded-xl text-center font-mono-num text-xs font-bold transition-all ${
                            !slot.available
                              ? 'bg-stone-200/45 text-stone-400 cursor-not-allowed'
                              : isChosen
                              ? 'glass-dark-royal text-[#D6B77A] shadow-sm cursor-pointer'
                              : 'glass-card text-stone-900 hover:bg-white cursor-pointer'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PART 3: SIMPLE CUSTOMER DETAILS */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-[#160824] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8C4A56]" />
                  <span>3. Your Details &amp; Area</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl glass-input text-sm font-medium bg-white/90"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setWhatsapp(e.target.value);
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl glass-input text-sm font-mono-num font-bold bg-white/90"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                      <span>Select Area / Branch *</span>
                      <span className="text-[10px] text-[#8C4A56] font-semibold">Bangalore</span>
                    </label>
                    <select
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl glass-input text-sm font-semibold text-stone-900 bg-white/90"
                    >
                      {availableLocalities.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Occasion / Service Type
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as EventType)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl glass-input text-sm bg-white/90"
                    >
                      {EVENT_TYPES.map((evt) => (
                        <option key={evt} value={evt}>
                          {evt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Full Address / Landmark (Optional for Salon Walk-in)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={`House/Flat No., Street, Landmark in ${locality} (or leave blank for Salon Walk-in)`}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl glass-input text-sm bg-white/90"
                  />
                </div>

                {/* PART 4: MANDATORY ₹99 ADVANCE PAYMENT & SCREENSHOT / UTR VERIFICATION */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#160824] text-[#FFF8EF] border-2 border-[#D6B77A] space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#D6B77A] text-[#160824] text-[10px] font-extrabold uppercase tracking-wider mb-1">
                        Mandatory Step · ₹99 Advance Payment
                      </span>
                      <h4 className="font-display text-lg sm:text-xl font-bold text-[#F5E2B8]">
                        4. Pay ₹99 Advance to Confirm Slot
                      </h4>
                      <p className="text-xs text-white/80">
                        बिना ₹99 एडवांस पेमेंट के बुकिंग नहीं होती है। QR स्कैन करके ₹99 पे करें और नीचे Screenshot या UTR/Ref/Transaction ID डालें।
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-[#D6B77A]/40">
                      <span className="text-[10px] uppercase tracking-wider text-[#D6B77A] block font-bold">
                        Advance Due Now
                      </span>
                      <span className="font-mono-num text-2xl font-extrabold text-[#F5E2B8]">
                        ₹99
                      </span>
                    </div>
                  </div>

                  {/* QR Code + UPI ID Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <div className="sm:col-span-5 flex flex-col items-center">
                      <div className="w-44 sm:w-48 bg-white rounded-2xl p-2 shadow-lg border-2 border-[#D6B77A]">
                        <img
                          src={OFFICIAL_UPI_QR_IMAGE}
                          alt="Scan to Pay Rs 99 UPI QR Code - Subha State Bank of India"
                          className="w-full h-auto rounded-xl object-contain"
                        />
                      </div>
                      <span className="text-[11px] text-[#D6B77A] font-bold mt-1.5">
                        Scan with GPay, PhonePe, Paytm or Any UPI App
                      </span>
                    </div>

                    <div className="sm:col-span-7 space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/35 border border-white/15 space-y-1.5">
                        <p className="text-[11px] text-white/70">
                          Merchant / Account Name:{' '}
                          <strong className="text-white">Subha (State Bank of India)</strong>
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="font-mono-num text-xs sm:text-sm font-bold text-[#F5E2B8] break-all">
                            {OFFICIAL_UPI_ID}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpiId}
                            className="px-2.5 py-1 rounded-lg bg-[#D6B77A] text-[#160824] text-[11px] font-extrabold shrink-0 cursor-pointer"
                          >
                            {copiedUpi ? '✓ Copied' : 'Copy UPI ID'}
                          </button>
                        </div>
                      </div>

                      <a
                        href={OFFICIAL_UPI_PAY_LINK}
                        className="tap-scale w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E6C98F] via-[#D6B77A] to-[#C29B56] text-[#160824] font-extrabold text-xs flex items-center justify-center gap-2 shadow-md"
                      >
                        <span>Pay ₹99 Directly via UPI App</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>

                      {/* Selectable Proof Type: UTR Number / Reference Number / Transaction ID */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-[11px] font-bold text-[#F5E2B8]">
                          Enter UTR Number / Reference Number / Transaction ID:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(
                            [
                              'UTR Number',
                              'Reference Number',
                              'Transaction ID',
                            ] as const
                          ).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setPaymentProofType(type)}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                paymentProofType === type
                                  ? 'bg-[#D6B77A] text-[#160824] border-[#D6B77A]'
                                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/15'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder={`Enter ${paymentProofType} (e.g. 4312XXXXXXXX)`}
                          className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white text-stone-900 font-mono-num text-xs font-bold placeholder:text-stone-400 border border-[#D6B77A]"
                        />
                      </div>

                      {/* Upload Payment Screenshot */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-bold text-[#F5E2B8]">
                          Upload ₹99 Payment Screenshot (स्क्रीनशॉट अपलोड करें):
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-[#D6B77A]/60 text-[#F5E2B8] text-xs font-bold inline-flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-[#D6B77A]" />
                            <span>
                              {isUploadingScreenshot
                                ? 'Uploading Screenshot...'
                                : paymentScreenshot
                                ? 'Change Payment Screenshot'
                                : 'Upload Payment Screenshot'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePaymentScreenshotUpload}
                              className="hidden"
                            />
                          </label>
                          {paymentScreenshot && (
                            <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Screenshot Attached
                            </span>
                          )}
                        </div>

                        {paymentScreenshot && (
                          <div className="mt-2 flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-emerald-400/40">
                            <img
                              src={paymentScreenshot}
                              alt="Uploaded Payment Screenshot"
                              className="w-14 h-14 rounded-lg object-cover border border-white/20 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-emerald-300">
                                ✓ ₹99 Payment Screenshot Ready for Admin Verification
                              </p>
                              <button
                                type="button"
                                onClick={() => setPaymentScreenshot('')}
                                className="text-[10px] text-rose-300 underline mt-0.5 cursor-pointer"
                              >
                                Remove Screenshot
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingScreenshot}
                    className="tap-scale flex-1 min-h-[52px] px-6 py-3.5 rounded-2xl glass-dark-royal text-[#D6B77A] text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border border-[#D6B77A]/60"
                  >
                    <ShieldCheck className="w-5 h-5 text-[#D6B77A]" />
                    <span>
                      {isSubmitting
                        ? 'Sending to Admin for Verification...'
                        : `Submit ₹99 Payment & Verify Booking (${totalCartItems} ${
                            totalCartItems === 1 ? 'Service' : 'Services'
                          })`}
                    </span>
                  </button>
                </div>
              </div>
            </form>

            {/* Right: Live Glassmorphic Booking Summary Card (5 cols) */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-5 sm:p-7 space-y-5 sticky top-28">
              <div className="flex items-center justify-between border-b border-[#E6DAC8]/60 pb-3.5">
                <div>
                  <h3 className="text-lg font-bold text-[#160824]">Booking Summary</h3>
                  <p className="text-xs text-stone-600">
                    {locality}, Bangalore · {totalCartItems} item(s) in cart
                  </p>
                </div>
                <CalendarIcon className="w-5 h-5 text-[#B76E79]" />
              </div>

              {/* Selected Location, Date & Time Slot */}
              <div className="p-3.5 rounded-2xl glass-card space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Service Location</span>
                  <button
                    type="button"
                    onClick={() => setLocationModalOpen(true)}
                    className="font-bold text-[#160824] hover:text-[#8C4A56] flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#B76E79]" />
                    <span>{locality}, Bangalore</span>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#E6DAC8]/55">
                  <span className="text-stone-600">Preferred Date &amp; Slot</span>
                  <span className="font-mono-num font-bold text-[#160824]">
                    {selectedDate} · {selectedTime}
                  </span>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">
                    No services added yet. Tap &ldquo;Add&rdquo; on any service above.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-[#E6DAC8]/50 text-xs sm:text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#160824] truncate">
                          {item.name}
                        </p>
                        <p className="font-mono-num text-xs text-stone-500">
                          {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-num font-bold text-[#160824]">
                          ₹{item.price * item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Promo Code Input */}
              <div className="space-y-2.5 pt-1 border-t border-[#E6DAC8]/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code (BRIDAL500 / EDEN10)"
                    className="flex-1 px-3 py-2 rounded-xl glass-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscountCode}
                    className="px-4 py-2 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Totals Breakdown in Royal Dark Glass */}
              <div className="p-4 rounded-2xl glass-dark-royal text-white space-y-2 text-sm">
                <div className="flex justify-between text-white/80 text-xs">
                  <span>Items Total</span>
                  <span className="font-mono-num">₹{itemsSubtotal}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-emerald-300 text-xs">
                    <span>Offer Discount</span>
                    <span className="font-mono-num">-₹{effectiveDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#D6B77A] text-xs font-bold">
                  <span>Mandatory Advance Payment (Due Now)</span>
                  <span className="font-mono-num">₹{effectiveAdvance}</span>
                </div>
                <div className="pt-2 border-t border-white/15 flex justify-between items-baseline font-bold text-base">
                  <span>Balance Payable at Appointment</span>
                  <span className="font-mono-num text-lg text-[#D6B77A]">
                    ₹{remainingAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          ORIGINAL EDEN ROSES PORTFOLIO GALLERY (Glassmorphic Couture Showcase)
      ===================================================================== */}
      <section
        id="gallery"
        className="relative z-10 py-8 sm:py-12"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="glass-panel rounded-3xl p-4 sm:p-7 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6DAC8]/60 pb-4">
              <div>
                <p className="text-xs font-semibold tracking-wider text-[#8C4A56]">
                  Authentic Client Bridal &amp; Styling Portfolio
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#160824] mt-1">
                  Bridal Transformations &amp; Hair Artistry
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
                  Real brides, engagement looks, saree draping, and floral Poola Jada
                  hairstyling by Subba Lakshmi.
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {(
                  [
                    'All',
                    'Bridal Makeup',
                    'Party Makeup',
                    'Engagement Makeup',
                    'Hairstyling',
                    'Salon',
                    'Beauty Services',
                  ] as GalleryFilterCategory[]
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveGalleryCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      activeGalleryCategory === cat
                        ? 'glass-dark-royal text-[#D6B77A]'
                        : 'glass-card text-stone-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {filteredGallery.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxImage(img)}
                  className="tap-scale group relative aspect-[3/4] rounded-2xl overflow-hidden glass-card p-1.5 text-left cursor-pointer"
                >
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-stone-900">
                    <SmartImage
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-2 bottom-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 p-2.5 flex flex-col justify-end">
                      <span className="text-[10px] text-[#D6B77A] font-semibold">
                        {img.galleryCategory || img.category}
                      </span>
                      <p className="text-xs font-semibold text-white leading-snug mt-0.5 line-clamp-2">
                        {img.alt}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          ABOUT SECTION ("Meet Your Makeup Artist — Subba Lakshmi") & TESTIMONIALS
      ===================================================================== */}
      <section
        id="about"
        className="relative z-10 py-8 sm:py-12"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-8">
          <div className="glass-panel rounded-3xl p-5 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
                <div className="rounded-2xl overflow-hidden glass-card p-1.5 aspect-[3/4]">
                  <SmartImage
                    src={EDEN_ROSES_ABOUT_IMAGES[0].url}
                    alt={EDEN_ROSES_ABOUT_IMAGES[0].alt}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="space-y-3.5 pt-4">
                  <div className="rounded-2xl overflow-hidden glass-card p-1.5 aspect-square">
                    <SmartImage
                      src={EDEN_ROSES_ABOUT_IMAGES[1].url}
                      alt={EDEN_ROSES_ABOUT_IMAGES[1].alt}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <div className="rounded-2xl glass-dark-royal text-white p-3.5">
                    <p className="font-display text-base font-bold text-[#D6B77A]">
                      {settings.makeupBrand}
                    </p>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      C V Raman Nagar Studio &amp; Venue Visits Across Bangalore
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-semibold tracking-wider text-[#8C4A56]">
                  {settings.aboutKicker || 'Principal Makeup & Styling Artist'}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#160824]">
                  {settings.artistName} — {settings.makeupBrand}
                </h2>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {settings.description}
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl glass-card">
                    <p className="font-bold text-sm text-[#160824]">
                      {settings.aboutHighlight1Title || 'HD & Airbrush'}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {settings.aboutHighlight1Sub || 'Waterproof 16-hr skin finish'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-card">
                    <p className="font-bold text-sm text-[#160824]">
                      {settings.aboutHighlight2Title || 'Venue Travel'}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {settings.aboutHighlight2Sub || '5:00 AM Muhurtham slots available'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-card">
                    <p className="font-bold text-sm text-[#160824]">
                      {settings.aboutHighlight3Title || '4.9 ★ Rated'}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {settings.aboutHighlight3Sub || 'Loved by Bengaluru brides'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Testimonials in Frosted Glass */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                name: 'Akshara Prasanth',
                role: 'Bridal Client · C V Raman Nagar',
                quote:
                  'Subba Lakshmi and the Eden Roses team made me feel so confident and radiant! From facial prep to the bridal makeover and draping, every detail was perfection.',
                img: EDEN_ROSES_TESTIMONIAL_IMAGES[0].url,
              },
              {
                name: 'Prarthana',
                role: 'Hairstyling & Engagement · Indiranagar',
                quote:
                  'Booked the Engagement Makeup and Advance Hairstyling package. The curls and floral braid stayed intact for over 10 hours through the entire ceremony!',
                img: EDEN_ROSES_TESTIMONIAL_IMAGES[1].url,
              },
              {
                name: 'Kumari Madhumita',
                role: 'Party Makeover & Draping · Whitefield',
                quote:
                  'Flawless saree draping, messy up-do hairstyling, and natural party makeup that looked amazing in person and on camera.',
                img: EDEN_ROSES_TESTIMONIAL_IMAGES[2].url,
              },
            ].map((item) => (
              <div
                key={item.name}
                className="p-5 rounded-3xl glass-card flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-[#E6DAC8]/55">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D6B77A] shrink-0">
                    <SmartImage
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#160824]">{item.name}</p>
                    <p className="text-[11px] text-stone-600">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          9. DEDICATED "OUR SALON BRANCHES" SECTION (Kaggadaspura & Electronic City)
             + BANGALORE-WIDE BRIDAL MAKEUP SERVICE AREAS NOTE
      ===================================================================== */}
      <section
        id="our-salon-branches"
        className="relative z-10 py-8 sm:py-12"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="glass-panel rounded-3xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E6DAC8]/60 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C4A56]">
                  Physical Walk-In Salon Studios · Open Daily 9:00 AM – 8:30 PM
                </p>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#160824] mt-1">
                  Our Salon Branches
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Visit our two luxury walk-in unisex salon branches in Bangalore for hair, skin,
                  spa, manicure, pedicure, men&apos;s grooming, and studio bridal makeovers.
                </p>
              </div>
              <a
                href={primaryPhoneTel}
                className="tap-scale px-4 py-2.5 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto"
              >
                <Phone className="w-4 h-4 text-[#D6B77A]" />
                <span>Call Central Desk: {primaryPhoneDisplay}</span>
              </a>
            </div>

            {/* Two Distinct Location Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Branch 1: Kaggadaspura Branch */}
              <div className="rounded-3xl glass-card p-5 sm:p-6 border-2 border-[#D6B77A]/55 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full glass-dark-royal text-[#D6B77A] text-[11px] font-bold">
                      Branch 1 · East / Central Bangalore
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      Walk-In &amp; Appointment
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#160824]">
                    Kaggadaspura Branch
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 font-medium">
                    Full In-Salon Services &amp; Bridal Studio
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    BBMP 202, 50/2, 1st Main Road, C V Raman Nagar / Nagavarapalya / Kaggadaspura,
                    Bengaluru, Karnataka 560093
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {[
                      'Facial & Skin',
                      'Manicure & Pedicure',
                      'Hair Spa & Keratin',
                      "Women's Haircuts",
                      "Men's Grooming",
                      'Bridal Studio',
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-white/85 border border-[#E6DAC8]/70 text-[11px] font-semibold text-[#160824]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E6DAC8]/60">
                  <a
                    href={primaryPhoneTel}
                    className="tap-scale h-11 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Branch</span>
                  </a>
                  <a
                    href={
                      settings.googleMapsLink ||
                      'https://maps.google.com/?q=Eden+Roses+Unisex+Salon+Kaggadaspura+Bangalore'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-scale h-11 rounded-xl glass-card text-[#160824] border border-[#D6B77A]/60 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#8C4A56]" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>

              {/* Branch 2: Electronic City Branch */}
              <div className="rounded-3xl glass-card p-5 sm:p-6 border-2 border-[#D6B77A]/55 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full glass-dark-royal text-[#D6B77A] text-[11px] font-bold">
                      Branch 2 · South Bangalore Hub
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      Walk-In &amp; Appointment
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#160824]">
                    Electronic City Branch
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 font-medium">
                    Full In-Salon Services &amp; Bridal Studio
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Eden Roses Unisex Salon, Electronic City Phase 1 &amp; 2 Corridor, Bengaluru,
                    Karnataka 560100
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {[
                      'Facial & Skin',
                      'Manicure & Pedicure',
                      'Hair Spa & Keratin',
                      "Women's Haircuts",
                      "Men's Grooming",
                      'Bridal Studio',
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-white/85 border border-[#E6DAC8]/70 text-[11px] font-semibold text-[#160824]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E6DAC8]/60">
                  <a
                    href={primaryPhoneTel}
                    className="tap-scale h-11 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Branch</span>
                  </a>
                  <a
                    href="https://maps.google.com/?q=Eden+Roses+Unisex+Salon+Electronic+City+Bangalore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-scale h-11 rounded-xl glass-card text-[#160824] border border-[#D6B77A]/60 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#8C4A56]" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Service Areas Note */}
            <div className="rounded-2xl glass-dark-royal p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#D6B77A]/40">
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#D6B77A]">
                  Service Areas Note · Doorstep &amp; Wedding Venue Coverage
                </p>
                <p className="text-xs sm:text-sm text-[#FFF8EF] leading-relaxed">
                  <strong>At-Home Bridal Makeup &amp; Selected Beauty Services</strong> are
                  available across all Bangalore neighborhoods including{' '}
                  <span className="text-[#D6B77A] font-semibold">
                    Varthur, Whitefield, Brookefield, Indiranagar, Koramangala, HSR Layout,
                    Jayanagar, Marathahalli, and Yelahanka
                  </span>
                  . (Physical walk-in salon branches are located exclusively at Kaggadaspura and
                  Electronic City.)
                </p>
              </div>
              <a
                href={whatsappInstantBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          9B. INSTANT CALLBACK & CUSTOM BRIDAL QUOTE SECTION (Glassmorphic Panel)
      ===================================================================== */}
      <section
        id="contact"
        className="relative z-10 py-6 sm:py-12"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="glass-panel rounded-3xl p-5 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 space-y-4">
                <p className="text-xs font-semibold tracking-wider text-[#8C4A56]">
                  2 Walk-In Salon Branches &amp; Bangalore-Wide At-Home Bridal Makeup
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#160824]">
                  Eden Roses Unisex Salon — {settings.makeupBrand}
                </h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl glass-card flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#B76E79] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#160824]">
                        Walk-In Salon Branches: Kaggadaspura &amp; Electronic City
                      </p>
                      <p className="text-xs text-stone-600 mt-0.5">{settings.address}</p>
                      <a
                        href={settings.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C4A56] hover:text-[#160824] underline mt-1.5"
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl glass-card flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#B76E79] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#160824]">
                        Official Booking &amp; WhatsApp Line
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs font-bold font-mono-num text-stone-800">
                        <a href={primaryPhoneTel} className="text-[#160824] underline">
                          {primaryPhoneDisplay}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 glass-card rounded-3xl p-5 sm:p-7 space-y-4">
                <h3 className="text-lg sm:text-xl font-bold text-[#160824]">
                  Request a Custom Bridal Quote or Callback
                </h3>

                {contactSent ? (
                  <div className="p-5 rounded-2xl bg-white/90 border border-emerald-300 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-base text-stone-900">
                      Inquiry Received! We will call you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactSent(false)}
                      className="px-4 py-2 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-semibold cursor-pointer"
                    >
                      Send Another Request
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await saveCustomerLead({
                        customerName: inquiryName.trim(),
                        phone: inquiryPhone.trim(),
                        whatsapp: inquiryPhone.trim().replace(/[^0-9]/g, ''),
                        address: inquiryLocality.trim() || locality,
                        locality: inquiryLocality.trim() || locality,
                        eventType: 'Callback Request',
                        message: inquiryMessage.trim(),
                        source: 'Callback Form',
                      });
                      setInquiryName('');
                      setInquiryPhone('');
                      setInquiryLocality('');
                      setInquiryMessage('');
                      setContactSent(true);
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        placeholder="Your Name *"
                        className="w-full h-11 px-3.5 rounded-xl glass-input text-xs sm:text-sm"
                      />
                      <input
                        type="tel"
                        required
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        placeholder="Phone / WhatsApp Number *"
                        className="w-full h-11 px-3.5 rounded-xl glass-input text-xs sm:text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={inquiryLocality}
                      onChange={(e) => setInquiryLocality(e.target.value)}
                      placeholder="Branch (Kaggadaspura / Electronic City) or Home Locality (e.g. Varthur, Whitefield)"
                      className="w-full h-11 px-3.5 rounded-xl glass-input text-xs sm:text-sm"
                    />
                    <textarea
                      rows={2}
                      required
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      placeholder="Tell us what salon or bridal makeup services you need..."
                      className="w-full p-3.5 rounded-xl glass-input text-xs sm:text-sm"
                    />
                    <button
                      type="submit"
                      className="tap-scale w-full h-11 rounded-xl glass-dark-royal text-[#D6B77A] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      Request Callback
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER (With Discreet Staff Login Link at Bottom) */}
      <footer className="relative z-10 glass-dark-royal text-[#FFF8EF] py-10 border-t border-[#D6B77A]/35">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-11 rounded-xl overflow-hidden border border-[#D6B77A]/60 shrink-0">
                <SmartImage
                  src={settings.footerLogoUrl}
                  alt={settings.businessName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-[#D6B77A]">
                  Eden Roses Unisex Salon
                </p>
                <p className="text-xs text-white/75">
                  {settings.makeupBrand} by {settings.artistName} · Phone: {primaryPhoneDisplay}
                </p>
              </div>
            </div>
            <div className="text-xs text-white/75 max-w-md">
              <strong>Walk-In Salon Branches:</strong> Kaggadaspura &amp; Electronic City |{' '}
              <strong>At-Home Bridal Makeup:</strong> Varthur, Whitefield, Brookefield,
              Indiranagar, Koramangala &amp; All Bangalore
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/55">
            <p>
              © {new Date().getFullYear()} Eden Roses Unisex Salon ({settings.makeupBrand} by{' '}
              {settings.artistName}). All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <a href={primaryPhoneTel} className="text-[#D6B77A] hover:underline font-mono-num">
                {primaryPhoneDisplay}
              </a>
              <span aria-hidden="true">·</span>
              <span>Bengaluru 560093</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          FLOATING "≡ Menu" CATEGORY QUICK-JUMP BUTTON
          Positioned cleanly above the mobile sticky bottom bar so it never overlaps
      ===================================================================== */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-30 transition-all ${
          totalCartItems > 0 ? 'bottom-44 lg:bottom-8' : 'bottom-32 lg:bottom-8'
        }`}
      >
        <button
          type="button"
          onClick={() => setFloatingMenuOpen((v) => !v)}
          className="tap-scale h-10 px-5 rounded-full glass-dark-royal text-[#F5E2B8] border border-[#D6B77A]/50 shadow-xl flex items-center gap-2 text-xs font-bold tracking-wide cursor-pointer"
        >
          {floatingMenuOpen ? (
            <>
              <X className="w-3.5 h-3.5 text-[#D6B77A]" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Menu className="w-3.5 h-3.5 text-[#D6B77A]" />
              <span>Menu</span>
            </>
          )}
        </button>
      </div>

      {/* FLOATING MENU POPOVER (Glassmorphic Popover) */}
      {floatingMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 pb-36 sm:pb-4"
          onClick={() => setFloatingMenuOpen(false)}
        >
          <div
            className="w-full max-w-xs glass-modal-sheet rounded-3xl p-4 space-y-2 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pb-2 border-b border-[#E6DAC8]/60">
              <span className="font-display text-base font-bold text-[#160824]">
                Makeup &amp; Styling Menu
              </span>
              <button
                type="button"
                onClick={() => setFloatingMenuOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[#E6DAC8]/45">
              {ALL_SERVICE_SECTIONS_ORDER.map((sec) => {
                const count = (groupedServices.get(sec.id) || []).length;
                if (count === 0) return null;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => jumpToCategorySection(sec.id)}
                    className="w-full py-2.5 px-3 hover:bg-white/75 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-[#160824]">
                      {sec.title}
                    </span>
                    <span className="font-mono-num text-xs font-bold text-[#8C4A56]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DESKTOP FLOATING ACTION BUTTONS + MOBILE STICKY BOTTOM BAR
          Instant "Call Now (+91 7619603016)" & "Book on WhatsApp"
      ===================================================================== */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-40 items-center gap-3">
        <a
          href={primaryPhoneTel}
          className="tap-scale h-12 px-5 rounded-full glass-dark-royal text-[#D6B77A] border border-[#D6B77A]/50 shadow-xl flex items-center gap-2 text-xs font-extrabold tracking-wide"
        >
          <Phone className="w-4 h-4 text-[#D6B77A]" />
          <span>Call Now ({primaryPhoneDisplay})</span>
        </a>
        <a
          href={whatsappInstantBookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-scale h-12 px-5 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-xl flex items-center gap-2 text-xs font-extrabold tracking-wide"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Book on WhatsApp</span>
        </a>
      </div>

      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 luxury-glass border-t border-white/85 shadow-[0_-10px_30px_rgba(22,8,36,0.16)]"
      >
        {/* Sticky Mini Cart Strip when items are in cart */}
        {totalCartItems > 0 && (
          <div className="glass-dark-royal text-white px-3.5 py-2 border-b border-[#D6B77A]/35 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveNavTab('cart');
                setCartDrawerOpen(true);
              }}
              className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
            >
              <span className="px-2 py-0.5 rounded-lg bg-[#D6B77A] text-[#160824] font-mono-num text-xs font-extrabold">
                {totalCartItems}
              </span>
              <div className="min-w-0">
                <p className="font-mono-num text-xs font-extrabold text-[#F5E2B8] leading-tight">
                  ₹{netPayable.toLocaleString('en-IN')} · View Cart
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingStep(2);
                scrollToSection('booking');
              }}
              className="tap-scale px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E6C98F] via-[#D6B77A] to-[#C29B56] text-[#160824] text-[11px] font-extrabold flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
            >
              <span>Select Slot</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Primary Instant Call Now & Book on WhatsApp Sticky Action Bar */}
        <div className="grid grid-cols-2 gap-2 px-3 pt-2 pb-1.5 bg-white/92 backdrop-blur-xl">
          <a
            href={primaryPhoneTel}
            className="tap-scale h-10 rounded-xl glass-dark-royal text-[#D6B77A] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm px-2 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-[#D6B77A] shrink-0" />
            <span className="truncate">Call Now ({primaryPhoneDisplay})</span>
          </a>
          <a
            href={whatsappInstantBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale h-10 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm px-2 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="truncate">Book on WhatsApp</span>
          </a>
        </div>

        {/* 5-Tab App Bottom Navigation */}
        <div className="grid grid-cols-5 h-13 text-[10px] font-semibold text-stone-600 border-t border-[#E6DAC8]/65 bg-white/95">
          <button
            type="button"
            onClick={() => scrollToSection('service-separation-guide')}
            className={`tap-scale flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              activeNavTab === 'home'
                ? 'text-[#160824] font-extrabold bg-[#D6B77A]/15'
                : 'hover:text-[#160824]'
            }`}
          >
            <Home
              className={`w-4 h-4 ${
                activeNavTab === 'home' ? 'text-[#8C4A56]' : 'text-stone-500'
              }`}
            />
            <span>In-Salon/Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubCategory('All');
              setSearchQuery('');
              scrollToSection('makeup-artist-page');
            }}
            className={`tap-scale flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              activeNavTab === 'services'
                ? 'text-[#160824] font-extrabold bg-[#D6B77A]/15'
                : 'hover:text-[#160824]'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 ${
                activeNavTab === 'services' ? 'text-[#B76E79]' : 'text-stone-500'
              }`}
            />
            <span>Services</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('our-salon-branches')}
            className={`tap-scale flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              activeNavTab === 'branches'
                ? 'text-[#160824] font-extrabold bg-[#D6B77A]/15'
                : 'hover:text-[#160824]'
            }`}
          >
            <MapPin
              className={`w-4 h-4 ${
                activeNavTab === 'branches' ? 'text-[#8C4A56]' : 'text-stone-500'
              }`}
            />
            <span>2 Branches</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('booking')}
            className={`tap-scale flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              activeNavTab === 'booking'
                ? 'text-[#160824] font-extrabold bg-[#D6B77A]/15'
                : 'hover:text-[#160824]'
            }`}
          >
            <CalendarIcon
              className={`w-4 h-4 ${
                activeNavTab === 'booking' ? 'text-[#8C4A56]' : 'text-stone-500'
              }`}
            />
            <span>Book Slot</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveNavTab('cart');
              setCartDrawerOpen((v) => !v);
            }}
            className={`tap-scale flex flex-col items-center justify-center gap-0.5 transition-colors relative cursor-pointer ${
              activeNavTab === 'cart' || cartDrawerOpen
                ? 'text-[#160824] font-extrabold bg-[#D6B77A]/15'
                : 'hover:text-[#160824]'
            }`}
          >
            <ShoppingBag
              className={`w-4 h-4 ${
                activeNavTab === 'cart' || cartDrawerOpen
                  ? 'text-[#8C4A56]'
                  : 'text-stone-500'
              }`}
            />
            <span>Cart ({totalCartItems})</span>
          </button>
        </div>
      </nav>

      {/* =====================================================================
          8. SERVICE DETAILS VIEW MODAL / BOTTOM SHEET ("View details >")
      ===================================================================== */}
      {selectedServiceDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedServiceDetail(null)}
        >
          <div
            className="w-full max-w-lg glass-modal-sheet rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Service Hero Image */}
            <div className="relative aspect-[16/10] w-full bg-stone-900 shrink-0">
              <SmartImage
                src={selectedServiceDetail.image}
                alt={selectedServiceDetail.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedServiceDetail(null)}
                aria-label="Close service details"
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              {selectedServiceDetail.makeupSubCategory && (
                <span className="absolute bottom-3 left-3.5 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-[#D6B77A] text-xs font-semibold">
                  {selectedServiceDetail.makeupSubCategory}
                </span>
              )}
            </div>

            {/* Details Content */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-2 border-b border-[#E6DAC8]/60 pb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-[#160824]">
                  {selectedServiceDetail.name}
                </h3>

                <div className="flex items-center flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-stone-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{(selectedServiceDetail.rating ?? 4.9).toFixed(1)}</span>
                    <span className="text-stone-500 font-normal">
                      ({selectedServiceDetail.reviewCount ?? 48} reviews)
                    </span>
                  </span>
                  <span>•</span>
                  <span className="font-mono-num text-base font-bold text-[#160824]">
                    ₹{(selectedServiceDetail.price ?? 999).toLocaleString('en-IN')}
                  </span>
                  {selectedServiceDetail.originalPrice && (
                    <span className="font-mono-num text-xs text-stone-400 line-through">
                      ₹{selectedServiceDetail.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span>•</span>
                  <span className="text-stone-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedServiceDetail.duration || '1 hr 15 mins'}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
                  {selectedServiceDetail.description}
                </p>
              </div>

              {/* What's Included */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-[#160824] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>What&apos;s Included</span>
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
                  {(
                    selectedServiceDetail.whatsIncluded ||
                    selectedServiceDetail.highlights || [
                      'Complete skin preparation, primer & colour correction',
                      'Long-wear photo-ready makeup base customized to your skin tone',
                      'Professional eye makeup, hairstyling & outfit/saree draping',
                    ]
                  ).map((inc, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional Information */}
              <div className="p-3.5 rounded-2xl glass-card space-y-1.5">
                <h4 className="text-xs font-bold text-[#160824] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#8C4A56]" />
                  <span>Additional Information</span>
                </h4>
                <ul className="space-y-1 text-xs text-stone-600">
                  {(
                    selectedServiceDetail.additionalInfo || [
                      `Available at your venue/home in ${locality} or at our Kaggadaspura & Electronic City branches`,
                      'Performed by Certified Eden Roses Artists',
                    ]
                  ).map((info, i) => (
                    <li key={i}>• {info}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sticky Bottom Action in Modal */}
            <div className="sticky bottom-0 luxury-glass border-t border-white/85 p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-stone-500 block">Service Price</span>
                <span className="font-mono-num text-lg font-bold text-[#160824]">
                  ₹{(selectedServiceDetail.price ?? 999).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {getItemQuantity(selectedServiceDetail.id) === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddOrIncrement(selectedServiceDetail);
                      setSelectedServiceDetail(null);
                    }}
                    className="px-5 py-3 rounded-xl glass-card text-[#160824] text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <div className="flex items-center gap-2 glass-card text-[#160824] px-3 py-2 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(selectedServiceDetail.id, -1)
                      }
                      className="w-6 h-6 rounded-md hover:bg-black/5 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono-num text-xs font-bold px-1">
                      {getItemQuantity(selectedServiceDetail.id)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(selectedServiceDetail.id, 1)
                      }
                      className="w-6 h-6 rounded-md hover:bg-black/5 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (getItemQuantity(selectedServiceDetail.id) === 0) {
                      handleAddOrIncrement(selectedServiceDetail);
                    }
                    setSelectedServiceDetail(null);
                    setBookingStep(2);
                    scrollToSection('booking');
                  }}
                  className="px-5 py-3 rounded-xl glass-dark-royal text-[#D6B77A] text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Book Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          LOCATION SELECTOR MODAL (Configurable Bangalore Service Areas)
      ===================================================================== */}
      {locationModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setLocationModalOpen(false)}
        >
          <div
            className="w-full max-w-md glass-modal-sheet rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6DAC8]/60 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#160824]">
                  Select Service Location
                </h3>
                <p className="text-xs text-stone-600">
                  On-venue bridal &amp; styling service across Bangalore
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="p-1.5 rounded-full glass-card text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#8C4A56] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                placeholder="Search Indiranagar, Varthur, Yelahanka, Kaggadasapura..."
                className="w-full h-10 pl-9 pr-3.5 rounded-xl glass-input text-xs sm:text-sm"
              />
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
              {filteredLocalities.map((loc) => {
                const isSelected = locality === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setLocality(loc);
                      setLocationModalOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'glass-dark-royal text-[#D6B77A] font-bold'
                        : 'glass-card text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#B76E79]" />
                      <div>
                        <p className="text-xs sm:text-sm">{loc}</p>
                        <p
                          className={`text-[10px] ${
                            isSelected ? 'text-white/70' : 'text-stone-500'
                          }`}
                        >
                          Bengaluru, Karnataka, India
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#D6B77A]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAKEUP & STYLING CATEGORIES QUICK MODAL (Frosted Glass Sheet)
      ===================================================================== */}
      {showLandingCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowLandingCategoryModal(false)}
        >
          <div
            className="w-full max-w-md glass-modal-sheet rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6DAC8]/60 pb-3">
              <h3 className="text-lg font-bold text-[#160824]">
                Makeup &amp; Styling
              </h3>
              <button
                type="button"
                onClick={() => setShowLandingCategoryModal(false)}
                className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-wider text-[#8C4A56]">
                Makeup &amp; Women Styling
              </p>
              <div className="grid grid-cols-3 gap-3">
                {MAKEUP_STYLING_LANDING_CATEGORIES.filter(
                  (c) => c.group === 'MAKEUP'
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectLandingCategory(cat)}
                    className="flex flex-col items-center text-center cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden glass-card p-1">
                      <SmartImage
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <span className="text-xs font-medium text-stone-800 mt-1.5 leading-tight">
                      {cat.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#E6DAC8]/60">
              <p className="text-[11px] font-bold tracking-wider text-[#8C4A56]">
                Men Salon
              </p>
              <div className="grid grid-cols-3 gap-3">
                {MAKEUP_STYLING_LANDING_CATEGORIES.filter(
                  (c) => c.group === 'MEN SALON'
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectLandingCategory(cat)}
                    className="flex flex-col items-center text-center cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden glass-card p-1">
                      <SmartImage
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <span className="text-xs font-medium text-stone-800 mt-1.5 leading-tight">
                      {cat.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CART TOAST NOTIFICATION */}
      {cartToast && (
        <div className="fixed top-20 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto glass-dark-royal text-[#F5E2B8] border border-[#D6B77A] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-bold">
            <span>{cartToast}</span>
            <button
              type="button"
              onClick={() => {
                setCartToast(null);
                setCartDrawerOpen(true);
              }}
              className="px-3 py-1 rounded-xl bg-[#D6B77A] text-[#160824] font-extrabold text-xs cursor-pointer"
            >
              View Cart &amp; Book ({totalCartItems})
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          SLIDE-OVER CART & INSTANT 1-STEP EXPRESS CHECKOUT DRAWER
      ===================================================================== */}
      {cartDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex justify-end"
          onClick={() => setCartDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md glass-modal-sheet h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6DAC8]/60 pb-3.5">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#160824]">
                    Your Booking Cart ({totalCartItems})
                  </h3>
                  <p className="text-xs text-stone-600">
                    Add multiple items &amp; confirm booking right here
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-2 rounded-xl glass-card text-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="py-8 text-center space-y-3 bg-[#FAF7F2] rounded-2xl p-4 border border-dashed border-[#D6B77A]">
                  <ShoppingBag className="w-9 h-9 text-[#8C4A56] mx-auto" />
                  <p className="text-sm font-bold text-[#160824]">Your booking cart is empty</p>
                  <p className="text-xs text-stone-600">
                    Pick a service from the quick dropdown below or tap &ldquo;+ Add to Cart&rdquo; on any card.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl glass-card flex items-center justify-between gap-2 border border-[#D6B77A]/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-[#160824] truncate">
                          {item.name}
                        </p>
                        <p className="font-mono-num text-xs text-stone-600">
                          ₹{item.price} × {item.quantity} ={' '}
                          <strong className="text-[#160824]">₹{item.price * item.quantity}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-stone-300 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono-num text-xs font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-lg glass-dark-royal text-[#D6B77A] flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Add Another Service right inside Cart Drawer */}
              <div>
                <select
                  value={quickAddServiceId}
                  onChange={(e) => {
                    const srvId = e.target.value;
                    setQuickAddServiceId('');
                    if (!srvId) return;
                    const found = enrichedServices.find((s) => s.id === srvId);
                    if (found) handleAddOrIncrement(found);
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl glass-input text-xs font-semibold text-[#160824] bg-white/95"
                >
                  <option value="">+ Add Another Service to Cart...</option>
                  {enrichedServices
                    .filter((s) => s.price !== null)
                    .map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        + {srv.name} — ₹{srv.price}
                      </option>
                    ))}
                </select>
              </div>

              {/* Express 1-Step Checkout Form inside Cart Drawer */}
              <form onSubmit={handleConfirmBookingSubmit} className="space-y-3 pt-2 border-t border-[#E6DAC8]/60 text-xs">
                <p className="font-bold text-xs uppercase tracking-wider text-[#8C4A56]">
                  Fast 1-Step Booking Details
                </p>

                {formError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Date *</label>
                    <input
                      type="date"
                      min={todayISO}
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value) setSelectedDate(e.target.value);
                      }}
                      className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl glass-input font-mono-num font-bold text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Time Slot *</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl glass-input font-mono-num font-bold text-xs bg-white"
                    >
                      {selectedDateSlots.map((slot) => (
                        <option key={slot.time} value={slot.time} disabled={!slot.available}>
                          {slot.time} {!slot.available ? '(Full)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Select Area / Branch *
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-xl glass-input font-semibold text-xs text-stone-900 bg-white"
                  >
                    {availableLocalities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl glass-input text-xs font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Mobile / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setWhatsapp(e.target.value);
                      }}
                      placeholder="10-digit Phone"
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl glass-input font-mono-num font-bold text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Address / Landmark (Optional for Salon Walk-in)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={`Flat / House / Street in ${locality}`}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-xl glass-input text-xs bg-white"
                  />
                </div>

                {/* Mandatory ₹99 Advance Payment Block inside Cart Drawer */}
                <div className="p-3.5 rounded-2xl bg-[#160824] text-[#FFF8EF] border border-[#D6B77A] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/15 pb-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D6B77A] block">
                        Mandatory Advance Payment
                      </span>
                      <span className="text-xs font-bold text-white">
                        Pay ₹99 via QR / UPI to Book
                      </span>
                    </div>
                    <span className="font-mono-num text-xl font-extrabold text-[#F5E2B8]">
                      ₹99
                    </span>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl">
                    <img
                      src={OFFICIAL_UPI_QR_IMAGE}
                      alt="UPI QR Code"
                      className="w-24 h-28 object-contain rounded-lg bg-white p-1 border border-[#D6B77A] shrink-0"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#F5E2B8]">
                        Subha (SBI)
                      </p>
                      <p className="font-mono-num text-[11px] text-white/90 break-all">
                        {OFFICIAL_UPI_ID}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyUpiId}
                          className="px-2 py-1 rounded-md bg-[#D6B77A] text-[#160824] text-[10px] font-extrabold cursor-pointer"
                        >
                          {copiedUpi ? '✓ Copied' : 'Copy UPI'}
                        </button>
                        <a
                          href={OFFICIAL_UPI_PAY_LINK}
                          className="px-2 py-1 rounded-md bg-emerald-500 text-white text-[10px] font-extrabold"
                        >
                          Open UPI App
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Proof Type Tabs */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          'UTR Number',
                          'Reference Number',
                          'Transaction ID',
                        ] as const
                      ).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPaymentProofType(type)}
                          className={`py-1 px-1.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                            paymentProofType === type
                              ? 'bg-[#D6B77A] text-[#160824] border-[#D6B77A]'
                              : 'bg-white/10 text-white/75 border-white/20'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder={`Enter ${paymentProofType} *`}
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white text-stone-900 font-mono-num text-xs font-bold placeholder:text-stone-400"
                    />
                  </div>

                  {/* Screenshot Upload */}
                  <div className="space-y-1.5">
                    <label className="cursor-pointer w-full py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-[#D6B77A]/50 text-[#F5E2B8] text-xs font-bold flex items-center justify-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#D6B77A]" />
                      <span>
                        {isUploadingScreenshot
                          ? 'Uploading Screenshot...'
                          : paymentScreenshot
                          ? '✓ Screenshot Attached (Tap to Change)'
                          : 'Upload ₹99 Payment Screenshot'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                    {paymentScreenshot && (
                      <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg">
                        <img
                          src={paymentScreenshot}
                          alt="Payment Screenshot"
                          className="w-10 h-10 rounded object-cover"
                        />
                        <span className="text-[10px] text-emerald-300 font-bold flex-1">
                          Screenshot ready for Admin Panel verification
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E6DAC8]/60 space-y-2">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Total Bill ({totalCartItems} items)</span>
                    <span className="font-mono-num font-bold text-[#160824]">
                      ₹{netPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-xs text-emerald-800">
                    <span>Mandatory Advance Paid Now</span>
                    <span className="font-mono-num">₹99</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#160824]">
                    <span>Balance Payable at Appointment</span>
                    <span className="font-mono-num text-base">
                      ₹{remainingAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingScreenshot}
                    className="tap-scale w-full py-3.5 rounded-xl glass-dark-royal text-[#D6B77A] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D6B77A]" />
                    <span>
                      {isSubmitting
                        ? 'Sending to Admin Panel...'
                        : 'Submit ₹99 Payment & Verify Booking'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-3xl w-full glass-dark-royal rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
              <SmartImage
                src={lightboxImage.url}
                alt={lightboxImage.alt}
                fit="contain"
                className="w-full h-full max-h-[70vh]"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
              <div>
                <p className="text-xs text-[#D6B77A] font-medium">
                  {lightboxImage.galleryCategory || lightboxImage.category}
                </p>
                <h4 className="font-display text-xl font-bold">{lightboxImage.alt}</h4>
                <p className="text-xs text-white/75 mt-0.5">{lightboxImage.description}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLightboxImage(null);
                  scrollToSection('booking');
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E6C98F] via-[#D6B77A] to-[#C29B56] text-[#160824] text-xs font-bold shrink-0 cursor-pointer"
              >
                Book Similar Look
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME PAYMENT VERIFICATION WAITING SCREEN & APPROVED CONFIRMATION MODAL */}
      {liveConfirmedBooking && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full glass-modal-sheet rounded-3xl p-6 sm:p-8 space-y-6 my-8 border-2 border-[#D6B77A]">
            {liveConfirmedBooking.paymentStatus === 'Pending Verification' ||
            liveConfirmedBooking.status === 'Pending Verification' ? (
              /* WAITING FOR ADMIN VERIFICATION LOADING STATE */
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-500 text-amber-700 flex items-center justify-center mx-auto relative">
                  <div className="w-12 h-12 rounded-full border-3 border-amber-600 border-t-transparent animate-spin" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold">
                  ⏳ Please Wait · Admin Verification in Progress
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#160824]">
                  Verifying Your ₹99 Advance Payment...
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-amber-50/90 p-3.5 rounded-2xl border border-amber-200">
                  <strong>कृपया प्रतीक्षा करें (Please Wait):</strong> आपका ₹99 एडवांस पेमेंट और डिटेल्स{' '}
                  <strong>Admin Panel</strong> में भेज दिए गए हैं। जैसे ही एडमिन आपका पेमेंट वेरीफाई और अप्रूव करेंगे, यह पेज अपने आप{' '}
                  <strong className="text-emerald-700">
                    &ldquo;Payment is Verified &amp; Approved by Admin Panel&rdquo;
                  </strong>{' '}
                  हो जाएगा!
                </p>
                <p className="font-mono-num text-sm font-bold text-[#D6B77A] glass-dark-royal inline-block px-4 py-1.5 rounded-xl">
                  Booking ID: {liveConfirmedBooking.id}
                </p>
              </div>
            ) : liveConfirmedBooking.paymentStatus === 'Rejected' ||
              liveConfirmedBooking.status === 'Cancelled' ? (
              /* PAYMENT REJECTED STATE */
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 text-red-700 flex items-center justify-center mx-auto">
                  <X className="w-8 h-8" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold">
                  Payment Verification Declined
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-red-900">
                  Payment Not Verified by Admin
                </h3>
                <p className="text-xs text-stone-600">
                  Your payment proof could not be verified. Please contact us on WhatsApp or call {primaryPhoneDisplay}.
                </p>
              </div>
            ) : (
              /* PAYMENT VERIFIED & APPROVED BY ADMIN PANEL STATE */
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-700 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-extrabold">
                  ✓ Payment is Verified &amp; Approved by Admin Panel
                </span>
                <h3 className="font-display text-3xl font-bold text-[#160824]">
                  Booking Approved &amp; Confirmed!
                </h3>
                <p className="text-xs text-emerald-800 font-semibold">
                  आपका ₹99 एडवांस पेमेंट एडमिन पैनल द्वारा वेरीफाई और अप्रूव कर दिया गया है। आपकी बुकिंग कन्फर्म हो गई है!
                </p>
                <p className="font-mono-num text-sm font-bold text-[#D6B77A] glass-dark-royal inline-block px-4 py-1.5 rounded-xl">
                  Booking ID: {liveConfirmedBooking.id}
                </p>
              </div>
            )}

            <div className="glass-card rounded-2xl p-5 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Customer Name</span>
                <span className="font-semibold text-[#160824]">
                  {liveConfirmedBooking.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Date &amp; Time</span>
                <span className="font-mono-num font-semibold text-[#160824]">
                  {liveConfirmedBooking.date} · {liveConfirmedBooking.time}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-600 shrink-0">Service Area</span>
                <span className="font-medium text-[#160824] text-right">
                  {liveConfirmedBooking.address}
                </span>
              </div>

              {liveConfirmedBooking.utrNumber && (
                <div className="flex justify-between gap-4 pt-1 border-t border-[#E6DAC8]/50">
                  <span className="text-stone-600">
                    {liveConfirmedBooking.paymentProofType || 'UTR / Ref ID'}
                  </span>
                  <span className="font-mono-num font-bold text-[#160824]">
                    {liveConfirmedBooking.utrNumber}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <span className="text-stone-600">Payment Verification Status</span>
                <span
                  className={`font-bold ${
                    liveConfirmedBooking.paymentStatus === 'Pending Verification' ||
                    liveConfirmedBooking.status === 'Pending Verification'
                      ? 'text-amber-700'
                      : liveConfirmedBooking.paymentStatus === 'Rejected'
                      ? 'text-red-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {liveConfirmedBooking.paymentStatus === 'Pending Verification' ||
                  liveConfirmedBooking.status === 'Pending Verification'
                    ? '⏳ Waiting for Admin Approval'
                    : liveConfirmedBooking.paymentStatus === 'Rejected'
                    ? '❌ Declined'
                    : '✅ Payment Verified & Approved'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E6DAC8]/60">
                <span className="text-xs font-semibold text-[#8C4A56] block mb-1.5">
                  Booked Services:
                </span>
                {liveConfirmedBooking.services.map((s) => (
                  <div key={s.id} className="flex justify-between text-xs py-0.5">
                    <span>
                      {s.name} × {s.quantity}
                    </span>
                    <span className="font-mono-num font-semibold">
                      ₹{s.price * s.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E6DAC8]/60 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-600">Total Bill</span>
                  <span className="font-mono-num font-bold">
                    ₹{liveConfirmedBooking.itemsTotal - liveConfirmedBooking.discount}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Mandatory Advance Paid</span>
                  <span className="font-mono-num">
                    ₹{liveConfirmedBooking.advancePaid}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base text-[#160824] pt-1">
                  <span>Balance Payable at Appointment</span>
                  <span className="font-mono-num">
                    ₹{liveConfirmedBooking.amountToCollect}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href={buildWhatsAppBookingUrl(liveConfirmedBooking, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Send Booking &amp; Payment Details on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('eden_roses_active_verification_booking_id');
                  } catch {
                    // ignore
                  }
                  setConfirmedBooking(null);
                  setShowBookingDetailsModal(false);
                }}
                className="w-full py-3 rounded-xl glass-dark-royal text-[#D6B77A] text-xs font-semibold cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
