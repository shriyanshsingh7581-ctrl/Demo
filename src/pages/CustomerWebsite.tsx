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
  getGalleryImages,
  getServicesCatalog,
  getTodayISO,
  saveBooking,
  saveCustomerLead,
  subscribeToDataUpdates,
} from '../services/bookingStorage';

// Configurable Service Areas in Bangalore (Editable / extensible via Business Settings)
const BENGALURU_LOCALITIES = [
  'Indiranagar',
  'Varthur',
  'Yelahanka',
  'Kaggadasapura',
  'C V Raman Nagar',
  'Nagavarapalya',
  'Whitefield',
  'Brookefield',
  'Jayanagar',
  'Koramangala',
  'HSR Layout',
  'Marathahalli',
  'Domlur',
  'Banaswadi',
  'Hebbal',
  'Malleswaram',
  'Electronic City',
  'Other Bengaluru Locality',
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
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.08.jpeg',
    targetSubCategory: 'Party Makeup',
    badge: 'Popular',
  },
  {
    id: 'Saree Draping',
    title: 'Saree Draping',
    group: 'MAKEUP',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.07-2.jpeg',
    targetSubCategory: 'Saree Draping',
  },
  {
    id: 'Hair Styling for Women',
    title: 'Hair Styling for Women',
    group: 'MAKEUP',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.26.53.jpeg',
    targetSubCategory: 'Hair Styling',
  },
  {
    id: 'Salon for Women',
    title: 'Salon for Women',
    group: 'MAKEUP',
    image:
      'https://edenroses.in/wp-content/uploads/2024/12/Untitled-design-2024-12-28T120023.379.png',
    targetSubCategory: 'Salon for Women',
  },
  {
    id: 'Salon for Men',
    title: 'Salon for Men',
    group: 'MEN SALON',
    image: 'https://edenroses.in/wp-content/uploads/2021/03/haircut.jpg',
    targetSubCategory: 'Salon for Men',
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
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.34.17.jpeg',
  },
  {
    id: 'Engagement Makeup',
    label: 'Engagement Makeup',
    shortLabel: 'Engagement Makeup',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.32.28.jpeg',
  },
  {
    id: 'Bridal Makeup',
    label: 'Bridal Makeup',
    shortLabel: 'Bridal Makeup',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.07.jpeg',
  },
  {
    id: 'Wedding Guest Makeup',
    label: 'Wedding Guest Makeup',
    shortLabel: 'Wedding Guest Makeup',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.24.57.jpeg',
  },
  {
    id: 'Saree Draping',
    label: 'Saree Draping',
    shortLabel: 'Saree Draping',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.07-2.jpeg',
  },
  {
    id: 'Hair Styling',
    label: 'Hair Styling',
    shortLabel: 'Hair Styling',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.26.54.jpeg',
  },
  {
    id: 'Packages',
    label: 'Packages',
    shortLabel: 'Packages',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.10.jpeg',
  },
  {
    id: 'Add-ons',
    label: 'Add-ons',
    shortLabel: 'Add-ons',
    image:
      'https://edenroses.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-11-at-05.30.08-2.jpeg',
  },
];

