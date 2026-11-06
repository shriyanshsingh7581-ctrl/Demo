import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Minus,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  BookingSource,
  EventType,
  PartnerSelfieLog,
  ServiceCatalogItem,
  formatDateISO,
  getAvailableSlots,
  getPartnerSelfies,
  getServicesCatalog,
  getTodayISO,
  saveBooking,
  savePartnerSelfie,
} from '../../services/bookingStorage';
import { uploadImageAsset } from '../../services/firebaseConfig';
import { SmartImage } from '../SmartImage';

interface AddBookingModalProps {
  isOpen: boolean;
  initialDate?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddBookingModal: React.FC<AddBookingModalProps> = ({
  isOpen,
  initialDate,
  onClose,
  onSuccess,
}) => {
  const servicesCatalog = useMemo(() => getServicesCatalog(), [isOpen]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(initialDate || getTodayISO());
  const [time, setTime] = useState('08:00 AM');
  const [eventType, setEventType] = useState<EventType>('Wedding');
  const [bookingSource, setBookingSource] = useState<BookingSource>('Admin Manual');
  const [discount, setDiscount] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({
    'pkg-hair-half-up': 1,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate, isOpen]);

  const slots = useMemo(() => getAvailableSlots(date), [date, isOpen]);

  useEffect(() => {
    const current = slots.find((s) => s.time === time);
    if (current && !current.available) {
      const firstAvail = slots.find((s) => s.available);
      if (firstAvail) setTime(firstAvail.time);
    }
  }, [date, slots, time]);

  if (!isOpen) return null;

  const selectedItems = servicesCatalog
    .filter((s) => (selectedQuantities[s.id] || 0) > 0)
    .map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price ?? 999,
      quantity: selectedQuantities[s.id],
    }));

  const itemsTotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const amountToCollect = Math.max(0, itemsTotal - discount - advancePaid);

  const handleToggleQty = (srv: ServiceCatalogItem, delta: number) => {
    setSelectedQuantities((prev) => {
      const next = Math.max(0, (prev[srv.id] || 0) + delta);
      const copy = { ...prev };
      if (next === 0) {
        delete copy[srv.id];
      } else {
        copy[srv.id] = next;
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setError('Client Name, Phone Number, and Address are required.');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please select at least one service.');
      return;
    }

    const res = await saveBooking({
      customerName: customerName.trim(),
      phone: phone.trim(),
      whatsapp: (whatsapp.trim() || phone.trim()).replace(/[^0-9]/g, ''),
      address: address.trim(),
      eventType,
      services: selectedItems,
      date,
      time,
      itemsTotal,
      discount: Number(discount || 0),
      advancePaid: Number(advancePaid || 0),
      amountToCollect,
      notes: notes.trim(),
      status: 'Confirmed',
      bookingSource,
      assignedTeam: [],
      badgeType: 'VISIT',
    });

    if (!res.success) {
      setError(res.error || 'Slot unavailable.');
      return;
    }

    // Reset form
    setCustomerName('');
    setPhone('');
    setWhatsapp('');
    setAddress('');
    setNotes('');
    setDiscount(0);
    setAdvancePaid(0);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#f8f9f0] w-full max-w-lg rounded-3xl border border-[#5b6324]/30 shadow-2xl overflow-hidden my-6">
        <div className="bg-[#5b6324] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Add New Booking</h3>
            <p className="text-xs text-white/80">
              Subba Lakshmi Makeup · Instant Partner &amp; Website Sync
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-stone-900"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Client full name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Booking Source
              </label>
              <select
                value={bookingSource}
                onChange={(e) => setBookingSource(e.target.value as BookingSource)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm"
              >
                {[
                  'Admin Manual',
                  'WhatsApp',
                  'Phone Call',
                  'Instagram',
                  'Walk-in',
                  'Customer Website',
                ].map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98450 00000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Complete Venue / Client Address *
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Flat No, Building, Street, Locality, Bengaluru Pin Code"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value || formatDateISO(new Date()))}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Time Slot *
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-mono-num"
              >
                {slots.map((s) => (
                  <option key={s.time} value={s.time} disabled={!s.available}>
                    {s.time} {s.available ? '' : '(Booked)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-300 text-sm"
              >
                {(['Wedding', 'Engagement', 'Reception', 'Party', 'Photoshoot', 'Other'] as EventType[]).map(
                  (evt) => (
                    <option key={evt} value={evt}>
                      {evt}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Services Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Select Services &amp; Quantities *
            </label>
            <div className="bg-white rounded-2xl border border-stone-200 p-2.5 max-h-44 overflow-y-auto space-y-2">
              {servicesCatalog
                .filter((s) => s.price !== null)
                .map((srv) => {
                  const qty = selectedQuantities[srv.id] || 0;
                  return (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-xl hover:bg-stone-50 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800 truncate">{srv.name}</p>
                        <p className="font-mono-num text-stone-500">₹{srv.price}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleQty(srv, -1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono-num font-bold w-5 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleQty(srv, 1)}
                          className="w-7 h-7 rounded-lg bg-[#5b6324] text-white flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Discount & Advance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Advance Paid (₹)
              </label>
              <input
                type="number"
                min={0}
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional styling or venue notes..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-sm"
            />
          </div>

          {/* Payment Preview */}
          <div className="p-3.5 rounded-2xl bg-[#e9ecd6] border border-[#5b6324]/25 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-600 block">Items Total: ₹{itemsTotal}</span>
              <span className="text-stone-600 block">
                Discount: ₹{discount} · Advance: ₹{advancePaid}
              </span>
            </div>
            <div className="text-right">
              <span className="text-stone-600 block">To Collect</span>
              <span className="font-mono-num text-base font-bold text-[#5b6324]">
                ₹{amountToCollect}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white text-xs font-bold cursor-pointer"
            >
              Save Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== UPLOAD SELFIE MODAL ====================
interface SelfieModalProps {
  isOpen: boolean;
  bookingId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SelfieUploadModal: React.FC<SelfieModalProps> = ({
  isOpen,
  bookingId,
  onClose,
  onSuccess,
}) => {
  const [selfies, setSelfies] = useState<PartnerSelfieLog[]>([]);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelfies(getPartnerSelfies());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadImageAsset(file);
      savePartnerSelfie({
        bookingId,
        imageUrl,
        note: note.trim() || 'Partner uniform & hygiene check-in selfie',
      });
      setSelfies(getPartnerSelfies());
      setNote('');
      onSuccess?.();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#f8f9f0] w-full max-w-md rounded-3xl border border-[#5b6324]/30 shadow-2xl overflow-hidden">
        <div className="bg-[#5b6324] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-bold text-base">Upload Partner Attendance Selfie</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-stone-800">
          <p className="text-xs text-stone-600 leading-relaxed">
            Upload your arrival or kit-readiness selfie before starting the service to
            maintain 100% Partner Quality Compliance.
          </p>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              bookingId ? `Note for Job ${bookingId}...` : 'Venue arrival / kit check note...'
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-xs"
          />

          <label className="w-full py-4 rounded-2xl border-2 border-dashed border-[#5b6324] bg-[#e9ecd6]/50 hover:bg-[#e9ecd6] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
            <Camera className="w-6 h-6 text-[#5b6324]" />
            <span className="text-xs font-bold text-[#5b6324]">
              {uploading ? 'Uploading Selfie...' : 'Tap to Capture or Upload Selfie Photo'}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {selfies.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-200 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-stone-700">Recent Verified Selfies</p>
              {selfies.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center gap-3 text-xs"
                >
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                    <SmartImage
                      src={s.imageUrl}
                      alt="Partner Selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-800 truncate">{s.note}</p>
                    <p className="text-[11px] text-stone-500">
                      {new Date(s.timestamp).toLocaleString()}
                      {s.bookingId ? ` · ${s.bookingId}` : ''}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SERVICE FLOW GUIDE MODAL ====================
interface ServiceFlowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceFlowGuideModal: React.FC<ServiceFlowGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '01',
      title: 'Confirm Slot & Kit Hygiene Check',
      desc: 'Review client address, services, and saree/hair requirements 12 hours prior. Sanitize all brushes, beauty blenders, and airbrush nozzles.',
    },
    {
      step: '02',
      title: 'Tap "Start Journey" Before Leaving Studio',
      desc: 'Always update status to "Journey Started" at least 45 minutes before the scheduled appointment time.',
    },
    {
      step: '03',
      title: 'Upload Venue Arrival Selfie',
      desc: 'Upon reaching the client venue or studio chair, upload your Partner Selfie via the Olive Service Flow banner.',
    },
    {
      step: '04',
      title: 'Update Additional Items Before Completion',
      desc: 'If the bride or family adds extra saree draping or hairstyling on-site, add it under "Items (+ Add Item)" so the invoice updates automatically.',
    },
    {
      step: '05',
      title: 'Collect Balance & Mark Job Completed',
      desc: 'Verify the "Amount To Be Collected" in Payment Summary and tap "Mark Job Completed & Closed" to credit your Partner Wallet.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#f8f9f0] w-full max-w-lg rounded-3xl border border-[#5b6324]/30 shadow-2xl overflow-hidden">
        <div className="bg-[#5b6324] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            <h3 className="font-bold text-base">
              Service Flow Guide (Avoid Partner Penalties)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Following every step below ensures 100% On-Time Rating and zero cancellation
              or late-arrival penalties.
            </span>
          </div>

          {steps.map((s) => (
            <div
              key={s.step}
              className="p-3.5 rounded-2xl bg-white border border-stone-200 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-[#5b6324] text-white font-mono-num text-xs font-bold flex items-center justify-center shrink-0">
                {s.step}
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">{s.title}</h4>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#5b6324] text-white font-bold text-xs cursor-pointer"
          >
            Got It, Understood
          </button>
        </div>
      </div>
    </div>
  );
};
