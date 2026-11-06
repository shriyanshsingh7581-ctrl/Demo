import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Wallet as WalletIcon,
  TrendingUp,
  MoreHorizontal,
  Plus,
  ChevronRight,
  ChevronLeft,
  Delete,
  Lock,
  Globe,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Phone,
  MessageCircle,
  Database,
  Users,
  Tag,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut,
  Cloud,
  Camera,
  Building2,
} from 'lucide-react';
import {
  Booking,
  BusinessSettings,
  CustomerLead,
  PartnerSessionUser,
  ServiceCatalogItem,
  TeamMember,
  authenticatePartnerLogin,
  formatDateISO,
  getBookingById,
  getBookings,
  getBookingsByDate,
  getBusinessSettings,
  getCustomerLeads,
  getDashboardStats,
  getFirebaseConnectionStatus,
  getGalleryImages,
  getOffsetDateISO,
  getServicesCatalog,
  getTeamMembers,
  getTodayISO,
  subscribeToDataUpdates,
  getCustomAreas,
  addCustomArea,
  assignBookingToArtist,
  buildWhatsAppBookingUrl,
} from '../services/bookingStorage';
import { EdenRoseImage } from '../config/edenRosesImages';
import {
  AddBookingModal,
  SelfieUploadModal,
  ServiceFlowGuideModal,
} from '../components/admin/AdminModals';
import { JobDetailsView } from '../components/admin/JobDetailsView';
import { AdminMoreScreen, MoreSectionId } from '../components/admin/AdminMoreScreen';
import { SmartImage } from '../components/SmartImage';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from '../services/firebaseConfig';

type AdminTab = 'dashboard' | 'calendar' | 'wallet' | 'earnings' | 'more';
type JobFilterPill = 'All' | 'Jobs' | 'Visits' | 'Call' | 'Followup' | 'Customers';
type StatCardFilter =
  | 'all'
  | 'today'
  | 'tomorrow'
  | 'upcoming'
  | 'overdue'
  | 'closed'
  | 'report';

const AUTH_SESSION_KEY = 'eden_roses_partner_auth_v1';
const AUTH_USER_KEY = 'eden_roses_partner_user_v1';
const DEMO_PIN = '7777';

