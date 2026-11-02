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

  const openProductsAndPricingManager = () => {
    setMoreInitialSubScreen('service-management');
    setActiveTab('more');
    navigate('/admin');
  };

  const openTeamAccountsManager = () => {
    setMoreInitialSubScreen('team-management');
    setActiveTab('more');
    navigate('/admin');
  };

  const openWebsiteControlManager = () => {
    setMoreInitialSubScreen('business-profile');
    setActiveTab('more');
    navigate('/admin');
  };

  useEffect(() => {
    if (location.pathname.includes('/admin/calendar')) {
      setActiveTab('calendar');
    }
  }, [location.pathname]);

  // Dashboard & Job List Filter State
  const [activeCardFilter, setActiveCardFilter] = useState<StatCardFilter>('all');
  const [activeJobPill, setActiveJobPill] = useState<JobFilterPill>('All');

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
          phone: '+91 7019135530',
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

  // ==================== PART 11: ADMIN & TEAM LOGIN SCREEN ====================
  if (!isAuthenticated) {
    const activeTeamPreview = team.filter((m) => m.active !== false).slice(0, 4);

    return (
      <div className="min-h-screen bg-[#f8f9f0] text-stone-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-[#5b6324]/25 shadow-xl space-y-5">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-28 h-20 rounded-2xl bg-[#160824] border border-[#D6B77A]/60 overflow-hidden mx-auto flex items-center justify-center shadow-md">
              <SmartImage
                src={settings.logoUrl}
                alt="Eden Roses Partner App"
                fit="cover"
                className="w-full h-full object-center scale-110"
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Eden Roses Partner App
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#5b6324]">
                Admin &amp; Team Login Portal · Subba Lakshmi Makeup
              </p>
            </div>
          </div>

          {/* Login Mode Switcher: User ID & Password vs 4-Digit PIN */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#f8f9f0] border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('credentials');
                setLoginErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loginMode === 'credentials'
                  ? 'bg-[#160824] text-[#F3E2BA] shadow-xs'
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
                  ? 'bg-[#160824] text-[#F3E2BA] shadow-xs'
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
                    User ID / Username (Admin or Team Member)
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
                    className="w-full px-3.5 py-3 rounded-xl bg-[#f8f9f0] border border-stone-300 font-mono-num font-bold text-sm text-stone-900 focus:outline-none focus:border-[#5b6324]"
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
                      className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-[#f8f9f0] border border-stone-300 font-mono-num font-bold text-sm text-stone-900 focus:outline-none focus:border-[#5b6324]"
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
                className="w-full py-3.5 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In with User ID &amp; Password</span>
              </button>

              {/* Quick Demo / Active Accounts Fill Box */}
              <div className="p-3.5 rounded-2xl bg-[#f8f9f0] border border-stone-200 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5b6324]" />
                    <span>Tap to Quick-Fill Login Credentials:</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginUserId('admin');
                      setLoginPassword('7777');
                      setLoginErrorMsg(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#160824] text-[#F3E2BA] text-[11px] font-mono-num font-bold cursor-pointer hover:opacity-90"
                  >
                    Admin (ID: admin / Pass: 7777)
                  </button>

                  {activeTeamPreview.map((member) => {
                    const uid =
                      member.userId ||
                      member.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const pass = member.password || 'eden123';
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setLoginUserId(uid);
                          setLoginPassword(pass);
                          setLoginErrorMsg(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-[#5b6324] text-stone-800 text-[11px] font-mono-num font-semibold cursor-pointer"
                      >
                        {member.name.split(' ')[0]} ({uid} / {pass})
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          ) : (
            /* MODE 2: 4-DIGIT PIN KEYPAD */
            <div className="space-y-4 text-center">
              <p className="font-mono-num text-xs font-bold text-stone-600 bg-[#e9ecd6] inline-block px-3 py-1 rounded-lg">
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
                          ? 'bg-[#5b6324] scale-110'
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
                    className="h-13 rounded-2xl bg-[#f8f9f0] hover:bg-[#e9ecd6] active:scale-95 border border-stone-200 font-mono-num text-xl font-bold text-stone-900 transition-all cursor-pointer"
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
                  className="h-13 rounded-2xl bg-[#f8f9f0] hover:bg-[#e9ecd6] active:scale-95 border border-stone-200 font-mono-num text-xl font-bold text-stone-900 transition-all cursor-pointer"
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
              className="w-full py-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 text-xs font-semibold hover:text-stone-900 cursor-pointer"
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
    <div className="min-h-screen bg-[#f8f9f0] text-stone-900 flex flex-col">
      {/* PART 12: ADMIN TOP BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          {/* Left: Uploaded Logo + Subba Lakshmi Makeup + Logged-in User Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-10 rounded-xl bg-[#160824] border border-[#D6B77A]/60 overflow-hidden flex items-center justify-center shrink-0">
              <SmartImage
                src={settings.logoUrl}
                alt="Eden Roses Logo"
                fit="cover"
                className="w-full h-full object-center scale-110"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm sm:text-base text-stone-900 truncate">
                  Subba Lakshmi Makeup
                </h1>
                {currentUser && (
                  <span
                    className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      currentUser.isAdmin
                        ? 'bg-[#160824] text-[#F3E2BA]'
                        : 'bg-[#e9ecd6] text-[#5b6324]'
                    }`}
                  >
                    {currentUser.isAdmin
                      ? 'Admin'
                      : `Team: ${currentUser.name.split(' ')[0]}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 truncate flex items-center gap-1.5">
                <span>
                  {currentUser
                    ? `${currentUser.name} (${currentUser.userId})`
                    : 'Eden Roses Partner App'}
                </span>
                {firebaseConnected && (
                  <>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline-flex text-emerald-700 font-semibold items-center gap-1">
                      <Database className="w-3 h-3" />
                      Live Sync
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right: Team Accounts + Products & Pricing + Add Booking + Logout */}
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href="https://edenrosesunisexsalon-phi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f8f9f0] border border-[#5b6324]/30 text-[#5b6324] text-[11px] font-bold hover:bg-[#e9ecd6]"
            >
              <Globe className="w-3 h-3" />
              <span>Live Site</span>
            </a>
            <button
              type="button"
              onClick={openWebsiteControlManager}
              title="Full Website Content & Settings Control (Firebase Sync)"
              className="px-2.5 py-2 rounded-xl bg-[#f8f9f0] hover:bg-[#e9ecd6] border border-[#5b6324]/30 text-[#5b6324] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Website CMS</span>
            </button>
            <button
              type="button"
              onClick={openTeamAccountsManager}
              title="Create or Delete Team Login Accounts"
              className="px-2.5 py-2 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F3E2BA] border border-[#D6B77A]/40 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Team Login</span>
            </button>
            <button
              type="button"
              onClick={openProductsAndPricingManager}
              className="px-2.5 py-2 rounded-xl bg-[#e9ecd6] hover:bg-[#dfe4c4] border border-[#5b6324]/30 text-[#5b6324] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Products &amp; Price</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAddBookingPreselectedDate(undefined);
                setAddBookingModalOpen(true);
              }}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
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
              title="Logout"
              className="p-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-4 pb-24">
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
            <div className="bg-white rounded-2xl p-8 text-center space-y-3 border border-stone-200">
              <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
              <p className="font-bold text-base">Booking {bookingId} Not Found</p>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-5 py-2.5 rounded-xl bg-[#5b6324] text-white text-xs font-bold cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          )
        ) : (
          <>
            {/* ==================== TAB 1: DASHBOARD & JOB LIST ==================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5">
                {/* PART 13: SERVICE FLOW GUIDE OLIVE BANNER */}
                <div className="rounded-2xl bg-[#5b6324] text-white p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e9ecd6]">
                      Service Flow Guide
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="text-[11px] font-semibold text-[#e9ecd6] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Globe className="w-3 h-3" />
                      <span>View Customer Website</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={openWebsiteControlManager}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#160824] text-[#F3E2BA] hover:bg-[#261139] border border-[#D6B77A]/40 text-left text-xs font-bold flex items-center justify-between transition-colors shadow-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-[#D6B77A] shrink-0" />
                        <span>Full Website Control (CMS)</span>
                      </span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={openProductsAndPricingManager}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white text-[#5b6324] hover:bg-[#e9ecd6] text-left text-xs font-bold flex items-center justify-between transition-colors shadow-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        <span>+ Add Product / Price ({services.length})</span>
                      </span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelfieBookingId(undefined);
                        setSelfieModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Upload Selfie</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowGuideModalOpen(true)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Service Flow Guide</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* PART 15: ORDERS - LAST 30 DAYS (6 LARGE BEIGE CARDS) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base sm:text-lg text-stone-900">
                      Orders - Last 30 days
                    </h2>
                    {activeCardFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setActiveCardFilter('all')}
                        className="text-xs font-bold text-[#5b6324] underline cursor-pointer"
                      >
                        Show All Orders
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                        label: 'Closed',
                        value: stats.closed,
                      },
                      {
                        key: 'report' as StatCardFilter,
                        label: 'Report',
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
                          className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#5b6324] text-white border-[#5b6324] shadow-md'
                              : 'bg-[#e9ecd6] hover:bg-[#dfe4c4] text-stone-900 border-[#5b6324]/20'
                          }`}
                        >
                          <p
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-[#e9ecd6]' : 'text-stone-600'
                            }`}
                          >
                            {card.label}
                          </p>
                          <p className="font-mono-num text-2xl sm:text-3xl font-bold mt-1">
                            {card.value}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PART 17: JOB LIST & REAL-TIME USER DETAILS SCREEN */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-stone-900">
                      {activeJobPill === 'Customers'
                        ? `Live Customer Details & Leads (${customerLeads.length})`
                        : `Job List & Customer Bookings (${filteredJobs.length})`}
                    </h3>
                    <span className="text-xs text-stone-500">
                      Synced in real-time via Firebase
                    </span>
                  </div>

                  {/* Interactive Filter Buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {(
                      [
                        'All',
                        'Jobs',
                        'Visits',
                        'Call',
                        'Followup',
                        'Customers',
                      ] as JobFilterPill[]
                    ).map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setActiveJobPill(pill)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          activeJobPill === pill
                            ? 'bg-[#5b6324] text-white shadow-xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-[#e9ecd6]/50'
                        }`}
                      >
                        {pill === 'Customers'
                          ? `User Details (${customerLeads.length})`
                          : pill}
                      </button>
                    ))}
                  </div>

                  {/* IF "Customers" PILL IS ACTIVE -> SHOW ALL REAL-TIME CUSTOMER LEADS & INQUIRIES */}
                  {activeJobPill === 'Customers' ? (
                    <div className="space-y-3">
                      {customerLeads.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-xs text-stone-500">
                          No customer inquiries yet. Any booking or callback request on the
                          Customer Website appears here immediately in real time!
                        </div>
                      ) : (
                        customerLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-[#5b6324]" />
                                  <h4 className="font-bold text-base text-stone-900">
                                    {lead.customerName}
                                  </h4>
                                </div>
                                <p className="font-mono-num text-xs text-stone-500 mt-0.5">
                                  Phone: {lead.phone} · WhatsApp: {lead.whatsapp}
                                </p>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-[#e9ecd6] text-[#5b6324] text-[11px] font-bold">
                                {lead.source}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#f8f9f0] text-xs space-y-1 text-stone-700">
                              <p>
                                <strong>Event / Category:</strong> {lead.eventType}
                                {lead.totalSpend !== undefined
                                  ? ` · Total: ₹${lead.totalSpend}`
                                  : ''}
                              </p>
                              <p>
                                <strong>Address / Locality:</strong> {lead.address}
                              </p>
                              <p>
                                <strong>Details:</strong> {lead.message}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-stone-400">
                                Received: {new Date(lead.createdAt).toLocaleString()}
                              </span>
                              <div className="flex items-center gap-2">
                                {lead.lastBookingId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(`/admin/job/${lead.lastBookingId}`)
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-[#5b6324] text-white text-xs font-bold cursor-pointer"
                                  >
                                    Open Job {lead.lastBookingId}
                                  </button>
                                )}
                                <a
                                  href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800"
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
                    /* CLIENT JOB CARDS (Includes Full Customer Details) */
                    <div className="space-y-3">
                      {filteredJobs.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-xs text-stone-500">
                          No jobs match the selected filter.
                        </div>
                      ) : (
                        filteredJobs.map((job) => (
                          <div
                            key={job.id}
                            onClick={() => navigate(`/admin/job/${job.id}`)}
                            className="bg-white hover:bg-[#fcfdf7] rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-[#5b6324]/50 transition-all cursor-pointer space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-base text-stone-900">
                                    {job.customerName}
                                  </h4>
                                  <span className="text-xs font-medium text-stone-500">
                                    · Makeup Artist ({job.eventType})
                                  </span>
                                </div>
                                <p className="font-mono-num text-xs font-semibold text-stone-600 mt-0.5">
                                  {job.id} · Phone: {job.phone} · Source:{' '}
                                  {job.bookingSource}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                    job.status === 'Completed'
                                      ? 'bg-stone-200 text-stone-700'
                                      : job.status === 'Reported'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-emerald-600 text-white'
                                  }`}
                                >
                                  {job.badgeType || 'VISIT'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#5b6324] bg-[#f8f9f0] px-3 py-2 rounded-xl">
                              <span className="font-mono-num">
                                Date: {formatShortDate(job.date)} ({job.date})
                              </span>
                              <span>·</span>
                              <span className="font-mono-num">Time: {job.time}</span>
                              <span>·</span>
                              <span className="font-mono-num">
                                Total: ₹{job.itemsTotal}
                              </span>
                              <span>·</span>
                              <span className="font-mono-num">
                                Adv: ₹{job.advancePaid} | Due: ₹{job.amountToCollect}
                              </span>
                            </div>

                            <div className="flex items-start gap-2 text-xs text-stone-600">
                              <MapPin className="w-4 h-4 text-[#5b6324] shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{job.address}</span>
                            </div>

                            {job.notes && (
                              <p className="text-xs text-stone-500 italic bg-stone-50 px-3 py-1.5 rounded-lg">
                                Note: &ldquo;{job.notes}&rdquo;
                              </p>
                            )}

                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs gap-2">
                              <span className="text-stone-600 font-medium truncate">
                                {job.services
                                  .map((s) => `${s.name} (×${s.quantity})`)
                                  .join(', ')}
                              </span>
                              <span className="font-bold text-[#5b6324] flex items-center gap-1 shrink-0">
                                <span>Job Details</span>
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
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-lg text-stone-900">
                        Monthly Booking Calendar
                      </h2>
                      <p className="text-xs text-stone-500">
                        Colored dots indicate active, completed, or multiple bookings
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
                        className="p-2 rounded-xl bg-[#f8f9f0] border border-stone-200 hover:bg-[#e9ecd6] cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm min-w-[125px] text-center">
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
                        className="p-2 rounded-xl bg-[#f8f9f0] border border-stone-200 hover:bg-[#e9ecd6] cursor-pointer"
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
                              ? 'bg-[#5b6324] text-white border-[#5b6324] shadow-sm'
                              : isToday
                              ? 'bg-[#e9ecd6] text-stone-900 border-[#5b6324]'
                              : 'bg-[#f8f9f0] hover:bg-[#e9ecd6]/60 text-stone-800 border-stone-200/80'
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
                                      ? 'bg-white'
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
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-stone-900">
                        Bookings on {selectedCalendarDate} ({selectedDateBookings.length})
                      </h3>
                      <p className="text-xs text-stone-500">
                        Click any booking to open Job Details or add a new appointment
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAddBookingPreselectedDate(selectedCalendarDate);
                        setAddBookingModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Booking on this Date</span>
                    </button>
                  </div>

                  {selectedDateBookings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-500">
                      No bookings scheduled for {selectedCalendarDate}. Tap &ldquo;+ Add
                      Booking on this Date&rdquo; to schedule one.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => navigate(`/admin/job/${b.id}`)}
                          className="p-4 rounded-2xl bg-[#f8f9f0] hover:bg-[#e9ecd6]/60 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-stone-900">
                                {b.customerName}
                              </span>
                              <span className="font-mono-num text-xs text-stone-500">
                                ({b.id} · {b.phone})
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                                {b.status}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600">
                              {b.services.map((s) => `${s.name} (×${s.quantity})`).join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <div className="text-right">
                              <span className="font-mono-num text-xs font-bold text-[#5b6324] block">
                                {b.time}
                              </span>
                              <span className="font-mono-num text-sm font-bold text-stone-900">
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

            {/* ==================== TAB 3: WALLET ==================== */}
            {activeTab === 'wallet' && (
              <div className="space-y-5">
                <div className="rounded-3xl bg-[#5b6324] text-white p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#e9ecd6]">
                        Eden Roses Partner Wallet
                      </p>
                      <h2 className="font-mono-num text-3xl sm:text-4xl font-bold mt-1">
                        ₹{stats.availableBalance.toLocaleString('en-IN')}
                      </h2>
                      <p className="text-xs text-[#e9ecd6] mt-0.5">
                        Available Balance (Completed Jobs + Verified Advances)
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                      <WalletIcon className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/15">
                    <div>
                      <span className="text-[11px] text-[#e9ecd6] block">
                        Total Earnings
                      </span>
                      <span className="font-mono-num text-base font-bold">
                        ₹{stats.totalEarnings.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#e9ecd6] block">
                        Advance Payments
                      </span>
                      <span className="font-mono-num text-base font-bold">
                        ₹{stats.advancePaymentsTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#e9ecd6] block">
                        Pending Collections
                      </span>
                      <span className="font-mono-num text-base font-bold text-amber-200">
                        ₹{stats.pendingCollectionsTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#e9ecd6] block">
                        Completed Payments
                      </span>
                      <span className="font-mono-num text-base font-bold">
                        ₹{stats.completedPaymentsTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Wallet Ledger Derived From Bookings */}
                <div className="bg-white rounded-3xl p-5 border border-stone-200 space-y-3">
                  <h3 className="font-bold text-base text-stone-900">
                    Booking Payment Ledger
                  </h3>
                  <div className="space-y-2.5">
                    {bookings
                      .filter((b) => b.status !== 'Cancelled')
                      .slice(0, 12)
                      .map((b) => (
                        <div
                          key={b.id}
                          onClick={() => navigate(`/admin/job/${b.id}`)}
                          className="p-3.5 rounded-2xl bg-[#f8f9f0] border border-stone-200 flex items-center justify-between gap-3 cursor-pointer hover:border-[#5b6324]"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-stone-900">
                                {b.customerName}
                              </p>
                              <span className="font-mono-num text-xs text-stone-500">
                                {b.id}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500">
                              {b.date} · {b.phone} · {b.status}
                            </p>
                          </div>

                          <div className="text-right font-mono-num">
                            <p className="text-sm font-bold text-[#5b6324]">
                              ₹{b.itemsTotal - b.discount}
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

            {/* ==================== TAB 4: EARNINGS ==================== */}
            {activeTab === 'earnings' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-5 rounded-2xl bg-[#e9ecd6] border border-[#5b6324]/20">
                    <span className="text-xs font-semibold text-stone-600">
                      Daily Earnings (Today)
                    </span>
                    <p className="font-mono-num text-2xl font-bold text-[#5b6324] mt-1">
                      ₹{stats.dailyEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#e9ecd6] border border-[#5b6324]/20">
                    <span className="text-xs font-semibold text-stone-600">
                      Weekly Earnings (Last 7 Days)
                    </span>
                    <p className="font-mono-num text-2xl font-bold text-[#5b6324] mt-1">
                      ₹{stats.weeklyEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#e9ecd6] border border-[#5b6324]/20">
                    <span className="text-xs font-semibold text-stone-600">
                      Monthly Earnings (30 Days)
                    </span>
                    <p className="font-mono-num text-2xl font-bold text-[#5b6324] mt-1">
                      ₹{stats.monthlyEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-stone-200">
                    <span className="text-xs text-stone-500">Total Completed Jobs</span>
                    <p className="font-mono-num text-xl font-bold text-stone-900 mt-0.5">
                      {stats.closed} Jobs
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-stone-200">
                    <span className="text-xs text-stone-500">Total Collected</span>
                    <p className="font-mono-num text-xl font-bold text-emerald-700 mt-0.5">
                      ₹{stats.totalEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-stone-200">
                    <span className="text-xs text-stone-500">Pending Collections</span>
                    <p className="font-mono-num text-xl font-bold text-amber-700 mt-0.5">
                      ₹{stats.pendingCollectionsTotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-stone-200 space-y-3">
                  <h3 className="font-bold text-base text-stone-900">
                    Completed Jobs Breakdown ({stats.closed})
                  </h3>
                  <div className="space-y-2.5">
                    {bookings
                      .filter((b) => b.status === 'Completed')
                      .map((b) => (
                        <div
                          key={b.id}
                          onClick={() => navigate(`/admin/job/${b.id}`)}
                          className="p-3.5 rounded-2xl bg-[#f8f9f0] border border-stone-200 flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-bold text-sm text-stone-900">
                                {b.customerName} ({b.id})
                              </p>
                              <p className="text-xs text-stone-500">
                                {b.date} · {b.services.map((s) => s.name).join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="font-mono-num font-bold text-sm text-[#5b6324] flex items-center gap-1">
                            <span>₹{b.itemsTotal - b.discount}</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 5: MORE ==================== */}
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

      {/* PART 14: ADMIN BOTTOM NAVIGATION (5 FUNCTIONAL TABS) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-lg">
        <div className="max-w-4xl mx-auto grid grid-cols-5 h-16">
          {[
            {
              id: 'dashboard' as AdminTab,
              label: 'Dashboard',
              icon: LayoutDashboard,
              path: '/admin',
            },
            {
              id: 'calendar' as AdminTab,
              label: 'Calendar',
              icon: CalendarIcon,
              path: '/admin/calendar',
            },
            {
              id: 'wallet' as AdminTab,
              label: 'Wallet',
              icon: WalletIcon,
              path: '/admin',
            },
            {
              id: 'earnings' as AdminTab,
              label: 'Earnings',
              icon: TrendingUp,
              path: '/admin',
            },
            {
              id: 'more' as AdminTab,
              label: 'More',
              icon: MoreHorizontal,
              path: '/admin',
            },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = !bookingId && activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'more') {
                    setMoreInitialSubScreen('menu');
                  }
                  setActiveTab(tab.id);
                  navigate(tab.path);
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#5b6324] font-bold'
                    : 'text-stone-500 hover:text-stone-800 font-medium'
                }`}
              >
                <IconComp className="w-5 h-5" />
                <span className="text-[11px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MODALS */}
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
      />

      <ServiceFlowGuideModal
        isOpen={flowGuideModalOpen}
        onClose={() => setFlowGuideModalOpen(false)}
      />
    </div>
  );
};
