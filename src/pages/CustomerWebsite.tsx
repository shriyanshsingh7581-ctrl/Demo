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
  UserCheck,
  ArrowRight,
  Menu,
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

  const handleApplyDiscountCode = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'BRIDAL500' || code === 'EDEN500') {
      setDiscountAmount(500);
    } else if (code === 'EDEN10') {
      setDiscountAmount(Math.round(itemsSubtotal * 0.1));
    } else if (!isNaN(Number(code)) && Number(code) > 0) {
      setDiscountAmount(Math.min(Number(code), itemsSubtotal));
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

  const currentHeroImg = heroImages[heroSlideIdx % heroImages.length];

  return (
    <div className="min-h-screen bg-[#FFF8EF] text-[#321E1E] relative">
      {/* 1. HEADER (Strict 3-Zone Top Bar Contract) */}
      <header className="sticky top-0 z-40 luxury-glass border-b border-[#B76E79]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark + Original Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
            className="flex items-center gap-3 whitespace-nowrap shrink-0 group"
          >
            <div className="w-16 h-12 rounded-xl bg-[#160824] border border-[#D6B77A]/60 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
              <SmartImage
                src={settings.logoUrl}
                alt={settings.makeupBrand}
                fit="cover"
                eager
                className="w-full h-full object-center scale-110"
              />
            </div>
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#321E1E]">
              {settings.makeupBrand}
            </span>
          </a>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#321E1E]/85">
            {[
              { label: 'Home', id: 'home' },
              { label: 'About', id: 'about' },
              { label: 'Services', id: 'services' },
              { label: 'Bridal Packages', id: 'packages' },
              { label: 'Gallery', id: 'gallery' },
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

          {/* Zone 3: Primary Action CTA + Cart Drawer Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label="Open Booking Cart"
              className="relative min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-[#B76E79]/30 bg-white/90 hover:bg-[#F6DDE2]/50 text-[#321E1E] flex items-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[#B76E79]" />
              <span className="font-mono-num text-xs font-semibold">
                {totalCartItems}
              </span>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('booking')}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Book Appointment
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle Menu"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#B76E79]/30 text-[#321E1E]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFF8EF] border-b border-[#B76E79]/20 px-4 pt-3 pb-5 space-y-2">
            {[
              { label: 'Home', id: 'home' },
              { label: 'About Subba Lakshmi', id: 'about' },
              { label: 'All Services', id: 'services' },
              { label: 'Bridal Packages', id: 'packages' },
              { label: 'Portfolio & Gallery', id: 'gallery' },
              { label: 'Booking Calendar', id: 'calendar' },
              { label: 'Contact Studio', id: 'contact' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#321E1E] hover:bg-[#F6DDE2]/60"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => scrollToSection('booking')}
                className="flex-1 py-2.5 rounded-xl bg-[#B76E79] text-white text-sm font-semibold text-center"
              >
                Book Appointment
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2.5 rounded-xl bg-[#321E1E] text-[#D6B77A] text-sm font-semibold"
              >
                Partner App
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section
        id="home"
        className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-gradient-to-b from-[#F6DDE2]/45 via-[#FFF8EF] to-[#FFF8EF]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Editorial Column */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-[#B76E79]">
                <span>By {settings.artistName}</span>
                <span aria-hidden="true">·</span>
                <span>C V Raman Nagar &amp; Nagavarapalya, Bengaluru</span>
                <span aria-hidden="true">·</span>
                <span>Bridal &amp; Luxury Makeover Studio</span>
              </div>

              <h1
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#321E1E] leading-[1.08] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Your Beauty, Our Artistry
              </h1>

              <p className="text-base sm:text-lg text-[#321E1E]/80 leading-relaxed max-w-2xl">
                Experience the magic of professional bridal makeup with{' '}
                <strong className="font-semibold text-[#321E1E]">
                  Eden Roses Makeover by Subba Lakshmi
                </strong>
                . Discover elegant makeup, personalized styling, and unforgettable bridal
                transformations in Bengaluru.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('booking')}
                  className="px-7 py-3.5 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white font-semibold text-sm sm:text-base shadow-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Book Appointment Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('packages')}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F6DDE2]/40 text-[#321E1E] border border-[#D6B77A] font-semibold text-sm sm:text-base transition-all cursor-pointer whitespace-nowrap"
                >
                  Explore Packages
                </button>
              </div>

              {/* Studio Highlights Bar */}
              <div className="pt-6 border-t border-[#B76E79]/20 grid grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[#321E1E] tabular-nums">
                    100%
                  </p>
                  <p className="text-xs text-[#321E1E]/70 mt-0.5">
                    Authentic HD &amp; Silicone Airbrush Products
                  </p>
                </div>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[#321E1E] tabular-nums">
                    ₹599+
                  </p>
                  <p className="text-xs text-[#321E1E]/70 mt-0.5">
                    Curated Draping, Hair &amp; Bridal Packages
                  </p>
                </div>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[#321E1E] tabular-nums">
                    5.0 ★
                  </p>
                  <p className="text-xs text-[#321E1E]/70 mt-0.5">
                    Loved by Bengaluru Brides &amp; Families
                  </p>
                </div>
              </div>
            </div>

            {/* Right Original Eden Roses Photography Frame */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative rounded-3xl overflow-hidden bg-white p-3 shadow-xl border border-[#D6B77A]/40 flex-1 flex flex-col">
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden flex-1">
                  <SmartImage
                    src={currentHeroImg.url}
                    alt={currentHeroImg.alt}
                    eager
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#F6DDE2] font-medium">
                        Original Eden Roses Bridal Portfolio
                      </p>
                      <p className="font-display text-xl font-semibold">
                        {currentHeroImg.alt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {heroImages.map((img, i) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setHeroSlideIdx(i)}
                          aria-label={`Show slide ${i + 1}`}
                          className={`h-2 rounded-full transition-all ${
                            heroSlideIdx % heroImages.length === i
                              ? 'w-6 bg-[#D6B77A]'
                              : 'w-2 bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT SECTION ("Meet Your Makeup Artist — Subba Lakshmi") */}
      <section id="about" className="py-16 lg:py-24 bg-white border-y border-[#B76E79]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Original Portfolio Collage */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="rounded-2xl overflow-hidden shadow-md border border-[#D6B77A]/30 aspect-[3/4]">
                  <SmartImage
                    src={EDEN_ROSES_ABOUT_IMAGES[0].url}
                    alt={EDEN_ROSES_ABOUT_IMAGES[0].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl bg-[#FFF8EF] p-5 border border-[#D6B77A]/40">
                  <p className="font-display text-xl font-bold text-[#321E1E]">
                    Eden Roses Unisex Salon
                  </p>
                  <p className="text-xs text-[#321E1E]/75 mt-1 leading-relaxed">
                    Primary Bridal Makeup Studio in C V Raman Nagar / Nagavarapalya,
                    Bengaluru.
                  </p>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6 pt-6">
                <div className="rounded-2xl overflow-hidden shadow-md border border-[#D6B77A]/30 aspect-square">
                  <SmartImage
                    src={EDEN_ROSES_ABOUT_IMAGES[1].url}
                    alt={EDEN_ROSES_ABOUT_IMAGES[1].alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md border border-[#D6B77A]/30 aspect-[4/3]">
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
                Meet Your Makeup Artist
              </div>
              <h2
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#321E1E]"
                style={{ textWrap: 'balance' }}
              >
                {settings.artistName}
              </h2>
              <div className="space-y-4 text-[#321E1E]/85 text-base leading-relaxed">
                <p>
                  At <strong>Eden Roses Makeover</strong>, beauty is more than makeup. It
                  is about confidence, individuality, and creating unforgettable memories.
                </p>
                <p>
                  <strong>Subba Lakshmi</strong> specializes in professional makeup
                  artistry, bridal transformations, hairstyling, and personalized beauty
                  services designed to complement every client&apos;s personality and
                  special occasion.
                </p>
                <p>
                  From traditional bridal looks to modern glamorous styles, every makeover
                  is thoughtfully customized.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#B76E79]/20">
                  <p className="font-display text-lg font-bold text-[#321E1E]">
                    Excellence
                  </p>
                  <p className="text-xs text-[#321E1E]/75 mt-1">
                    Striving for the highest standards in bridal &amp; HD artistry.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#B76E79]/20">
                  <p className="font-display text-lg font-bold text-[#321E1E]">Care</p>
                  <p className="text-xs text-[#321E1E]/75 mt-1">
                    Putting your skin comfort first with genuine hospitality.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#B76E79]/20">
                  <p className="font-display text-lg font-bold text-[#321E1E]">
                    Innovation
                  </p>
                  <p className="text-xs text-[#321E1E]/75 mt-1">
                    Offering the latest silicone airbrush &amp; advance hairstyling trends.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('packages')}
                  className="px-6 py-3 rounded-xl bg-[#321E1E] hover:bg-[#4a2d2d] text-[#FFF8EF] text-sm font-semibold transition-colors cursor-pointer"
                >
                  View Signature Packages
                </button>
                <a
                  href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
                  className="px-5 py-3 rounded-xl border border-[#B76E79]/40 text-[#321E1E] hover:bg-[#F6DDE2]/40 text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#B76E79]" />
                  <span>{settings.phonePrimary}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BRIDAL & MAKEUP PACKAGES SECTION (Interactive Booking Cards + Cart) */}
      <section id="packages" className="py-16 lg:py-24 bg-[#FFF8EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Curated Makeover Packages
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#321E1E] mt-1"
                style={{ textWrap: 'balance' }}
              >
                Bridal, Party &amp; Advance Styling Packages
              </h2>
              <p className="text-sm sm:text-base text-[#321E1E]/75 mt-2 max-w-2xl">
                Select one or multiple packages to build your personalized makeover booking.
                Airbrush makeup upgrades can be requested for any party or bridal package.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="self-start md:self-auto px-5 py-3 rounded-xl bg-[#321E1E] text-white text-sm font-semibold flex items-center gap-2.5 shadow-sm hover:bg-[#492c2c] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 text-[#D6B77A]" />
              <span>Selected Services ({totalCartItems})</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-[#D6B77A]">₹{itemsSubtotal}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {packagesList.map((pkg) => {
              const qty = getItemQuantity(pkg.id);
              return (
                <div
                  key={pkg.id}
                  className={`luxury-card-3d rounded-2xl bg-white overflow-hidden border transition-all flex flex-col ${
                    qty > 0
                      ? 'border-[#B76E79] ring-2 ring-[#B76E79]/25'
                      : 'border-[#D6B77A]/35'
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F6DDE2]/30">
                    <SmartImage
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                    {qty > 0 && (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-[#321E1E]/90 text-[#D6B77A] text-xs font-semibold">
                        In Cart × {qty}
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#321E1E]/60">
                        <span>{pkg.category}</span>
                        {pkg.duration && <span>{pkg.duration}</span>}
                      </div>
                      <h3 className="font-display text-2xl font-bold text-[#321E1E] leading-snug">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-[#321E1E]/75 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#B76E79]/15 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-[#321E1E]/60 block">Package Price</span>
                        <span className="font-mono-num text-xl font-bold text-[#321E1E]">
                          ₹{pkg.price}
                        </span>
                      </div>

                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleAddOrIncrement(pkg)}
                          className="px-4 py-2.5 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add to Booking</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-[#FFF8EF] border border-[#B76E79]/40 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(pkg.id, -1)}
                            aria-label="Decrease quantity"
                            className="w-8 h-8 rounded-lg bg-white hover:bg-[#F6DDE2] text-[#321E1E] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono-num text-sm font-bold px-2">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(pkg.id, 1)}
                            aria-label="Increase quantity"
                            className="w-8 h-8 rounded-lg bg-[#B76E79] text-white flex items-center justify-center transition-colors cursor-pointer"
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
      </section>

      {/* 5. COMPLETE SALON & MAKEUP SERVICES CATALOG */}
      <section id="services" className="py-16 lg:py-24 bg-white border-t border-[#B76E79]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
              Official Eden Roses Service Catalog
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#321E1E] mt-1"
              style={{ textWrap: 'balance' }}
            >
              Makeup Artistry, Hair, Skin &amp; Permanent Beauty
            </h2>
            <p className="text-sm sm:text-base text-[#321E1E]/75 mt-2">
              Explore all official services offered at Eden Roses Makeover &amp; Unisex Salon
              in C V Raman Nagar, Bengaluru. Airbrush Makeup can be requested for bridal and
              party makeup services at an additional cost.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8">
            {serviceCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveServiceTab(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeServiceTab === cat
                    ? 'bg-[#321E1E] text-[#D6B77A] shadow-sm'
                    : 'bg-[#FFF8EF] text-[#321E1E]/80 hover:bg-[#F6DDE2]/50 border border-[#D6B77A]/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredServices.map((srv) => {
              const qty = getItemQuantity(srv.id);
              return (
                <div
                  key={srv.id}
                  className="luxury-card-3d rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/35 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-white">
                    <SmartImage
                      src={srv.image}
                      alt={srv.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="text-[11px] font-medium text-[#B76E79]">
                        {srv.category}
                        {srv.airbrushAvailable ? ' · Airbrush Option' : ''}
                      </p>
                      <h3 className="font-display text-xl font-bold text-[#321E1E] mt-1">
                        {srv.name}
                      </h3>
                      <p className="text-xs text-[#321E1E]/75 mt-1.5 leading-relaxed line-clamp-3">
                        {srv.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#B76E79]/15 flex items-center justify-between gap-2">
                      {srv.price !== null ? (
                        <span className="font-mono-num text-base font-bold text-[#321E1E]">
                          ₹{srv.price}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#321E1E]/70">
                          Custom Consultation
                        </span>
                      )}

                      {srv.price !== null ? (
                        <button
                          type="button"
                          onClick={() => handleAddOrIncrement(srv)}
                          className="px-3.5 py-2 rounded-lg bg-[#B76E79] hover:bg-[#9f5964] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {qty > 0 ? `Added (${qty})` : '+ Select'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSpecialNotes((prev) =>
                              prev.includes(srv.name)
                                ? prev
                                : `${prev ? prev + ' | ' : ''}Inquiry for: ${srv.name}`
                            );
                            scrollToSection('booking');
                          }}
                          className="px-3.5 py-2 rounded-lg border border-[#321E1E]/30 hover:bg-[#321E1E] hover:text-white text-[#321E1E] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Book Consultation
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

      {/* 6 & 7. MAKEUP PORTFOLIO & ORIGINAL EDEN ROSES GALLERY */}
      <section
        id="gallery"
        className="py-16 lg:py-24 bg-gradient-to-b from-[#FFF8EF] to-[#F6DDE2]/35"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Authentic Eden Roses Portfolio
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#321E1E] mt-1"
                style={{ textWrap: 'balance' }}
              >
                Bridal Transformations &amp; Studio Gallery
              </h2>
              <p className="text-sm sm:text-base text-[#321E1E]/75 mt-2 max-w-2xl">
                Every photograph below is an original bridal, engagement, party makeover,
                hairstyling, or salon capture from Eden Roses Makeover by Subba Lakshmi.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
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
                      ? 'bg-[#B76E79] text-white shadow-sm'
                      : 'bg-white text-[#321E1E]/80 hover:bg-[#F6DDE2]/50 border border-[#D6B77A]/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredGallery.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxImage(img)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-sm border border-[#D6B77A]/30 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
              >
                <SmartImage
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-[11px] text-[#F6DDE2] font-medium">
                    {img.galleryCategory || img.category}
                  </span>
                  <p className="font-display text-base font-semibold text-white leading-snug mt-0.5">
                    {img.alt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 8 & 9. WHY CHOOSE US & CLIENT TESTIMONIALS */}
      <section className="py-16 lg:py-24 bg-white border-t border-[#B76E79]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* Why Choose Us */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                The Eden Roses Promise
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-[#321E1E] mt-1"
                style={{ textWrap: 'balance' }}
              >
                Why Bengaluru Brides Choose Subba Lakshmi
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    className="p-6 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/35 space-y-3"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#F6DDE2] text-[#B76E79] flex items-center justify-center">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#321E1E]">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-[#321E1E]/75 leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testimonials */}
          <div>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Verified Client Love
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-[#321E1E] mt-1"
                style={{ textWrap: 'balance' }}
              >
                Real Stories from Our Brides &amp; Clients
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
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
                  className="p-6 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/35 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-[#D6B77A]">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-[#321E1E]/85 leading-relaxed italic">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-[#B76E79]/15">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#B76E79]/40 shrink-0">
                      <SmartImage
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-[#321E1E]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#321E1E]/65">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 10 & 11. INTERACTIVE BOOKING CALENDAR + MULTI-STEP BOOKING FORM */}
      <section
        id="booking"
        className="py-16 lg:py-24 bg-gradient-to-b from-[#F6DDE2]/40 via-[#FFF8EF] to-[#FFF8EF] border-t border-[#B76E79]/20"
      >
        <div id="calendar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
              Real-Time Studio &amp; Venue Scheduling
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#321E1E] mt-1"
              style={{ textWrap: 'balance' }}
            >
              Book Your Makeover Appointment
            </h2>
            <p className="text-sm sm:text-base text-[#321E1E]/75 mt-2">
              Live availability synchronized with Subba Lakshmi&apos;s Partner Calendar.
              Choose your packages, check available dates &amp; time slots, and receive
              instant confirmation.
            </p>
          </div>

          {/* Stepper Bar */}
          <div className="max-w-3xl mx-auto mb-10 grid grid-cols-3 gap-3">
            {[
              { step: 1 as const, title: '1. Select Services' },
              { step: 2 as const, title: '2. Date & Time Slot' },
              { step: 3 as const, title: '3. Client Details' },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => setBookingStep(item.step)}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  bookingStep === item.step
                    ? 'bg-[#321E1E] text-[#D6B77A] border-[#321E1E] shadow-sm'
                    : bookingStep > item.step
                    ? 'bg-[#F6DDE2]/70 text-[#321E1E] border-[#B76E79]/40'
                    : 'bg-white text-[#321E1E]/70 border-[#D6B77A]/30'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {formError && (
            <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Main Interactive Area (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#D6B77A]/40">
              {/* STEP 1: SELECT SERVICES */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#B76E79]/15 pb-4">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-[#321E1E]">
                        Step 1: Select Makeup &amp; Styling Packages
                      </h3>
                      <p className="text-xs text-[#321E1E]/70 mt-0.5">
                        Add multiple services or adjust quantities for bridesmaids &amp;
                        family members.
                      </p>
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-[#B76E79]">
                      {totalCartItems} selected
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {services
                      .filter((s) => s.price !== null)
                      .map((srv) => {
                        const qty = getItemQuantity(srv.id);
                        return (
                          <div
                            key={srv.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                              qty > 0
                                ? 'bg-[#FFF8EF] border-[#B76E79]'
                                : 'bg-white border-stone-200 hover:border-[#D6B77A]'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#F6DDE2]/30">
                                <SmartImage
                                  src={srv.image}
                                  alt={srv.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-display text-lg font-bold text-[#321E1E] truncate">
                                  {srv.name}
                                </p>
                                <p className="font-mono-num text-xs font-semibold text-[#B76E79]">
                                  ₹{srv.price}
                                </p>
                              </div>
                            </div>

                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAddOrIncrement(srv)}
                                className="px-4 py-2 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white text-xs font-semibold shrink-0 cursor-pointer"
                              >
                                + Select
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(srv.id, -1)}
                                  className="w-8 h-8 rounded-lg border border-[#B76E79]/40 flex items-center justify-center text-[#321E1E] hover:bg-[#F6DDE2] cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono-num text-sm font-bold w-5 text-center">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(srv.id, 1)}
                                  className="w-8 h-8 rounded-lg bg-[#B76E79] text-white flex items-center justify-center cursor-pointer"
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
                      className="px-6 py-3 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Date &amp; Time</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: INTERACTIVE MONTHLY CALENDAR & TIME SLOTS */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#B76E79]/15 pb-4">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-[#321E1E]">
                        Step 2: Choose Appointment Date &amp; Time
                      </h3>
                      <p className="text-xs text-[#321E1E]/70 mt-0.5">
                        Real-time availability prevents duplicate bookings.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
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
                        className="p-2 rounded-lg border border-[#D6B77A]/50 hover:bg-[#FFF8EF] cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-display text-lg font-bold min-w-[130px] text-center">
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
                        className="p-2 rounded-lg border border-[#D6B77A]/50 hover:bg-[#FFF8EF] cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-[#321E1E]/60">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
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
                              ? 'bg-[#B76E79] text-white font-bold shadow-sm cursor-pointer'
                              : 'bg-[#FFF8EF] hover:bg-[#F6DDE2]/60 text-[#321E1E] border border-[#D6B77A]/30 cursor-pointer'
                          }`}
                        >
                          <span className="font-mono-num text-xs sm:text-sm">
                            {cell.dayNumber}
                          </span>
                          {cell.bookedCount > 0 && (
                            <span
                              className={`text-[9px] font-medium ${
                                isSelected ? 'text-[#FFF8EF]' : 'text-[#B76E79]'
                              }`}
                            >
                              {cell.isFullyBooked ? 'Full' : `${cell.bookedCount} booked`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots Selection */}
                  <div className="pt-4 border-t border-[#B76E79]/15 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#321E1E] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#B76E79]" />
                        <span>Available Time Slots for {selectedDate}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                                ? 'bg-[#321E1E] border-[#321E1E] text-[#D6B77A] shadow-sm cursor-pointer'
                                : 'bg-[#FFF8EF] border-[#D6B77A]/40 hover:border-[#B76E79] text-[#321E1E] cursor-pointer'
                            }`}
                          >
                            <div className="font-mono-num text-xs sm:text-sm font-bold">
                              {slot.time}
                            </div>
                            <div className="text-[11px] mt-0.5">
                              {slot.available ? 'Available' : 'Booked / Unavailable'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="px-5 py-2.5 rounded-xl border border-[#B76E79]/40 text-xs sm:text-sm font-semibold text-[#321E1E] cursor-pointer"
                    >
                      Back to Services
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="px-6 py-3 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Client Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CUSTOMER DETAILS FORM */}
              {bookingStep === 3 && (
                <form onSubmit={handleConfirmBookingSubmit} className="space-y-5">
                  <div className="border-b border-[#B76E79]/15 pb-4">
                    <h3 className="font-display text-2xl font-bold text-[#321E1E]">
                      Step 3: Customer &amp; Event Details
                    </h3>
                    <p className="text-xs text-[#321E1E]/70 mt-0.5">
                      Enter your contact and venue details in Bengaluru to confirm your
                      appointment.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#321E1E] mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g., Prarthana Rao"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#B76E79]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#321E1E] mb-1.5">
                        Event Type *
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#B76E79]"
                      >
                        {EVENT_TYPES.map((evt) => (
                          <option key={evt} value={evt}>
                            {evt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#321E1E] mb-1.5">
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
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#B76E79]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#321E1E] mb-1.5">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+91 98450 00000"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#B76E79]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#321E1E] mb-1.5">
                        Bengaluru Locality *
                      </label>
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#B76E79]"
                      >
                        {BENGALURU_LOCALITIES.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#321E1E] mb-1.5">
                        Optional Advance Payment (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={netPayable}
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF]/60 text-sm font-mono-num focus:outline-none focus:border-[#B76E79]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#321E1E] mb-1.5">
                      Complete Event / Home Address *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Flat / House No., Apartment / Venue Name, Street, Landmark, Bengaluru Pin Code"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#B76E79]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#321E1E] mb-1.5">
                      Special Notes (Skin Type, Airbrush Request, Saree Type, etc.)
                    </label>
                    <textarea
                      rows={2}
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="Optional notes for Subba Lakshmi..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF]/60 text-sm focus:outline-none focus:border-[#B76E79]"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="px-5 py-2.5 rounded-xl border border-[#B76E79]/40 text-xs sm:text-sm font-semibold text-[#321E1E] cursor-pointer"
                    >
                      Back to Calendar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-7 py-3.5 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white text-sm font-semibold shadow-md transition-all cursor-pointer"
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
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#D6B77A]/40 space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-[#B76E79]/15 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#321E1E]">
                    Booking Summary
                  </h3>
                  <p className="text-xs text-[#321E1E]/65">
                    Eden Roses Makeover · By {settings.artistName}
                  </p>
                </div>
                <CalendarIcon className="w-5 h-5 text-[#B76E79]" />
              </div>

              {/* Selected Date & Slot Badge */}
              <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D6B77A]/40 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="text-[#321E1E]/60 block text-xs">Appointment Slot</span>
                  <span className="font-semibold text-[#321E1E]">
                    {selectedDate} at {selectedTime}
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
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-[#321E1E]/60 py-4 text-center">
                    No services selected yet. Choose from packages above.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#321E1E] truncate">
                          {item.name}
                        </p>
                        <p className="font-mono-num text-xs text-[#321E1E]/65">
                          {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-num font-bold text-[#321E1E]">
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

              {/* Discount & Advance Inputs */}
              <div className="space-y-3 pt-2 border-t border-[#B76E79]/15">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code (e.g. BRIDAL500) or ₹ discount"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#D6B77A]/50 bg-[#FFF8EF] text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscountCode}
                    className="px-3.5 py-2 rounded-xl bg-[#321E1E] text-[#D6B77A] text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#321E1E]/75">Advance Payment (₹):</span>
                  <input
                    type="number"
                    min={0}
                    max={netPayable}
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 rounded-lg border border-[#D6B77A]/50 bg-[#FFF8EF] text-right font-mono-num font-semibold"
                  />
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-4 rounded-2xl bg-[#321E1E] text-white space-y-2 text-sm">
                <div className="flex justify-between text-white/80 text-xs">
                  <span>Items Subtotal</span>
                  <span className="font-mono-num">₹{itemsSubtotal}</span>
                </div>
                <div className="flex justify-between text-[#F6DDE2] text-xs">
                  <span>Discount Applied</span>
                  <span className="font-mono-num">-₹{effectiveDiscount}</span>
                </div>
                <div className="flex justify-between text-[#D6B77A] text-xs">
                  <span>Advance Payment</span>
                  <span className="font-mono-num">₹{effectiveAdvance}</span>
                </div>
                <div className="pt-2 border-t border-white/15 flex justify-between items-baseline font-bold text-base">
                  <span>Remaining Amount</span>
                  <span className="font-mono-num text-xl text-[#D6B77A]">
                    ₹{remainingAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. CONTACT SECTION */}
      <section id="contact" className="py-16 lg:py-24 bg-white border-t border-[#B76E79]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-semibold tracking-wider text-[#B76E79] uppercase">
                Visit Our Bengaluru Studio
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#321E1E]">
                {settings.makeupBrand} — {settings.businessName}
              </h2>
              <p className="text-sm sm:text-base text-[#321E1E]/75 leading-relaxed">
                Conveniently located in C V Raman Nagar / Nagavarapalya, Bengaluru. Reach
                out for bridal consultations, trial sessions, or salon appointments.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F6DDE2] text-[#B76E79] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B76E79]">
                      Primary Studio Address (C V Raman Nagar / Nagavarapalya)
                    </p>
                    <p className="text-sm font-medium text-[#321E1E] mt-0.5">
                      {settings.address}
                    </p>
                    <a
                      href={settings.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B76E79] hover:underline mt-1.5"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F6DDE2] text-[#B76E79] flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B76E79]">
                      Official Phone &amp; WhatsApp Numbers
                    </p>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm font-semibold text-[#321E1E]">
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

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F6DDE2] text-[#B76E79] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B76E79]">
                      Opening Hours &amp; Service Area
                    </p>
                    <p className="text-sm text-[#321E1E] mt-0.5">{settings.openingHours}</p>
                    <p className="text-xs text-[#321E1E]/70 mt-1">
                      Service Area: {settings.serviceArea}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Consultation Card */}
            <div className="lg:col-span-6 bg-[#FFF8EF] rounded-3xl p-6 sm:p-8 border border-[#D6B77A]/40 space-y-5">
              <h3 className="font-display text-2xl font-bold text-[#321E1E]">
                Request a Bridal Callback or Custom Quote
              </h3>
              {contactSent ? (
                <div className="p-6 rounded-2xl bg-white border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="font-display text-2xl font-bold text-[#321E1E]">
                    Thank You! We Have Received Your Request.
                  </p>
                  <p className="text-xs text-[#321E1E]/75">
                    Subba Lakshmi&apos;s team will contact you shortly, or you can message
                    us directly on WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSent(false)}
                    className="px-4 py-2 rounded-xl bg-[#B76E79] text-white text-xs font-semibold"
                  >
                    Send Another Message
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
                      placeholder="Your Name *"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6B77A]/40 text-sm focus:outline-none focus:border-[#B76E79]"
                    />
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="Phone / WhatsApp Number *"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6B77A]/40 text-sm focus:outline-none focus:border-[#B76E79]"
                    />
                  </div>
                  <input
                    type="text"
                    value={inquiryLocality}
                    onChange={(e) => setInquiryLocality(e.target.value)}
                    placeholder="Event Date & Locality in Bengaluru"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6B77A]/40 text-sm focus:outline-none focus:border-[#B76E79]"
                  />
                  <textarea
                    rows={3}
                    required
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Tell us about your bridal, engagement, party, or salon service requirements..."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#D6B77A]/40 text-sm focus:outline-none focus:border-[#B76E79]"
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#321E1E] hover:bg-[#492c2c] text-[#D6B77A] font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Send Callback Request
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 13. FOOTER */}
      <footer className="bg-[#321E1E] text-[#FFF8EF] py-14 border-t border-[#D6B77A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-14 rounded-xl bg-[#160824] border border-[#D6B77A]/60 overflow-hidden flex items-center justify-center shrink-0">
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
              <p className="font-display text-lg font-bold text-[#D6B77A]">Quick Links</p>
              <ul className="space-y-2 text-xs text-white/80">
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
                    onClick={() => navigate('/admin')}
                    className="hover:text-[#D6B77A] cursor-pointer"
                  >
                    Partner Admin App (PIN: 7777)
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-display text-lg font-bold text-[#D6B77A]">
                C V Raman Nagar Studio
              </p>
              <p className="text-xs text-white/80 leading-relaxed">{settings.address}</p>
              <p className="text-xs text-white/80 pt-1">
                Phone: {settings.phonePrimary} / {settings.phoneSecondary}
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <p>
              © {new Date().getFullYear()} {settings.businessName} ({settings.makeupBrand}{' '}
              by {settings.artistName}). All rights reserved.
            </p>
            <p>Nagavarapalya / C V Raman Nagar, Bengaluru, Karnataka 560093</p>
          </div>
        </div>
      </footer>

      {/* FLOATING MODE SWITCHER (Customer Website | Partner Dashboard) & FLOATING WHATSAPP CTA */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#321E1E]/95 text-white shadow-xl border border-[#D6B77A]/40 backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#B76E79] text-white whitespace-nowrap cursor-pointer"
          >
            Customer Website
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#D6B77A] hover:text-white flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Partner Dashboard</span>
          </button>
        </div>
      </div>

      <a
        href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
          'Hello Subba Lakshmi! I would like to inquire about booking a makeover appointment at Eden Roses Makeover.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-4 right-4 z-40 h-12 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold transition-transform hover:scale-105"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline">WhatsApp Studio</span>
      </a>

      {/* SLIDE-OVER CART DRAWER */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-[#FFF8EF] h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#B76E79]/20 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#321E1E]">
                    Your Makeover Cart
                  </h3>
                  <p className="text-xs text-[#321E1E]/65">
                    {totalCartItems} service(s) selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white border border-stone-200 text-[#321E1E] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-[#B76E79]/50 mx-auto" />
                  <p className="text-sm text-[#321E1E]/75">Your booking cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#D6B77A]/35 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#321E1E] truncate">
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
                          className="w-7 h-7 rounded-lg bg-[#FFF8EF] border border-[#B76E79]/30 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono-num text-xs font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#B76E79] text-white flex items-center justify-center cursor-pointer"
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

            <div className="pt-4 border-t border-[#B76E79]/20 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#321E1E]/70">Subtotal</span>
                  <span className="font-mono-num font-bold">₹{itemsSubtotal}</span>
                </div>
                <div className="flex justify-between text-xs text-[#B76E79]">
                  <span>Discount</span>
                  <span className="font-mono-num">-₹{effectiveDiscount}</span>
                </div>
                <div className="flex justify-between text-xs text-[#321E1E]/75">
                  <span>Advance Payment</span>
                  <span className="font-mono-num">₹{effectiveAdvance}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-[#B76E79]/15">
                  <span>Remaining Balance</span>
                  <span className="font-mono-num text-[#B76E79]">₹{remainingAmount}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  setBookingStep(2);
                  scrollToSection('booking');
                }}
                className="w-full py-3.5 rounded-xl bg-[#B76E79] hover:bg-[#9f5964] text-white font-semibold text-sm cursor-pointer"
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
            className="max-w-3xl w-full bg-[#321E1E] rounded-3xl overflow-hidden border border-[#D6B77A]/40 shadow-2xl"
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
                className="px-5 py-2.5 rounded-xl bg-[#B76E79] text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Book Similar Look
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PART 9: BOOKING CONFIRMATION MODAL */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-[#FFF8EF] rounded-3xl p-6 sm:p-8 border-2 border-[#D6B77A] shadow-2xl space-y-6 my-8">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B76E79]">
                Eden Roses Makeover · By {settings.artistName}
              </p>
              <h3 className="font-display text-3xl font-bold text-[#321E1E]">
                Your Appointment Is Confirmed!
              </h3>
              <p className="font-mono-num text-sm font-bold text-[#B76E79] bg-[#F6DDE2]/60 inline-block px-3.5 py-1 rounded-lg">
                Booking ID: {confirmedBooking.id}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#D6B77A]/40 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-[#321E1E]/65">Customer Name</span>
                <span className="font-semibold text-[#321E1E]">
                  {confirmedBooking.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#321E1E]/65">Date &amp; Time</span>
                <span className="font-mono-num font-semibold text-[#321E1E]">
                  {confirmedBooking.date} · {confirmedBooking.time}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#321E1E]/65 shrink-0">Address</span>
                <span className="font-medium text-[#321E1E] text-right">
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
                <div className="pt-2 border-t border-stone-100 text-xs space-y-1 text-[#321E1E]/75">
                  <p>Event Type: {confirmedBooking.eventType}</p>
                  <p>Phone: {confirmedBooking.phone}</p>
                  <p>Status: {confirmedBooking.status} (Synced with Partner App)</p>
                  {confirmedBooking.notes && <p>Notes: {confirmedBooking.notes}</p>}
                </div>
              )}

              <div className="pt-3 border-t border-[#B76E79]/20 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#321E1E]/70">Total Amount</span>
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
                <div className="flex justify-between font-bold text-base text-[#B76E79] pt-1">
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
                  className="py-3 rounded-xl bg-white border border-[#D6B77A] text-[#321E1E] text-xs font-semibold cursor-pointer"
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
                  className="py-3 rounded-xl bg-[#321E1E] text-[#D6B77A] text-xs font-semibold cursor-pointer"
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
