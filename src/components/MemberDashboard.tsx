import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  Booking,
  TeamMember,
  getBookings,
  getTeamMembers,
  updateBooking,
  updateTeamMemberAvailability,
  subscribeToDataUpdates,
  getBusinessSettings,
  BusinessSettings,
} from '../services/bookingStorage';

export const MemberDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => {
    try {
      const saved = localStorage.getItem('eden_roses_active_member_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form states
  const [userIdInput, setUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // App data states
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => getTeamMembers());
  const [settings, setSettings] = useState<BusinessSettings>(() => getBusinessSettings());
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  useEffect(() => {
    const unsub = subscribeToDataUpdates(() => {
      setBookings(getBookings());
      const updatedTeam = getTeamMembers();
      setTeamMembers(updatedTeam);
      setSettings(getBusinessSettings());

      // Refresh current user availability if logged in
      if (currentUser) {
        const fresh = updatedTeam.find(
          (m) =>
            m.id === currentUser.id ||
            (m.userId && m.userId.toLowerCase() === currentUser.userId?.toLowerCase())
        );
        if (fresh) {
          setCurrentUser(fresh);
          localStorage.setItem('eden_roses_active_member_session', JSON.stringify(fresh));
        }
      }
    });
    return unsub;
  }, [currentUser]);

  // Handle staff login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = userIdInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Please enter your Staff User ID and Password.');
      return;
    }

    const member = teamMembers.find(
      (m) => (m.userId || '').toLowerCase() === cleanUser
    );

    if (!member) {
      setLoginError('Invalid User ID. Please check with Admin (Lakshmi Madam).');
      return;
    }

    if (member.password !== cleanPass) {
      setLoginError('Incorrect password. Please try again.');
      return;
    }

    if (member.active === false) {
      setLoginError('Your staff account is currently inactive. Contact Admin.');
      return;
    }

    setCurrentUser(member);
    localStorage.setItem('eden_roses_active_member_session', JSON.stringify(member));
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('eden_roses_active_member_session');
  };

  // Toggle availability
  const toggleAvailability = async () => {
    if (!currentUser || isUpdatingAvailability) return;
    setIsUpdatingAvailability(true);
    const newStatus = !currentUser.isAvailable;
    const updated = await updateTeamMemberAvailability(currentUser.id, newStatus);
    if (updated) {
      setCurrentUser(updated);
      localStorage.setItem('eden_roses_active_member_session', JSON.stringify(updated));
    }
    setIsUpdatingAvailability(false);
  };

  // Filter bookings assigned exclusively to this logged-in member
  const myAssignedBookings = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.id.toLowerCase();
    const myUserId = (currentUser.userId || '').toLowerCase();

    return bookings.filter((b) => {
      const matchAssignedId =
        b.assignedArtistId &&
        (b.assignedArtistId.toLowerCase() === myId ||
          b.assignedArtistId.toLowerCase() === myUserId);

      const matchTeam =
        Array.isArray(b.assignedTeam) &&
        b.assignedTeam.some(
          (m) =>
            m.id?.toLowerCase() === myId ||
            (m.userId && m.userId.toLowerCase() === myUserId)
        );

      return matchAssignedId || matchTeam;
    });
  }, [bookings, currentUser]);

  const pendingBookings = useMemo(
    () => myAssignedBookings.filter((b) => b.status !== 'Completed' && b.status !== 'Cancelled'),
    [myAssignedBookings]
  );

  const completedBookings = useMemo(
    () => myAssignedBookings.filter((b) => b.status === 'Completed'),
    [myAssignedBookings]
  );

  // Status handlers
  const handleAcceptJob = async (bookingId: string) => {
    await updateBooking(bookingId, {
      status: 'Visit Scheduled',
    });
  };

  const handleStartJourney = async (bookingId: string) => {
    await updateBooking(bookingId, {
      status: 'Journey Started',
    });
  };

  const handleMarkCompleted = async (bookingId: string) => {
    await updateBooking(bookingId, {
      status: 'Completed',
      completedAt: new Date().toISOString(),
      amountToCollect: 0,
    });
  };

  // IF NOT LOGGED IN: Render Staff Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0E0617] text-[#FAF5ED] flex flex-col justify-center items-center px-4 py-8">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#C59A45]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Top Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E0D33] to-[#0E0617] border border-[#C59A45]/40 shadow-xl mb-3">
              <Sparkles className="w-8 h-8 text-[#E6C687]" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#F5E2B8]">
              Eden Roses Staff Portal
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Member Login &bull; Real-time Job Assignment Dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#170B26]/90 border border-[#C59A45]/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#C59A45]/20">
              <ShieldCheck className="w-5 h-5 text-[#C59A45]" />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-[#E6C687]">
                Enter Staff Credentials
              </h2>
            </div>

            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  User ID (Assigned by Lakshmi Madam)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    placeholder="e.g. kavya or deepika"
                    className="w-full bg-[#0E0617] border border-stone-700 focus:border-[#C59A45] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0E0617] border border-stone-700 focus:border-[#C59A45] rounded-xl px-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C59A45] to-[#E6C687] text-[#0E0617] font-bold text-sm shadow-lg shadow-[#C59A45]/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                Sign In to Member Dashboard
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-stone-800 text-center">
              <p className="text-[11px] text-stone-400 mb-2">Demo Staff Accounts:</p>
              <div className="flex flex-wrap justify-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setUserIdInput('kavya');
                    setPasswordInput('eden123');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:border-[#C59A45]"
                >
                  kavya (Kaggadaspura)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserIdInput('deepika');
                    setPasswordInput('eden123');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:border-[#C59A45]"
                >
                  deepika (Electronic City)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Portal Switcher */}
          <div className="mt-6 flex items-center justify-between px-2 text-xs text-stone-400">
            <button
              onClick={() => navigate('/')}
              className="hover:text-[#E6C687] flex items-center gap-1 transition"
            >
              &larr; Back to Website
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="hover:text-[#E6C687] flex items-center gap-1 transition font-semibold"
            >
              Owner Admin Panel &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // IF LOGGED IN: Render Staff Dashboard
  return (
    <div className="min-h-screen bg-[#0E0617] text-[#FAF5ED] pb-24">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#160A26]/90 backdrop-blur-xl border-b border-[#C59A45]/30 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C59A45] to-[#E6C687] p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-[#160A26] flex items-center justify-center text-[#E6C687] font-bold">
                {currentUser.name.charAt(0)}
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#F5E2B8] leading-tight">
                {currentUser.name}
              </h1>
              <p className="text-[11px] text-stone-400">
                {currentUser.role} &bull; <span className="text-[#E6C687]">{currentUser.area || 'Bangalore'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:text-white"
            >
              Website
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-900 transition"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* AVAILABILITY TOGGLE CARD (CRITICAL REQUIREMENT 5) */}
        <div className="bg-[#170B26] border border-[#C59A45]/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C59A45]">
                Real-Time Duty Status
              </span>
              <h2 className="text-lg font-serif font-bold text-[#F5E2B8] mt-0.5">
                Current Availability
              </h2>
              <p className="text-xs text-stone-400 mt-1 max-w-sm">
                Toggle your live status so Lakshmi Madam knows when you are free to accept appointments in{' '}
                <strong className="text-stone-200">{currentUser.area || 'your area'}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleAvailability}
              disabled={isUpdatingAvailability}
              className={`tap-scale px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg transition cursor-pointer ${
                currentUser.isAvailable
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-emerald-950/50'
                  : 'bg-rose-500/20 border-2 border-rose-400 text-rose-300 shadow-rose-950/50'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full animate-pulse ${
                  currentUser.isAvailable ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span>
                {currentUser.isAvailable ? '🟢 I am Free (Online)' : '🔴 I am Busy (Offline)'}
              </span>
              <RefreshCw
                className={`w-3.5 h-3.5 ml-1 text-stone-400 ${
                  isUpdatingAvailability ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* FEED FILTER TABS */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'pending'
                  ? 'bg-[#C59A45] text-[#0E0617] shadow-md shadow-[#C59A45]/20'
                  : 'bg-stone-900 text-stone-400 hover:text-white'
              }`}
            >
              My Assigned Jobs ({pendingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'completed'
                  ? 'bg-[#C59A45] text-[#0E0617] shadow-md shadow-[#C59A45]/20'
                  : 'bg-stone-900 text-stone-400 hover:text-white'
              }`}
            >
              Completed ({completedBookings.length})
            </button>
          </div>

          <span className="text-[11px] text-stone-400">
            Assigned to @{currentUser.userId}
          </span>
        </div>

        {/* BOOKINGS FEED */}
        <div className="space-y-4">
          {activeTab === 'pending' && pendingBookings.length === 0 && (
            <div className="text-center py-12 px-4 rounded-3xl bg-[#170B26]/50 border border-dashed border-stone-800">
              <Sparkles className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-stone-300">
                No active jobs currently assigned
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                When Admin assigns you a booking in {currentUser.area || 'Bangalore'}, it will appear here immediately.
              </p>
            </div>
          )}

          {activeTab === 'completed' && completedBookings.length === 0 && (
            <div className="text-center py-12 px-4 rounded-3xl bg-[#170B26]/50 border border-dashed border-stone-800">
              <CheckCircle2 className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-stone-300">
                No completed jobs yet
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Your successfully serviced appointments will be archived here.
              </p>
            </div>
          )}

          {(activeTab === 'pending' ? pendingBookings : completedBookings).map((booking) => {
            const mapsQuery = encodeURIComponent(
              `${booking.address || ''}, Bangalore`
            );
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

            return (
              <div
                key={booking.id}
                className="bg-[#170B26] border border-[#C59A45]/25 rounded-3xl p-5 shadow-xl transition hover:border-[#C59A45]/50"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#E6C687]">
                        {booking.id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          booking.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : booking.status === 'Journey Started'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : booking.status === 'Visit Scheduled'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#F5E2B8] mt-1">
                      {booking.customerName}
                    </h3>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-[#200F36] border border-[#C59A45]/40 text-[11px] font-semibold text-[#E6C687] shrink-0">
                    {booking.area || booking.locality || 'Bangalore'}
                  </span>
                </div>

                {/* Details grid */}
                <div className="py-3.5 space-y-2.5 text-xs text-stone-300">
                  {/* Date & Time */}
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-stone-200 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[#C59A45]" />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1.5 text-stone-200 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-[#C59A45]" />
                      {booking.time}
                    </span>
                  </div>

                  {/* Services */}
                  <div className="p-2.5 rounded-xl bg-[#0E0617]/70 border border-stone-800">
                    <p className="text-[10px] uppercase font-bold text-stone-500 mb-1">
                      Booked Services:
                    </p>
                    <ul className="space-y-1">
                      {booking.services.map((s, idx) => (
                        <li key={idx} className="flex justify-between items-center text-xs">
                          <span>
                            {s.name} &times; {s.quantity}
                          </span>
                          <span className="font-mono text-[#E6C687]">
                            ₹{s.price * s.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Address with Google Maps link */}
                  <div className="flex items-start gap-2 pt-1">
                    <MapPin className="w-4 h-4 text-[#C59A45] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-stone-300 leading-relaxed">
                        {booking.address}
                      </p>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#E6C687] hover:underline mt-1 font-semibold"
                      >
                        <span>Open Location in Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Payment overview */}
                  <div className="flex justify-between items-center pt-2 text-[11px] border-t border-stone-800">
                    <span className="text-stone-400">
                      Advance Paid: <strong className="text-emerald-400">₹{booking.advancePaid}</strong>
                    </span>
                    <span className="text-stone-400">
                      To Collect:{' '}
                      <strong className="text-amber-400 font-mono">
                        ₹{booking.amountToCollect}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-stone-800/80 flex flex-wrap gap-2">
                  {/* Call Customer 1-Tap */}
                  <a
                    href={`tel:${booking.phone}`}
                    className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-stone-900 border border-stone-700 hover:border-emerald-500 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Customer</span>
                  </a>

                  {/* Accept Job */}
                  {booking.status === 'Confirmed' && (
                    <button
                      onClick={() => handleAcceptJob(booking.id)}
                      className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-blue-600/30 border border-blue-500 text-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-600/50 transition active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Accept Job</span>
                    </button>
                  )}

                  {/* Start Journey */}
                  {booking.status === 'Visit Scheduled' && (
                    <button
                      onClick={() => handleStartJourney(booking.id)}
                      className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-purple-600/30 border border-purple-500 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-purple-600/50 transition active:scale-95"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                      <span>On The Way</span>
                    </button>
                  )}

                  {/* Mark Completed */}
                  {booking.status !== 'Completed' && (
                    <button
                      onClick={() => handleMarkCompleted(booking.id)}
                      className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 transition active:scale-95 shadow-md shadow-emerald-950"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