const ALL_SERVICE_SECTIONS_ORDER: {
  id: MakeupSubCategory;
  title: string;
  subtitle: string;
}[] = [
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
    subtitle: 'Signature Muhurtham & Reception bridal artistry by Subba Lakshmi',
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

  // Gallery & Hero States
  const [activeGalleryCategory, setActiveGalleryCategory] =
    useState<GalleryFilterCategory>('All');
  const [lightboxImage, setLightboxImage] = useState<EdenRoseImage | null>(null);
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  // Cart & Package Selection State
  const [cart, setCart] = useState<BookingServiceItem[]>([
    {
      id: 'pkg-party-makeup',
      name: 'Basic Party Makeup',
      price: 1599,
      quantity: 1,
      category: 'Bridal & Makeup Packages',
    },
  ]);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(500);

  // Interactive Monthly Booking Calendar State
  const todayISO = getTodayISO();
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return formatDateISO(d);
  });
  const [selectedTime, setSelectedTime] = useState<string>('08:00 AM');

  // Multi-Step Booking Form State
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('Indiranagar');
  const [eventType, setEventType] = useState<EventType>('Wedding');
  const [specialNotes, setSpecialNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);

  // Contact Inquiry Quick State
  const [contactSent, setContactSent] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryLocality, setInquiryLocality] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  // Dynamic Service Areas combining defaults + admin configured serviceArea
  const availableLocalities = useMemo(() => {
    const customFromSettings = (settings.serviceArea || '')
      .split(',')
      .map((s) => s.replace(/& All Across Bengaluru/i, '').trim())
      .filter((s) => s.length > 2 && s.length < 35);
    return Array.from(new Set([...BENGALURU_LOCALITIES, ...customFromSettings]));
  }, [settings.serviceArea]);

  const filteredLocalities = useMemo(() => {
    if (!locationSearchQuery.trim()) return availableLocalities;
    const q = locationSearchQuery.toLowerCase();
    return availableLocalities.filter((loc) => loc.toLowerCase().includes(q));
  }, [availableLocalities, locationSearchQuery]);

  // Enrich services with inferred subCategory
  const enrichedServices = useMemo(() => {
    return services.map((s) => ({
      ...s,
      makeupSubCategory: inferMakeupSubCategory(s),
    }));
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

  // Cart Calculations
  const itemsSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const effectiveDiscount = Math.min(discountAmount, itemsSubtotal);
  const netPayable = Math.max(0, itemsSubtotal - effectiveDiscount);
  const effectiveAdvance = Math.min(Math.max(0, advancePayment), netPayable);
  const remainingAmount = Math.max(0, netPayable - effectiveAdvance);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cart Handlers
  const getItemQuantity = (serviceId: string): number => {
    return cart.find((item) => item.id === serviceId)?.quantity || 0;
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

  // Smooth jump to a specific Makeup Sub-Category section
  const jumpToCategorySection = (subCategory: MakeupSubCategory) => {
    setActiveSubCategory(subCategory);
    setFloatingMenuOpen(false);
    setShowLandingCategoryModal(false);
    const slug = `cat-section-${subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    setTimeout(() => {
      const el = document.getElementById(slug) || document.getElementById('makeup-artist-page');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Handle clicking one of the 5 "Makeup & Styling" Landing Categories
  const handleSelectLandingCategory = (card: LandingCategoryCard) => {
    setActiveLandingCategory(card.id);
    setShowLandingCategoryModal(false);
    if (card.id === 'Makeup & Styling for Women') {
      setActiveSubCategory('All');
      const el = document.getElementById('makeup-artist-page');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleConfirmBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cart.length === 0) {
      setFormError('Please select at least one makeup or styling service.');
      setBookingStep(1);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setFormError('Please select your preferred appointment date and time slot.');
      setBookingStep(2);
      return;
    }

    const slotCheck = selectedDateSlots.find((s) => s.time === selectedTime);
    if (!slotCheck || !slotCheck.available) {
      setFormError('This time slot was just booked. Please select an available slot.');
      setBookingStep(2);
      return;
    }

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setFormError('Please enter your Full Name, Phone Number, and Complete Address.');
      return;
    }

    setIsSubmitting(true);
    const fullAddress = address.toLowerCase().includes(locality.toLowerCase())
      ? address.trim()
      : `${address.trim()}, ${locality}, Bengaluru`;

    const result = await saveBooking({
      customerName: customerName.trim(),
      phone: phone.trim(),
      whatsapp: (whatsapp.trim() || phone.trim()).replace(/[^0-9]/g, ''),
      address: fullAddress,
      locality,
      eventType,
      services: cart,
      date: selectedDate,
      time: selectedTime,
      itemsTotal: itemsSubtotal,
      discount: effectiveDiscount,
      advancePaid: effectiveAdvance,
      amountToCollect: remainingAmount,
      notes: specialNotes.trim(),
      status: 'Confirmed',
      bookingSource: 'Customer Website',
      assignedTeam: [],
      badgeType: 'VISIT',
    });

    setIsSubmitting(false);

    if (!result.success || !result.booking) {
      setFormError(result.error || 'Could not confirm booking. Please try another slot.');
      return;
    }

    setConfirmedBooking(result.booking);
  };

  const cleanWhatsappNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1619] relative pb-32 lg:pb-0 selection:bg-[#160824] selection:text-[#D6B77A]">
      {/* 0. ROYAL PLUM & CHAMPAGNE GOLD BRAND BAR */}
      <div className="bg-[#160824] text-[#F5E2B8] border-b border-[#D6B77A]/35 text-[11px] sm:text-xs">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D6B77A] shrink-0 shadow-xs">
              <SmartImage
                src={settings.logoUrl}
                alt={settings.makeupBrand}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-serif-luxury text-xs sm:text-sm font-bold tracking-wide text-[#F5E2B8] truncate">
              {settings.makeupBrand}
            </span>
            <span className="text-[#D6B77A]/60" aria-hidden="true">
              ·
            </span>
            <span className="text-[#D6B77A] font-medium truncate">
              By {settings.artistName}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[#F5E2B8] font-mono-num text-[11px] font-semibold transition-colors"
            >
              <Phone className="w-3 h-3 text-[#D6B77A]" />
              <span>{settings.phonePrimary}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 1. MOBILE-FIRST LUXURY STICKY HEADER (Location Selector + Search Bar + Cart Icon — Reference Video 0:00-0:05) */}
      <header className="sticky top-0 z-40 luxury-glass border-b border-[#E6DAC8]/90 shadow-[0_6px_24px_-10px_rgba(22,8,36,0.08)]">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-2.5 pb-3 space-y-2.5">
          {/* Top Row: Location Selector (Left) + Desktop Navigation (Center) + Cart & Menu (Right) */}
          <div className="flex items-center justify-between gap-2">
            {/* Location Selector Button matching Reference Video */}
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="tap-scale flex items-center gap-2.5 text-left group min-w-0 max-w-[68%] sm:max-w-xs cursor-pointer py-0.5"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#160824] to-[#2D1245] border border-[#D6B77A]/60 flex items-center justify-center shrink-0 shadow-xs">
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
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-stone-700">
              <button
                type="button"
                onClick={() => scrollToSection('makeup-styling-landing')}
                className="hover:text-[#160824] hover:underline underline-offset-4 cursor-pointer"
              >
                Makeup &amp; Styling
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('makeup-artist-page')}
                className="hover:text-[#160824] hover:underline underline-offset-4 cursor-pointer"
              >
                Makeup Artist
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('booking')}
                className="hover:text-[#160824] hover:underline underline-offset-4 cursor-pointer"
              >
                Book Slot
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('gallery')}
                className="hover:text-[#160824] hover:underline underline-offset-4 cursor-pointer"
              >
                Bridal Portfolio
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="hover:text-[#160824] hover:underline underline-offset-4 cursor-pointer"
              >
                About Artist
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="hover:text-[#160824] hover:underline underline-offset-4 cursor-pointer"
              >
                Studio Address
              </button>
            </nav>

            {/* Right Action Cluster: Categories Sheet Trigger + Cart Icon + Mobile Menu */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowLandingCategoryModal(true)}
                className="tap-scale hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5EFE6] hover:bg-[#EBE1D2] text-[#160824] text-xs font-semibold transition-colors cursor-pointer"
              >
                <ListFilter className="w-3.5 h-3.5 text-[#8C4A56]" />
                <span>Categories</span>
              </button>

              {/* Cart Icon Button matching Reference Video with Luxury Accent */}
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                aria-label="Open Booking Cart"
                className="tap-scale relative h-10 px-3 sm:px-3.5 rounded-xl border border-[#D6B77A]/60 bg-[#160824] text-[#F5E2B8] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
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
                className="tap-scale lg:hidden w-10 h-10 rounded-xl border border-[#E6DAC8] bg-white text-[#160824] flex items-center justify-center cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Search Bar Row: "What service do you need?" (Matches Reference Video 0:00 - 0:04) */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
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
              className="w-full h-11 pl-10 pr-24 rounded-2xl border border-[#DFD2BF] bg-white text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#160824] focus:ring-2 focus:ring-[#D6B77A]/25 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-16 p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
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
              className="tap-scale absolute right-1.5 h-8 px-3 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#D6B77A] text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <span>Search</span>
            </button>
          </div>

          {/* 1-Tap Mobile Quick Search Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <span className="text-[10px] font-semibold text-stone-400 shrink-0 pr-1">
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
                  className={`tap-scale px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#160824] text-[#D6B77A]'
                      : 'bg-[#F5EFE6]/80 hover:bg-[#EBE1D2] text-stone-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Quick Navigation Sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFFDF9] border-t border-[#E6DAC8] px-4 py-4 space-y-3 shadow-xl">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Makeup & Styling', id: 'makeup-styling-landing' },
                { label: 'Makeup Artist Menu', id: 'makeup-artist-page' },
                { label: 'Book Date & Slot', id: 'booking' },
                { label: 'Bridal Portfolio (40+)', id: 'gallery' },
                { label: 'Meet Subba Lakshmi', id: 'about' },
                { label: 'Studio Address', id: 'contact' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#160824] bg-[#F5EFE6] hover:bg-[#EBE1D2] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          2. MAKEUP & STYLING LANDING PAGE SECTION (Matches Reference Video 0:03 - 0:10)
          Shows ONLY the 5 required Makeup & Styling categories:
          1. Makeup & Styling for Women
          2. Saree Draping
          3. Hair Styling for Women
          4. Salon for Women
          5. Salon for Men
      ===================================================================== */}
      <section
        id="makeup-styling-landing"
        className="pt-4 pb-2 sm:py-6"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="premium-surface rounded-3xl p-4 sm:p-6 space-y-5">
            {/* Section Title Row */}
            <div className="flex items-center justify-between gap-2 border-b border-[#EFE6D8] pb-3.5">
              <div>
                <p className="text-[11px] font-semibold text-[#8C4A56] tracking-wide">
                  Doorstep &amp; Studio Artistry · {locality}, Bangalore
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#160824] tracking-tight">
                  Makeup &amp; Styling
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSubCategory('All');
                  scrollToSection('makeup-artist-page');
                }}
                className="tap-scale px-3 py-1.5 rounded-xl bg-[#F5EFE6] hover:bg-[#EBE1D2] text-[#160824] text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>All Services ({services.length})</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8C4A56]" />
              </button>
            </div>

            {/* Group 1: MAKEUP (4 Categories on Mobile, 5 on Desktop) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-stone-600">
                  Makeup &amp; Women Styling
                </p>
                <span className="text-[11px] text-stone-400">Tap any category to explore</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-4">
                {MAKEUP_STYLING_LANDING_CATEGORIES.filter(
                  (c) => c.group === 'MAKEUP'
                ).map((cat) => {
                  const isSelected = activeLandingCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectLandingCategory(cat)}
                      className="tap-scale group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                    >
                      <div
                        className={`relative w-full aspect-square max-w-[100px] rounded-2xl overflow-hidden bg-[#F8F3EC] border transition-all p-1 ${
                          isSelected
                            ? 'border-[#160824] ring-2 ring-[#D6B77A]/60 shadow-md'
                            : 'border-[#E6DAC8] group-hover:border-[#B76E79]'
                        }`}
                      >
                        <SmartImage
                          src={cat.image}
                          alt={cat.title}
                          eager
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <span
                        className={`text-[11px] sm:text-xs mt-2 leading-tight line-clamp-2 max-w-[100px] ${
                          isSelected
                            ? 'font-bold text-[#160824]'
                            : 'font-semibold text-stone-800'
                        }`}
                      >
                        {cat.title}
                      </span>
                    </button>
                  );
                })}

                {/* Group 2 on Desktop same row */}
                <div className="hidden sm:flex flex-col items-center text-center">
                  {MAKEUP_STYLING_LANDING_CATEGORIES.filter(
                    (c) => c.group === 'MEN SALON'
                  ).map((cat) => {
                    const isSelected = activeLandingCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectLandingCategory(cat)}
                        className="tap-scale group flex flex-col items-center text-center w-full cursor-pointer focus:outline-none"
                      >
                        <div
                          className={`relative w-full aspect-square max-w-[100px] rounded-2xl overflow-hidden bg-[#F8F3EC] border transition-all p-1 ${
                            isSelected
                              ? 'border-[#160824] ring-2 ring-[#D6B77A]/60 shadow-md'
                              : 'border-[#E6DAC8] group-hover:border-[#B76E79]'
                          }`}
                        >
                          <SmartImage
                            src={cat.image}
                            alt={cat.title}
                            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <span
                          className={`text-[11px] sm:text-xs mt-2 leading-tight line-clamp-2 max-w-[100px] ${
                            isSelected
                              ? 'font-bold text-[#160824]'
                              : 'font-semibold text-stone-800'
                          }`}
                        >
                          {cat.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Group 2: MEN SALON (Shown on Mobile matching Reference Video 0:06) */}
            <div className="sm:hidden space-y-2.5 pt-2 border-t border-[#F2ECE1]">
              <p className="text-xs font-bold text-stone-600">
                Men Salon &amp; Grooming
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {MAKEUP_STYLING_LANDING_CATEGORIES.filter(
                  (c) => c.group === 'MEN SALON'
                ).map((cat) => {
                  const isSelected = activeLandingCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectLandingCategory(cat)}
                      className="tap-scale group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                    >
                      <div
                        className={`relative w-full aspect-square max-w-[100px] rounded-2xl overflow-hidden bg-[#F8F3EC] border transition-all p-1 ${
                          isSelected
                            ? 'border-[#160824] ring-2 ring-[#D6B77A]/60 shadow-md'
                            : 'border-[#E6DAC8] group-hover:border-[#B76E79]'
                        }`}
                      >
                        <SmartImage
                          src={cat.image}
                          alt={cat.title}
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-stone-800 mt-1.5 leading-tight line-clamp-2">
                        {cat.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3, 4, 5, 6, 7. MAKEUP ARTIST DEDICATED CATEGORY PAGE & SERVICE LISTINGS
          Matches Reference Video 0:11 - 0:44 with Couture Luxury Mobile Polish
      ===================================================================== */}
      <section id="makeup-artist-page" className="py-3 sm:py-6">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-5">
          {/* 3. MAKEUP ARTIST PAGE CONTAINER */}
          <div className="premium-surface rounded-3xl p-4 sm:p-6 space-y-5">
            {/* Top Bar: Back Button + "Makeup Artist" Title + Rating + Search/Cart */}
            <div className="flex items-center justify-between gap-3 border-b border-[#EFE6D8] pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubCategory('All');
                    setSearchQuery('');
                    scrollToSection('makeup-styling-landing');
                  }}
                  aria-label="Back to Makeup & Styling Categories"
                  className="tap-scale w-10 h-10 rounded-2xl bg-[#F5EFE6] hover:bg-[#EBE1D2] text-[#160824] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
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
                      <span className="text-stone-400">
                        ({settings.ratingCountText || '520+ Brides'})
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-stone-500 hover:text-[#160824] mt-0.5 cursor-pointer"
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
                  className="tap-scale w-10 h-10 rounded-2xl border border-[#E6DAC8] bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#160824] flex items-center justify-center cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Promotional Offers Strip (Matches Reference Video 0:12 — Editable from Admin Panel) */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => applyCodeValue(settings.offer1Code || 'BRIDAL500')}
                className="tap-scale flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[#E6DAC8] bg-[#FFFDF9] hover:border-[#D6B77A] text-left shrink-0 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#160824]">
                    {settings.offer1Title || 'Flat ₹500 OFF on Bridal & Engagement'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Tap to apply code{' '}
                    <span className="font-mono-num font-bold text-[#8C4A56]">
                      {settings.offer1Code || 'BRIDAL500'}
                    </span>
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyCodeValue(settings.offer2Code || 'EDEN10')}
                className="tap-scale flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[#E6DAC8] bg-[#FFFDF9] hover:border-[#D6B77A] text-left shrink-0 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#160824]">
                    {settings.offer2Title || 'Save 10% on Party Makeup & Combos'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Tap to apply code{' '}
                    <span className="font-mono-num font-bold text-[#8C4A56]">
                      {settings.offer2Code || 'EDEN10'}
                    </span>
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[#E6DAC8] bg-[#FFFDF9] shrink-0">
                <div className="w-8 h-8 rounded-xl bg-[#F5EFE6] text-[#160824] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#B76E79]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#160824]">
                    {settings.trustBadgeTitle || '100% Authentic Luxury Products'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {settings.trustBadgeSubtitle ||
                      'MAC · Huda Beauty · NARS · Silicone Airbrush'}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. COUTURE PROMOTIONAL BANNER ("Professional Makeup — Beauty services for every special occasion" — Reference Video 0:15) */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#160824] via-[#26103B] to-[#3B1954] border border-[#D6B77A]/45 shadow-lg text-white">
              <div className="grid grid-cols-12 items-center min-h-[175px] sm:min-h-[220px]">
                <div className="col-span-7 sm:col-span-7 p-4 sm:p-8 space-y-2.5 z-10">
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
                  <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => scrollToSection('booking')}
                      className="tap-scale px-3.5 py-2 rounded-xl bg-[#D6B77A] hover:bg-[#e3c78e] text-[#160824] text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
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
                              ? 'w-5 bg-[#D6B77A]'
                              : 'w-1.5 bg-white/35'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-span-5 sm:col-span-5 h-full relative min-h-[175px] sm:min-h-[220px]">
                  <SmartImage
                    src={currentHeroImg.url}
                    alt="Professional Makeup by Subba Lakshmi"
                    eager
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-[#26103B] via-[#26103B]/60 to-transparent" />
                </div>
              </div>
            </div>

            {/* 4. MAKEUP SERVICE CATEGORY GRID ("What service do you need?" — 8 Categories matching Reference Video 0:16) */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#160824]">
                    What service do you need?
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500">
                    Choose a category below to view packages, transparent pricing &amp; details
                  </p>
                </div>
                {activeSubCategory !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setActiveSubCategory('All')}
                    className="px-3 py-1.5 rounded-xl bg-[#F5EFE6] text-xs font-bold text-[#160824] hover:bg-[#EBE1D2] cursor-pointer"
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
                        className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-[#F8F3EC] border transition-all p-1 ${
                          isSelected
                            ? 'border-[#160824] ring-2 ring-[#D6B77A]/70 bg-[#FFF8EF] shadow-md'
                            : 'border-[#E6DAC8] group-hover:border-[#B76E79]'
                        }`}
                      >
                        <SmartImage
                          src={cat.image}
                          alt={cat.label}
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        />
                        {count > 0 && (
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.2 rounded-md bg-black/70 text-[#F5E2B8] font-mono-num text-[9px] font-bold backdrop-blur-2xs">
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

          {/* Sticky Horizontal Category Filter Bar for Effortless Mobile Switching */}
          <div className="sticky top-[146px] z-30 bg-[#FAF7F2]/95 backdrop-blur-md py-2 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 border-b border-[#E6DAC8]/60">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveSubCategory('All')}
                className={`tap-scale px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  activeSubCategory === 'All'
                    ? 'bg-[#160824] text-[#D6B77A] shadow-xs'
                    : 'bg-white text-stone-700 border border-[#E6DAC8] hover:border-[#B76E79]'
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
                        ? 'bg-[#160824] text-[#D6B77A] shadow-xs'
                        : 'bg-white text-stone-700 border border-[#E6DAC8] hover:border-[#B76E79]'
                    }`}
                  >
                    {sec.title} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6 & 7. SERVICE LISTINGS BY CATEGORY (Exact Reference Video Card Structure + Couture Mobile Polish) */}
          {searchFilteredServices.length === 0 ? (
            <div className="premium-surface rounded-3xl p-10 text-center space-y-3">
              <p className="text-base font-bold text-[#160824]">
                No makeup or styling services matched &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-stone-500">
                Try searching for Bridal Makeup, Party Makeup, Saree Draping, Hair Styling, or Packages.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveSubCategory('All');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#160824] text-[#D6B77A] text-xs font-bold cursor-pointer"
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
                    className="premium-surface rounded-3xl p-4 sm:p-6 scroll-mt-40"
                  >
                    {/* Category Section Heading */}
                    <div className="border-b border-[#EFE6D8] pb-3.5 mb-4 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold text-[#8C4A56]">
                          {settings.makeupBrand} · Verified Studio &amp; Venue Pricing
                        </p>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#160824]">
                          {sectionMeta.title}
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {sectionMeta.subtitle}
                        </p>
                      </div>
                      <span className="font-mono-num text-xs font-semibold text-stone-500 shrink-0">
                        {sectionItems.length}{' '}
                        {sectionItems.length === 1 ? 'option' : 'options'}
                      </span>
                    </div>

                    {/* Service Cards List (1-col on mobile matching reference video, 2-col on large desktop) */}
                    <div className="divide-y divide-[#EFE6D8] lg:divide-y-0 lg:grid lg:grid-cols-2 lg:gap-5">
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
                            className={`py-5 first:pt-1 last:pb-1 lg:p-5 lg:rounded-2xl lg:border transition-all flex items-start justify-between gap-4 ${
                              qty > 0
                                ? 'lg:bg-[#FFFBF4] lg:border-[#D6B77A]'
                                : 'lg:bg-white lg:border-[#E6DAC8]/90 lg:hover:border-[#B76E79]'
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
                                <span className="text-stone-400">
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

                              {/* Dashed Divider matching Reference Video */}
                              <div className="border-t border-dashed border-[#E6DAC8] my-2" />

                              {/* Bullet Point Description */}
                              <ul className="space-y-1 text-xs text-stone-600 leading-relaxed">
                                {bulletPoints.slice(0, 2).map((pt, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-[#B76E79] font-bold mt-0.5">•</span>
                                    <span className="line-clamp-2">{pt}</span>
                                  </li>
                                ))}
                              </ul>

                              {/* "View details >" Button (Opens Service Details Sheet) */}
                              <button
                                type="button"
                                onClick={() => setSelectedServiceDetail(srv)}
                                className="pt-1 inline-flex items-center gap-1 text-xs font-bold text-[#8C4A56] hover:text-[#160824] cursor-pointer"
                              >
                                <span>View details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Right Column: High-Clarity Service Portrait + Overlapping "Add" Button (Matches Reference Video) */}
                            <div className="flex flex-col items-center shrink-0 w-28 sm:w-32">
                              <div
                                onClick={() => setSelectedServiceDetail(srv)}
                                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[#F8F3EC] border border-[#E6DAC8] shadow-sm cursor-pointer relative group"
                              >
                                <SmartImage
                                  src={srv.image}
                                  alt={srv.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>

                              {/* Overlapping "Add" or "- qty +" Stepper Button */}
                              <div className="-mt-4 z-10 w-24 sm:w-26">
                                {qty === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAddOrIncrement(srv)}
                                    className="tap-scale w-full h-9 rounded-xl bg-white hover:bg-[#FFF8EF] text-[#160824] border border-[#D6B77A] shadow-md text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <span>Add</span>
                                    <Plus className="w-3.5 h-3.5 text-[#8C4A56]" />
                                  </button>
                                ) : (
                                  <div className="w-full h-9 rounded-xl bg-[#160824] text-[#D6B77A] border border-[#D6B77A]/60 shadow-md flex items-center justify-between px-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(srv.id, -1)}
                                      aria-label="Decrease quantity"
                                      className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="font-mono-num text-xs font-extrabold text-white">
                                      {qty}
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
          8. INTERACTIVE BOOKING CALENDAR + MULTI-STEP BOOKING FLOW (Section 9)
      ===================================================================== */}
      <section
        id="booking"
        className="py-12 sm:py-16 bg-gradient-to-b from-[#FFF8EF] to-[#FFFDF9] border-t border-stone-200"
      >
        <div id="calendar" className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
              Instant Online Makeup &amp; Styling Reservation
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#160824] mt-1">
              Complete Your Booking
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
              Review your selected services, choose your preferred date &amp; time slot in{' '}
              <strong className="text-stone-900">{locality}, Bangalore</strong>, and confirm
              your appointment.
            </p>
          </div>

          {/* 3-Step Progress Bar */}
          <div className="max-w-2xl mx-auto mb-7 grid grid-cols-3 gap-2">
            {[
              { step: 1 as const, title: '1. Selected Services' },
              { step: 2 as const, title: '2. Date & Time Slot' },
              { step: 3 as const, title: '3. Customer Details' },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => setBookingStep(item.step)}
                className={`min-h-[44px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  bookingStep === item.step
                    ? 'bg-[#160824] text-[#D6B77A] border-[#D6B77A] shadow-sm'
                    : bookingStep > item.step
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {formError && (
            <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-xs font-semibold underline ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left / Main Interactive Area (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200">
              {/* STEP 1: SELECT SERVICES */}
              {bookingStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                        Step 1: Review or Add Services
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Service Location: <strong className="text-stone-800">{locality}, Bangalore</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocationModalOpen(true)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      Change Location
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {enrichedServices
                      .filter((s) => s.price !== null)
                      .map((srv) => {
                        const qty = getItemQuantity(srv.id);
                        return (
                          <div
                            key={srv.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              qty > 0
                                ? 'bg-[#FFF8EF] border-[#160824]'
                                : 'bg-white border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-stone-100">
                                <SmartImage
                                  src={srv.image}
                                  alt={srv.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                                  {srv.makeupSubCategory}
                                </span>
                                <p className="text-sm font-bold text-stone-900 truncate">
                                  {srv.name}
                                </p>
                                <p className="font-mono-num text-xs font-bold text-[#B76E79]">
                                  ₹{srv.price} · {srv.duration || '1 hr'}
                                </p>
                              </div>
                            </div>

                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAddOrIncrement(srv)}
                                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#2563EB] border border-stone-300 text-xs font-bold shrink-0 cursor-pointer"
                              >
                                + Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(srv.id, -1)}
                                  className="w-8 h-8 rounded-lg border border-stone-300 flex items-center justify-center text-stone-800 hover:bg-stone-100 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono-num text-sm font-bold w-5 text-center">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(srv.id, 1)}
                                  className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#F5E2B8] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Select Date &amp; Time Slot</span>
                      <ArrowRight className="w-4 h-4 text-[#D6B77A]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: INTERACTIVE MONTHLY CALENDAR & TIME SLOTS */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                        Step 2: Choose Preferred Date &amp; Time Slot
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Real-time slot availability synced with Eden Roses Partner Calendar.
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 bg-stone-100 p-1.5 rounded-xl">
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
                        aria-label="Previous Month"
                        className="p-2 rounded-lg hover:bg-white cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold min-w-[130px] text-center text-stone-900">
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
                        aria-label="Next Month"
                        className="p-2 rounded-lg hover:bg-white cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] font-semibold text-stone-500">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {calendarDays.map((cell, idx) => {
                      if (!cell.dateISO || !cell.dayNumber) {
                        return <div key={`empty-${idx}`} className="h-12" />;
                      }
                      const isSelected = cell.dateISO === selectedDate;
                      const isDisabled = cell.isPast || cell.isFullyBooked;

                      return (
                        <button
                          key={cell.dateISO}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedDate(cell.dateISO!)}
                          className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all relative ${
                            isDisabled
                              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[#160824] text-[#D6B77A] font-bold shadow-sm cursor-pointer'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200/80 cursor-pointer'
                          }`}
                        >
                          <span className="font-mono-num text-xs sm:text-sm">
                            {cell.dayNumber}
                          </span>
                          {cell.bookedCount > 0 && (
                            <span
                              className={`text-[8px] sm:text-[9px] font-medium ${
                                isSelected ? 'text-[#F5E2B8]' : 'text-[#B76E79]'
                              }`}
                            >
                              {cell.isFullyBooked ? 'Full' : `${6 - cell.bookedCount} left`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots Selection */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <span className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#B76E79]" />
                      <span>Available Time Slots on {selectedDate}</span>
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {selectedDateSlots.map((slot) => {
                        const isChosen = selectedTime === slot.time && slot.available;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              !slot.available
                                ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                                : isChosen
                                ? 'bg-[#160824] border-[#160824] text-[#D6B77A] shadow-sm cursor-pointer'
                                : 'bg-white border-stone-200 hover:border-stone-400 text-stone-900 cursor-pointer'
                            }`}
                          >
                            <div className="font-mono-num text-xs sm:text-sm font-bold">
                              {slot.time}
                            </div>
                            <div className="text-[11px] mt-0.5 opacity-80">
                              {slot.available ? 'Available' : 'Booked'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="min-h-[46px] px-5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold text-stone-800 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="flex-1 sm:flex-initial min-h-[46px] px-6 py-3 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#F5E2B8] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Customer Details</span>
                      <ArrowRight className="w-4 h-4 text-[#D6B77A]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CUSTOMER DETAILS FORM */}
              {bookingStep === 3 && (
                <form onSubmit={handleConfirmBookingSubmit} className="space-y-4">
                  <div className="border-b border-stone-100 pb-3.5">
                    <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                      Step 3: Customer &amp; Service Location Details
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Enter your contact details and address in Bangalore to confirm your booking.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g., Prarthana Rao"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:border-[#160824]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                        Event / Occasion *
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:border-[#160824]"
                      >
                        {EVENT_TYPES.map((evt) => (
                          <option key={evt} value={evt}>
                            {evt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                        Customer Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (!whatsapp) setWhatsapp(e.target.value);
                        }}
                        placeholder="+91 98450 00000"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:border-[#160824]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+91 98450 00000"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:border-[#160824]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                        Service Location (Bangalore Area) *
                      </label>
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:border-[#160824]"
                      >
                        {availableLocalities.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                        Advance Payment to Reserve (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={netPayable}
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(Number(e.target.value))}
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm font-mono-num focus:outline-none focus:border-[#160824]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                      Complete Venue / Home / Studio Visit Address *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Flat / House No., Apartment / Wedding Venue Name, Street, Landmark, Bengaluru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:border-[#160824]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                      Special Notes (HD / Airbrush preference, Saree Draping style, etc.)
                    </label>
                    <textarea
                      rows={2}
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="Optional notes for Subba Lakshmi..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:border-[#160824]"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="min-h-[46px] px-5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold text-stone-800 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial min-h-[48px] px-7 py-3 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#D6B77A] text-sm font-bold shadow-md transition-all cursor-pointer"
                    >
                      {isSubmitting ? 'Confirming Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right: Live Booking Summary Card (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200 space-y-5 sticky top-28">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Booking Summary</h3>
                  <p className="text-xs text-stone-500">
                    {locality}, Bangalore · By {settings.artistName}
                  </p>
                </div>
                <CalendarIcon className="w-5 h-5 text-[#B76E79]" />
              </div>

              {/* Selected Location, Date & Time Slot */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Service Location</span>
                  <button
                    type="button"
                    onClick={() => setLocationModalOpen(true)}
                    className="font-bold text-stone-900 hover:text-[#2563EB] flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#B76E79]" />
                    <span>{locality}, Bangalore</span>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/60">
                  <span className="text-stone-500">Preferred Date &amp; Slot</span>
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="font-mono-num font-bold text-[#160824] underline cursor-pointer"
                  >
                    {selectedDate} · {selectedTime}
                  </button>
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
                      className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 text-xs sm:text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900 truncate">
                          {item.name}
                        </p>
                        <p className="font-mono-num text-xs text-stone-500">
                          {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-num font-bold text-stone-900">
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
              <div className="space-y-2.5 pt-1 border-t border-stone-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code (BRIDAL500 / EDEN10)"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscountCode}
                    className="px-3.5 py-2 rounded-xl bg-[#160824] text-[#D6B77A] text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-4 rounded-2xl bg-[#160824] text-white space-y-2 text-sm">
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
                <div className="flex justify-between text-[#D6B77A] text-xs">
                  <span>Advance Payment</span>
                  <span className="font-mono-num">₹{effectiveAdvance}</span>
                </div>
                <div className="pt-2 border-t border-white/15 flex justify-between items-baseline font-bold text-base">
                  <span>Payable at Appointment</span>
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
          ORIGINAL EDEN ROSES PORTFOLIO GALLERY (40+ Client Photographs)
      ===================================================================== */}
      <section
        id="gallery"
        className="py-12 sm:py-16 bg-white border-t border-stone-200"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
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
                      ? 'bg-[#160824] text-[#D6B77A] shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
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
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-900 shadow-xs border border-stone-200 text-left cursor-pointer"
              >
                <SmartImage
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-3">
                  <span className="text-[10px] text-[#D6B77A] font-semibold">
                    {img.galleryCategory || img.category}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-white leading-snug mt-0.5 line-clamp-2">
                    {img.alt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          ABOUT SECTION ("Meet Your Makeup Artist — Subba Lakshmi") & TESTIMONIALS
      ===================================================================== */}
      <section
        id="about"
        className="py-12 sm:py-16 bg-[#FFF8EF] border-t border-stone-200"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl overflow-hidden shadow-md border border-[#D6B77A]/40 aspect-[3/4]">
                <SmartImage
                  src={EDEN_ROSES_ABOUT_IMAGES[0].url}
                  alt={EDEN_ROSES_ABOUT_IMAGES[0].alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-3 pt-4">
                <div className="rounded-2xl overflow-hidden shadow-md border border-[#D6B77A]/40 aspect-square">
                  <SmartImage
                    src={EDEN_ROSES_ABOUT_IMAGES[1].url}
                    alt={EDEN_ROSES_ABOUT_IMAGES[1].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl bg-[#160824] text-white p-3.5 border border-[#D6B77A]/40">
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
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B76E79]">
                {settings.aboutKicker || 'Principal Makeup & Styling Artist'}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#160824]">
                {settings.artistName} — {settings.makeupBrand}
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed">
                {settings.description}
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200">
                  <p className="font-bold text-sm text-[#160824]">
                    {settings.aboutHighlight1Title || 'HD & Airbrush'}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {settings.aboutHighlight1Sub || 'Waterproof 16-hr skin finish'}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200">
                  <p className="font-bold text-sm text-[#160824]">
                    {settings.aboutHighlight2Title || 'Venue Travel'}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {settings.aboutHighlight2Sub || '5:00 AM Muhurtham slots available'}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200">
                  <p className="font-bold text-sm text-[#160824]">
                    {settings.aboutHighlight3Title || '4.9 ★ Rated'}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {settings.aboutHighlight3Sub || 'Loved by Bengaluru brides'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Testimonials */}
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
                className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-col justify-between space-y-4"
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
                <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D6B77A] shrink-0">
                    <SmartImage
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-stone-900">{item.name}</p>
                    <p className="text-[11px] text-stone-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          9. STUDIO LOCATION & INSTANT CALLBACK SECTION
      ===================================================================== */}
      <section
        id="contact"
        className="py-12 sm:py-16 bg-white border-t border-stone-200"
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-4">
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Studio &amp; Home-Venue Service Across Bangalore
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#160824]">
                {settings.makeupBrand} — {settings.businessName}
              </h2>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#B76E79] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      Studio Address (C V Raman Nagar / Nagavarapalya)
                    </p>
                    <p className="text-xs text-stone-600 mt-0.5">{settings.address}</p>
                    <a
                      href={settings.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline mt-1.5"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#B76E79] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      Direct Booking &amp; WhatsApp Lines
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs font-bold font-mono-num text-stone-800">
                      <a href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}>
                        {settings.phonePrimary}
                      </a>
                      <span>·</span>
                      <a href={`tel:${settings.phoneSecondary.replace(/\s+/g, '')}`}>
                        {settings.phoneSecondary}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-stone-50 rounded-3xl p-5 sm:p-7 border border-stone-200 space-y-4">
              <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                Request a Custom Bridal Quote or Callback
              </h3>

              {contactSent ? (
                <div className="p-5 rounded-2xl bg-white border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-base text-stone-900">
                    Inquiry Received! We will call you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSent(false)}
                    className="px-4 py-2 rounded-xl bg-[#160824] text-[#D6B77A] text-xs font-semibold cursor-pointer"
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
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:outline-none"
                    />
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="Phone / WhatsApp Number *"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={inquiryLocality}
                    onChange={(e) => setInquiryLocality(e.target.value)}
                    placeholder="Event Date & Locality in Bangalore (e.g., Indiranagar, Varthur)"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    required
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Tell us what makeup or styling services you need..."
                    className="w-full p-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#D6B77A] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    Request Callback
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER (With Discreet Staff Login Link at Bottom) */}
      <footer className="bg-[#160824] text-[#FFF8EF] py-10 border-t border-[#D6B77A]/35">
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
                  {settings.makeupBrand}
                </p>
                <p className="text-xs text-white/75">
                  By {settings.artistName} · {settings.businessName}
                </p>
              </div>
            </div>
            <div className="text-xs text-white/75">
              Service Areas:{' '}
              {settings.serviceArea ||
                'Indiranagar, Varthur, Yelahanka, Kaggadasapura, C V Raman Nagar & All Bangalore'}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/55">
            <p>
              © {new Date().getFullYear()} {settings.businessName} ({settings.makeupBrand}{' '}
              by {settings.artistName}). All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span>Bengaluru 560093</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  navigate('/admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-white/40 hover:text-[#D6B77A] transition-colors cursor-pointer"
                title="Staff Portal"
              >
                Staff Login
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          FLOATING "≡ Menu" CATEGORY QUICK-JUMP BUTTON (Matches Reference Video 0:18 - 0:37)
      ===================================================================== */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all ${
          totalCartItems > 0 ? 'bottom-28 lg:bottom-8' : 'bottom-18 lg:bottom-8'
        }`}
      >
        <button
          type="button"
          onClick={() => setFloatingMenuOpen((v) => !v)}
          className="tap-scale h-10 px-5 rounded-full bg-[#160824] hover:bg-[#26103B] text-[#F5E2B8] shadow-xl border border-[#D6B77A]/60 flex items-center gap-2 text-xs font-bold tracking-wide cursor-pointer"
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

      {/* FLOATING MENU POPOVER (Lists all Makeup & Styling Categories with Counts) */}
      {floatingMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-2xs flex items-end sm:items-center justify-center p-4 pb-28 sm:pb-4"
          onClick={() => setFloatingMenuOpen(false)}
        >
          <div
            className="w-full max-w-xs bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#D6B77A]/60 p-4 space-y-2 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pb-2 border-b border-[#EFE6D8]">
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
            <div className="max-h-72 overflow-y-auto divide-y divide-[#F2ECE1]">
              {ALL_SERVICE_SECTIONS_ORDER.map((sec) => {
                const count = (groupedServices.get(sec.id) || []).length;
                if (count === 0) return null;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => jumpToCategorySection(sec.id)}
                    className="w-full py-2.5 px-3 hover:bg-[#F5EFE6] rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
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
          MOBILE BOTTOM NAVIGATION + STICKY LUXURY CART BAR (App-Like Interface)
      ===================================================================== */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 luxury-glass border-t border-[#E6DAC8] shadow-[0_-8px_28px_rgba(22,8,36,0.12)]">
        {/* Sticky Mini Cart Strip when items are in cart */}
        {totalCartItems > 0 && (
          <div className="bg-gradient-to-r from-[#160824] via-[#26103B] to-[#160824] text-white px-3.5 py-2.5 border-b border-[#D6B77A]/35 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer"
            >
              <span className="px-2 py-0.5 rounded-lg bg-[#D6B77A] text-[#160824] font-mono-num text-xs font-extrabold">
                {totalCartItems}
              </span>
              <div className="min-w-0">
                <p className="font-mono-num text-sm font-extrabold text-[#F5E2B8] leading-tight">
                  ₹{netPayable.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-white/75 truncate">
                  Tap to view selected services
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingStep(2);
                scrollToSection('booking');
              }}
              className="tap-scale px-4 py-2 rounded-xl bg-[#D6B77A] hover:bg-[#e5c98f] text-[#160824] text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
            >
              <span>Select Slot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4-Tab App Bottom Navigation */}
        <div className="grid grid-cols-4 h-14 text-[11px] font-semibold text-stone-600">
          <button
            type="button"
            onClick={() => scrollToSection('makeup-styling-landing')}
            className="tap-scale flex flex-col items-center justify-center gap-0.5 hover:text-[#160824] cursor-pointer"
          >
            <Home className="w-4 h-4 text-stone-500" />
            <span>Categories</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('makeup-artist-page')}
            className="tap-scale flex flex-col items-center justify-center gap-0.5 text-[#160824] font-bold cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#B76E79]" />
            <span>Makeup Artist</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('gallery')}
            className="tap-scale flex flex-col items-center justify-center gap-0.5 hover:text-[#160824] cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-stone-500" />
            <span>Portfolio</span>
          </button>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="tap-scale flex flex-col items-center justify-center gap-0.5 hover:text-[#160824] relative cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-stone-500" />
            <span>Booking ({totalCartItems})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          8. SERVICE DETAILS VIEW MODAL / BOTTOM SHEET ("View details >")
      ===================================================================== */}
      {selectedServiceDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedServiceDetail(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto shadow-2xl flex flex-col justify-between"
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
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/65 text-white flex items-center justify-center hover:bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              {selectedServiceDetail.makeupSubCategory && (
                <span className="absolute bottom-3 left-3.5 px-3 py-1 rounded-full bg-black/70 text-[#D6B77A] text-xs font-semibold backdrop-blur-xs">
                  {selectedServiceDetail.makeupSubCategory}
                </span>
              )}
            </div>

            {/* Details Content */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-2 border-b border-stone-100 pb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {selectedServiceDetail.name}
                </h3>

                <div className="flex items-center flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-stone-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{(selectedServiceDetail.rating ?? 4.9).toFixed(1)}</span>
                    <span className="text-stone-400 font-normal">
                      ({selectedServiceDetail.reviewCount ?? 48} reviews)
                    </span>
                  </span>
                  <span>•</span>
                  <span className="font-mono-num text-base font-bold text-stone-900">
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
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
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
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Additional Information</span>
                </h4>
                <ul className="space-y-1 text-xs text-stone-600">
                  {(
                    selectedServiceDetail.additionalInfo || [
                      `Available at your venue/home in ${locality} or at our C V Raman Nagar Studio`,
                      'Performed by Subba Lakshmi & certified Eden Roses Makeover team',
                    ]
                  ).map((info, i) => (
                    <li key={i}>• {info}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sticky Bottom Action in Modal */}
            <div className="sticky bottom-0 bg-white border-t border-stone-200 p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-stone-500 block">Service Price</span>
                <span className="font-mono-num text-lg font-bold text-stone-900">
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
                    className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-[#2563EB] text-white px-3 py-2 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(selectedServiceDetail.id, -1)
                      }
                      className="w-6 h-6 rounded-md hover:bg-white/20 flex items-center justify-center cursor-pointer"
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
                      className="w-6 h-6 rounded-md hover:bg-white/20 flex items-center justify-center cursor-pointer"
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
                  className="px-5 py-3 rounded-xl bg-[#160824] text-[#D6B77A] text-xs sm:text-sm font-bold cursor-pointer"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setLocationModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Select Service Location
                </h3>
                <p className="text-xs text-stone-500">
                  On-venue bridal &amp; styling service across Bangalore
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="p-1.5 rounded-full bg-stone-100 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                placeholder="Search Indiranagar, Varthur, Yelahanka, Kaggadasapura..."
                className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#160824]"
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
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF8EF] border-[#160824] text-[#160824] font-bold'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#B76E79]" />
                      <div>
                        <p className="text-xs sm:text-sm">{loc}</p>
                        <p className="text-[10px] text-stone-400">
                          Bengaluru, Karnataka, India
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#160824]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAKEUP & STYLING CATEGORIES QUICK MODAL (Matches Video 0:04 Sheet)
      ===================================================================== */}
      {showLandingCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowLandingCategoryModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-900">
                Makeup &amp; Styling
              </h3>
              <button
                type="button"
                onClick={() => setShowLandingCategoryModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                MAKEUP
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
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 p-1">
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

            <div className="space-y-3 pt-2 border-t border-stone-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                MEN SALON
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
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 p-1">
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

      {/* =====================================================================
          SLIDE-OVER CART & QUICK CHECKOUT DRAWER
      ===================================================================== */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-5 sm:p-6 overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Your Booking Cart
                  </h3>
                  <p className="text-xs text-stone-500">
                    {totalCartItems} service(s) · {locality}, Bangalore
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-2 rounded-xl bg-stone-100 text-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-sm text-stone-600">Your booking cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-stone-900 truncate">
                          {item.name}
                        </p>
                        <p className="font-mono-num text-xs text-stone-500">
                          ₹{item.price} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
                          className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center cursor-pointer"
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
            </div>

            <div className="pt-4 border-t border-stone-200 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal</span>
                  <span className="font-mono-num font-bold">₹{itemsSubtotal}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Discount</span>
                    <span className="font-mono-num">-₹{effectiveDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-stone-200">
                  <span>Net Payable</span>
                  <span className="font-mono-num text-[#160824]">₹{netPayable}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  setBookingStep(2);
                  scrollToSection('booking');
                }}
                className="w-full py-3.5 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#D6B77A] font-bold text-sm cursor-pointer"
              >
                Select Date, Slot &amp; Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-3xl w-full bg-[#160824] rounded-3xl overflow-hidden border border-[#D6B77A]/50 shadow-2xl"
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
                className="px-5 py-2.5 rounded-xl bg-[#D6B77A] text-[#160824] text-xs font-bold shrink-0 cursor-pointer"
              >
                Book Similar Look
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING CONFIRMATION MODAL */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#D6B77A] shadow-2xl space-y-6 my-8">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B76E79]">
                Eden Roses Makeover · By {settings.artistName}
              </p>
              <h3 className="font-display text-3xl font-bold text-[#160824]">
                Your Appointment Is Confirmed!
              </h3>
              <p className="font-mono-num text-sm font-bold text-[#D6B77A] bg-[#160824] inline-block px-4 py-1.5 rounded-xl">
                Booking ID: {confirmedBooking.id}
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer Name</span>
                <span className="font-semibold text-stone-900">
                  {confirmedBooking.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date &amp; Time</span>
                <span className="font-mono-num font-semibold text-stone-900">
                  {confirmedBooking.date} · {confirmedBooking.time}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-500 shrink-0">Service Location</span>
                <span className="font-medium text-stone-900 text-right">
                  {confirmedBooking.address}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <span className="text-xs font-semibold text-[#B76E79] block mb-1.5">
                  Booked Services:
                </span>
                {confirmedBooking.services.map((s) => (
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

              {showBookingDetailsModal && (
                <div className="pt-2 border-t border-stone-200 text-xs space-y-1 text-stone-600">
                  <p>Event Type: {confirmedBooking.eventType}</p>
                  <p>Phone: {confirmedBooking.phone}</p>
                  <p>Status: {confirmedBooking.status}</p>
                  {confirmedBooking.notes && <p>Notes: {confirmedBooking.notes}</p>}
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-600">Total Amount</span>
                  <span className="font-mono-num font-bold">
                    ₹{confirmedBooking.itemsTotal - confirmedBooking.discount}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance Payment</span>
                  <span className="font-mono-num font-semibold">
                    ₹{confirmedBooking.advancePaid}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base text-stone-900 pt-1">
                  <span>Remaining Amount</span>
                  <span className="font-mono-num">
                    ₹{confirmedBooking.amountToCollect}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href={buildWhatsAppBookingUrl(confirmedBooking, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Send Booking on WhatsApp</span>
              </a>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBookingDetailsModal((v) => !v)}
                  className="py-3 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-semibold cursor-pointer"
                >
                  {showBookingDetailsModal ? 'Hide Extra Details' : 'View Booking Details'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedBooking(null);
                    setShowBookingDetailsModal(false);
                    setBookingStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="py-3 rounded-xl bg-[#160824] text-[#D6B77A] text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
