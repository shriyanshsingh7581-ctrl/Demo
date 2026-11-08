import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  Copy,
  Check,
  AlertTriangle,
  Users,
  Edit3,
  CheckCircle2,
  Navigation,
  X,
} from 'lucide-react';
import {
  Booking,
  BookingServiceItem,
  BookingStatus,
  TeamMember,
  getAvailableSlots,
  getServicesCatalog,
  getTeamMembers,
  updateBooking,
  verifyBookingPayment,
  rejectBookingPayment,
} from '../../services/bookingStorage';

interface JobDetailsViewProps {
  booking: Booking;
  onBack: () => void;
  onOpenSelfieModal: (bookingId: string) => void;
  onOpenFlowGuideModal: () => void;
  onUpdated: () => void;
}

export const JobDetailsView: React.FC<JobDetailsViewProps> = ({
  booking,
  onBack,
  onOpenSelfieModal,
  onOpenFlowGuideModal,
  onUpdated,
}) => {
  const servicesCatalog = useMemo(() => getServicesCatalog(), []);
  const allTeamMembers = useMemo(() => getTeamMembers(), []);

  // Modal states inside Job Details
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Add/Custom Item state
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(
    servicesCatalog.find((s) => s.price !== null)?.id || 'pkg-saree-draping'
  );
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(999);
  const [customItemQty, setCustomItemQty] = useState<number>(1);

  // Reschedule state
  const [newDate, setNewDate] = useState(booking.date);
  const [newTime, setNewTime] = useState(booking.time);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Editable Payment Summary state
  const [editItemsTotal, setEditItemsTotal] = useState<number>(booking.itemsTotal);
  const [editDiscount, setEditDiscount] = useState<number>(booking.discount);
  const [editAdvance, setEditAdvance] = useState<number>(booking.advancePaid);

  // Report state
  const [reportReason, setReportReason] = useState(booking.reportReason || '');
  const [copiedPhone, setCopiedPhone] = useState(false);

  const availableSlotsForReschedule = useMemo(
    () => getAvailableSlots(newDate, booking.id),
    [newDate, booking.id]
  );

  // Format readable date like "Sun, 01 Nov 2026"
  const formattedDate = useMemo(() => {
    const [y, m, d] = booking.date.split('-').map(Number);
    if (!y || !m || !d) return booking.date;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [booking.date]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    booking.address
  )}`;

  // Item Management Handlers
  const handleAddPredefinedItem = async () => {
    const catalogItem = servicesCatalog.find((s) => s.id === selectedCatalogId);
    if (!catalogItem) return;
    const price = catalogItem.price ?? 999;
    const existing = booking.services.find((s) => s.id === catalogItem.id);
    const updatedServices: BookingServiceItem[] = existing
      ? booking.services.map((s) =>
          s.id === catalogItem.id ? { ...s, quantity: s.quantity + 1 } : s
        )
      : [
          ...booking.services,
          {
            id: catalogItem.id,
            name: catalogItem.name,
            price,
            quantity: 1,
          },
        ];

    await updateBooking(booking.id, { services: updatedServices });
    onUpdated();
    setAddItemModalOpen(false);
  };

  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || customItemPrice <= 0) return;
    const updatedServices: BookingServiceItem[] = [
      ...booking.services,
      {
        id: `custom-${Date.now()}`,
        name: customItemName.trim(),
        price: Number(customItemPrice),
        quantity: Math.max(1, Number(customItemQty)),
      },
    ];
    await updateBooking(booking.id, { services: updatedServices });
    setCustomItemName('');
    onUpdated();
    setAddItemModalOpen(false);
  };

  const handleChangeItemQty = async (itemId: string, delta: number) => {
    const updatedServices = booking.services
      .map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
      )
      .filter((item) => item.quantity > 0);
    await updateBooking(booking.id, { services: updatedServices });
    onUpdated();
  };

  const handleChangeItemPrice = async (itemId: string, newPrice: number) => {
    const updatedServices = booking.services.map((item) =>
      item.id === itemId ? { ...item, price: Math.max(0, newPrice) } : item
    );
    await updateBooking(booking.id, { services: updatedServices });
    onUpdated();
  };

  const handleRemoveItem = async (itemId: string) => {
    const updatedServices = booking.services.filter((item) => item.id !== itemId);
    await updateBooking(booking.id, { services: updatedServices });
    onUpdated();
  };

  // Reschedule Handler
  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRescheduleError(null);
    const res = await updateBooking(booking.id, {
      date: newDate,
      time: newTime,
    });
    if (!res.success) {
      setRescheduleError(res.error || 'Double booking prevented: Slot unavailable.');
      return;
    }
    onUpdated();
    setRescheduleModalOpen(false);
  };

  // Payment Summary Save Handler
  const handleSavePaymentSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBooking(booking.id, {
      itemsTotal: Number(editItemsTotal),
      discount: Number(editDiscount),
      advancePaid: Number(editAdvance),
    });
    onUpdated();
    setPaymentModalOpen(false);
  };

  // Team Assignment Toggle
  const handleToggleTeamMember = async (member: TeamMember) => {
    const exists = booking.assignedTeam.some((m) => m.id === member.id);
    const nextTeam = exists
      ? booking.assignedTeam.filter((m) => m.id !== member.id)
      : [...booking.assignedTeam, member];
    await updateBooking(booking.id, { assignedTeam: nextTeam });
    onUpdated();
  };

  // Report Job Handler
  const handleConfirmReportJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    await updateBooking(booking.id, {
      status: 'Reported',
      reportReason: reportReason.trim(),
      badgeType: 'FOLLOWUP',
    });
    onUpdated();
    setReportModalOpen(false);
  };

  // Status Progression ("Start Journey" -> "In Progress" -> "Mark Job Completed & Closed")
  const getNextJourneyState = (): {
    nextStatus: BookingStatus | null;
    buttonLabel: string;
  } => {
    switch (booking.status) {
      case 'Confirmed':
      case 'Visit Scheduled':
        return { nextStatus: 'Journey Started', buttonLabel: 'Start Journey' };
      case 'Journey Started':
        return { nextStatus: 'In Progress', buttonLabel: 'Start Service (In Progress)' };
      case 'In Progress':
        return {
          nextStatus: 'Completed',
          buttonLabel: 'Mark Job Completed & Closed',
        };
      case 'Completed':
        return { nextStatus: null, buttonLabel: 'Job Completed & Closed' };
      case 'Reported':
        return { nextStatus: 'Visit Scheduled', buttonLabel: 'Re-Activate & Start Journey' };
      default:
        return { nextStatus: 'Journey Started', buttonLabel: 'Start Journey' };
    }
  };

  const journeyAction = getNextJourneyState();

  const handleAdvanceJourneyStatus = async () => {
    if (!journeyAction.nextStatus) return;
    await updateBooking(booking.id, {
      status: journeyAction.nextStatus,
    });
    onUpdated();
  };

  return (
    <div className="pb-28 space-y-4">
      {/* Sub-header with Back Navigation */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-stone-800 hover:text-[#5b6324] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </button>
        <span className="font-mono-num text-xs font-bold text-[#5b6324]">
          {booking.id}
        </span>
      </div>

      {/* SECTION 1: SERVICE FLOW GUIDE BANNER */}
      <div className="rounded-2xl bg-[#5b6324] text-white p-4 shadow-sm space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-[#e9ecd6]">
          Service Flow Guide
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenSelfieModal(booking.id)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Upload Selfie</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenFlowGuideModal}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Service Flow Guide (Read steps to avoid penalties)</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* SECTION 2: STATUS AND DATE ROW */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold tracking-wide">
            VISIT
          </span>
          <span className="px-3 py-1 rounded-lg bg-[#e9ecd6] text-[#5b6324] text-xs font-bold">
            {booking.status === 'Confirmed' ? 'Visit Scheduled' : booking.status}
          </span>
        </div>
        <div className="font-mono-num text-xs sm:text-sm font-bold text-stone-800">
          {formattedDate} · {booking.time}
        </div>
      </div>

      {/* SECTION 3: CLIENT AND ADDRESS */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono-num text-xs font-bold text-stone-500">
              Wo {booking.id}
            </p>
            <h2 className="text-lg font-bold text-stone-900">
              Name-{booking.customerName}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {booking.address}
            </p>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-[#e9ecd6] hover:bg-[#dce1be] text-[#5b6324] text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>Google Maps</span>
          </a>
        </div>

        {booking.reportReason && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            <strong>Reported Reason:</strong> {booking.reportReason}
          </div>
        )}
      </div>

      {/* SECTION 4: ITEMS */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-bold text-sm uppercase tracking-wider text-stone-500">
            Items
          </h3>
          <button
            type="button"
            onClick={() => setAddItemModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {booking.services.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[#f8f9f0] border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <p className="font-semibold text-sm text-stone-900">{item.name}</p>
                <p className="font-mono-num text-xs text-stone-600">
                  {item.quantity} X ₹{item.price}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-white rounded-lg border border-stone-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleChangeItemQty(item.id, -1)}
                    className="w-6 h-6 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-700 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono-num text-xs font-bold px-1.5">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChangeItemQty(item.id, 1)}
                    className="w-6 h-6 rounded-md bg-[#5b6324] text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Inline Editable Unit Price */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-stone-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) =>
                      handleChangeItemPrice(item.id, Number(e.target.value))
                    }
                    className="w-16 px-1.5 py-1 rounded-md bg-white border border-stone-200 font-mono-num text-xs font-semibold text-right"
                  />
                </div>

                <span className="font-mono-num text-sm font-bold text-stone-900 min-w-[60px] text-right">
                  ₹{item.price * item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-stone-200 flex items-center justify-between font-bold text-sm text-stone-900">
          <span>Items Total:</span>
          <span className="font-mono-num text-base text-[#5b6324]">
            ₹{booking.itemsTotal}
          </span>
        </div>
      </div>

      {/* SECTION 5: SCHEDULES */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-bold text-sm uppercase tracking-wider text-stone-500">
            Schedules
          </h3>
          <button
            type="button"
            onClick={() => {
              setNewDate(booking.date);
              setNewTime(booking.time);
              setRescheduleError(null);
              setRescheduleModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#e9ecd6] hover:bg-[#dce1be] text-[#5b6324] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Reschedule</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="space-y-1">
            <p className="font-semibold text-stone-900">{formattedDate}</p>
            <p className="font-mono-num text-stone-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#5b6324]" />
              <span>{booking.time}</span>
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">
            VISIT
          </span>
        </div>
      </div>

      {/* SECTION 6: PAYMENT SUMMARY */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-bold text-sm uppercase tracking-wider text-stone-500">
            Payment Summary
          </h3>
          <button
            type="button"
            onClick={() => {
              setEditItemsTotal(booking.itemsTotal);
              setEditDiscount(booking.discount);
              setEditAdvance(booking.advancePaid);
              setPaymentModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#e9ecd6] hover:bg-[#dce1be] text-[#5b6324] text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Payment</span>
          </button>
        </div>

        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-stone-700">
            <span>Items Total</span>
            <span className="font-mono-num font-semibold">₹{booking.itemsTotal}</span>
          </div>
          <div className="flex justify-between text-stone-700">
            <span>Discount</span>
            <span className="font-mono-num font-semibold">₹{booking.discount}</span>
          </div>
          <div className="flex justify-between text-stone-700">
            <span>Advance Payment</span>
            <span className="font-mono-num font-semibold">₹{booking.advancePaid}</span>
          </div>
          <div className="pt-2.5 border-t border-stone-200 flex justify-between items-baseline font-bold text-sm sm:text-base text-stone-900">
            <span>Amount To Be Collected</span>
            <span className="font-mono-num text-lg text-[#5b6324]">
              ₹{booking.amountToCollect}
            </span>
          </div>
        </div>

        {/* ₹99 ADVANCE PAYMENT VERIFICATION DETAILS (UTR / REF / SCREENSHOT) */}
        <div
          className={`mt-3 p-4 rounded-2xl border space-y-3 ${
            booking.paymentStatus === 'Pending Verification' ||
            booking.status === 'Pending Verification'
              ? 'bg-amber-50 border-amber-300'
              : booking.paymentStatus === 'Rejected'
              ? 'bg-red-50 border-red-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
              ₹99 Advance Payment Proof &amp; Status
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                booking.paymentStatus === 'Pending Verification' ||
                booking.status === 'Pending Verification'
                  ? 'bg-amber-200 text-amber-900'
                  : booking.paymentStatus === 'Rejected'
                  ? 'bg-red-200 text-red-900'
                  : 'bg-emerald-200 text-emerald-900'
              }`}
            >
              {booking.paymentStatus === 'Pending Verification' ||
              booking.status === 'Pending Verification'
                ? '⏳ Pending Verification'
                : booking.paymentStatus === 'Rejected'
                ? '❌ Rejected'
                : '✅ Verified & Approved'}
            </span>
          </div>

          {booking.utrNumber && (
            <div className="text-xs text-stone-800 bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between">
              <span>
                <strong>{booking.paymentProofType || 'UTR / Ref / Txn ID'}:</strong>{' '}
                <span className="font-mono-num font-bold">{booking.utrNumber}</span>
              </span>
            </div>
          )}

          {booking.paymentScreenshot && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-stone-700">
                Uploaded Payment Screenshot:
              </p>
              <a
                href={booking.paymentScreenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-xs rounded-xl overflow-hidden border-2 border-stone-300 bg-black"
              >
                <img
                  src={booking.paymentScreenshot}
                  alt="Customer Payment Screenshot"
                  className="w-full max-h-64 object-contain"
                />
              </a>
            </div>
          )}

          {(booking.paymentStatus === 'Pending Verification' ||
            booking.status === 'Pending Verification') && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await verifyBookingPayment(booking.id);
                  onUpdated();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Verify Payment &amp; Approve Booking</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await rejectBookingPayment(booking.id);
                  onUpdated();
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
              >
                Reject Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 7: TEAM */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-bold text-sm uppercase tracking-wider text-stone-500">
            Team
          </h3>
          <button
            type="button"
            onClick={() => setTeamModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#5b6324] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Add Team</span>
          </button>
        </div>

        {booking.assignedTeam.length === 0 ? (
          <p className="text-xs text-stone-500">
            Lead Artist: Subba Lakshmi (Tap &ldquo;+ Add Team&rdquo; to assign Assistant
            Makeup Artist, Hairstylist, or Saree Drapist).
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {booking.assignedTeam.map((member) => (
              <div
                key={member.id}
                className="px-3 py-2 rounded-xl bg-[#f8f9f0] border border-[#5b6324]/30 text-xs flex items-center gap-2"
              >
                <div>
                  <p className="font-bold text-stone-900">{member.name}</p>
                  <p className="text-[11px] text-stone-600">{member.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleTeamMember(member)}
                  className="text-stone-400 hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PART 19: STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setContactModalOpen(true)}
            className="py-3 px-3 rounded-xl bg-[#f8f9f0] hover:bg-[#e9ecd6] border border-[#5b6324]/30 text-stone-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-[#5b6324]" />
            <span>Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="py-3 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Job</span>
          </button>

          <button
            type="button"
            disabled={!journeyAction.nextStatus}
            onClick={handleAdvanceJourneyStatus}
            className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors ${
              journeyAction.nextStatus
                ? 'bg-[#5b6324] hover:bg-[#49501c] text-white shadow-sm cursor-pointer'
                : 'bg-emerald-100 text-emerald-800 cursor-default'
            }`}
          >
            {journeyAction.nextStatus ? (
              <Navigation className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span className="truncate">{journeyAction.buttonLabel}</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: ADD ITEM MODAL */}
      {addItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#f8f9f0] w-full max-w-md rounded-3xl p-5 border border-[#5b6324]/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-stone-900">
                Add Service or Custom Item
              </h4>
              <button
                type="button"
                onClick={() => setAddItemModalOpen(false)}
                className="p-1.5 rounded-lg bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                Select From Service Catalog
              </label>
              <select
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 text-xs font-semibold"
              >
                {servicesCatalog.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₹{s.price ?? 999}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddPredefinedItem}
                className="w-full py-2.5 rounded-xl bg-[#5b6324] text-white text-xs font-bold cursor-pointer"
              >
                + Add Selected Catalog Service
              </button>
            </div>

            <form
              onSubmit={handleAddCustomItem}
              className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-3"
            >
              <p className="text-xs font-bold text-stone-700">Or Add Custom Service</p>
              <input
                type="text"
                required
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Custom service name (e.g. Airbrush Upgrade / Flowers)"
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-0.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300 text-xs font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-0.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300 text-xs font-mono-num"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
              >
                + Add Custom Service
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESCHEDULE MODAL */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveReschedule}
            className="bg-[#f8f9f0] w-full max-w-md rounded-3xl p-5 border border-[#5b6324]/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-stone-900">
                Reschedule Appointment
              </h4>
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1.5 rounded-lg bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {rescheduleError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                New Date
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Available Time Slots
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableSlotsForReschedule.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setNewTime(slot.time)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-mono-num ${
                      !slot.available
                        ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                        : newTime === slot.time
                        ? 'bg-[#5b6324] text-white border-[#5b6324] font-bold cursor-pointer'
                        : 'bg-white text-stone-800 border-stone-300 cursor-pointer'
                    }`}
                  >
                    <div>{slot.time}</div>
                    <div className="text-[10px]">
                      {slot.available ? 'Available' : 'Booked'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#5b6324] text-white text-xs font-bold cursor-pointer"
              >
                Confirm Reschedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: EDIT PAYMENT SUMMARY MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePaymentSummary}
            className="bg-[#f8f9f0] w-full max-w-md rounded-3xl p-5 border border-[#5b6324]/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-stone-900">Edit Payment Summary</h4>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 rounded-lg bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Items Total (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editItemsTotal}
                  onChange={(e) => setEditItemsTotal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Advance Payment (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editAdvance}
                  onChange={(e) => setEditAdvance(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-mono-num"
                />
              </div>
              <div className="p-3 rounded-xl bg-[#e9ecd6] flex justify-between font-bold text-sm text-[#5b6324]">
                <span>Calculated Amount To Be Collected:</span>
                <span className="font-mono-num">
                  ₹{Math.max(0, editItemsTotal - editDiscount - editAdvance)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#5b6324] text-white text-xs font-bold cursor-pointer"
              >
                Save Payment Values
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: ASSIGN TEAM MODAL */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#f8f9f0] w-full max-w-md rounded-3xl p-5 border border-[#5b6324]/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-stone-900">
                Assign Team Members to Job
              </h4>
              <button
                type="button"
                onClick={() => setTeamModalOpen(false)}
                className="p-1.5 rounded-lg bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {allTeamMembers.map((member) => {
                const isAssigned = booking.assignedTeam.some((m) => m.id === member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleToggleTeamMember(member)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isAssigned
                        ? 'bg-[#e9ecd6] border-[#5b6324]'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-stone-900">{member.name}</p>
                      <p className="text-xs text-stone-600">
                        {member.role} · {member.phone}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        isAssigned
                          ? 'bg-[#5b6324] text-white'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {isAssigned ? 'Assigned' : '+ Assign'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setTeamModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#5b6324] text-white text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: CONTACT CLIENT MODAL */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#f8f9f0] w-full max-w-sm rounded-3xl p-5 border border-[#5b6324]/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-stone-900">
                Contact {booking.customerName}
              </h4>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="p-1.5 rounded-lg bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-mono-num text-sm font-bold text-center py-2 bg-white rounded-xl border border-stone-200">
              {booking.phone}
            </p>

            <div className="space-y-2.5">
              <a
                href={`tel:${booking.phone.replace(/\s+/g, '')}`}
                className="w-full py-3 rounded-xl bg-[#5b6324] text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Direct Phone Call</span>
              </a>

              <a
                href={`https://wa.me/${(booking.whatsapp || booking.phone).replace(
                  /[^0-9]/g,
                  ''
                )}?text=${encodeURIComponent(
                  `Hello ${booking.customerName}, this is Subba Lakshmi from Eden Roses Makeover regarding your appointment (${booking.id}) on ${booking.date} at ${booking.time}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Message</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(booking.phone);
                  setCopiedPhone(true);
                  setTimeout(() => setCopiedPhone(false), 2000);
                }}
                className="w-full py-3 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Phone Number Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Phone Number</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: REPORT JOB MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReportJob}
            className="bg-[#f8f9f0] w-full max-w-md rounded-3xl p-5 border border-red-300 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Report Job Issue ({booking.id})</span>
              </h4>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1.5 rounded-lg bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Reporting this job moves it to the Report queue and frees up the calendar
              slot if the client cancelled or was unreachable.
            </p>

            <textarea
              required
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter report reason (e.g., Client postponed event / Incorrect address / Unreachable)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-xs"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