export const AdminPartnerApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams<{ bookingId?: string }>();

  // Authentication State (Supports User ID + Password AND 4-Digit PIN)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  });
  const [currentUser, setCurrentUser] = useState<PartnerSessionUser | null>(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PartnerSessionUser;
    } catch {
      return null;
    }
  });
  const [loginMode, setLoginMode] = useState<'credentials' | 'pin'>('credentials');
  const [loginUserId, setLoginUserId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);

  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Live Synchronized Data State (Firebase + LocalStorage)
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings());
  const [customerLeads, setCustomerLeads] = useState<CustomerLead[]>(() =>
    getCustomerLeads()
  );
  const [settings, setSettings] = useState<BusinessSettings>(() => getBusinessSettings());
  const [services, setServices] = useState<ServiceCatalogItem[]>(() =>
    getServicesCatalog()
  );
  const [team, setTeam] = useState<TeamMember[]>(() => getTeamMembers());
  const [gallery, setGallery] = useState<EdenRoseImage[]>(() => getGalleryImages());
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(() =>
    getFirebaseConnectionStatus()
  );

  const refreshData = () => {
    setBookings(getBookings());
    setCustomerLeads(getCustomerLeads());
    setSettings(getBusinessSettings());
    setServices(getServicesCatalog());
    setTeam(getTeamMembers());
    setGallery(getGalleryImages());
    setFirebaseConnected(getFirebaseConnectionStatus());
  };

  useEffect(() => {
    return subscribeToDataUpdates(refreshData);
  }, []);

  // Real-time check: if a logged-in Team Member's account is deleted or disabled by Admin, revoke session immediately
  useEffect(() => {
    if (!isAuthenticated || !currentUser || currentUser.isAdmin) return;
    const stillActiveMember = team.find(
      (m) => m.id === currentUser.id && m.active !== false
    );
    if (!stillActiveMember && team.length > 0) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(AUTH_USER_KEY);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setLoginErrorMsg(
        'Your team account was removed or disabled by Admin. Please contact Subba Lakshmi.'
      );
    }
  }, [team, isAuthenticated, currentUser]);

  // Determine Active Tab from URL or state
  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    location.pathname.includes('/admin/calendar') ? 'calendar' : 'dashboard'
  );
  const [moreInitialSubScreen, setMoreInitialSubScreen] =
    useState<MoreSectionId>('menu');

  const openMoreSubSection = (section: MoreSectionId) => {
    setAddBookingModalOpen(false);
    setSelfieModalOpen(false);
    setFlowGuideModalOpen(false);
    setMoreInitialSubScreen(section);
    setActiveTab('more');
    navigate('/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (location.pathname.includes('/admin/calendar')) {
      setActiveTab('calendar');
    }
  }, [location.pathname]);

  // Dashboard & Job List Filter State
  const [activeCardFilter, setActiveCardFilter] = useState<StatCardFilter>('all');
  const [activeJobPill, setActiveJobPill] = useState<JobFilterPill>('All');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('All Areas');
  const [customAreas, setCustomAreas] = useState<string[]>(() => getCustomAreas());
  const [showAddAreaModal, setShowAddAreaModal] = useState<boolean>(false);
  const [newAreaInput, setNewAreaInput] = useState<string>('');

  const handleCreateNewArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaInput.trim()) return;
    const updated = addCustomArea(newAreaInput.trim());
    setCustomAreas(updated);
    setSelectedAreaFilter(newAreaInput.trim());
    setNewAreaInput('');
    setShowAddAreaModal(false);
  };

  // Interactive Monthly Calendar State
  const todayISO = getTodayISO();
  const tomorrowISO = getOffsetDateISO(1);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const target = tomorrowISO.startsWith('2026-11') ? new Date(2026, 10, 1) : new Date();
    return new Date(target.getFullYear(), target.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(tomorrowISO);

  // Modals State
  const [addBookingModalOpen, setAddBookingModalOpen] = useState(false);
  const [addBookingPreselectedDate, setAddBookingPreselectedDate] = useState<
    string | undefined
  >(undefined);
  const [selfieModalOpen, setSelfieModalOpen] = useState(false);
  const [selfieBookingId, setSelfieBookingId] = useState<string | undefined>(undefined);
  const [flowGuideModalOpen, setFlowGuideModalOpen] = useState(false);

  const completePartnerLogin = (user: PartnerSessionUser) => {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setLoginErrorMsg(null);
    setPinError(false);
    setPinInput('');
  };

  const handleCredentialsLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg(null);
    const res = authenticatePartnerLogin(loginUserId, loginPassword);
    if (!res.success || !res.user) {
      setLoginErrorMsg(res.error || 'Invalid User ID or Password.');
      return;
    }
    completePartnerLogin(res.user);
  };

  // PIN Keypad Handlers
  const handleDigitPress = (digit: string) => {
    setPinError(false);
    if (pinInput.length >= 4) return;
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      if (next === DEMO_PIN || next === '1234') {
        completePartnerLogin({
          id: 'admin-master',
          name: 'Subba Lakshmi',
          role: 'Founder & Lead Makeup Artist (Admin)',
          userId: 'admin',
          phone: '+91 7619603016',
          isAdmin: true,
        });
      } else {
        setPinError(true);
        setTimeout(() => setPinInput(''), 500);
      }
    }
  };

  const handleBackspace = () => {
    setPinError(false);
    setPinInput((prev) => prev.slice(0, -1));
  };

  // Dynamic Dashboard Statistics
  const stats = useMemo(() => getDashboardStats(), [bookings]);

  // Filtered Jobs for Dashboard / Job List
  const filteredJobs = useMemo(() => {
    return bookings
      .filter((b) => {
        if (b.status === 'Cancelled') return false;

        if (
          activeCardFilter === 'today' &&
          (b.date !== todayISO || b.status === 'Completed' || b.status === 'Reported')
        )
          return false;
        if (
          activeCardFilter === 'tomorrow' &&
          (b.date !== tomorrowISO || b.status === 'Completed' || b.status === 'Reported')
        )
          return false;
        if (
          activeCardFilter === 'upcoming' &&
          (b.date <= tomorrowISO || b.status === 'Completed' || b.status === 'Reported')
        )
          return false;
        if (
          activeCardFilter === 'overdue' &&
          (b.date >= todayISO || b.status === 'Completed' || b.status === 'Reported')
        )
          return false;
        if (activeCardFilter === 'closed' && b.status !== 'Completed') return false;
        if (activeCardFilter === 'report' && b.status !== 'Reported') return false;

        if (
          activeCardFilter === 'all' &&
          b.status === 'Completed' &&
          activeJobPill === 'Visits'
        ) {
          return false;
        }

        if (activeJobPill === 'Jobs' && b.status !== 'Completed' && b.badgeType !== 'JOB')
          return false;
        if (
          activeJobPill === 'Visits' &&
          (b.status === 'Completed' || b.status === 'Reported')
        )
          return false;
        if (activeJobPill === 'Call' && b.badgeType !== 'CALL') return false;
        if (
          activeJobPill === 'Followup' &&
          b.badgeType !== 'FOLLOWUP' &&
          b.status !== 'Reported'
        )
          return false;

        // Area-Wise Filter
        if (selectedAreaFilter !== 'All Areas') {
          const areaMatch =
            (b.area && b.area.toLowerCase().includes(selectedAreaFilter.toLowerCase())) ||
            (b.locality && b.locality.toLowerCase().includes(selectedAreaFilter.toLowerCase())) ||
            (b.address && b.address.toLowerCase().includes(selectedAreaFilter.toLowerCase()));
          if (!areaMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aActive = a.status !== 'Completed' && a.status !== 'Reported' ? 0 : 1;
        const bActive = b.status !== 'Completed' && b.status !== 'Reported' ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      });
  }, [bookings, activeCardFilter, activeJobPill, todayISO, tomorrowISO]);

  // Calendar Grid Computation
  const adminCalendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: {
      dateISO: string | null;
      day: number | null;
      dayBookings: Booking[];
    }[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ dateISO: null, day: null, dayBookings: [] });
    }

    for (let d = 1; d <= totalDays; d++) {
      const iso = formatDateISO(new Date(year, month, d));
      const dayBookings = getBookingsByDate(iso);
      cells.push({ dateISO: iso, day: d, dayBookings });
    }

    return cells;
  }, [calendarMonth, bookings]);

  const selectedDateBookings = useMemo(
    () => getBookingsByDate(selectedCalendarDate),
    [selectedCalendarDate, bookings]
  );

  const formatShortDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  // ==================== ADMIN LOGIN SCREEN ====================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#1C1619] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-[#E6DAC8] shadow-xl space-y-5">
          {/* Brand Header */}
          <div className="text-center space-y-2.5">
            <div className="w-24 h-20 rounded-2xl bg-[#160824] border border-[#D6B77A] overflow-hidden mx-auto flex items-center justify-center shadow-md">
              <SmartImage
                src={settings.logoUrl}
                alt="Eden Roses Partner App"
                fit="cover"
                className="w-full h-full object-center scale-110"
              />
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#160824] tracking-tight">
                {settings.makeupBrand}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#8C4A56]">
                Admin &amp; Team Login · By {settings.artistName}
              </p>
            </div>
          </div>

          {/* Login Mode Switcher: User ID & Password vs 4-Digit PIN */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('credentials');
                setLoginErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loginMode === 'credentials'
                  ? 'bg-[#160824] text-[#F5E2B8] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>User ID &amp; Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('pin');
                setPinError(false);
              }}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loginMode === 'pin'
                  ? 'bg-[#160824] text-[#F5E2B8] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>4-Digit PIN</span>
            </button>
          </div>

          {/* MODE 1: USER ID & PASSWORD LOGIN (FOR ADMIN & TEAM MEMBERS) */}
          {loginMode === 'credentials' ? (
            <form onSubmit={handleCredentialsLoginSubmit} className="space-y-4">
              {loginErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginErrorMsg}</span>
                </div>
              )}

              <div className="space-y-3 text-left text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    User ID / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUserId}
                    onChange={(e) => {
                      setLoginUserId(e.target.value);
                      setLoginErrorMsg(null);
                    }}
                    placeholder="Enter User ID (e.g., admin or kavya)"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold text-sm text-stone-900 focus:outline-none focus:border-[#160824]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginErrorMsg(null);
                      }}
                      placeholder="Enter Password"
                      className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold text-sm text-stone-900 focus:outline-none focus:border-[#160824]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-[#D6B77A]" />
                <span>Sign In to Admin Panel</span>
              </button>
            </form>
          ) : (
            /* MODE 2: 4-DIGIT PIN KEYPAD */
            <div className="space-y-4 text-center">
              <p className="font-mono-num text-xs font-bold text-[#160824] bg-[#F3ECE0] inline-block px-3 py-1 rounded-lg">
                Admin Quick PIN: 7777
              </p>

              {/* 4-Dot PIN Indicator */}
              <div className="flex items-center justify-center gap-4 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all ${
                        pinError
                          ? 'bg-red-500 scale-110'
                          : filled
                          ? 'bg-[#160824] scale-110'
                          : 'bg-stone-200 border border-stone-300'
                      }`}
                    />
                  );
                })}
              </div>

              {pinError && (
                <p className="text-xs font-semibold text-red-600">
                  Incorrect PIN. Enter Demo PIN: 7777
                </p>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitPress(digit)}
                    className="h-13 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3ECE0] active:scale-95 border border-[#E6DAC8] font-mono-num text-xl font-bold text-[#160824] transition-all cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinInput('')}
                  className="h-13 rounded-2xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-600 cursor-pointer"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  className="h-13 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3ECE0] active:scale-95 border border-[#E6DAC8] font-mono-num text-xl font-bold text-[#160824] transition-all cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  aria-label="Backspace"
                  className="h-13 rounded-2xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 cursor-pointer"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="pt-1 flex flex-col gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 text-xs font-semibold hover:text-[#160824] cursor-pointer"
            >
              ← Return to Customer Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Job Details Route (/admin/job/:bookingId)
  const activeBookingForDetails = bookingId ? getBookingById(bookingId) : undefined;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1619] flex flex-col">
      {/* CLEAN MOBILE-FIRST LUXURY TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E6DAC8] shadow-2xs">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Left: Logo + Brand Title + Live Cloud Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#160824] border border-[#D6B77A] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
              <SmartImage
                src={settings.logoUrl}
                alt="Eden Roses Logo"
                fit="cover"
                className="w-full h-full object-center scale-110"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base sm:text-lg text-[#160824] truncate leading-tight">
                {settings.makeupBrand}
              </h1>
              <p className="text-[11px] text-stone-500 truncate flex items-center gap-1.5">
                <span>
                  {currentUser ? currentUser.name.split(' ')[0] : 'Admin'}
                </span>
                <span>·</span>
                <span className="text-emerald-700 font-semibold">
                  {firebaseConnected ? 'Firebase + Cloud Live' : 'Cloud Ready'}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Clean Mobile Action Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/member')}
              title="Open Staff Member Portal"
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-[#200F36] hover:bg-[#2b1448] border border-[#D6B77A]/40 text-[#E6C687] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#D6B77A]" />
              <span className="hidden sm:inline">Staff Portal</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              title="Open Customer Website"
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE0] border border-[#E6DAC8] text-[#160824] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#8C4A56]" />
              <span className="hidden sm:inline">Website</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAddBookingPreselectedDate(undefined);
                setAddBookingModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D6B77A]" />
              <span>Booking</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(AUTH_SESSION_KEY);
                sessionStorage.removeItem(AUTH_USER_KEY);
                setIsAuthenticated(false);
                setCurrentUser(null);
              }}
              title="Sign Out"
              className="p-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 pt-4 pb-24">
        {/* IF ON /admin/job/:bookingId -> SHOW JOB DETAILS VIEW */}
        {bookingId ? (
          activeBookingForDetails ? (
            <JobDetailsView
              booking={activeBookingForDetails}
              onBack={() => navigate('/admin')}
              onOpenSelfieModal={(id) => {
                setSelfieBookingId(id);
                setSelfieModalOpen(true);
              }}
              onOpenFlowGuideModal={() => setFlowGuideModalOpen(true)}
              onUpdated={refreshData}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-[#E6DAC8]">
              <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
              <p className="font-bold text-base">Booking {bookingId} Not Found</p>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-5 py-2.5 rounded-xl bg-[#160824] text-[#F5E2B8] text-xs font-bold cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          )
        ) : (
          <>
            {/* ==================== TAB 1: DASHBOARD & QUICK STUDIO CONTROLS ==================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5">
                {/* 4 LARGE MOBILE-FRIENDLY LUXURY QUICK CONTROL TILES */}
                <div className="rounded-3xl bg-gradient-to-r from-[#160824] via-[#261139] to-[#160824] text-white p-4 sm:p-5 border border-[#D6B77A]/40 shadow-md space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-[#D6B77A]">
                        Cloudinary ({CLOUDINARY_CLOUD_NAME} / {CLOUDINARY_UPLOAD_PRESET}) · Firebase Live
                      </p>
                      <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                        Studio Quick Control Center
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFlowGuideModalOpen(true)}
                      className="text-xs font-semibold text-[#F5E2B8] hover:underline cursor-pointer"
                    >
                      Flow Guide →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => openMoreSubSection('service-management')}
                      className="p-3.5 rounded-2xl bg-[#D6B77A] hover:bg-[#e5c98f] text-[#160824] text-left transition-all shadow-xs cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <Tag className="w-5 h-5" />
                      <div>
                        <p className="font-bold text-xs leading-tight">
                          Products &amp; Price
                        </p>
                        <p className="text-[10px] opacity-80 mt-0.5">
                          + Add / Photo ({services.length})
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openMoreSubSection('gallery-management')}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/20 border border-white/15 text-white text-left transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <Cloud className="w-5 h-5 text-[#D6B77A]" />
                      <div>
                        <p className="font-bold text-xs leading-tight">
                          Cloud Photos
                        </p>
                        <p className="text-[10px] text-white/75 mt-0.5">
                          Upload to Cloudinary
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openMoreSubSection('business-profile')}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/20 border border-white/15 text-white text-left transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <Building2 className="w-5 h-5 text-[#D6B77A]" />
                      <div>
                        <p className="font-bold text-xs leading-tight">
                          Website CMS
                        </p>
                        <p className="text-[10px] text-white/75 mt-0.5">
                          Banners, Offers, Info
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openMoreSubSection('team-management')}
                      className="p-3.5 rounded-2xl bg-white/12 hover:bg-white/20 border border-white/15 text-white text-left transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <Users className="w-5 h-5 text-[#D6B77A]" />
                      <div>
                        <p className="font-bold text-xs leading-tight">
                          Team Logins
                        </p>
                        <p className="text-[10px] text-white/75 mt-0.5">
                          ID &amp; Password ({team.length})
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ORDERS SUMMARY (6 CLEAN MOBILE CARDS) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-sm sm:text-base text-[#160824]">
                      Bookings Overview
                    </h2>
                    {activeCardFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setActiveCardFilter('all')}
                        className="text-xs font-bold text-[#8C4A56] underline cursor-pointer"
                      >
                        Show All ({bookings.length})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {[
                      {
                        key: 'today' as StatCardFilter,
                        label: 'Today',
                        value: stats.today,
                      },
                      {
                        key: 'tomorrow' as StatCardFilter,
                        label: 'Tomorrow',
                        value: stats.tomorrow,
                      },
                      {
                        key: 'upcoming' as StatCardFilter,
                        label: 'Upcoming',
                        value: stats.upcoming,
                      },
                      {
                        key: 'overdue' as StatCardFilter,
                        label: 'Overdue',
                        value: stats.overdue,
                      },
                      {
                        key: 'closed' as StatCardFilter,
                        label: 'Completed',
                        value: stats.closed,
                      },
                      {
                        key: 'report' as StatCardFilter,
                        label: 'Reported',
                        value: stats.report,
                      },
                    ].map((card) => {
                      const isSelected = activeCardFilter === card.key;
                      return (
                        <button
                          key={card.key}
                          type="button"
                          onClick={() =>
                            setActiveCardFilter((prev) =>
                              prev === card.key ? 'all' : card.key
                            )
                          }
                          className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#160824] text-[#F5E2B8] border-[#160824] shadow-md'
                              : 'bg-white hover:bg-[#FAF6F0] text-[#160824] border-[#E6DAC8]'
                          }`}
                        >
                          <p
                            className={`text-[11px] font-semibold ${
                              isSelected ? 'text-[#D6B77A]' : 'text-stone-500'
                            }`}
                          >
                            {card.label}
                          </p>
                          <p className="font-mono-num text-xl sm:text-2xl font-bold mt-0.5">
                            {card.value}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* JOB LIST & REAL-TIME CUSTOMER LEADS */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm sm:text-base text-[#160824]">
                      {activeJobPill === 'Customers'
                        ? `Customer Inquiries & Leads (${customerLeads.length})`
                        : `Active Appointments (${filteredJobs.length})`}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setSelfieBookingId(undefined);
                        setSelfieModalOpen(true);
                      }}
                      className="text-xs font-bold text-[#8C4A56] flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Selfie</span>
                    </button>
                  </div>

                  {/* AREA-WISE HORIZONTAL FILTER BAR (Requirement 4.A) */}
                  <div className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#E6DAC8] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#160824] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#8C4A56]" />
                        <span>Filter By Area / Branch:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddAreaModal(true)}
                        className="text-[11px] font-bold text-[#8C4A56] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add New Area</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {customAreas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => setSelectedAreaFilter(area)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                            selectedAreaFilter === area
                              ? 'bg-[#8C4A56] text-white shadow-xs font-bold'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Filter Buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {(
                      [
                        'All',
                        'Visits',
                        'Jobs',
                        'Call',
                        'Followup',
                        'Customers',
                      ] as JobFilterPill[]
                    ).map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setActiveJobPill(pill)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          activeJobPill === pill
                            ? 'bg-[#160824] text-[#F5E2B8] shadow-xs'
                            : 'bg-white text-stone-700 border border-[#E6DAC8] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        {pill === 'Customers'
                          ? `Leads (${customerLeads.length})`
                          : pill}
                      </button>
                    ))}
                  </div>

                  {/* IF "Customers" PILL IS ACTIVE -> SHOW ALL REAL-TIME CUSTOMER LEADS */}
                  {activeJobPill === 'Customers' ? (
                    <div className="space-y-3">
                      {customerLeads.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 text-center border border-[#E6DAC8] text-xs text-stone-500">
                          No customer inquiries yet. Any booking or callback request on the
                          website appears here immediately.
                        </div>
                      ) : (
                        customerLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6DAC8] shadow-2xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-base text-[#160824]">
                                  {lead.customerName}
                                </h4>
                                <p className="font-mono-num text-xs text-stone-500 mt-0.5">
                                  {lead.phone} · {lead.source}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl bg-[#FAF7F2] text-xs space-y-1 text-stone-700">
                              <p>
                                <strong>Event:</strong> {lead.eventType}
                                {lead.totalSpend !== undefined
                                  ? ` · ₹${lead.totalSpend}`
                                  : ''}
                              </p>
                              <p>
                                <strong>Address:</strong> {lead.address}
                              </p>
                              <p>
                                <strong>Details:</strong> {lead.message}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-stone-400">
                                {new Date(lead.createdAt).toLocaleString()}
                              </span>
                              <div className="flex items-center gap-2">
                                {lead.lastBookingId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(`/admin/job/${lead.lastBookingId}`)
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-[#160824] text-[#F5E2B8] text-xs font-bold cursor-pointer"
                                  >
                                    Open Job
                                  </button>
                                )}
                                <a
                                  href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                                  className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E6DAC8] text-[#160824]"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/${lead.whatsapp.replace(
                                    /[^0-9]/g,
                                    ''
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-[#25D366] text-white"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* CLIENT JOB CARDS */
                    <div className="space-y-3">
                      {filteredJobs.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 text-center border border-[#E6DAC8] text-xs text-stone-500">
                          No appointments match the selected filter.
                        </div>
                      ) : (
                        filteredJobs.map((job) => (
                          <div
                            key={job.id}
                            onClick={() => navigate(`/admin/job/${job.id}`)}
                            className="bg-white hover:bg-[#FFFDF9] rounded-3xl p-4 sm:p-5 border border-[#E6DAC8] shadow-2xs hover:border-[#160824]/40 transition-all cursor-pointer space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold text-[#8C4A56]">
                                  {job.id} · {job.eventType} · {job.status}
                                </p>
                                <h4 className="font-bold text-base text-[#160824] mt-0.5">
                                  {job.customerName}
                                </h4>
                                <p className="font-mono-num text-xs text-stone-600">
                                  {job.phone}
                                </p>
                              </div>

                              <div className="text-right font-mono-num">
                                <span className="text-sm font-bold text-[#160824] block">
                                  ₹{(job.itemsTotal - job.discount).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  {formatShortDate(job.date)} · {job.time}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-xs text-stone-600 bg-[#FAF7F2] p-3 rounded-2xl">
                              <MapPin className="w-4 h-4 text-[#8C4A56] shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-bold text-[#8C4A56] text-[11px] px-2 py-0.5 rounded-md bg-[#8C4A56]/10">
                                    {job.area || job.locality || 'Bangalore'}
                                  </span>
                                  {job.assignedArtistName && (
                                    <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      Assigned: {job.assignedArtistName}
                                    </span>
                                  )}
                                </div>
                                <span className="line-clamp-2">{job.address}</span>
                              </div>
                            </div>

                            {/* Requirement 4.C: Area-Wise 1-Click Job Assignment Toolbar */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <Users className="w-3.5 h-3.5 text-[#8C4A56] shrink-0" />
                                <select
                                  value={job.assignedArtistId || ''}
                                  onChange={async (e) => {
                                    const artistUserId = e.target.value;
                                    const matched = team.find(
                                      (m) =>
                                        (m.userId && m.userId.toLowerCase() === artistUserId.toLowerCase()) ||
                                        m.id === artistUserId
                                    );
                                    if (matched) {
                                      await assignBookingToArtist(job.id, matched);
                                      refreshData();
                                    }
                                  }}
                                  className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-stone-300 bg-white text-stone-900"
                                >
                                  <option value="">-- Assign Staff / Artist --</option>
                                  {team.map((m) => {
                                    const isAreaMatch =
                                      job.area &&
                                      m.area &&
                                      job.area.toLowerCase().includes(m.area.toLowerCase());
                                    return (
                                      <option key={m.id} value={m.userId || m.id}>
                                        {isAreaMatch ? '⭐ ' : ''}
                                        {m.name} | {m.area || 'Bangalore'} | {m.isAvailable !== false ? '🟢 Free' : '🔴 Busy'}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <a
                                href={buildWhatsAppBookingUrl(job, job.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Job</span>
                              </a>
                            </div>

                            <div className="pt-1 flex items-center justify-between text-xs gap-2">
                              <span className="text-stone-600 font-medium truncate">
                                {job.services
                                  .map((s) => `${s.name} (×${s.quantity})`)
                                  .join(', ')}
                              </span>
                              <span className="font-bold text-[#160824] flex items-center gap-1 shrink-0">
                                <span>Manage Details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 2: INTERACTIVE MONTHLY CALENDAR ==================== */}
            {activeTab === 'calendar' && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display font-bold text-lg sm:text-xl text-[#160824]">
                        Booking Schedule
                      </h2>
                      <p className="text-xs text-stone-500">
                        Tap any date to view or schedule appointments
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
                        className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E6DAC8] hover:bg-[#F3ECE0] cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm min-w-[125px] text-center text-[#160824]">
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
                        className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E6DAC8] hover:bg-[#F3ECE0] cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday Row */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-stone-500">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Cells */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {adminCalendarCells.map((cell, i) => {
                      if (!cell.dateISO || !cell.day) {
                        return <div key={`empty-${i}`} className="h-14" />;
                      }
                      const isSelected = cell.dateISO === selectedCalendarDate;
                      const isToday = cell.dateISO === todayISO;
                      const count = cell.dayBookings.length;

                      return (
                        <button
                          key={cell.dateISO}
                          type="button"
                          onClick={() => setSelectedCalendarDate(cell.dateISO!)}
                          className={`h-14 rounded-2xl p-1.5 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#160824] text-[#F5E2B8] border-[#160824] shadow-sm'
                              : isToday
                              ? 'bg-[#F3ECE0] text-[#160824] border-[#D6B77A]'
                              : 'bg-[#FAF7F2] hover:bg-[#F3ECE0]/60 text-stone-800 border-[#E6DAC8]/80'
                          }`}
                        >
                          <span className="font-mono-num text-xs font-bold">
                            {cell.day}
                          </span>

                          {count > 0 && (
                            <div className="flex items-center gap-1">
                              {cell.dayBookings.slice(0, 3).map((b) => (
                                <span
                                  key={b.id}
                                  className={`w-2 h-2 rounded-full ${
                                    isSelected
                                      ? 'bg-[#D6B77A]'
                                      : b.status === 'Completed'
                                      ? 'bg-stone-500'
                                      : b.status === 'Reported'
                                      ? 'bg-red-500'
                                      : 'bg-emerald-600'
                                  }`}
                                />
                              ))}
                              {count > 3 && (
                                <span className="text-[9px] font-bold">+{count - 3}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Date Bookings Section */}
                <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-[#160824]">
                        Appointments on {selectedCalendarDate} ({selectedDateBookings.length})
                      </h3>
                      <p className="text-xs text-stone-500">
                        Tap any appointment to view full details
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAddBookingPreselectedDate(selectedCalendarDate);
                        setAddBookingModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#D6B77A]" />
                      <span>+ Add Booking on this Date</span>
                    </button>
                  </div>

                  {selectedDateBookings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-500">
                      No bookings scheduled for {selectedCalendarDate}.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => navigate(`/admin/job/${b.id}`)}
                          className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3ECE0]/60 border border-[#E6DAC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-[#160824]">
                              {b.customerName}{' '}
                              <span className="font-normal text-xs text-stone-500">
                                · {b.id} · {b.status}
                              </span>
                            </p>
                            <p className="text-xs text-stone-600">
                              {b.services.map((s) => `${s.name} (×${s.quantity})`).join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <div className="text-right">
                              <span className="font-mono-num text-xs font-bold text-[#8C4A56] block">
                                {b.time}
                              </span>
                              <span className="font-mono-num text-sm font-bold text-[#160824]">
                                ₹{b.itemsTotal - b.discount}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-stone-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 3 & 4: WALLET & EARNINGS ==================== */}
            {(activeTab === 'wallet' || activeTab === 'earnings') && (
              <div className="space-y-5">
                <div className="rounded-3xl bg-gradient-to-r from-[#160824] via-[#261139] to-[#160824] text-white p-6 border border-[#D6B77A]/40 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#D6B77A]">
                        Eden Roses Partner Wallet &amp; Revenue
                      </p>
                      <h2 className="font-mono-num text-3xl sm:text-4xl font-bold mt-1">
                        ₹{stats.availableBalance.toLocaleString('en-IN')}
                      </h2>
                      <p className="text-xs text-white/75 mt-0.5">
                        Available Balance (Completed Jobs + Verified Advances)
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-[#D6B77A]/40 flex items-center justify-center text-[#D6B77A]">
                      <WalletIcon className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/15">
                    <div>
                      <span className="text-[11px] text-white/70 block">
                        Total Revenue
                      </span>
                      <span className="font-mono-num text-base font-bold text-[#F5E2B8]">
                        ₹{stats.totalEarnings.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/70 block">
                        Advances Paid
                      </span>
                      <span className="font-mono-num text-base font-bold">
                        ₹{stats.advancePaymentsTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/70 block">
                        Pending Balance
                      </span>
                      <span className="font-mono-num text-base font-bold text-amber-300">
                        ₹{stats.pendingCollectionsTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/70 block">
                        Completed Jobs
                      </span>
                      <span className="font-mono-num text-base font-bold">
                        {stats.closed} Jobs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-[#E6DAC8]">
                    <span className="text-xs text-stone-500">Today&apos;s Earnings</span>
                    <p className="font-mono-num text-2xl font-bold text-[#160824] mt-1">
                      ₹{stats.dailyEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#E6DAC8]">
                    <span className="text-xs text-stone-500">Last 7 Days</span>
                    <p className="font-mono-num text-2xl font-bold text-[#160824] mt-1">
                      ₹{stats.weeklyEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#E6DAC8]">
                    <span className="text-xs text-stone-500">Last 30 Days</span>
                    <p className="font-mono-num text-2xl font-bold text-[#160824] mt-1">
                      ₹{stats.monthlyEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Live Wallet Ledger Derived From Bookings */}
                <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-3">
                  <h3 className="font-bold text-base text-[#160824]">
                    Booking Payment Ledger
                  </h3>
                  <div className="space-y-2.5">
                    {bookings
                      .filter((b) => b.status !== 'Cancelled')
                      .slice(0, 15)
                      .map((b) => (
                        <div
                          key={b.id}
                          onClick={() => navigate(`/admin/job/${b.id}`)}
                          className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] flex items-center justify-between gap-3 cursor-pointer hover:border-[#160824]"
                        >
                          <div>
                            <p className="font-bold text-sm text-[#160824]">
                              {b.customerName}{' '}
                              <span className="font-mono-num font-normal text-xs text-stone-500">
                                · {b.id}
                              </span>
                            </p>
                            <p className="text-xs text-stone-500">
                              {b.date} · {b.phone} · {b.status}
                            </p>
                          </div>

                          <div className="text-right font-mono-num">
                            <p className="text-sm font-bold text-[#160824]">
                              ₹{(b.itemsTotal - b.discount).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Adv: ₹{b.advancePaid} · Due: ₹{b.amountToCollect}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 5: MORE / PRODUCTS / CMS / CLOUD GALLERY ==================== */}
            {activeTab === 'more' && (
              <AdminMoreScreen
                settings={settings}
                services={services}
                team={team}
                gallery={gallery}
                bookings={bookings}
                initialSubScreen={moreInitialSubScreen}
                onSubScreenChange={setMoreInitialSubScreen}
                onRefresh={refreshData}
                onLogout={() => {
                  sessionStorage.removeItem(AUTH_SESSION_KEY);
                  sessionStorage.removeItem(AUTH_USER_KEY);
                  setIsAuthenticated(false);
                  setCurrentUser(null);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* MOBILE-FRIENDLY 5-TAB BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6DAC8] shadow-lg">
        <div className="max-w-4xl mx-auto grid grid-cols-5 h-16">
          {[
            {
              id: 'dashboard' as const,
              label: 'Bookings',
              icon: LayoutDashboard,
              isActive: !bookingId && activeTab === 'dashboard',
              onClick: () => {
                setAddBookingModalOpen(false);
                setSelfieModalOpen(false);
                setFlowGuideModalOpen(false);
                setActiveTab('dashboard');
                navigate('/admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
            },
            {
              id: 'products' as const,
              label: 'Products',
              icon: Tag,
              isActive:
                !bookingId &&
                activeTab === 'more' &&
                moreInitialSubScreen === 'service-management',
              onClick: () => openMoreSubSection('service-management'),
            },
            {
              id: 'calendar' as const,
              label: 'Calendar',
              icon: CalendarIcon,
              isActive: !bookingId && activeTab === 'calendar',
              onClick: () => {
                setAddBookingModalOpen(false);
                setSelfieModalOpen(false);
                setFlowGuideModalOpen(false);
                setActiveTab('calendar');
                navigate('/admin/calendar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
            },
            {
              id: 'wallet' as const,
              label: 'Wallet',
              icon: WalletIcon,
              isActive:
                !bookingId && (activeTab === 'wallet' || activeTab === 'earnings'),
              onClick: () => {
                setAddBookingModalOpen(false);
                setSelfieModalOpen(false);
                setFlowGuideModalOpen(false);
                setActiveTab('wallet');
                navigate('/admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
            },
            {
              id: 'more' as const,
              label: 'CMS & More',
              icon: MoreHorizontal,
              isActive:
                !bookingId &&
                activeTab === 'more' &&
                moreInitialSubScreen !== 'service-management',
              onClick: () => openMoreSubSection('menu'),
            },
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  tab.isActive
                    ? 'text-[#160824] font-bold'
                    : 'text-stone-400 hover:text-stone-800 font-medium'
                }`}
              >
                <IconComp
                  className={`w-5 h-5 ${tab.isActive ? 'text-[#8C4A56]' : ''}`}
                />
                <span className="text-[11px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* SHARED ADMIN MODALS */}
      <AddBookingModal
        isOpen={addBookingModalOpen}
        initialDate={addBookingPreselectedDate}
        onClose={() => setAddBookingModalOpen(false)}
        onSuccess={refreshData}
      />

      <SelfieUploadModal
        isOpen={selfieModalOpen}
        bookingId={selfieBookingId}
        onClose={() => setSelfieModalOpen(false)}
        onSuccess={refreshData}
      />

      <ServiceFlowGuideModal
        isOpen={flowGuideModalOpen}
        onClose={() => setFlowGuideModalOpen(false)}
      />

      {/* MODAL: ADD NEW BANGALORE AREA / ZONE */}
      {showAddAreaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewArea}
            className="bg-[#FAF7F2] w-full max-w-sm rounded-3xl p-5 border border-[#E6DAC8] space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E6DAC8] pb-3">
              <h4 className="font-bold text-sm text-[#160824] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#8C4A56]" />
                <span>Add Bangalore Area / Zone</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddAreaModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Area Name (e.g., Sarjapur Road, Bellandur, JP Nagar)
              </label>
              <input
                type="text"
                required
                autoFocus
                value={newAreaInput}
                onChange={(e) => setNewAreaInput(e.target.value)}
                placeholder="Enter area name..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-semibold text-stone-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddAreaModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#160824] text-[#F5E2B8] text-xs font-bold cursor-pointer hover:bg-[#2b1448]"
              >
                Save Area
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
