import React, { useState } from 'react';
import {
  Building2,
  Scissors,
  Clock,
  Users,
  Image as ImageIcon,
  MessageCircle,
  PhoneCall,
  Download,
  LogOut,
  Plus,
  Trash2,
  Check,
  Upload,
  RefreshCw,
  UserCheck,
  CalendarOff,
  ChevronRight,
  ArrowLeft,
  Tag,
  IndianRupee,
  Edit3,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Booking,
  BusinessSettings,
  MakeupLandingGroup,
  MakeupSubCategory,
  ServiceCatalogItem,
  TeamMember,
  deleteServiceCatalogItem,
  resetDemoData,
  saveBusinessSettings,
  saveGalleryImages,
  saveServicesCatalog,
  saveTeamMembers,
  upsertServiceCatalogItem,
} from '../../services/bookingStorage';
import { EdenRoseImage, GalleryFilterCategory } from '../../config/edenRosesImages';
import { uploadImageAsset } from '../../services/firebaseConfig';
import { SmartImage } from '../SmartImage';

export type MoreSectionId =
  | 'menu'
  | 'business-profile'
  | 'service-management'
  | 'booking-availability'
  | 'customer-management'
  | 'team-management'
  | 'gallery-management'
  | 'whatsapp-contact'
  | 'data-export';

interface AdminMoreScreenProps {
  settings: BusinessSettings;
  services: ServiceCatalogItem[];
  team: TeamMember[];
  gallery: EdenRoseImage[];
  bookings: Booking[];
  initialSubScreen?: MoreSectionId;
  onSubScreenChange?: (screen: MoreSectionId) => void;
  onRefresh: () => void;
  onLogout: () => void;
}

const MAKEUP_SUB_CATEGORIES: MakeupSubCategory[] = [
  'Party Makeup',
  'Engagement Makeup',
  'Bridal Makeup',
  'Wedding Guest Makeup',
  'Saree Draping',
  'Hair Styling',
  'Packages',
  'Add-ons',
  'Salon for Women',
  'Salon for Men',
];

function mapSubCategoryToMainCategory(
  sub: MakeupSubCategory
): ServiceCatalogItem['category'] {
  switch (sub) {
    case 'Party Makeup':
    case 'Engagement Makeup':
    case 'Bridal Makeup':
    case 'Packages':
      return 'Bridal & Makeup Packages';
    case 'Wedding Guest Makeup':
    case 'Add-ons':
      return 'Makeup Services';
    case 'Saree Draping':
    case 'Hair Styling':
    case 'Salon for Men':
      return 'Hair & Styling';
    case 'Salon for Women':
      return 'Skin & Facial';
    default:
      return 'Makeup Services';
  }
}

function mapSubCategoryToLandingGroup(sub: MakeupSubCategory): MakeupLandingGroup {
  switch (sub) {
    case 'Saree Draping':
      return 'Saree Draping';
    case 'Hair Styling':
      return 'Hair Styling for Women';
    case 'Salon for Women':
      return 'Salon for Women';
    case 'Salon for Men':
      return 'Salon for Men';
    default:
      return 'Makeup & Styling for Women';
  }
}

