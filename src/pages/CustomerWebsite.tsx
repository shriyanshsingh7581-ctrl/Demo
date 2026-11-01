import React, { useState, useEffect, useMemo } from 'react';
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
  Star,
  Sparkles,
  Award,
  Heart,
  ShieldCheck,
  X,
  ExternalLink,
  MessageCircle,
  ArrowRight,
  Menu,
  Check,
  Tag,
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

const BENGALURU_LOCALITIES = [
  'C V Raman Nagar',
  'Nagavarapalya',
  'Kaggadasapura',
  'Indiranagar',
  'Brookefield',
  'Whitefield',
  'Jayanagar',
  'Koramangala',
  'HSR Layout',
  'Marathahalli',
  'Domlur',
  'Banaswadi',
  'Electronic City',
  'Hebbal',
  'Malleswaram',
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

export const CustomerWebsite: React.FC = () => {
  const navigate = useNavigate();
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

  // Navigation & Drawer UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState<string>('All');
  const [activeGalleryCategory, setActiveGalleryCategory] =
    useState<GalleryFilterCategory>('All');
  const [lightboxImage, setLightboxImage] = useState<EdenRoseImage | null>(null);
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  // Cart & Package Selection State
  const [cart, setCart] = useState<BookingServiceItem[]>([
    {
      id: 'pkg-luxury-bridal',
      name: 'Luxury Bridal Makeup Package',
      price: 8999,
      quantity: 1,
      category: 'Bridal & Makeup Packages',
    },
  ]);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(1000);

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
  const [locality, setLocality] = useState('C V Raman Nagar');
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

  // Derived Packages & Categories
  const packagesList = useMemo(
    () => services.filter((s) => s.isPackage && s.price !== null),
    [services]
  );

  const serviceCategories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.category)));
    return ['All', ...cats];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeServiceTab === 'All') return services;
    return services.filter((s) => s.category === activeServiceTab);
  }, [services, activeServiceTab]);

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

  const handleQuickBookPackage = (srv: ServiceCatalogItem) => {
    if (getItemQuantity(srv.id) === 0) {
      handleAddOrIncrement(srv);
    }
    setBookingStep(2);
    scrollToSection('booking');
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
    setPromoCode(code);
    if (code === 'BRIDAL500' || code === 'EDEN500') {
      setDiscountAmount(500);
    } else if (code === 'EDEN10') {
      setDiscountAmount(Math.round(itemsSubtotal * 0.1));
    } else if (!isNaN(Number(code)) && Number(code) > 0) {
      setDiscountAmount(Math.min(Number(code), itemsSubtotal));
    }
  };

  const handleApplyDiscountCode = () => {
    applyCodeValue(promoCode);
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

  // Auto-select first available slot if current selection is booked
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

  // Subtle auto-advance for Hero bridal showcase
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
    <div className="min-h-screen bg-[#FFFDF9] text-[#2A1818] relative pb-20 lg:pb-0">
      {/* 0. ROYAL PLUM & GOLD EDITORIAL TOP ANNOUNCEMENT RIBBON */}
      <div className="bg-[#160824] text-[#F5E2B8] border-b border-[#D6B77A]/30 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[#D6B77A] font-semibold tracking-wider uppercase">
              Luxury Redefined · Beauty with Soul
            </span>
            <span className="hidden md:inline text-white/40" aria-hidden="true">
              ·
            </span>
            <span className="hidden md:inline text-white/80 truncate">
              C V Raman Nagar Studio &amp; Venue Bridal Artistry across Bengaluru
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 text-[#F5E2B8] hover:text-white font-mono-num font-semibold transition-colors"
            >
              <Phone className="w-3 h-3 text-[#D6B77A]" />
              <span>{settings.phonePrimary}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 1. LUXURY STICKY HEADER */}
      <header className="sticky top-0 z-40 luxury-glass border-b border-[#D6B77A]/35 shadow-[0_4px_24px_-8px_rgba(22,8,36,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Zone 1: Brand Emblem + Wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
            className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 group"
          >
            <div className="w-14 h-11 sm:w-16 sm:h-12 rounded-xl bg-[#160824] border border-[#D6B77A]/70 overflow-hidden flex items-center justify-center shadow-md shrink-0">
              <SmartImage
                src={settings.logoUrl}
                alt={settings.makeupBrand}
                fit="cover"
                eager
                className="w-full h-full object-center scale-110 transition-transform duration-300 group-hover:scale-115"
              />
            </div>
            <div className="min-w-0">
              <span className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#160824] block truncate leading-none">
                {settings.makeupBrand}
              </span>
              <span className="text-[10px] sm:text-xs text-[#B76E79] font-medium tracking-wide block truncate mt-0.5">
                By {settings.artistName} · Bengaluru
              </span>
            </div>
          </a>

          {/* Zone 2: Desktop Editorial Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#2A1818]/85">
            {[
              { label: 'Home', id: 'home' },
              { label: 'Bridal Packages', id: 'packages' },
              { label: 'All Services', id: 'services' },
              { label: 'Portfolio Gallery', id: 'gallery' },
              { label: 'About Artist', id: 'about' },
              { label: 'Book Slot', id: 'booking' },
              { label: 'Contact', id: 'contact' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.id);
                }}
                className="hover:text-[#B76E79] transition-colors py-1 border-b-2 border-transparent hover:border-[#B76E79] whitespace-nowrap shrink-0"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Mobile-Ergonomic Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Mobile Direct Call Action */}
            <a
              href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
              aria-label="Call Studio"
              className="lg:hidden min-h-[44px] min-w-[44px] rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF] text-[#160824] flex items-center justify-center hover:bg-[#F6DDE2]/40 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#B76E79]" />
            </a>

            {/* Cart Drawer Trigger */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label="Open Booking Cart"
              className="relative min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF] hover:bg-[#F6DDE2]/40 text-[#160824] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#B76E79]" />
              <span className="font-mono-num text-xs font-bold">{totalCartItems}</span>
              <span className="hidden md:inline text-stone-300" aria-hidden="true">
                |
              </span>
              <span className="hidden md:inline font-mono-num text-xs font-semibold text-[#B76E79]">
                ₹{itemsSubtotal}
              </span>
            </button>

            {/* Primary Book CTA (Royal Plum & Gold) */}
            <button
              type="button"
              onClick={() => scrollToSection('booking')}
              className="hidden sm:inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#F5E2B8] border border-[#D6B77A]/60 text-xs sm:text-sm font-semibold shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Book Appointment</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D6B77A]" />
            </button>

            {/* Mobile Menu Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle Navigation Menu"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#160824] text-[#D6B77A] border border-[#D6B77A]/50 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Luxury Navigation Sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#160824] text-[#FFF8EF] border-b border-[#D6B77A]/40 px-4 pt-4 pb-6 space-y-4 shadow-2xl">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-[#D6B77A]/25 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#D6B77A] font-semibold">
                  Primary Bridal Studio
                </p>
                <p className="text-xs text-white/85 mt-0.5">
                  C V Raman Nagar / Nagavarapalya, Bengaluru
                </p>
              </div>
              <a
                href={settings.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#D6B77A]/20 text-[#F5E2B8] text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Map</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Home Showcase', id: 'home' },
                { label: 'Bridal Packages', id: 'packages' },
                { label: 'All Salon Services', id: 'services' },
                { label: 'Bridal Gallery', id: 'gallery' },
                { label: 'Meet Subba Lakshmi', id: 'about' },
                { label: 'Slot Calendar', id: 'booking' },
                { label: 'Studio Contact', id: 'contact' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-1 grid grid-cols-2 gap-2.5">
              <a
                href={`https://wa.me/${cleanWhatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 rounded-xl bg-[#25D366] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp Us</span>
              </a>
              <button
                type="button"
                onClick={() => scrollToSection('booking')}
                className="py-3 rounded-xl bg-gradient-to-r from-[#D6B77A] to-[#B8924A] text-[#160824] text-xs sm:text-sm font-bold text-center shadow-sm"
              >
                Book Appointment
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. EDITORIAL HERO SECTION (Mobile-First Luxury Layout) */}
      <section
        id="home"
        className="relative overflow-hidden pt-6 pb-14 sm:pt-10 sm:pb-20 lg:pt-14 lg:pb-24 bg-gradient-to-b from-[#F6DDE2]/40 via-[#FFF8EF] to-[#FFFDF9]"
      >
        {/* Subtle decorative background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-[#D6B77A]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-40 -left-24 w-80 h-80 rounded-full bg-[#B76E79]/10 blur-3xl"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Editorial Column (Order 2 on Mobile so Portrait & Headline work harmoniously, Order 1 on Desktop) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-[#B76E79]">
                <span className="text-[#160824]">By {settings.artistName}</span>
                <span aria-hidden="true">·</span>
                <span>C V Raman Nagar &amp; Nagavarapalya, Bengaluru</span>
                <span aria-hidden="true">·</span>
                <span>Bridal &amp; Unisex Luxury Salon</span>
              </div>

              <h1
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#160824] leading-[1.06] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Your Beauty, Our Artistry —{' '}
                <span className="text-[#B76E79] italic font-semibold">
                  Luxury Redefined
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-[#2A1818]/80 leading-relaxed max-w-2xl">
                Experience the magic of signature South Indian &amp; contemporary bridal
                transformations with{' '}
                <strong className="font-semibold text-[#160824]">
                  Eden Roses Makeover by Subba Lakshmi
                </strong>
                . Precision HD &amp; Silicone Airbrush makeup, intricate floral poola jada
                hairstyling, and flawless Kanjeevaram saree draping at our studio or your
                venue.
              </p>

              {/* Quick-Tap Service Highlights (Interactive Jump Buttons) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { label: 'Luxury Bridal ₹8,999', target: 'packages' },
                  { label: 'Engagement Look ₹4,999', target: 'packages' },
                  { label: 'Party Makeup ₹1,599', target: 'packages' },
                  { label: 'Advance Hair ₹999', target: 'packages' },
                  { label: 'Saree Draping ₹599', target: 'packages' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => scrollToSection(chip.target)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF8EF] text-[#160824] border border-[#D6B77A]/50 text-xs font-semibold whitespace-nowrap shrink-0 shadow-2xs transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Primary & Secondary Hero CTAs */}
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 sm:gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => scrollToSection('booking')}
                  className="min-h-[50px] px-7 py-3.5 rounded-2xl bg-[#160824] hover:bg-[#27103d] text-[#F5E2B8] border border-[#D6B77A]/70 font-semibold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span>Book Makeover Appointment</span>
                  <ArrowRight className="w-4 h-4 text-[#D6B77A]" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('packages')}
                  className="min-h-[50px] px-6 py-3.5 rounded-2xl bg-white hover:bg-[#F6DDE2]/40 text-[#160824] border border-[#B76E79]/40 font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore 7 Signature Packages</span>
                </button>
              </div>

              {/* Studio Trust & Credentials Bar */}
              <div className="pt-5 border-t border-[#D6B77A]/35 grid grid-cols-3 gap-3 sm:gap-6">
                <div className="bg-white/80 p-3 sm:p-4 rounded-2xl border border-[#D6B77A]/30">
                  <p className="font-display text-xl sm:text-3xl font-bold text-[#160824] tabular-nums">
                    100%
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#2A1818]/75 mt-0.5 leading-snug">
                    HD &amp; Silicone Airbrush Studio Products
                  </p>
                </div>
                <div className="bg-white/80 p-3 sm:p-4 rounded-2xl border border-[#D6B77A]/30">
                  <p className="font-display text-xl sm:text-3xl font-bold text-[#B76E79] tabular-nums">
                    ₹599+
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#2A1818]/75 mt-0.5 leading-snug">
                    Transparent Hairstyling &amp; Bridal Packages
                  </p>
                </div>
                <div className="bg-white/80 p-3 sm:p-4 rounded-2xl border border-[#D6B77A]/30">
                  <p className="font-display text-xl sm:text-3xl font-bold text-[#160824] tabular-nums">
                    5.0 ★
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#2A1818]/75 mt-0.5 leading-snug">
                    Trusted by Bengaluru Brides &amp; Families
                  </p>
                </div>
              </div>
            </div>

            {/* Right Original Eden Roses Photography Frame with Touch Controls */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative rounded-3xl overflow-hidden bg-[#160824] p-2.5 sm:p-3.5 shadow-2xl border-2 border-[#D6B77A]/60">
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden">
                  <SmartImage
                    src={currentHeroImg.url}
                    alt={currentHeroImg.alt}
                    eager
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#160824]/90 via-[#160824]/20 to-transparent" />

                  {/* Prev / Next Touch Controls on Portrait */}
                  <button
                    type="button"
                    onClick={() =>
                      setHeroSlideIdx(
                        (prev) => (prev - 1 + heroImages.length) % heroImages.length
                      )
                    }
                    aria-label="Previous Bridal Portrait"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/25 flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHeroSlideIdx((prev) => (prev + 1) % heroImages.length)
                    }
                    aria-label="Next Bridal Portrait"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/25 flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Bottom Portrait Caption & Quick Book Action */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 p-3.5 rounded-2xl bg-[#160824]/85 border border-[#D6B77A]/40 backdrop-blur-md text-white flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[#D6B77A] font-semibold">
                        Original Eden Roses Portfolio
                      </p>
                      <p className="font-display text-lg sm:text-xl font-bold truncate">
                        {currentHeroImg.alt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollToSection('booking')}
                      className="px-3.5 py-2 rounded-xl bg-[#D6B77A] hover:bg-[#e5c98f] text-[#160824] text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Book Look
                    </button>
                  </div>
                </div>

                {/* Slide Indicator Dots */}
                <div className="pt-2.5 pb-1 flex items-center justify-between px-2 text-xs text-[#F5E2B8]/80">
                  <span>
                    Look {(heroSlideIdx % heroImages.length) + 1} of {heroImages.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {heroImages.map((img, i) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setHeroSlideIdx(i)}
                        aria-label={`Show slide ${i + 1}`}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          heroSlideIdx % heroImages.length === i
                            ? 'w-7 bg-[#D6B77A]'
                            : 'w-2 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE BRIDAL & MAKEUP PACKAGES SECTION (Moved Up for Mobile Conversion) */}
      <section id="packages" className="py-14 sm:py-20 lg:py-24 bg-[#FFF8EF] border-t border-[#D6B77A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Transparent Luxury Pricing · Studio &amp; Venue
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#160824] mt-1"
                style={{ textWrap: 'balance' }}
              >
                Curated Bridal, Party &amp; Hairstyling Packages
              </h2>
              <p className="text-sm sm:text-base text-[#2A1818]/75 mt-2 max-w-2xl">
                Select one or multiple packages to customize your booking. Silicone
                Airbrush upgrades are available for any party, engagement, or bridal
                makeover.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="self-start md:self-auto min-h-[46px] px-5 py-3 rounded-2xl bg-[#160824] text-[#F5E2B8] border border-[#D6B77A]/60 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-md hover:bg-[#27103d] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 text-[#D6B77A]" />
              <span>Selected ({totalCartItems})</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-[#D6B77A] font-bold">
                ₹{itemsSubtotal}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {packagesList.map((pkg) => {
              const qty = getItemQuantity(pkg.id);
              return (
                <div
                  key={pkg.id}
                  className={`luxury-card-3d rounded-3xl bg-white overflow-hidden border transition-all flex flex-col ${
                    qty > 0
                      ? 'border-[#160824] ring-2 ring-[#D6B77A]/60 shadow-lg'
                      : 'border-[#D6B77A]/45 shadow-sm'
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#160824]">
                    <SmartImage
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                    {/* Price Tag Overlay on Image */}
                    <div className="absolute bottom-3 left-3 px-3.5 py-1.5 rounded-xl bg-[#160824]/90 border border-[#D6B77A]/60 text-[#F5E2B8] backdrop-blur-xs">
                      <span className="text-[10px] uppercase tracking-wider text-[#D6B77A] block leading-none">
                        Package Rate
                      </span>
                      <span className="font-mono-num text-lg font-bold">
                        ₹{pkg.price}
                      </span>
                    </div>

                    {qty > 0 && (
                      <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-[#D6B77A] text-[#160824] text-xs font-bold flex items-center gap-1 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Selected × {qty}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#B76E79] font-medium">
                        <span>{pkg.category}</span>
                        {pkg.duration && (
                          <span className="text-[#2A1818]/60 font-mono-num">
                            {pkg.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-2xl font-bold text-[#160824] leading-snug">
                        {pkg.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#2A1818]/75 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#D6B77A]/25 flex items-center justify-between gap-2.5">
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleAddOrIncrement(pkg)}
                          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FFF8EF] hover:bg-[#F6DDE2]/50 text-[#160824] border border-[#D6B77A] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-[#B76E79]" />
                          <span>Add to Cart</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-[#FFF8EF] border border-[#160824]/30 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(pkg.id, -1)}
                            aria-label="Decrease quantity"
                            className="w-9 h-9 rounded-lg bg-white hover:bg-[#F6DDE2] text-[#160824] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono-num text-sm font-bold px-2.5 text-[#160824]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(pkg.id, 1)}
                            aria-label="Increase quantity"
                            className="w-9 h-9 rounded-lg bg-[#160824] text-[#D6B77A] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleQuickBookPackage(pkg)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <span>Book Slot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. COMPLETE SALON & MAKEUP SERVICES CATALOG */}
      <section id="services" className="py-14 sm:py-20 lg:py-24 bg-white border-t border-[#D6B77A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
              Complete Unisex Salon &amp; Bridal Menu
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#160824] mt-1"
              style={{ textWrap: 'balance' }}
            >
              Makeup Artistry, Hair, Skin &amp; Permanent Beauty
            </h2>
            <p className="text-sm sm:text-base text-[#2A1818]/75 mt-2">
              Swipe categories below to explore all official services at Eden Roses
              Unisex Salon in C V Raman Nagar, Bengaluru.
            </p>
          </div>

          {/* Mobile-Friendly Horizontal Scroll-Snap Category Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
            {serviceCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveServiceTab(cat)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeServiceTab === cat
                    ? 'bg-[#160824] text-[#D6B77A] border border-[#D6B77A]/60 shadow-sm'
                    : 'bg-[#FFF8EF] text-[#2A1818]/80 hover:bg-[#F6DDE2]/50 border border-[#D6B77A]/35'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredServices.map((srv) => {
              const qty = getItemQuantity(srv.id);
              return (
                <div
                  key={srv.id}
                  className="luxury-card-3d rounded-2xl bg-[#FFFDF9] border border-[#D6B77A]/40 overflow-hidden flex flex-col shadow-2xs"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#160824] relative">
                    <SmartImage
                      src={srv.image}
                      alt={srv.name}
                      className="w-full h-full object-cover"
                    />
                    {srv.airbrushAvailable && (
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#160824]/85 text-[#D6B77A] text-[10px] font-semibold backdrop-blur-xs">
                        Airbrush Option Available
                      </span>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="text-[11px] font-medium text-[#B76E79]">
                        {srv.category}
                      </p>
                      <h3 className="font-display text-xl font-bold text-[#160824] mt-0.5">
                        {srv.name}
                      </h3>
                      <p className="text-xs text-[#2A1818]/75 mt-1.5 leading-relaxed line-clamp-3">
                        {srv.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#D6B77A]/25 flex items-center justify-between gap-2">
                      {srv.price !== null ? (
                        <span className="font-mono-num text-base font-bold text-[#160824]">
                          ₹{srv.price}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[#B76E79]">
                          Custom Consultation
                        </span>
                      )}

                      {srv.price !== null ? (
                        <button
                          type="button"
                          onClick={() => handleAddOrIncrement(srv)}
                          className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            qty > 0
                              ? 'bg-[#160824] text-[#D6B77A]'
                              : 'bg-[#B76E79] hover:bg-[#9f5964] text-white'
                          }`}
                        >
                          {qty > 0 ? `Added (${qty})` : '+ Add Service'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSpecialNotes((prev) =>
                              prev.includes(srv.name)
                                ? prev
                                : `${prev ? prev + ' | ' : ''}Consultation for: ${srv.name}`
                            );
                            scrollToSection('booking');
                          }}
                          className="min-h-[38px] px-3.5 py-2 rounded-xl border border-[#160824]/30 hover:bg-[#160824] hover:text-[#D6B77A] text-[#160824] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Inquire &amp; Book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. ORIGINAL EDEN ROSES PORTFOLIO & GALLERY */}
      <section
        id="gallery"
        className="py-14 sm:py-20 lg:py-24 bg-gradient-to-b from-[#FFF8EF] to-[#F6DDE2]/35 border-t border-[#D6B77A]/25"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                100% Authentic Client &amp; Bridal Captures
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#160824] mt-1"
                style={{ textWrap: 'balance' }}
              >
                Bridal Transformations &amp; Studio Portfolio
              </h2>
              <p className="text-sm sm:text-base text-[#2A1818]/75 mt-2 max-w-2xl">
                Tap any photograph to view full-screen details or book a similar bridal,
                reception, or party makeover look.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
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
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    activeGalleryCategory === cat
                      ? 'bg-[#160824] text-[#D6B77A] border border-[#D6B77A]/60 shadow-sm'
                      : 'bg-white text-[#2A1818]/80 hover:bg-[#F6DDE2]/50 border border-[#D6B77A]/35'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredGallery.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxImage(img)}
                className="group relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#160824] shadow-md border border-[#D6B77A]/40 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
              >
                <SmartImage
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Always visible subtle gradient on mobile + rich hover on desktop */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#160824]/90 via-black/15 to-transparent flex flex-col justify-end p-3 sm:p-4">
                  <span className="text-[10px] sm:text-[11px] text-[#D6B77A] font-semibold tracking-wide">
                    {img.galleryCategory || img.category}
                  </span>
                  <p className="font-display text-sm sm:text-base font-semibold text-white leading-snug mt-0.5 line-clamp-2">
                    {img.alt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ABOUT SECTION ("Meet Your Makeup Artist — Subba Lakshmi") */}
      <section id="about" className="py-14 sm:py-20 lg:py-24 bg-white border-t border-[#D6B77A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Original Portfolio Collage */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-3.5 sm:gap-6">
              <div className="space-y-3.5 sm:space-y-6">
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-[#D6B77A]/45 aspect-[3/4]">
                  <SmartImage
                    src={EDEN_ROSES_ABOUT_IMAGES[0].url}
                    alt={EDEN_ROSES_ABOUT_IMAGES[0].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl sm:rounded-3xl bg-[#160824] text-[#FFF8EF] p-4 sm:p-5 border border-[#D6B77A]/50">
                  <p className="font-display text-lg sm:text-xl font-bold text-[#D6B77A]">
                    Eden Roses Unisex Salon
                  </p>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    Primary Bridal Makeup Studio in C V Raman Nagar / Nagavarapalya,
                    Bengaluru.
                  </p>
                </div>
              </div>
              <div className="space-y-3.5 sm:space-y-6 pt-5 sm:pt-8">
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-[#D6B77A]/45 aspect-square">
                  <SmartImage
                    src={EDEN_ROSES_ABOUT_IMAGES[1].url}
                    alt={EDEN_ROSES_ABOUT_IMAGES[1].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-[#D6B77A]/45 aspect-[4/3]">
                  <SmartImage
                    src={EDEN_ROSES_ABOUT_IMAGES[2].url}
                    alt={EDEN_ROSES_ABOUT_IMAGES[2].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Artist Story & Credentials */}
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Meet Your Principal Makeup Artist
              </div>
              <h2
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#160824]"
                style={{ textWrap: 'balance' }}
              >
                {settings.artistName}
              </h2>
              <div className="space-y-4 text-[#2A1818]/85 text-sm sm:text-base leading-relaxed">
                <p>
                  At <strong>Eden Roses Makeover</strong>, beauty is more than makeup—it
                  is about confidence, individuality, and creating unforgettable memories
                  on your most cherished days.
                </p>
                <p>
                  <strong>Subba Lakshmi</strong> specializes in luxury South Indian and
                  modern bridal transformations, silicone airbrush skin finishes, advance
                  floral hairstyling, and precision saree draping tailored to your
                  features and attire.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/40">
                  <p className="font-display text-lg font-bold text-[#160824]">
                    Excellence
                  </p>
                  <p className="text-xs text-[#2A1818]/75 mt-1">
                    International luxury cosmetics &amp; long-wear HD techniques.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/40">
                  <p className="font-display text-lg font-bold text-[#160824]">Care</p>
                  <p className="text-xs text-[#2A1818]/75 mt-1">
                    Skin-first prep and calm, punctual bridal hospitality.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/40">
                  <p className="font-display text-lg font-bold text-[#160824]">
                    Innovation
                  </p>
                  <p className="text-xs text-[#2A1818]/75 mt-1">
                    Flawless silicone airbrush &amp; intricate bridal hair architecture.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => scrollToSection('booking')}
                  className="min-h-[46px] px-6 py-3 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#F5E2B8] border border-[#D6B77A]/60 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Schedule Bridal Appointment
                </button>
                <a
                  href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
                  className="min-h-[46px] px-5 py-3 rounded-xl border border-[#B76E79]/40 text-[#160824] hover:bg-[#F6DDE2]/40 text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#B76E79]" />
                  <span>{settings.phonePrimary}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE US & CLIENT TESTIMONIALS */}
      <section className="py-14 sm:py-20 lg:py-24 bg-[#FFF8EF] border-t border-[#D6B77A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
          {/* Why Choose Us */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                The Eden Roses Standard
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-[#160824] mt-1"
                style={{ textWrap: 'balance' }}
              >
                Why Bengaluru Brides Choose Subba Lakshmi
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[
                {
                  icon: Sparkles,
                  title: 'HD & Silicone Airbrush Mastery',
                  desc: 'Sweat-resistant, camera-ready skin finishes customized for Indian bridal lighting and skin tones.',
                },
                {
                  icon: Award,
                  title: 'Complete Look Architecture',
                  desc: 'From Kanjeevaram saree pleating and floral poola jada braids to precision eye makeup.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Punctual Venue & Studio Visits',
                  desc: 'Available for early 5:00 AM Muhurtham calls across C V Raman Nagar, Indiranagar, Jayanagar & Bengaluru.',
                },
                {
                  icon: Heart,
                  title: 'Tailor-Made Bridal Packages',
                  desc: 'Flexible multi-event packages for Engagement, Haldi, Sangeet, Muhurtham, and Reception.',
                },
              ].map((feat) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="p-6 rounded-3xl bg-white border border-[#D6B77A]/40 shadow-2xs space-y-3"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-[#160824] text-[#D6B77A] flex items-center justify-center">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#160824]">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#2A1818]/75 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testimonials */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Verified Client Love
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-[#160824] mt-1"
                style={{ textWrap: 'balance' }}
              >
                Real Stories from Our Brides &amp; Clients
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
              {[
                {
                  name: 'Akshara Prasanth',
                  role: 'Bridal & Salon Client · C V Raman Nagar',
                  quote:
                    'Subba Lakshmi and the Eden Roses team made me feel so confident and radiant! From facial prep and manicure to the final makeover and hairstyling, the attention to detail was unmatched.',
                  img: EDEN_ROSES_TESTIMONIAL_IMAGES[0].url,
                },
                {
                  name: 'Prarthana',
                  role: 'Advance Hairstyling Client · Jayanagar 4th Block',
                  quote:
                    'Booked the Half-up & down and Braid with curls advance hairstyling packages. The curls stayed intact for over 10 hours through the entire ceremony!',
                  img: EDEN_ROSES_TESTIMONIAL_IMAGES[1].url,
                },
                {
                  name: 'Kumari Madhumita',
                  role: 'Party Makeover & Draping · Brookefield',
                  quote:
                    'Flawless saree draping, messy up-do hairstyling, and natural party makeup that looked great both in person and in photographs. Highly recommend Eden Roses Makeover!',
                  img: EDEN_ROSES_TESTIMONIAL_IMAGES[2].url,
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="p-6 rounded-3xl bg-white border border-[#D6B77A]/40 shadow-2xs flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-[#D6B77A]">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-[#2A1818]/85 leading-relaxed italic">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-[#D6B77A]/25">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D6B77A] shrink-0">
                      <SmartImage
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-[#160824]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#2A1818]/65">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE BOOKING CALENDAR + MULTI-STEP BOOKING FORM */}
      <section
        id="booking"
        className="py-14 sm:py-20 lg:py-24 bg-gradient-to-b from-[#F6DDE2]/40 via-[#FFF8EF] to-[#FFFDF9] border-t border-[#D6B77A]/35"
      >
        <div id="calendar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
              Instant Online Appointment Reservation
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#160824] mt-1"
              style={{ textWrap: 'balance' }}
            >
              Book Your Makeover Appointment
            </h2>
            <p className="text-sm sm:text-base text-[#2A1818]/75 mt-2">
              Live studio and venue availability for Subba Lakshmi. Choose your packages,
              select your preferred date &amp; time slot, and receive instant WhatsApp
              confirmation.
            </p>
          </div>

          {/* Luxury 3-Step Progress Bar */}
          <div className="max-w-3xl mx-auto mb-8 sm:mb-10 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { step: 1 as const, title: '1. Packages' },
              { step: 2 as const, title: '2. Date & Slot' },
              { step: 3 as const, title: '3. Your Details' },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => setBookingStep(item.step)}
                className={`min-h-[46px] py-2.5 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  bookingStep === item.step
                    ? 'bg-[#160824] text-[#D6B77A] border-[#D6B77A] shadow-md'
                    : bookingStep > item.step
                    ? 'bg-[#F6DDE2]/80 text-[#160824] border-[#B76E79]/40'
                    : 'bg-white text-[#2A1818]/70 border-[#D6B77A]/35'
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 items-start">
            {/* Left / Main Interactive Area (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-8 shadow-lg border border-[#D6B77A]/45">
              {/* STEP 1: SELECT SERVICES */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#D6B77A]/25 pb-4">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-[#160824]">
                        Step 1: Select Makeup &amp; Styling Packages
                      </h3>
                      <p className="text-xs text-[#2A1818]/70 mt-0.5">
                        Add multiple services or adjust quantities for bridesmaids &amp;
                        family members.
                      </p>
                    </div>
                    <span className="font-mono-num text-xs font-bold text-[#B76E79] shrink-0">
                      {totalCartItems} selected
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                    {services
                      .filter((s) => s.price !== null)
                      .map((srv) => {
                        const qty = getItemQuantity(srv.id);
                        return (
                          <div
                            key={srv.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              qty > 0
                                ? 'bg-[#FFF8EF] border-[#160824]'
                                : 'bg-white border-stone-200 hover:border-[#D6B77A]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#160824]">
                                <SmartImage
                                  src={srv.image}
                                  alt={srv.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-display text-base sm:text-lg font-bold text-[#160824] truncate">
                                  {srv.name}
                                </p>
                                <p className="font-mono-num text-xs font-bold text-[#B76E79]">
                                  ₹{srv.price}
                                </p>
                              </div>
                            </div>

                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAddOrIncrement(srv)}
                                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#D6B77A] text-xs font-semibold shrink-0 cursor-pointer"
                              >
                                + Select
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(srv.id, -1)}
                                  className="w-8 h-8 rounded-lg border border-[#160824]/30 flex items-center justify-center text-[#160824] hover:bg-[#F6DDE2] cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono-num text-sm font-bold w-5 text-center">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(srv.id, 1)}
                                  className="w-8 h-8 rounded-lg bg-[#160824] text-[#D6B77A] flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#F5E2B8] border border-[#D6B77A]/60 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Date &amp; Time</span>
                      <ArrowRight className="w-4 h-4 text-[#D6B77A]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: INTERACTIVE MONTHLY CALENDAR & TIME SLOTS */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D6B77A]/25 pb-4">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-[#160824]">
                        Step 2: Choose Appointment Date &amp; Time
                      </h3>
                      <p className="text-xs text-[#2A1818]/70 mt-0.5">
                        Real-time availability prevents duplicate slot bookings.
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 bg-[#FFF8EF] p-1.5 rounded-xl border border-[#D6B77A]/40">
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
                      <span className="font-display text-base sm:text-lg font-bold min-w-[130px] text-center text-[#160824]">
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
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] sm:text-xs font-semibold text-[#2A1818]/60">
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
                              ? 'bg-[#160824] text-[#D6B77A] border border-[#D6B77A] font-bold shadow-sm cursor-pointer'
                              : 'bg-[#FFF8EF] hover:bg-[#F6DDE2]/60 text-[#160824] border border-[#D6B77A]/35 cursor-pointer'
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
                  <div className="pt-4 border-t border-[#D6B77A]/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-[#160824] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#B76E79]" />
                        <span>Select Time Slot for {selectedDate}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
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
                                ? 'bg-[#160824] border-[#D6B77A] text-[#D6B77A] shadow-sm cursor-pointer'
                                : 'bg-[#FFF8EF] border-[#D6B77A]/40 hover:border-[#B76E79] text-[#160824] cursor-pointer'
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
                      className="min-h-[46px] px-4 sm:px-5 py-2.5 rounded-xl border border-[#D6B77A]/60 text-xs sm:text-sm font-semibold text-[#160824] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="flex-1 sm:flex-initial min-h-[46px] px-6 py-3 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#F5E2B8] border border-[#D6B77A]/60 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Your Details</span>
                      <ArrowRight className="w-4 h-4 text-[#D6B77A]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CUSTOMER DETAILS FORM */}
              {bookingStep === 3 && (
                <form onSubmit={handleConfirmBookingSubmit} className="space-y-5">
                  <div className="border-b border-[#D6B77A]/25 pb-4">
                    <h3 className="font-display text-2xl font-bold text-[#160824]">
                      Step 3: Customer &amp; Event Details
                    </h3>
                    <p className="text-xs text-[#2A1818]/70 mt-0.5">
                      Enter your contact and venue details in Bengaluru to confirm your
                      appointment.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#160824] mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g., Prarthana Rao"
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#160824]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#160824] mb-1.5">
                        Event Type *
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#160824]"
                      >
                        {EVENT_TYPES.map((evt) => (
                          <option key={evt} value={evt}>
                            {evt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#160824] mb-1.5">
                        Phone Number *
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
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#160824]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#160824] mb-1.5">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+91 98450 00000"
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#160824]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#160824] mb-1.5">
                        Bengaluru Locality *
                      </label>
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#160824]"
                      >
                        {BENGALURU_LOCALITIES.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#160824] mb-1.5">
                        Advance Payment to Reserve (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={netPayable}
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(Number(e.target.value))}
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF]/60 text-sm font-mono-num focus:outline-none focus:border-[#160824]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#160824] mb-1.5">
                      Complete Event / Home / Studio Visit Address *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Flat / House No., Apartment / Venue Name, Street, Landmark, Bengaluru Pin Code"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#160824]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#160824] mb-1.5">
                      Special Notes (Skin Type, Silicone Airbrush Request, Saree Draping, etc.)
                    </label>
                    <textarea
                      rows={2}
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="Optional notes for Subba Lakshmi..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/60 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#160824]"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="min-h-[48px] px-5 py-2.5 rounded-xl border border-[#D6B77A]/60 text-xs sm:text-sm font-semibold text-[#160824] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-initial min-h-[48px] px-7 py-3.5 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#D6B77A] border border-[#D6B77A] text-sm font-bold shadow-lg transition-all cursor-pointer"
                    >
                      {isSubmitting
                        ? 'Confirming Appointment...'
                        : 'Confirm Makeover Booking'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right: Live Booking Summary & Payment Calculator (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-8 shadow-lg border border-[#D6B77A]/45 space-y-5 sticky top-24">
              <div className="flex items-center justify-between border-b border-[#D6B77A]/25 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#160824]">
                    Booking Summary
                  </h3>
                  <p className="text-xs text-[#2A1818]/65">
                    Eden Roses Makeover · By {settings.artistName}
                  </p>
                </div>
                <CalendarIcon className="w-5 h-5 text-[#B76E79]" />
              </div>

              {/* Selected Date & Slot Card */}
              <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/50 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="text-[#2A1818]/60 block text-xs">Selected Slot</span>
                  <span className="font-bold text-[#160824] font-mono-num">
                    {selectedDate} · {selectedTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
                  className="text-xs font-semibold text-[#B76E79] underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-[#2A1818]/60 py-4 text-center">
                    No services selected yet. Choose from packages above.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#160824] truncate">
                          {item.name}
                        </p>
                        <p className="font-mono-num text-xs text-[#2A1818]/65">
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

              {/* 1-Tap Luxury Offer Chips + Promo Input */}
              <div className="space-y-3 pt-2 border-t border-[#D6B77A]/25">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-[#B76E79] flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Tap Offer:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => applyCodeValue('BRIDAL500')}
                    className="px-2.5 py-1 rounded-lg bg-[#FFF8EF] hover:bg-[#F6DDE2]/60 border border-[#D6B77A]/50 text-[11px] font-mono-num font-semibold text-[#160824] cursor-pointer"
                  >
                    BRIDAL500 (-₹500)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCodeValue('EDEN10')}
                    className="px-2.5 py-1 rounded-lg bg-[#FFF8EF] hover:bg-[#F6DDE2]/60 border border-[#D6B77A]/50 text-[11px] font-mono-num font-semibold text-[#160824] cursor-pointer"
                  >
                    EDEN10 (-10%)
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code or ₹ discount"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF] text-xs focus:outline-none"
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

              {/* Royal Plum & Gold Totals Breakdown */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#160824] text-white border border-[#D6B77A]/50 space-y-2 text-sm">
                <div className="flex justify-between text-white/80 text-xs">
                  <span>Items Subtotal</span>
                  <span className="font-mono-num">₹{itemsSubtotal}</span>
                </div>
                <div className="flex justify-between text-[#F6DDE2] text-xs">
                  <span>Privilege Discount</span>
                  <span className="font-mono-num">-₹{effectiveDiscount}</span>
                </div>
                <div className="flex justify-between text-[#D6B77A] text-xs">
                  <span>Advance Payment</span>
                  <span className="font-mono-num">₹{effectiveAdvance}</span>
                </div>
                <div className="pt-2.5 border-t border-white/15 flex justify-between items-baseline font-bold text-base">
                  <span>Balance at Appointment</span>
                  <span className="font-mono-num text-xl text-[#D6B77A]">
                    ₹{remainingAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. STUDIO LOCATION & INSTANT CALLBACK SECTION */}
      <section id="contact" className="py-14 sm:py-20 lg:py-24 bg-white border-t border-[#D6B77A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Visit Our Bengaluru Studio
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#160824]">
                {settings.makeupBrand} — {settings.businessName}
              </h2>
              <p className="text-sm sm:text-base text-[#2A1818]/75 leading-relaxed">
                Conveniently located in C V Raman Nagar / Nagavarapalya, Bengaluru. Reach
                out for bridal consultations, trial sessions, or unisex salon appointments.
              </p>

              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/40 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#160824] text-[#D6B77A] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B76E79]">
                      Primary Studio Address (C V Raman Nagar / Nagavarapalya)
                    </p>
                    <p className="text-sm font-medium text-[#160824] mt-0.5">
                      {settings.address}
                    </p>
                    <a
                      href={settings.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B76E79] hover:underline mt-2"
                    >
                      <span>Open Directions in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/40 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#160824] text-[#D6B77A] flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B76E79]">
                      Direct Studio Phone &amp; WhatsApp Lines
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm font-bold font-mono-num text-[#160824]">
                      <a
                        href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
                        className="hover:text-[#B76E79]"
                      >
                        {settings.phonePrimary}
                      </a>
                      <span>·</span>
                      <a
                        href={`tel:${settings.phoneSecondary.replace(/\s+/g, '')}`}
                        className="hover:text-[#B76E79]"
                      >
                        {settings.phoneSecondary}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/40 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#160824] text-[#D6B77A] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B76E79]">
                      Studio Hours &amp; Venue Travel
                    </p>
                    <p className="text-sm text-[#160824] font-medium mt-0.5">
                      {settings.openingHours}
                    </p>
                    <p className="text-xs text-[#2A1818]/70 mt-1">
                      Service Area: {settings.serviceArea}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Consultation Callback Card */}
            <div className="lg:col-span-6 bg-[#FFF8EF] rounded-3xl p-6 sm:p-8 border border-[#D6B77A]/50 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B76E79]">
                  Direct Bridal Desk
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#160824] mt-0.5">
                  Request an Instant Callback or Custom Bridal Quote
                </h3>
              </div>

              {contactSent ? (
                <div className="p-6 rounded-2xl bg-white border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="font-display text-2xl font-bold text-[#160824]">
                    Thank You! Your Details Have Been Received.
                  </p>
                  <p className="text-xs text-[#2A1818]/75">
                    Subba Lakshmi&apos;s team will call you shortly, or you can chat with
                    us immediately on WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSent(false)}
                    className="px-4 py-2 rounded-xl bg-[#160824] text-[#D6B77A] text-xs font-semibold"
                  >
                    Send Another Inquiry
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
                      address: inquiryLocality.trim() || 'Bengaluru',
                      locality: inquiryLocality.trim() || 'C V Raman Nagar',
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
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="Your Full Name *"
                      className="w-full min-h-[46px] px-4 py-3 rounded-xl bg-white border border-[#D6B77A]/50 text-sm focus:outline-none focus:border-[#160824]"
                    />
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="Phone / WhatsApp Number *"
                      className="w-full min-h-[46px] px-4 py-3 rounded-xl bg-white border border-[#D6B77A]/50 text-sm focus:outline-none focus:border-[#160824]"
                    />
                  </div>
                  <input
                    type="text"
                    value={inquiryLocality}
                    onChange={(e) => setInquiryLocality(e.target.value)}
                    placeholder="Event Date & Locality in Bengaluru"
                    className="w-full min-h-[46px] px-4 py-3 rounded-xl bg-white border border-[#D6B77A]/50 text-sm focus:outline-none focus:border-[#160824]"
                  />
                  <textarea
                    rows={3}
                    required
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Tell us about your bridal, engagement, party, or salon service requirements..."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6B77A]/50 text-sm focus:outline-none focus:border-[#160824]"
                  />
                  <button
                    type="submit"
                    className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#D6B77A] border border-[#D6B77A]/70 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Request Instant Callback
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 10. ROYAL PLUM & GOLD LUXURY FOOTER */}
      <footer className="bg-[#160824] text-[#FFF8EF] py-14 border-t border-[#D6B77A]/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-14 rounded-xl bg-[#160824] border border-[#D6B77A]/70 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                  <SmartImage
                    src={settings.footerLogoUrl}
                    alt={settings.businessName}
                    fit="cover"
                    className="w-full h-full object-center scale-110"
                  />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#D6B77A]">
                    {settings.makeupBrand}
                  </p>
                  <p className="text-xs text-[#F6DDE2]">
                    By {settings.artistName} · {settings.businessName}
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-white/75 max-w-md leading-relaxed">
                {settings.description}
              </p>
              <p className="text-xs text-[#D6B77A]">
                Official Website:{' '}
                <a
                  href={settings.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {settings.websiteUrl}
                </a>
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="font-display text-lg font-bold text-[#D6B77A]">Explore</p>
              <ul className="space-y-2 text-xs text-white/80">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('packages')}
                    className="hover:text-[#D6B77A] cursor-pointer"
                  >
                    Bridal &amp; Styling Packages
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('services')}
                    className="hover:text-[#D6B77A] cursor-pointer"
                  >
                    All Salon &amp; Makeup Services
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('gallery')}
                    className="hover:text-[#D6B77A] cursor-pointer"
                  >
                    Original Bridal Portfolio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('about')}
                    className="hover:text-[#D6B77A] cursor-pointer"
                  >
                    Meet Subba Lakshmi
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('booking')}
                    className="hover:text-[#D6B77A] cursor-pointer"
                  >
                    Book Online Appointment
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-display text-lg font-bold text-[#D6B77A]">
                C V Raman Nagar Studio
              </p>
              <p className="text-xs text-white/80 leading-relaxed">{settings.address}</p>
              <p className="text-xs text-white/80 pt-1 font-mono-num">
                Phone: {settings.phonePrimary} / {settings.phoneSecondary}
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <p>
              © {new Date().getFullYear()} {settings.businessName} ({settings.makeupBrand}{' '}
              by {settings.artistName}). All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span>Nagavarapalya / C V Raman Nagar, Bengaluru 560093</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  navigate('/admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-white/45 hover:text-[#D6B77A] transition-colors cursor-pointer"
                title="Staff Portal"
              >
                Staff Login
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* DESKTOP FLOATING WHATSAPP CTA */}
      <a
        href={`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
          'Hello Subba Lakshmi! I would like to inquire about booking a makeover appointment at Eden Roses Makeover.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="hidden lg:flex fixed bottom-6 right-6 z-40 h-13 px-5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-xl items-center gap-2.5 text-sm font-semibold transition-transform hover:scale-105"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span>WhatsApp Studio</span>
      </a>

      {/* MOBILE STICKY BOTTOM LUXURY ACTION BAR (Native App Ergonomics on < lg) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 royal-plum-glass border-t border-[#D6B77A]/50 px-3.5 py-2.5 shadow-[0_-8px_30px_rgba(22,8,36,0.35)]">
        <div className="flex items-center justify-between gap-2.5 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="text-left min-w-0 flex-1 py-1"
          >
            <span className="text-[10px] uppercase tracking-wider text-[#D6B77A] font-semibold block">
              {totalCartItems} Service(s) Selected
            </span>
            <span className="font-mono-num text-base font-bold text-white block truncate">
              ₹{netPayable}{' '}
              <span className="text-[11px] font-normal text-white/70">
                (Adv ₹{effectiveAdvance})
              </span>
            </span>
          </button>

          <a
            href={`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
              'Hello Subba Lakshmi! I would like to inquire about booking a makeover appointment at Eden Roses Makeover.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Studio"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
          </a>

          <button
            type="button"
            onClick={() => {
              setBookingStep(2);
              scrollToSection('booking');
            }}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F5E2B8] to-[#D6B77A] text-[#160824] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md"
          >
            <span>Book Slot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SLIDE-OVER CART DRAWER */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-[#FFFDF9] h-full shadow-2xl flex flex-col justify-between p-5 sm:p-6 overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#D6B77A]/30 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#160824]">
                    Your Makeover Selection
                  </h3>
                  <p className="text-xs text-[#2A1818]/65">
                    {totalCartItems} service(s) selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white border border-stone-200 text-[#160824] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-[#B76E79]/50 mx-auto" />
                  <p className="text-sm text-[#2A1818]/75">Your booking cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#D6B77A]/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#160824] truncate">
                          {item.name}
                        </p>
                        <p className="font-mono-num text-xs text-[#B76E79]">
                          ₹{item.price} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-[#FFF8EF] border border-[#D6B77A]/40 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono-num text-xs font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#160824] text-[#D6B77A] flex items-center justify-center cursor-pointer"
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

            <div className="pt-4 border-t border-[#D6B77A]/30 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#2A1818]/70">Subtotal</span>
                  <span className="font-mono-num font-bold">₹{itemsSubtotal}</span>
                </div>
                <div className="flex justify-between text-xs text-[#B76E79]">
                  <span>Discount</span>
                  <span className="font-mono-num">-₹{effectiveDiscount}</span>
                </div>
                <div className="flex justify-between text-xs text-[#2A1818]/75">
                  <span>Advance Payment</span>
                  <span className="font-mono-num">₹{effectiveAdvance}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-[#D6B77A]/25">
                  <span>Remaining Balance</span>
                  <span className="font-mono-num text-[#160824]">₹{remainingAmount}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  setBookingStep(2);
                  scrollToSection('booking');
                }}
                className="w-full py-3.5 rounded-xl bg-[#160824] hover:bg-[#27103d] text-[#D6B77A] border border-[#D6B77A]/60 font-semibold text-sm cursor-pointer"
              >
                Proceed to Date &amp; Time Selection
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
          <div className="max-w-lg w-full bg-[#FFFDF9] rounded-3xl p-6 sm:p-8 border-2 border-[#D6B77A] shadow-2xl space-y-6 my-8">
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

            <div className="bg-white rounded-2xl p-5 border border-[#D6B77A]/45 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-[#2A1818]/65">Customer Name</span>
                <span className="font-semibold text-[#160824]">
                  {confirmedBooking.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2A1818]/65">Date &amp; Time</span>
                <span className="font-mono-num font-semibold text-[#160824]">
                  {confirmedBooking.date} · {confirmedBooking.time}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#2A1818]/65 shrink-0">Address</span>
                <span className="font-medium text-[#160824] text-right">
                  {confirmedBooking.address}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-100">
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
                <div className="pt-2 border-t border-stone-100 text-xs space-y-1 text-[#2A1818]/75">
                  <p>Event Type: {confirmedBooking.eventType}</p>
                  <p>Phone: {confirmedBooking.phone}</p>
                  <p>Status: {confirmedBooking.status}</p>
                  {confirmedBooking.notes && <p>Notes: {confirmedBooking.notes}</p>}
                </div>
              )}

              <div className="pt-3 border-t border-[#D6B77A]/25 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#2A1818]/70">Total Amount</span>
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
                <div className="flex justify-between font-bold text-base text-[#160824] pt-1">
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
                  className="py-3 rounded-xl bg-white border border-[#D6B77A] text-[#160824] text-xs font-semibold cursor-pointer"
                >
                  {showBookingDetailsModal ? 'Hide Extra Details' : 'View Booking Details'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedBooking(null);
                    setShowBookingDetailsModal(false);
                    setBookingStep(1);
                    scrollToSection('home');
                  }}
                  className="py-3 rounded-xl bg-[#160824] text-[#D6B77A] text-xs font-semibold cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