export const AdminMoreScreen: React.FC<AdminMoreScreenProps> = ({
  settings,
  services,
  team,
  gallery,
  bookings,
  initialSubScreen = 'menu',
  onSubScreenChange,
  onRefresh,
  onLogout,
}) => {
  const [activeSubScreen, setActiveSubScreenState] =
    useState<MoreSectionId>(initialSubScreen);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveSubScreenState(initialSubScreen);
  }, [initialSubScreen]);

  const setActiveSubScreen = (screen: MoreSectionId) => {
    setActiveSubScreenState(screen);
    onSubScreenChange?.(screen);
  };

  // Editable Business Settings State
  const [formSettings, setFormSettings] = useState<BusinessSettings>(settings);

  // New Product / Service State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceSubCategory, setNewServiceSubCategory] =
    useState<MakeupSubCategory>('Party Makeup');
  const [newServiceCategory, setNewServiceCategory] =
    useState<ServiceCatalogItem['category']>('Bridal & Makeup Packages');
  const [newServicePrice, setNewServicePrice] = useState<string>('1999');
  const [newServiceOriginalPrice, setNewServiceOriginalPrice] = useState<string>('2499');
  const [newServiceDuration, setNewServiceDuration] = useState<string>('1 hr 30 mins');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceHighlights, setNewServiceHighlights] = useState('');
  const [newServiceAirbrush, setNewServiceAirbrush] = useState(false);
  const [newServiceImage, setNewServiceImage] = useState(
    gallery[0]?.url || settings.heroImageUrl
  );
  const [showPhotoPickerForNew, setShowPhotoPickerForNew] = useState(false);
  const [uploadingProductImg, setUploadingProductImg] = useState(false);

  // Filter & Search State for Product/Pricing Manager
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogSubCategoryFilter, setCatalogSubCategoryFilter] = useState<
    'All' | MakeupSubCategory
  >('All');

  // Full Edit Product Modal State
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [editHighlightsText, setEditHighlightsText] = useState('');
  const [editIncludedText, setEditIncludedText] = useState('');
  const [showPhotoPickerForEdit, setShowPhotoPickerForEdit] = useState(false);

  // New Team Member State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] =
    useState<TeamMember['role']>('Assistant Makeup Artist');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // Availability State
  const [newSlotInput, setNewSlotInput] = useState('');
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // Gallery Upload State
  const [newGalleryAlt, setNewGalleryAlt] = useState('');
  const [newGalleryCat, setNewGalleryCat] =
    useState<Exclude<GalleryFilterCategory, 'All'>>('Bridal Makeup');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [selectedServiceForImg, setSelectedServiceForImg] = useState<string>(
    services[0]?.id || ''
  );

  const showToast = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(null), 2800);
  };

  // Save Business Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBusinessSettings(formSettings);
    onRefresh();
    showToast('Business Settings updated and synced to Customer Website!');
  };

  // Service Catalog & Pricing Handlers
  const handleUpdateServicePrice = async (id: string, priceStr: string) => {
    const val = priceStr.trim() === '' ? null : Math.max(0, Number(priceStr));
    const target = services.find((s) => s.id === id);
    if (!target) return;
    await upsertServiceCatalogItem({ ...target, price: val });
    onRefresh();
  };

  const handleUpdateServiceOriginalPrice = async (id: string, origPriceStr: string) => {
    const val = origPriceStr.trim() === '' ? undefined : Math.max(0, Number(origPriceStr));
    const target = services.find((s) => s.id === id);
    if (!target) return;
    await upsertServiceCatalogItem({ ...target, originalPrice: val });
    onRefresh();
  };

  const handleQuickAdjustPrice = async (id: string, delta: number) => {
    const target = services.find((s) => s.id === id);
    if (!target) return;
    const currentPrice = target.price ?? 1000;
    const nextPrice = Math.max(99, currentPrice + delta);
    await upsertServiceCatalogItem({ ...target, price: nextPrice });
    onRefresh();
    showToast(`Updated "${target.name}" price to ₹${nextPrice.toLocaleString('en-IN')}`);
  };

  const handleUploadProductPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'new' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProductImg(true);
    try {
      const url = await uploadImageAsset(file);
      if (mode === 'new') {
        setNewServiceImage(url);
      } else if (editingService) {
        setEditingService({ ...editingService, image: url });
      }
      showToast('Product photo uploaded!');
    } finally {
      setUploadingProductImg(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const parsedHighlights = newServiceHighlights
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

    const mappedCategory = mapSubCategoryToMainCategory(newServiceSubCategory);
    const mappedLanding = mapSubCategoryToLandingGroup(newServiceSubCategory);

    const item: ServiceCatalogItem = {
      id: `srv-custom-${Date.now()}`,
      name: newServiceName.trim(),
      category: mappedCategory || newServiceCategory,
      makeupSubCategory: newServiceSubCategory,
      landingGroup: mappedLanding,
      description:
        newServiceDesc.trim() ||
        `Professional ${newServiceSubCategory} service by Subba Lakshmi at Eden Roses Makeover.`,
      price:
        newServicePrice.trim() === '' ? null : Math.max(0, Number(newServicePrice)),
      originalPrice:
        newServiceOriginalPrice.trim() === ''
          ? undefined
          : Math.max(0, Number(newServiceOriginalPrice)),
      duration: newServiceDuration.trim() || '1 hr 15 mins',
      rating: 4.9,
      reviewCount: 38,
      highlights:
        parsedHighlights.length > 0
          ? parsedHighlights
          : [
              `Professional ${newServiceSubCategory} using luxury HD international brands`,
              'Available at C V Raman Nagar Studio or doorstep across Bengaluru',
            ],
      whatsIncluded:
        parsedHighlights.length > 0
          ? parsedHighlights
          : [
              'Complete skin preparation & long-wear HD base',
              'Complimentary basic hairstyling & outfit/saree draping assistance',
            ],
      image: newServiceImage || gallery[0]?.url || settings.heroImageUrl,
      isPackage:
        newServiceSubCategory === 'Packages' ||
        newServiceSubCategory === 'Bridal Makeup' ||
        newServiceSubCategory === 'Engagement Makeup',
      airbrushAvailable: newServiceAirbrush,
    };

    await upsertServiceCatalogItem(item);
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceHighlights('');
    onRefresh();
    showToast(`Added "${item.name}" (₹${item.price ?? 'Consult'}) to live website!`);
  };

  const openEditServiceModal = (srv: ServiceCatalogItem) => {
    setEditingService({ ...srv });
    setEditHighlightsText((srv.highlights || []).join('\n'));
    setEditIncludedText((srv.whatsIncluded || []).join('\n'));
    setShowPhotoPickerForEdit(false);
  };

  const handleSaveEditedService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editingService.name.trim()) return;
    const subCat = editingService.makeupSubCategory || 'Party Makeup';
    const updatedHighlights = editHighlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const updatedIncluded = editIncludedText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedItem: ServiceCatalogItem = {
      ...editingService,
      name: editingService.name.trim(),
      makeupSubCategory: subCat,
      category: mapSubCategoryToMainCategory(subCat),
      landingGroup: mapSubCategoryToLandingGroup(subCat),
      highlights: updatedHighlights.length > 0 ? updatedHighlights : editingService.highlights,
      whatsIncluded:
        updatedIncluded.length > 0 ? updatedIncluded : editingService.whatsIncluded,
    };

    await upsertServiceCatalogItem(updatedItem);
    setEditingService(null);
    onRefresh();
    showToast(`Saved changes to "${updatedItem.name}" & synced to website!`);
  };

  const handleDeleteService = async (id: string) => {
    await deleteServiceCatalogItem(id);
    onRefresh();
    showToast('Product / Service removed from catalog.');
  };

  // Team Handlers
  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPhone.trim()) return;
    const member: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole,
      phone: newMemberPhone.trim(),
      active: true,
    };
    await saveTeamMembers([...team, member]);
    setNewMemberName('');
    setNewMemberPhone('');
    onRefresh();
    showToast('Team member added!');
  };

  const handleRemoveTeamMember = async (id: string) => {
    await saveTeamMembers(team.filter((m) => m.id !== id));
    onRefresh();
  };

  // Gallery Handlers
  const handleUploadNewGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadImageAsset(file);
      const newEntry: EdenRoseImage = {
        id: `gal-${Date.now()}`,
        url,
        alt: newGalleryAlt.trim() || 'Eden Roses Makeover Portfolio Photo',
        category: 'Bridal Portfolio',
        galleryCategory: newGalleryCat,
        description: `Uploaded via Partner App (${newGalleryCat})`,
        displayPosition: 'Gallery Grid',
      };
      await saveGalleryImages([newEntry, ...gallery]);
      setNewGalleryAlt('');
      onRefresh();
      showToast('Photo uploaded to Eden Roses Gallery!');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleReplaceGalleryImage = async (
    imgId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImageAsset(file);
    const updated = gallery.map((g) => (g.id === imgId ? { ...g, url } : g));
    await saveGalleryImages(updated);
    onRefresh();
    showToast('Gallery photo replaced!');
  };

  const handleDeleteGalleryImage = async (imgId: string) => {
    await saveGalleryImages(gallery.filter((g) => g.id !== imgId));
    onRefresh();
    showToast('Photo removed from gallery.');
  };

  const handleSetAsHeroImage = async (url: string) => {
    const updated = { ...settings, heroImageUrl: url };
    setFormSettings(updated);
    await saveBusinessSettings(updated);
    onRefresh();
    showToast('Customer Website Hero Image updated!');
  };

  const handleAssignImageToService = async (url: string) => {
    if (!selectedServiceForImg) return;
    const updated = services.map((s) =>
      s.id === selectedServiceForImg ? { ...s, image: url } : s
    );
    await saveServicesCatalog(updated);
    onRefresh();
    showToast('Assigned photo to selected service!');
  };

  // Derived Customers List from Bookings
  const customersMap = new Map<
    string,
    {
      name: string;
      phone: string;
      whatsapp: string;
      address: string;
      bookingsCount: number;
      totalSpent: number;
    }
  >();
  bookings.forEach((b) => {
    const key = b.phone.replace(/\s+/g, '');
    const existing = customersMap.get(key);
    const spend = Math.max(0, b.itemsTotal - b.discount);
    if (existing) {
      existing.bookingsCount += 1;
      existing.totalSpent += spend;
    } else {
      customersMap.set(key, {
        name: b.customerName,
        phone: b.phone,
        whatsapp: b.whatsapp || b.phone,
        address: b.address,
        bookingsCount: 1,
        totalSpent: spend,
      });
    }
  });
  const customersList = Array.from(customersMap.values());

  // Export CSV / JSON
  const handleExportCSV = () => {
    const headers = [
      'Booking ID',
      'Customer Name',
      'Phone',
      'Date',
      'Time',
      'Event Type',
      'Status',
      'Items Total',
      'Discount',
      'Advance Paid',
      'Balance To Collect',
      'Address',
    ];
    const rows = bookings.map((b) => [
      b.id,
      `"${b.customerName.replace(/"/g, '""')}"`,
      b.phone,
      b.date,
      b.time,
      b.eventType,
      b.status,
      b.itemsTotal,
      b.discount,
      b.advancePaid,
      b.amountToCollect,
      `"${b.address.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eden-roses-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      businessSettings: settings,
      bookings,
      services,
      team,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eden-roses-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (activeSubScreen === 'menu') {
    const menuItems = [
      {
        id: 'business-profile' as MoreSectionId,
        icon: Building2,
        title: 'Business Profile & Studio Settings',
        subtitle: 'Artist name, logo, C V Raman Nagar address, hours, social links',
      },
      {
        id: 'service-management' as MoreSectionId,
        icon: Scissors,
        title: 'Service & Package Management',
        subtitle: `Manage ${services.length} makeup packages & salon services`,
      },
      {
        id: 'booking-availability' as MoreSectionId,
        icon: Clock,
        title: 'Booking & Availability Settings',
        subtitle: 'Configure daily time slots and block unavailable dates',
      },
      {
        id: 'customer-management' as MoreSectionId,
        icon: UserCheck,
        title: 'Customer Management',
        subtitle: `${customersList.length} verified clients with booking history`,
      },
      {
        id: 'team-management' as MoreSectionId,
        icon: Users,
        title: 'Team Management',
        subtitle: `${team.length} stylists, saree drapists & assistant makeup artists`,
      },
      {
        id: 'gallery-management' as MoreSectionId,
        icon: ImageIcon,
        title: 'Gallery & Original Photos Management',
        subtitle: `Manage ${gallery.length} original Eden Roses photos, Hero & Service images`,
      },
      {
        id: 'whatsapp-contact' as MoreSectionId,
        icon: MessageCircle,
        title: 'WhatsApp & Business Contact Settings',
        subtitle: `Active WhatsApp: +${settings.whatsappNumber}`,
      },
      {
        id: 'data-export' as MoreSectionId,
        icon: Download,
        title: 'Data Export & Demo Reset',
        subtitle: 'Export CSV / JSON reports or restore initial seed bookings',
      },
    ];

    return (
      <div className="space-y-4 pb-24">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Partner Settings &amp; Management
            </h2>
            <p className="text-xs text-stone-600">
              {settings.makeupBrand} — By {settings.artistName}
            </p>
          </div>
          <div className="w-16 h-12 rounded-xl bg-[#160824] border border-[#D6B77A]/60 overflow-hidden flex items-center justify-center shrink-0">
            <SmartImage
              src={settings.logoUrl}
              alt={settings.makeupBrand}
              fit="cover"
              className="w-full h-full object-center scale-110"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSubScreen(item.id)}
                className="w-full p-4 rounded-2xl bg-white hover:bg-[#e9ecd6]/50 border border-stone-200 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#e9ecd6] text-[#5b6324] flex items-center justify-center shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-stone-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-stone-500 truncate">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Partner App</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveSubScreen('menu')}
          className="flex items-center gap-2 text-sm font-bold text-stone-800 hover:text-[#5b6324] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to More Menu</span>
        </button>
      </div>

      {savedBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm">
          <Check className="w-4 h-4 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* 1. BUSINESS PROFILE & SETTINGS */}
      {(activeSubScreen === 'business-profile' ||
        activeSubScreen === 'whatsapp-contact') && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-2xl p-5 border border-stone-200 space-y-4"
        >
          <h3 className="font-bold text-base text-stone-900 border-b border-stone-100 pb-2">
            Editable Business Profile &amp; Contact Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Business Name</label>
              <input
                type="text"
                value={formSettings.businessName}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, businessName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Makeup Brand</label>
              <input
                type="text"
                value={formSettings.makeupBrand}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, makeupBrand: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Makeup Artist Name
              </label>
              <input
                type="text"
                value={formSettings.artistName}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, artistName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Business Logo URL
              </label>
              <input
                type="text"
                value={formSettings.logoUrl}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, logoUrl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={formSettings.phonePrimary}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, phonePrimary: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Secondary Phone Number
              </label>
              <input
                type="text"
                value={formSettings.phoneSecondary}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, phoneSecondary: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                WhatsApp Number (with country code)
              </label>
              <input
                type="text"
                value={formSettings.whatsappNumber}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, whatsappNumber: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300 font-mono-num"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Email</label>
              <input
                type="email"
                value={formSettings.email}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, email: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Business Location
              </label>
              <input
                type="text"
                value={formSettings.location}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, location: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Website URL</label>
              <input
                type="text"
                value={formSettings.websiteUrl}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, websiteUrl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Primary Studio Address (C V Raman Nagar / Nagavarapalya)
              </label>
              <textarea
                rows={2}
                value={formSettings.address}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, address: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Google Maps Link
              </label>
              <input
                type="text"
                value={formSettings.googleMapsLink}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, googleMapsLink: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Opening Hours
                </label>
                <input
                  type="text"
                  value={formSettings.openingHours}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, openingHours: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Instagram Link
                </label>
                <input
                  type="text"
                  value={formSettings.instagramUrl}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, instagramUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Service Area</label>
              <input
                type="text"
                value={formSettings.serviceArea}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, serviceArea: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Business Description
              </label>
              <textarea
                rows={3}
                value={formSettings.description}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white font-bold text-xs cursor-pointer"
          >
            Save &amp; Sync Business Profile
          </button>
        </form>
      )}

      {/* 2. PRODUCT, SERVICE & PRICING MANAGEMENT */}
      {activeSubScreen === 'service-management' && (
        <div className="space-y-5">
          {/* TOP BANNER */}
          <div className="rounded-2xl bg-[#5b6324] text-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#e9ecd6]" />
                <h3 className="font-bold text-sm sm:text-base">
                  Products, Services &amp; Pricing Manager (प्रोडक्ट और प्राइसिंग मैनेजर)
                </h3>
              </div>
              <p className="text-xs text-[#e9ecd6] mt-1">
                Add new makeup packages/services or change prices anytime — updates sync live to Customer Website!
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/15 text-xs font-bold whitespace-nowrap self-start sm:self-auto">
              Total Products: {services.length}
            </div>
          </div>

          {/* ADD NEW PRODUCT / SERVICE / PACKAGE FORM */}
          <form
            onSubmit={handleAddService}
            className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#e9ecd6] text-[#5b6324] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    + Add New Product / Makeup Service / Package (नया प्रोडक्ट या सर्विस जोड़ें)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Appears immediately in the selected Makeup &amp; Styling category on the website
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Product / Service Name (प्रोडक्ट / सर्विस का नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g., HD Bridal Muhurtham Makeup or Saree Pre-Pleating"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Website Category (किस कैटेगरी में दिखाना है) *
                </label>
                <select
                  value={newServiceSubCategory}
                  onChange={(e) => {
                    const sub = e.target.value as MakeupSubCategory;
                    setNewServiceSubCategory(sub);
                    setNewServiceCategory(mapSubCategoryToMainCategory(sub));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 font-semibold text-stone-900"
                >
                  {MAKEUP_SUB_CATEGORIES.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Selling Price ₹ (ऑफर प्राइस ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="e.g. 1999"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 font-mono-num font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  MRP / Original Price ₹ (डिस्काउंट से पहले)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={newServiceOriginalPrice}
                    onChange={(e) => setNewServiceOriginalPrice(e.target.value)}
                    placeholder="e.g. 2499"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 font-mono-num text-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Duration (समय)
                </label>
                <input
                  type="text"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  placeholder="e.g. 1 hr 30 mins"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 text-stone-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Product / Service Description (विवरण)
                </label>
                <textarea
                  rows={2}
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  placeholder="Describe what this makeup or styling service offers..."
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Key Highlights / What&apos;s Included (एक लाइन में एक पॉइंट लिखें)
                </label>
                <textarea
                  rows={2}
                  value={newServiceHighlights}
                  onChange={(e) => setNewServiceHighlights(e.target.value)}
                  placeholder={'Long-wear waterproof HD base\nIncludes hairstyling & saree draping'}
                  className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
                />
              </div>
            </div>

            {/* PRODUCT PHOTO SELECTOR */}
            <div className="p-3.5 rounded-2xl bg-[#f8f9f0] border border-stone-200 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-stone-300 shrink-0">
                    <SmartImage
                      src={newServiceImage}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Product Photo (फोटो चुनें या अपलोड करें)</p>
                    <p className="text-[11px] text-stone-500">
                      Upload from mobile/PC, choose from studio gallery, or paste image link
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <label className="px-3 py-2 rounded-xl bg-[#5b6324] text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingProductImg ? 'Uploading...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadProductPhoto(e, 'new')}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPhotoPickerForNew((v) => !v)}
                    className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
                  >
                    {showPhotoPickerForNew ? 'Hide Studio Photos' : 'Pick from Studio Gallery'}
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={newServiceImage}
                onChange={(e) => setNewServiceImage(e.target.value)}
                placeholder="Or paste image URL here..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-[11px]"
              />

              {showPhotoPickerForNew && (
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                  {gallery.slice(0, 24).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setNewServiceImage(g.url);
                        setShowPhotoPickerForNew(false);
                      }}
                      className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${
                        newServiceImage === g.url
                          ? 'border-[#5b6324] ring-2 ring-[#5b6324]/30'
                          : 'border-transparent'
                      }`}
                    >
                      <SmartImage
                        src={g.url}
                        alt={g.alt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newServiceAirbrush}
                  onChange={(e) => setNewServiceAirbrush(e.target.checked)}
                  className="rounded border-stone-300 text-[#5b6324]"
                />
                <span className="font-semibold text-stone-700">
                  Show &quot;HD &amp; Airbrush Available&quot; badge on this product
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product &amp; Sync Price to Website (वेबसाइट पर जोड़ें)</span>
            </button>
          </form>

          {/* EXISTING PRODUCTS & INSTANT PRICE EDITOR */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-900">
                  Change Pricing &amp; Edit Products ({services.length} Active Items)
                </h3>
                <p className="text-[11px] text-stone-500">
                  Type a new Selling Price (₹) or MRP (₹) below or tap -₹100 / +₹100 / +₹500 for instant update
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search product or price..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300 text-xs"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['All', ...MAKEUP_SUB_CATEGORIES] as const).map((cat) => {
                const active = catalogSubCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogSubCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#5b6324] text-white'
                        : 'bg-[#f8f9f0] text-stone-700 border border-stone-200 hover:bg-[#e9ecd6]/50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Product List */}
            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {services
                .filter((srv) => {
                  if (
                    catalogSubCategoryFilter !== 'All' &&
                    srv.makeupSubCategory !== catalogSubCategoryFilter
                  ) {
                    return false;
                  }
                  if (catalogSearch.trim()) {
                    const q = catalogSearch.toLowerCase();
                    return (
                      srv.name.toLowerCase().includes(q) ||
                      (srv.makeupSubCategory || '').toLowerCase().includes(q) ||
                      srv.category.toLowerCase().includes(q) ||
                      String(srv.price || '').includes(q)
                    );
                  }
                  return true;
                })
                .map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-2xl bg-[#f8f9f0] border border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 text-xs hover:border-[#5b6324]/40 transition-colors"
                  >
                    {/* Left: Image & Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white border border-stone-200">
                        <SmartImage
                          src={srv.image}
                          alt={srv.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#e9ecd6] text-[#5b6324] text-[10px] font-bold">
                            {srv.makeupSubCategory || srv.category}
                          </span>
                          {srv.duration && (
                            <span className="text-[10px] text-stone-500 font-medium">
                              · {srv.duration}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-stone-900 leading-snug">
                          {srv.name}
                        </p>
                        <p className="text-[11px] text-stone-500 line-clamp-1">
                          {srv.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Price Inputs + Quick Adjusters + Edit / Delete */}
                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-200/80 shrink-0">
                      {/* Selling Price Input */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-stone-500 mb-0.5">
                          Selling Price (₹)
                        </span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            placeholder="Consult"
                            value={srv.price ?? ''}
                            onChange={(e) => handleUpdateServicePrice(srv.id, e.target.value)}
                            className="w-24 pl-6 pr-2 py-1.5 rounded-xl bg-white border border-[#5b6324]/40 font-mono-num font-bold text-stone-900 text-right"
                          />
                        </div>
                      </div>

                      {/* Original Price / MRP Input */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-stone-400 mb-0.5">
                          MRP / Strike (₹)
                        </span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            placeholder="MRP"
                            value={srv.originalPrice ?? ''}
                            onChange={(e) =>
                              handleUpdateServiceOriginalPrice(srv.id, e.target.value)
                            }
                            className="w-22 pl-6 pr-2 py-1.5 rounded-xl bg-white border border-stone-300 font-mono-num text-stone-600 text-right"
                          />
                        </div>
                      </div>

                      {/* Quick Adjuster Buttons */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-stone-500 mb-0.5">
                          Quick Change
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustPrice(srv.id, -100)}
                            className="px-2 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 font-mono-num font-bold text-[11px] text-stone-700 cursor-pointer"
                            title="Decrease price by ₹100"
                          >
                            -100
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustPrice(srv.id, 100)}
                            className="px-2 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 font-mono-num font-bold text-[11px] text-[#5b6324] cursor-pointer"
                            title="Increase price by ₹100"
                          >
                            +100
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustPrice(srv.id, 500)}
                            className="px-2 py-1.5 rounded-lg bg-[#e9ecd6] hover:bg-[#dfe4c4] border border-[#5b6324]/30 font-mono-num font-bold text-[11px] text-[#5b6324] cursor-pointer"
                            title="Increase price by ₹500"
                          >
                            +500
                          </button>
                        </div>
                      </div>

                      {/* Full Edit & Delete */}
                      <div className="flex items-center gap-1.5 self-end">
                        <button
                          type="button"
                          onClick={() => openEditServiceModal(srv)}
                          className="px-3 py-1.5 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-2 rounded-xl bg-white hover:bg-red-50 border border-stone-200 text-stone-400 hover:text-red-600 cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* FULL EDIT PRODUCT MODAL */}
          {editingService && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-stone-200 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-stone-900">
                      Edit Product &amp; Pricing (प्रोडक्ट और प्राइस एडिट करें)
                    </h3>
                    <p className="text-xs text-stone-500">{editingService.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingService(null)}
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedService} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Product / Service Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingService.name}
                      onChange={(e) =>
                        setEditingService({ ...editingService, name: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 font-bold text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        Website Makeup Sub-Category
                      </label>
                      <select
                        value={editingService.makeupSubCategory || 'Party Makeup'}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            makeupSubCategory: e.target.value as MakeupSubCategory,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 font-semibold"
                      >
                        {MAKEUP_SUB_CATEGORIES.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={editingService.duration || ''}
                        onChange={(e) =>
                          setEditingService({ ...editingService, duration: e.target.value })
                        }
                        placeholder="e.g. 1 hr 30 mins"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingService.price ?? ''}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            price: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-[#5b6324] font-mono-num font-bold text-sm text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        Original / MRP Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingService.originalPrice ?? ''}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            originalPrice:
                              e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#f8f9f0] border border-stone-300 font-mono-num text-sm text-stone-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={editingService.description}
                      onChange={(e) =>
                        setEditingService({
                          ...editingService,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Card Bullet Highlights (1 per line)
                    </label>
                    <textarea
                      rows={2}
                      value={editHighlightsText}
                      onChange={(e) => setEditHighlightsText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      What&apos;s Included in View Details (1 per line)
                    </label>
                    <textarea
                      rows={3}
                      value={editIncludedText}
                      onChange={(e) => setEditIncludedText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
                    />
                  </div>

                  {/* Photo selector in Edit modal */}
                  <div className="p-3 rounded-2xl bg-[#f8f9f0] border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-stone-300 shrink-0">
                          <SmartImage
                            src={editingService.image}
                            alt={editingService.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-bold text-stone-800">Product Image</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-2.5 py-1.5 rounded-xl bg-[#5b6324] text-white font-bold text-[11px] cursor-pointer">
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadProductPhoto(e, 'edit')}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPhotoPickerForEdit((v) => !v)}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold text-[11px] cursor-pointer"
                        >
                          Gallery
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={editingService.image}
                      onChange={(e) =>
                        setEditingService({ ...editingService, image: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-stone-300 text-[11px]"
                    />

                    {showPhotoPickerForEdit && (
                      <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                        {gallery.slice(0, 20).map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              setEditingService({ ...editingService, image: g.url });
                              setShowPhotoPickerForEdit(false);
                            }}
                            className="aspect-square rounded-lg overflow-hidden border border-stone-200 cursor-pointer"
                          >
                            <SmartImage
                              src={g.url}
                              alt={g.alt}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingService(null)}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white font-bold cursor-pointer"
                    >
                      Save &amp; Sync Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. BOOKING & AVAILABILITY SETTINGS */}
      {activeSubScreen === 'booking-availability' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-stone-900">
              Daily Appointment Time Slots
            </h3>
            <div className="flex flex-wrap gap-2">
              {settings.timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="px-3 py-1.5 rounded-xl bg-[#e9ecd6] text-[#5b6324] font-mono-num text-xs font-bold flex items-center gap-2"
                >
                  <span>{slot}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = settings.timeSlots.filter((s) => s !== slot);
                      await saveBusinessSettings({ ...settings, timeSlots: next });
                      onRefresh();
                    }}
                    className="text-stone-500 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSlotInput}
                onChange={(e) => setNewSlotInput(e.target.value)}
                placeholder="e.g., 09:30 AM"
                className="px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300 text-xs font-mono-num"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newSlotInput.trim()) return;
                  const next = Array.from(
                    new Set([...settings.timeSlots, newSlotInput.trim()])
                  );
                  await saveBusinessSettings({ ...settings, timeSlots: next });
                  setNewSlotInput('');
                  onRefresh();
                }}
                className="px-4 py-2 rounded-xl bg-[#5b6324] text-white text-xs font-bold cursor-pointer"
              >
                + Add Slot
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-stone-200">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-red-600" />
              <span>Blocked / Holiday Dates</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300 text-xs font-mono-num"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newBlockedDate) return;
                  const next = Array.from(
                    new Set([...settings.blockedDates, newBlockedDate])
                  );
                  await saveBusinessSettings({ ...settings, blockedDates: next });
                  setNewBlockedDate('');
                  onRefresh();
                  showToast(`Blocked ${newBlockedDate} from customer bookings.`);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                Block Date
              </button>
            </div>

            {settings.blockedDates.length === 0 ? (
              <p className="text-xs text-stone-500">No dates currently blocked.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {settings.blockedDates.map((d) => (
                  <div
                    key={d}
                    className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-mono-num text-xs font-bold flex items-center gap-2"
                  >
                    <span>{d}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const next = settings.blockedDates.filter((x) => x !== d);
                        await saveBusinessSettings({ ...settings, blockedDates: next });
                        onRefresh();
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CUSTOMER MANAGEMENT */}
      {activeSubScreen === 'customer-management' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-3">
          <h3 className="font-bold text-sm text-stone-900">
            Client Directory ({customersList.length})
          </h3>
          <div className="space-y-2.5">
            {customersList.map((c) => (
              <div
                key={c.phone}
                className="p-3.5 rounded-2xl bg-[#f8f9f0] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-sm text-stone-900">{c.name}</p>
                  <p className="font-mono-num text-stone-600">{c.phone}</p>
                  <p className="text-stone-500 mt-0.5 line-clamp-1">{c.address}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-2">
                    <span className="block text-[11px] text-stone-500">
                      {c.bookingsCount} booking(s)
                    </span>
                    <span className="font-mono-num font-bold text-[#5b6324]">
                      ₹{c.totalSpent}
                    </span>
                  </div>
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, '')}`}
                    className="p-2 rounded-xl bg-[#5b6324] text-white"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-[#25D366] text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TEAM MANAGEMENT */}
      {activeSubScreen === 'team-management' && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddTeamMember}
            className="bg-white rounded-2xl p-5 border border-stone-200 space-y-3"
          >
            <h3 className="font-bold text-sm text-stone-900">+ Add Team Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <input
                type="text"
                required
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Full Name *"
                className="px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
              <select
                value={newMemberRole}
                onChange={(e) =>
                  setNewMemberRole(e.target.value as TeamMember['role'])
                }
                className="px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              >
                <option value="Assistant Makeup Artist">Assistant Makeup Artist</option>
                <option value="Hairstylist">Hairstylist</option>
                <option value="Saree Drapist">Saree Drapist</option>
                <option value="Other Team Member">Other Team Member</option>
              </select>
              <input
                type="tel"
                required
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                placeholder="Phone Number *"
                className="px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#5b6324] text-white text-xs font-bold cursor-pointer"
            >
              Save Team Member
            </button>
          </form>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-2.5">
            <h3 className="font-bold text-sm text-stone-900">
              Active Eden Roses Team ({team.length})
            </h3>
            {team.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-[#f8f9f0] border border-stone-200 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-sm text-stone-900">{m.name}</p>
                  <p className="text-stone-600">
                    {m.role} · {m.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTeamMember(m.id)}
                  className="p-2 text-stone-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. GALLERY & ORIGINAL PHOTOS MANAGEMENT */}
      {activeSubScreen === 'gallery-management' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-3">
            <h3 className="font-bold text-sm text-stone-900">
              Upload New Photo to Gallery (Cloudinary / Local)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <input
                type="text"
                value={newGalleryAlt}
                onChange={(e) => setNewGalleryAlt(e.target.value)}
                placeholder="Photo caption / Alt text"
                className="px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              />
              <select
                value={newGalleryCat}
                onChange={(e) =>
                  setNewGalleryCat(
                    e.target.value as Exclude<GalleryFilterCategory, 'All'>
                  )
                }
                className="px-3 py-2 rounded-xl bg-[#f8f9f0] border border-stone-300"
              >
                {[
                  'Bridal Makeup',
                  'Party Makeup',
                  'Engagement Makeup',
                  'Hairstyling',
                  'Salon',
                  'Beauty Services',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <label className="w-full py-3 rounded-xl bg-[#5b6324] hover:bg-[#49501c] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>
                {uploadingImg ? 'Uploading Image...' : 'Upload New Portfolio Image'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadNewGalleryImage}
                className="hidden"
              />
            </label>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-stone-900">
                Original Eden Roses Website Photos ({gallery.length})
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500">Target Service:</span>
                <select
                  value={selectedServiceForImg}
                  onChange={(e) => setSelectedServiceForImg(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#f8f9f0] border border-stone-300 text-xs"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
              {gallery.map((img) => (
                <div
                  key={img.id}
                  className="p-3 rounded-2xl bg-[#f8f9f0] border border-stone-200 flex gap-3 items-start"
                >
                  <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 bg-white border border-stone-200">
                    <SmartImage
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                    <p className="font-bold text-stone-900 truncate">{img.alt}</p>
                    <p className="text-[11px] text-stone-500">
                      {img.galleryCategory || img.category}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSetAsHeroImage(img.url)}
                        className="px-2 py-1 rounded-md bg-[#5b6324] text-white text-[10px] font-bold cursor-pointer"
                      >
                        Set Hero
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignImageToService(img.url)}
                        className="px-2 py-1 rounded-md bg-stone-800 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Assign to Service
                      </button>
                      <label className="px-2 py-1 rounded-md bg-white border border-stone-300 text-stone-700 text-[10px] font-bold cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleReplaceGalleryImage(img.id, e)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteGalleryImage(img.id)}
                        className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-[10px] font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. DATA EXPORT & DEMO RESET */}
      {activeSubScreen === 'data-export' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 space-y-4">
          <h3 className="font-bold text-base text-stone-900">
            Data Export &amp; Synchronization Tools
          </h3>
          <p className="text-xs text-stone-600">
            Download your complete booking ledger, customer contacts, and financial records
            anytime.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-4 rounded-2xl bg-[#e9ecd6] hover:bg-[#dde2c2] text-[#5b6324] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Bookings CSV (Excel)</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="p-4 rounded-2xl bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Backup (JSON)</span>
            </button>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                onRefresh();
                showToast('Initial demo bookings & settings restored!');
              }}
              className="w-full py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Initial Seed Bookings (Prarthana, Kumari Madhumita, etc.)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
