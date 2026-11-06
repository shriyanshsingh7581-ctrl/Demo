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
  Edit3,
  Search,
  Sparkles,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ShieldCheck,
  UserPlus,
  Lock,
  Cloud,
  Camera,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Booking,
  BusinessSettings,
  MakeupLandingGroup,
  MakeupSubCategory,
  ServiceCatalogItem,
  TeamMember,
  deleteGalleryImage,
  deleteServiceCatalogItem,
  deleteTeamMember,
  resetDemoData,
  saveBusinessSettings,
  saveGalleryImages,
  saveServicesCatalog,
  upsertGalleryImage,
  upsertServiceCatalogItem,
  upsertTeamMember,
  getCustomAreas,
  updateTeamMemberAvailability,
} from '../../services/bookingStorage';
import { EdenRoseImage, GalleryFilterCategory } from '../../config/edenRosesImages';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  isCloudinaryUrl,
  uploadImageAsset,
} from '../../services/firebaseConfig';
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

  // Editable Business Settings State (Synced with live Firebase updates)
  const [formSettings, setFormSettings] = useState<BusinessSettings>(settings);

  React.useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // Collapsible Add New Product Drawer on Mobile
  const [showAddProductForm, setShowAddProductForm] = useState<boolean>(true);

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
  const [uploadingInlineServiceId, setUploadingInlineServiceId] = useState<string | null>(
    null
  );

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

  // New Team Member & Login Account State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] =
    useState<TeamMember['role']>('Assistant Makeup Artist');
  const [newMemberArea, setNewMemberArea] = useState('Kaggadaspura');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('eden123');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [teamAreaFilter, setTeamAreaFilter] = useState<string>('All Areas');

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
    setTimeout(() => setSavedBanner(null), 3200);
  };

  // Prioritize Cloudinary-uploaded images at the top of the Cloud Photo Picker
  const cloudSortedGallery = React.useMemo(() => {
    const cloudItems = gallery.filter((g) => isCloudinaryUrl(g.url));
    const otherItems = gallery.filter((g) => !isCloudinaryUrl(g.url));
    return [...cloudItems, ...otherItems];
  }, [gallery]);

  // Save Business Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBusinessSettings(formSettings);
    onRefresh();
    showToast('Website settings saved & synced live via Firebase!');
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

  /**
   * Upload Product Photo to Cloudinary (dxeuzdwkz / Makeup)
   * Also saves the uploaded photo to the Cloud Gallery so it can be reused anytime.
   */
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

      // Also save to Cloud Gallery so Admin can see & reuse all uploaded Cloudinary photos
      const cloudGalleryEntry: EdenRoseImage = {
        id: `cloud-${Date.now()}`,
        url,
        alt:
          mode === 'new' && newServiceName.trim()
            ? newServiceName.trim()
            : editingService?.name || 'Product Cloud Photo',
        category: 'Bridal Portfolio',
        galleryCategory: 'Bridal Makeup',
        description: `Uploaded to Cloudinary (${CLOUDINARY_CLOUD_NAME})`,
        displayPosition: 'Product & Gallery',
      };
      await upsertGalleryImage(cloudGalleryEntry);
      onRefresh();
      showToast(
        isCloudinaryUrl(url)
          ? 'Photo uploaded to Cloudinary CDN & attached to product!'
          : 'Product photo uploaded & attached!'
      );
    } finally {
      setUploadingProductImg(false);
    }
  };

  /**
   * Direct 1-Tap Photo Upload on any existing Product Card -> Uploads to Cloudinary & updates product live
   */
  const handleDirectCardPhotoUpload = async (
    srv: ServiceCatalogItem,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInlineServiceId(srv.id);
    try {
      const url = await uploadImageAsset(file);
      await upsertServiceCatalogItem({ ...srv, image: url });
      const cloudGalleryEntry: EdenRoseImage = {
        id: `cloud-${Date.now()}`,
        url,
        alt: srv.name,
        category: 'Bridal Portfolio',
        galleryCategory: 'Bridal Makeup',
        description: `Uploaded for ${srv.name} via Cloudinary`,
        displayPosition: 'Product & Gallery',
      };
      await upsertGalleryImage(cloudGalleryEntry);
      onRefresh();
      showToast(`Uploaded new Cloudinary photo for "${srv.name}"!`);
    } finally {
      setUploadingInlineServiceId(null);
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
    showToast(`Added "${item.name}" (₹${item.price ?? 'Consult'}) with photo to website!`);
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

  // Team & Login Account Handlers
  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPhone.trim()) return;

    const cleanUserId = (
      newMemberUserId.trim() ||
      newMemberName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20) ||
      `team${Date.now().toString().slice(-4)}`
    ).toLowerCase();

    const cleanPassword = newMemberPassword.trim() || 'eden123';

    if (
      team.some((m) => (m.userId || '').toLowerCase() === cleanUserId) ||
      ['admin', 'subbalakshmi', 'edenroses'].includes(cleanUserId)
    ) {
      showToast(`User ID "${cleanUserId}" is already in use. Please pick a unique User ID.`);
      return;
    }

    const member: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole,
      area: newMemberArea,
      isAvailable: true,
      phone: newMemberPhone.trim(),
      active: true,
      userId: cleanUserId,
      password: cleanPassword,
      createdAt: new Date().toISOString(),
    };
    await upsertTeamMember(member);
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberUserId('');
    setNewMemberArea('Kaggadaspura');
    setNewMemberPassword('eden123');
    onRefresh();
    showToast(
      `Team login created for ${member.name} (ID: ${cleanUserId} / Pass: ${cleanPassword})!`
    );
  };

  const handleToggleTeamMemberActive = async (member: TeamMember) => {
    const updated: TeamMember = {
      ...member,
      active: !member.active,
    };
    await upsertTeamMember(updated);
    onRefresh();
    showToast(
      updated.active
        ? `Login enabled for ${member.name} (${member.userId})`
        : `Login disabled for ${member.name} (${member.userId})`
    );
  };

  const handleSaveEditedTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeamMember || !editingTeamMember.name.trim()) return;
    const cleanUserId = (
      editingTeamMember.userId?.trim() ||
      editingTeamMember.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
    ).toLowerCase();

    const duplicate = team.find(
      (m) =>
        m.id !== editingTeamMember.id &&
        (m.userId || '').toLowerCase() === cleanUserId
    );
    if (duplicate) {
      showToast(`User ID "${cleanUserId}" is already assigned to ${duplicate.name}.`);
      return;
    }

    const updated: TeamMember = {
      ...editingTeamMember,
      name: editingTeamMember.name.trim(),
      phone: editingTeamMember.phone.trim(),
      userId: cleanUserId,
      password: (editingTeamMember.password || 'eden123').trim(),
    };
    await upsertTeamMember(updated);
    setEditingTeamMember(null);
    onRefresh();
    showToast(`Updated login account for ${updated.name}!`);
  };

  const handleRemoveTeamMember = async (member: TeamMember) => {
    await deleteTeamMember(member.id);
    onRefresh();
    showToast(
      `Deleted ${member.name}'s account (${member.userId}). They can no longer log in.`
    );
  };

  const handleCopyTeamCredentials = (member: TeamMember) => {
    const text = `Eden Roses Partner App Login\nName: ${member.name} (${member.role})\nAdmin Login Link: https://edenrosesunisexsalon-phi.vercel.app/admin\nUser ID: ${member.userId || member.name.toLowerCase().replace(/\s+/g, '')}\nPassword: ${member.password || 'eden123'}`;
    navigator.clipboard?.writeText(text);
    showToast(`Copied login ID & Password for ${member.name}!`);
  };

  const buildTeamWhatsAppShareUrl = (member: TeamMember) => {
    const digits = (member.phone || '').replace(/[^0-9]/g, '');
    const targetPhone = digits.length === 10 ? `91${digits}` : digits;
    const msg = [
      `🌸 *EDEN ROSES PARTNER APP — TEAM LOGIN* 🌸`,
      `Hi *${member.name}*, your team account has been created by Subba Lakshmi.`,
      ``,
      `🔗 *Login Link:* https://edenrosesunisexsalon-phi.vercel.app/admin`,
      `👤 *User ID:* ${member.userId || member.name.toLowerCase().replace(/\s+/g, '')}`,
      `🔑 *Password:* ${member.password || 'eden123'}`,
      `💼 *Role:* ${member.role}`,
    ].join('\n');
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Gallery Handlers (Uploaded to Cloudinary & Synced in Real-Time via Firebase)
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
        description: `Uploaded via Cloudinary (${newGalleryCat})`,
        displayPosition: 'Gallery Grid',
      };
      await upsertGalleryImage(newEntry);
      setNewGalleryAlt('');
      onRefresh();
      showToast('Photo uploaded to Cloudinary & synced to live Website Gallery!');
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
    const target = gallery.find((g) => g.id === imgId);
    if (target) {
      await upsertGalleryImage({ ...target, url });
    } else {
      const updated = gallery.map((g) => (g.id === imgId ? { ...g, url } : g));
      await saveGalleryImages(updated);
    }
    onRefresh();
    showToast('Gallery photo replaced on Cloudinary & synced to website!');
  };

  const handleDeleteGalleryImage = async (imgId: string) => {
    await deleteGalleryImage(imgId);
    onRefresh();
    showToast('Photo removed from gallery & synced via Firebase.');
  };

  const handleSetAsHeroImage = async (url: string) => {
    const updated = { ...settings, heroImageUrl: url };
    setFormSettings(updated);
    await saveBusinessSettings(updated);
    onRefresh();
    showToast('Customer Website Hero Banner Photo updated!');
  };

  const handleAssignImageToService = async (url: string) => {
    if (!selectedServiceForImg) return;
    const target = services.find((s) => s.id === selectedServiceForImg);
    if (target) {
      await upsertServiceCatalogItem({ ...target, image: url });
    } else {
      const updated = services.map((s) =>
        s.id === selectedServiceForImg ? { ...s, image: url } : s
      );
      await saveServicesCatalog(updated);
    }
    onRefresh();
    showToast(`Photo assigned to "${target?.name || 'Product'}" on live website!`);
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

  const quickNavTabs: { id: MoreSectionId; label: string; icon: React.ElementType }[] = [
    { id: 'service-management', label: 'Products & Photos', icon: Scissors },
    { id: 'gallery-management', label: 'Cloud Gallery', icon: Cloud },
    { id: 'business-profile', label: 'Website CMS', icon: Building2 },
    { id: 'team-management', label: 'Team Logins', icon: Users },
    { id: 'booking-availability', label: 'Time Slots', icon: Clock },
    { id: 'customer-management', label: 'Clients', icon: UserCheck },
    { id: 'menu', label: 'All Settings', icon: Sparkles },
  ];

  if (activeSubScreen === 'menu') {
    const menuItems = [
      {
        id: 'service-management' as MoreSectionId,
        icon: Scissors,
        title: 'Products, Pricing & Cloudinary Photo Upload',
        subtitle: `Add products, change prices & upload product photos (${services.length} items)`,
      },
      {
        id: 'gallery-management' as MoreSectionId,
        icon: Cloud,
        title: 'Cloudinary Photo Library & Website Gallery',
        subtitle: `Cloud: ${CLOUDINARY_CLOUD_NAME} (Preset: ${CLOUDINARY_UPLOAD_PRESET}) · ${gallery.length} photos`,
      },
      {
        id: 'business-profile' as MoreSectionId,
        icon: Building2,
        title: 'Full Website Information & CMS Control',
        subtitle:
          'Brand, Hero Banner, Offers, Coupons, Ratings, Bio, Phone, Address & Hours',
      },
      {
        id: 'team-management' as MoreSectionId,
        icon: Users,
        title: 'Team Accounts & Login Management',
        subtitle: `Create, edit or delete User ID & Password for ${team.length} team members`,
      },
      {
        id: 'booking-availability' as MoreSectionId,
        icon: Clock,
        title: 'Booking Time Slots & Holiday Dates',
        subtitle: 'Configure daily appointment slots and block unavailable dates',
      },
      {
        id: 'customer-management' as MoreSectionId,
        icon: UserCheck,
        title: 'Verified Client Directory',
        subtitle: `${customersList.length} clients with phone & WhatsApp history`,
      },
      {
        id: 'data-export' as MoreSectionId,
        icon: Download,
        title: 'Data Backup & Export',
        subtitle: 'Download Excel CSV or JSON backup of all bookings',
      },
    ];

    return (
      <div className="space-y-4 pb-24">
        {/* Brand & Cloudinary Status Card */}
        <div className="bg-gradient-to-r from-[#160824] via-[#241038] to-[#160824] text-white rounded-3xl p-5 border border-[#D6B77A]/40 shadow-md flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#D6B77A] tracking-wide">
              Cloud: {CLOUDINARY_CLOUD_NAME} · Preset: {CLOUDINARY_UPLOAD_PRESET}
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white truncate">
              {settings.makeupBrand}
            </h2>
            <p className="text-xs text-white/75 truncate">
              Admin Control Center · By {settings.artistName}
            </p>
          </div>
          <div className="w-16 h-14 rounded-2xl bg-[#160824] border border-[#D6B77A] overflow-hidden flex items-center justify-center shrink-0">
            <SmartImage
              src={settings.logoUrl}
              alt={settings.makeupBrand}
              fit="cover"
              className="w-full h-full object-center scale-110"
            />
          </div>
        </div>

        {/* Clean Mobile Menu List */}
        <div className="space-y-2.5">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSubScreen(item.id)}
                className="w-full p-4 rounded-2xl bg-white hover:bg-[#FAF6F0] border border-[#E6DAC8] flex items-center justify-between gap-3.5 text-left transition-all shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#160824] text-[#D6B77A] flex items-center justify-center shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#160824] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-stone-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
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
          <span>Sign Out of Admin Panel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* 1-Tap Horizontal Section Switcher for Fast Mobile Navigation */}
      <div className="bg-white rounded-2xl p-2 border border-[#E6DAC8] shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickNavTabs.map((tab) => {
          const IconComp = tab.icon;
          const isCurrent = activeSubScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubScreen(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#160824] text-[#F5E2B8] shadow-xs'
                  : 'text-stone-600 hover:bg-[#FAF6F0] hover:text-[#160824]'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {savedBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md">
          <Check className="w-4 h-4 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* =====================================================================
          1. FULL WEBSITE INFORMATION & CMS CONTROL (REAL-TIME FIREBASE SYNC)
      ===================================================================== */}
      {(activeSubScreen === 'business-profile' ||
        activeSubScreen === 'whatsapp-contact') && (
        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Header Banner */}
          <div className="rounded-3xl bg-[#160824] text-[#F3E2BA] p-5 border border-[#D6B77A]/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-[#D6B77A]">
                Real-Time Firebase &amp; Cloudinary Sync
              </p>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                Full Website Content &amp; Settings Control
              </h3>
              <p className="text-xs text-[#F3E2BA]/80 mt-0.5">
                Update brand info, banners, offers, ratings, bio, phone &amp; studio address.
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-[#D6B77A] hover:bg-[#e5c98f] text-[#160824] font-bold text-xs shrink-0 cursor-pointer shadow-xs"
            >
              Save &amp; Publish Live
            </button>
          </div>

          {/* SECTION A: BRAND, ARTIST, LOGO & HERO BANNER IMAGE */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
            <h4 className="font-bold text-sm text-[#160824] border-b border-stone-100 pb-2.5">
              01. Brand Name, Artist Name, Logo &amp; Hero Banner Photo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Salon / Business Name
                </label>
                <input
                  type="text"
                  value={formSettings.businessName}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, businessName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Makeup Brand Title
                </label>
                <input
                  type="text"
                  value={formSettings.makeupBrand}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, makeupBrand: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Lead Makeup Artist Name
                </label>
                <input
                  type="text"
                  value={formSettings.artistName}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, artistName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
              {/* Logo Preview + Cloudinary Upload */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#160824]">Website &amp; Admin Logo</span>
                  <label className="px-3.5 py-2 rounded-xl bg-[#160824] text-[#F3E2BA] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImageAsset(file);
                        setFormSettings({
                          ...formSettings,
                          logoUrl: url,
                          footerLogoUrl: url,
                        });
                        showToast('Logo uploaded to Cloudinary! Click Save & Publish.');
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#160824] border border-[#D6B77A] overflow-hidden shrink-0">
                    <SmartImage
                      src={formSettings.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    value={formSettings.logoUrl}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        logoUrl: e.target.value,
                        footerLogoUrl: e.target.value,
                      })
                    }
                    placeholder="Or paste Logo Image URL"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>
              </div>

              {/* Hero Promotional Banner Image Preview + Cloudinary Upload */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#160824]">
                    Main Promotional Banner Photo
                  </span>
                  <label className="px-3.5 py-2 rounded-xl bg-[#160824] text-[#D6B77A] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImageAsset(file);
                        setFormSettings({ ...formSettings, heroImageUrl: url });
                        showToast('Hero Banner uploaded to Cloudinary! Click Save & Publish.');
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-stone-200 border border-stone-300 overflow-hidden shrink-0">
                    <SmartImage
                      src={formSettings.heroImageUrl}
                      alt="Hero Banner"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    value={formSettings.heroImageUrl}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, heroImageUrl: e.target.value })
                    }
                    placeholder="Or paste Hero Image URL"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: HERO BANNER HEADINGS, RATINGS & TRUST BADGE */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
            <h4 className="font-bold text-sm text-[#160824] border-b border-stone-100 pb-2.5">
              02. Website Header, Hero Banner Text &amp; Rating Score
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Default City Name (Header)
                </label>
                <input
                  type="text"
                  value={formSettings.defaultCity || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, defaultCity: e.target.value })
                  }
                  placeholder="Bangalore"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Header Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={formSettings.headerTagline || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, headerTagline: e.target.value })
                  }
                  placeholder="Studio & On-Venue Service Across Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Promotional Banner Main Heading
                </label>
                <input
                  type="text"
                  value={formSettings.heroBannerTitle || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, heroBannerTitle: e.target.value })
                  }
                  placeholder="Professional Makeup"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Promotional Banner Subtitle
                </label>
                <input
                  type="text"
                  value={formSettings.heroBannerSubtitle || ''}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      heroBannerSubtitle: e.target.value,
                    })
                  }
                  placeholder="Beauty services for every special occasion"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Promotional Banner Tagline
                </label>
                <input
                  type="text"
                  value={formSettings.heroBannerTagline || ''}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      heroBannerTagline: e.target.value,
                    })
                  }
                  placeholder="Flawless HD & Airbrush beauty · Effortless bridal confidence"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Banner Button Text (CTA)
                </label>
                <input
                  type="text"
                  value={formSettings.heroCtaText || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, heroCtaText: e.target.value })
                  }
                  placeholder="Book Appointment"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Customer Rating Score (e.g., 4.9)
                </label>
                <input
                  type="text"
                  value={formSettings.ratingScore || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, ratingScore: e.target.value })
                  }
                  placeholder="4.9"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Rating Count Label (e.g., 520+ Brides)
                </label>
                <input
                  type="text"
                  value={formSettings.ratingCountText || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, ratingCountText: e.target.value })
                  }
                  placeholder="520+ Brides"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Trust Badge Title
                </label>
                <input
                  type="text"
                  value={formSettings.trustBadgeTitle || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, trustBadgeTitle: e.target.value })
                  }
                  placeholder="100% Authentic Luxury Products"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Trust Badge Brands Subtitle
                </label>
                <input
                  type="text"
                  value={formSettings.trustBadgeSubtitle || ''}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      trustBadgeSubtitle: e.target.value,
                    })
                  }
                  placeholder="MAC · Huda Beauty · NARS · Silicone Airbrush"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: PROMOTIONAL OFFERS & DISCOUNT COUPON CODES */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
            <h4 className="font-bold text-sm text-[#160824] border-b border-stone-100 pb-2.5">
              03. Live Website Offers &amp; Coupon Codes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Offer 1 Banner Title
                </label>
                <input
                  type="text"
                  value={formSettings.offer1Title || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, offer1Title: e.target.value })
                  }
                  placeholder="Flat ₹500 OFF on Bridal & Engagement"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Offer 1 Coupon Code
                </label>
                <input
                  type="text"
                  value={formSettings.offer1Code || ''}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      offer1Code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="BRIDAL500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Offer 1 Flat Discount (₹)
                </label>
                <input
                  type="number"
                  value={formSettings.offer1DiscountAmount ?? 500}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      offer1DiscountAmount: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Offer 2 Banner Title
                </label>
                <input
                  type="text"
                  value={formSettings.offer2Title || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, offer2Title: e.target.value })
                  }
                  placeholder="Save 10% on Party Makeup & Combos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Offer 2 Coupon Code
                </label>
                <input
                  type="text"
                  value={formSettings.offer2Code || ''}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      offer2Code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="EDEN10"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Offer 2 Discount (%)
                </label>
                <input
                  type="number"
                  value={formSettings.offer2DiscountPercent ?? 10}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      offer2DiscountPercent: Math.max(
                        0,
                        Math.min(90, Number(e.target.value))
                      ),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION D: ABOUT ARTIST BIO & 3 HIGHLIGHT CARDS */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
            <h4 className="font-bold text-sm text-[#160824] border-b border-stone-100 pb-2.5">
              04. About Artist Bio &amp; Highlights
            </h4>

            <div className="text-xs space-y-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Artist Role Kicker Title
                </label>
                <input
                  type="text"
                  value={formSettings.aboutKicker || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, aboutKicker: e.target.value })
                  }
                  placeholder="Principal Makeup & Styling Artist"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  About Artist &amp; Salon Bio Description
                </label>
                <textarea
                  rows={3}
                  value={formSettings.description}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] space-y-2">
                  <label className="font-bold text-[#160824] block">
                    Highlight Card 1
                  </label>
                  <input
                    type="text"
                    value={formSettings.aboutHighlight1Title || ''}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        aboutHighlight1Title: e.target.value,
                      })
                    }
                    placeholder="HD & Airbrush"
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-300 font-bold"
                  />
                  <input
                    type="text"
                    value={formSettings.aboutHighlight1Sub || ''}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        aboutHighlight1Sub: e.target.value,
                      })
                    }
                    placeholder="Waterproof 16-hr skin finish"
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] space-y-2">
                  <label className="font-bold text-[#160824] block">
                    Highlight Card 2
                  </label>
                  <input
                    type="text"
                    value={formSettings.aboutHighlight2Title || ''}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        aboutHighlight2Title: e.target.value,
                      })
                    }
                    placeholder="Venue Travel"
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-300 font-bold"
                  />
                  <input
                    type="text"
                    value={formSettings.aboutHighlight2Sub || ''}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        aboutHighlight2Sub: e.target.value,
                      })
                    }
                    placeholder="5:00 AM Muhurtham slots available"
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] space-y-2">
                  <label className="font-bold text-[#160824] block">
                    Highlight Card 3
                  </label>
                  <input
                    type="text"
                    value={formSettings.aboutHighlight3Title || ''}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        aboutHighlight3Title: e.target.value,
                      })
                    }
                    placeholder="4.9 ★ Rated"
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-300 font-bold"
                  />
                  <input
                    type="text"
                    value={formSettings.aboutHighlight3Sub || ''}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        aboutHighlight3Sub: e.target.value,
                      })
                    }
                    placeholder="Loved by Bengaluru brides"
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION E: CONTACT NUMBERS, WHATSAPP, ADDRESS & SOCIAL LINKS */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
            <h4 className="font-bold text-sm text-[#160824] border-b border-stone-100 pb-2.5">
              05. Phone, WhatsApp, Studio Address, Service Areas &amp; Social Links
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  WhatsApp Number (with country code, e.g. 917019135530)
                </label>
                <input
                  type="text"
                  value={formSettings.whatsappNumber}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, whatsappNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Business Location Label
                </label>
                <input
                  type="text"
                  value={formSettings.location}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, location: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Full Studio Address
                </label>
                <textarea
                  rows={2}
                  value={formSettings.address}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Service Areas / Localities (Shown in Footer &amp; Location Info)
                </label>
                <input
                  type="text"
                  value={formSettings.serviceArea}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, serviceArea: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] font-bold text-xs sm:text-sm cursor-pointer shadow-sm"
            >
              Save &amp; Sync All Website Information to Firebase
            </button>
          </div>
        </form>
      )}

      {/* =====================================================================
          2. PRODUCT, SERVICE, PRICING & CLOUDINARY PHOTO MANAGER
      ===================================================================== */}
      {activeSubScreen === 'service-management' && (
        <div className="space-y-4">
          {/* LUXURY HEADER CARD WITH CLOUDINARY STATUS */}
          <div className="rounded-3xl bg-gradient-to-r from-[#160824] via-[#261139] to-[#160824] text-white p-5 border border-[#D6B77A]/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#D6B77A] flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" />
                <span>
                  Cloudinary Connected: {CLOUDINARY_CLOUD_NAME} (Preset: {CLOUDINARY_UPLOAD_PRESET})
                </span>
              </p>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                Products, Photos &amp; Pricing Manager
              </h3>
              <p className="text-xs text-white/75">
                Upload product photos to Cloudinary, add new packages, or update prices in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddProductForm((v) => !v)}
              className="px-4 py-2.5 rounded-xl bg-[#D6B77A] hover:bg-[#e5c98f] text-[#160824] text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              {showAddProductForm ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Hide Add Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Product</span>
                </>
              )}
            </button>
          </div>

          {/* ADD NEW PRODUCT / SERVICE / PACKAGE FORM WITH CLOUDINARY PHOTO UPLOAD */}
          {showAddProductForm && (
            <form
              onSubmit={handleAddService}
              className="bg-white rounded-3xl p-5 border border-[#E6DAC8] shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#160824]">
                    + Add New Product / Makeup Service with Photo
                  </h3>
                  <p className="text-xs text-stone-500">
                    Upload a photo to Cloudinary ({CLOUDINARY_CLOUD_NAME}) and publish straight to the website
                  </p>
                </div>
              </div>

              {/* STEP 1: PROMINENT MOBILE-FRIENDLY CLOUDINARY PHOTO UPLOAD BOX */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-[#D6B77A] shrink-0 shadow-xs">
                      <SmartImage
                        src={newServiceImage}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-[#160824]">
                        1. Product Photo (Cloudinary Upload)
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {isCloudinaryUrl(newServiceImage)
                          ? '✓ Hosted on Cloudinary CDN (dxeuzdwkz)'
                          : 'Upload from mobile camera/gallery or choose from Cloud Photos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="px-4 py-2.5 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                      <Camera className="w-4 h-4 text-[#D6B77A]" />
                      <span>
                        {uploadingProductImg
                          ? 'Uploading to Cloudinary...'
                          : 'Upload Photo to Cloud'}
                      </span>
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
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
                    >
                      {showPhotoPickerForNew
                        ? 'Hide Cloud Photos'
                        : `Choose Uploaded Photo (${cloudSortedGallery.length})`}
                    </button>
                  </div>
                </div>

                {showPhotoPickerForNew && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold text-stone-600">
                      Tap any uploaded Cloud or Studio photo to attach to this product:
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-44 overflow-y-auto p-2 bg-white rounded-2xl border border-stone-200">
                      {cloudSortedGallery.slice(0, 32).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setNewServiceImage(g.url);
                            setShowPhotoPickerForNew(false);
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer ${
                            newServiceImage === g.url
                              ? 'border-[#160824] ring-2 ring-[#D6B77A]'
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
                  </div>
                )}
              </div>

              {/* STEP 2: PRODUCT NAME & CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    2. Product / Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g., HD Bridal Muhurtham Makeup or Saree Draping"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Website Category *
                  </label>
                  <select
                    value={newServiceSubCategory}
                    onChange={(e) => {
                      const sub = e.target.value as MakeupSubCategory;
                      setNewServiceSubCategory(sub);
                      setNewServiceCategory(mapSubCategoryToMainCategory(sub));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold text-stone-900"
                  >
                    {MAKEUP_SUB_CATEGORIES.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 3: SELLING PRICE, MRP & DURATION */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    3. Selling Price (₹)
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
                      placeholder="1999"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    MRP / Original (₹)
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
                      placeholder="2499"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num text-stone-700"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-stone-700 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    placeholder="1 hr 30 mins"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 text-stone-800"
                  />
                </div>
              </div>

              {/* STEP 4: DESCRIPTION & HIGHLIGHTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    placeholder="Short description of this makeup or styling service..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-stone-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Key Highlights (1 per line)
                  </label>
                  <textarea
                    rows={2}
                    value={newServiceHighlights}
                    onChange={(e) => setNewServiceHighlights(e.target.value)}
                    placeholder={'Waterproof HD base\nIncludes hairstyling & draping'}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-stone-300"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={newServiceAirbrush}
                    onChange={(e) => setNewServiceAirbrush(e.target.checked)}
                    className="rounded border-stone-300 text-[#160824]"
                  />
                  <span className="font-semibold text-stone-700">
                    Show &quot;HD &amp; Airbrush Available&quot; feature on card
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#D6B77A]" />
                  <span>Add Product with Photo to Website</span>
                </button>
              </div>
            </form>
          )}

          {/* EXISTING PRODUCTS LIST WITH 1-TAP INLINE PHOTO UPLOAD & PRICE EDITOR */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E6DAC8] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#160824]">
                  Active Website Products ({services.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Tap &quot;Change Photo&quot; on any product to upload a new photo to Cloudinary, or edit prices inline.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search product or price..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs"
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {(['All', ...MAKEUP_SUB_CATEGORIES] as const).map((cat) => {
                const active = catalogSubCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogSubCategoryFilter(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#160824] text-[#F5E2B8]'
                        : 'bg-[#FAF7F2] text-stone-700 border border-[#E6DAC8] hover:bg-[#F3ECE0]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Mobile-Friendly Product Cards */}
            <div className="space-y-3">
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
                .map((srv) => {
                  const isUploadingThis = uploadingInlineServiceId === srv.id;
                  return (
                    <div
                      key={srv.id}
                      className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs hover:border-[#160824]/40 transition-colors"
                    >
                      {/* Left: Product Photo with 1-Tap Cloudinary Upload + Title */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-[#E6DAC8] shadow-2xs relative">
                            <SmartImage
                              src={srv.image}
                              alt={srv.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <label className="w-20 py-1 rounded-lg bg-[#160824] text-[#F5E2B8] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs">
                            <Camera className="w-3 h-3 text-[#D6B77A]" />
                            <span>{isUploadingThis ? 'Wait...' : 'Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleDirectCardPhotoUpload(srv, e)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="min-w-0 space-y-1 flex-1">
                          <p className="text-[11px] font-semibold text-[#8C4A56]">
                            {srv.makeupSubCategory || srv.category}
                            {srv.duration ? ` · ${srv.duration}` : ''}
                            {isCloudinaryUrl(srv.image) ? ' · Cloud CDN ✓' : ''}
                          </p>
                          <p className="font-bold text-sm sm:text-base text-[#160824] leading-snug">
                            {srv.name}
                          </p>
                          <p className="text-xs text-stone-500 line-clamp-2">
                            {srv.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Mobile-Friendly Price Controls + Full Edit / Delete */}
                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E6DAC8]/80 shrink-0">
                        {/* Selling Price Input */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-stone-500 mb-0.5">
                            Offer Price (₹)
                          </span>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">
                              ₹
                            </span>
                            <input
                              type="number"
                              placeholder="Consult"
                              value={srv.price ?? ''}
                              onChange={(e) =>
                                handleUpdateServicePrice(srv.id, e.target.value)
                              }
                              className="w-24 pl-6 pr-2 py-2 rounded-xl bg-white border border-stone-300 font-mono-num font-bold text-[#160824] text-right"
                            />
                          </div>
                        </div>

                        {/* MRP Input */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-stone-400 mb-0.5">
                            MRP (₹)
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
                              className="w-22 pl-6 pr-2 py-2 rounded-xl bg-white border border-stone-300 font-mono-num text-stone-600 text-right"
                            />
                          </div>
                        </div>

                        {/* Quick Step Buttons */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-stone-500 mb-0.5">
                            Quick Adjust
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustPrice(srv.id, -100)}
                              className="px-2.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 font-mono-num font-bold text-[11px] text-stone-700 cursor-pointer"
                            >
                              -100
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustPrice(srv.id, 100)}
                              className="px-2.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 font-mono-num font-bold text-[11px] text-[#160824] cursor-pointer"
                            >
                              +100
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustPrice(srv.id, 500)}
                              className="px-2.5 py-2 rounded-xl bg-[#F3ECE0] hover:bg-[#E6DAC8] border border-[#D6B77A]/50 font-mono-num font-bold text-[11px] text-[#160824] cursor-pointer"
                            >
                              +500
                            </button>
                          </div>
                        </div>

                        {/* Edit & Delete */}
                        <div className="flex items-center gap-1.5 self-end">
                          <button
                            type="button"
                            onClick={() => openEditServiceModal(srv)}
                            className="px-3.5 py-2 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
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
                  );
                })}
            </div>
          </div>

          {/* FULL EDIT PRODUCT MODAL */}
          {editingService && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-[#E6DAC8] shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-[#160824]">
                      Edit Product, Photo &amp; Pricing
                    </h3>
                    <p className="text-xs text-stone-500">{editingService.name}</p>
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
                  {/* Photo selector in Edit modal */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-[#D6B77A] shrink-0">
                          <SmartImage
                            src={editingService.image}
                            alt={editingService.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block">
                            Product Photo (Cloudinary)
                          </span>
                          <span className="text-[11px] text-stone-500">
                            {isCloudinaryUrl(editingService.image)
                              ? '✓ Hosted on Cloudinary CDN'
                              : 'Upload a new photo or pick from Cloud Gallery'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-3 py-2 rounded-xl bg-[#160824] text-[#F5E2B8] font-bold text-xs cursor-pointer inline-flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-[#D6B77A]" />
                          <span>{uploadingProductImg ? 'Uploading...' : 'Upload'}</span>
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
                          className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold text-xs cursor-pointer"
                        >
                          Cloud Gallery
                        </button>
                      </div>
                    </div>

                    {showPhotoPickerForEdit && (
                      <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white rounded-xl border border-stone-200">
                        {cloudSortedGallery.slice(0, 25).map((g) => (
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-bold text-stone-900"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold"
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
                          setEditingService({
                            ...editingService,
                            duration: e.target.value,
                          })
                        }
                        placeholder="1 hr 30 mins"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#160824] font-mono-num font-bold text-sm text-stone-900"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num text-sm text-stone-700"
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
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-stone-300"
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
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-stone-300"
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
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-stone-300"
                    />
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
                      className="px-5 py-2.5 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] font-bold cursor-pointer"
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

      {/* =====================================================================
          3. BOOKING & AVAILABILITY SETTINGS
      ===================================================================== */}
      {activeSubScreen === 'booking-availability' && (
        <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-base text-[#160824]">
              Daily Appointment Time Slots
            </h3>
            <div className="flex flex-wrap gap-2">
              {settings.timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E6DAC8] text-[#160824] font-mono-num text-xs font-bold flex items-center gap-2"
                >
                  <span>{slot}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = settings.timeSlots.filter((s) => s !== slot);
                      await saveBusinessSettings({ ...settings, timeSlots: next });
                      onRefresh();
                    }}
                    className="text-stone-400 hover:text-red-600 cursor-pointer"
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
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs font-mono-num"
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
                className="px-4 py-2.5 rounded-xl bg-[#160824] text-[#F5E2B8] text-xs font-bold cursor-pointer"
              >
                + Add Slot
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-stone-200">
            <h3 className="font-bold text-base text-[#160824] flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-red-600" />
              <span>Blocked / Holiday Dates</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs font-mono-num"
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
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
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

      {/* =====================================================================
          4. CUSTOMER MANAGEMENT
      ===================================================================== */}
      {activeSubScreen === 'customer-management' && (
        <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-3">
          <h3 className="font-bold text-base text-[#160824]">
            Verified Client Directory ({customersList.length})
          </h3>
          <div className="space-y-2.5">
            {customersList.map((c) => (
              <div
                key={c.phone}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-sm text-[#160824]">{c.name}</p>
                  <p className="font-mono-num text-stone-600">{c.phone}</p>
                  <p className="text-stone-500 mt-0.5 line-clamp-1">{c.address}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-2">
                    <span className="block text-[11px] text-stone-500">
                      {c.bookingsCount} booking(s)
                    </span>
                    <span className="font-mono-num font-bold text-[#160824]">
                      ₹{c.totalSpent.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, '')}`}
                    className="p-2.5 rounded-xl bg-[#160824] text-[#F5E2B8]"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-[#25D366] text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          5. TEAM MANAGEMENT & LOGIN ACCOUNTS
      ===================================================================== */}
      {activeSubScreen === 'team-management' && (
        <div className="space-y-4">
          {/* Top Banner: Admin & Team Login Overview */}
          <div className="rounded-3xl p-5 bg-gradient-to-r from-[#160824] via-[#261139] to-[#160824] text-white border border-[#D6B77A]/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#D6B77A]">
                Team Login &amp; Access Control
              </p>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                Team User ID + Password Accounts
              </h3>
              <p className="text-xs text-white/75">
                Create or revoke login credentials for your makeup artists, hairstylists &amp; saree drapists.
              </p>
            </div>
            <div className="shrink-0 bg-white/10 border border-white/15 rounded-2xl p-3 text-xs space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-[#F3E2BA] font-bold">
                Master Admin Login
              </p>
              <p className="font-mono-num text-white">
                ID: <strong className="text-[#F3E2BA]">admin</strong> · Pass:{' '}
                <strong className="text-[#F3E2BA]">7777</strong>
              </p>
            </div>
          </div>

          {/* Create New Team Member Login Account Form */}
          <form
            onSubmit={handleAddTeamMember}
            className="bg-white rounded-3xl p-5 border border-[#E6DAC8] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#160824] text-[#D6B77A] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#160824]">
                    + Create New Team Member Login Account
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Team member can sign in at /admin with this User ID &amp; Password
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewMemberName(val);
                    if (
                      !newMemberUserId ||
                      newMemberUserId ===
                        newMemberName.toLowerCase().replace(/[^a-z0-9]/g, '')
                    ) {
                      setNewMemberUserId(
                        val
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '')
                          .slice(0, 20)
                      );
                    }
                  }}
                  placeholder="e.g., Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Role *</label>
                <select
                  value={newMemberRole}
                  onChange={(e) =>
                    setNewMemberRole(e.target.value as TeamMember['role'])
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold text-stone-900"
                >
                  <option value="Assistant Makeup Artist">Assistant Makeup Artist</option>
                  <option value="Hairstylist">Hairstylist</option>
                  <option value="Saree Drapist">Saree Drapist</option>
                  <option value="Other Team Member">Other Team Member</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Assigned Area *</label>
                <select
                  value={newMemberArea}
                  onChange={(e) => setNewMemberArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold text-stone-900"
                >
                  {getCustomAreas().filter((a) => a !== 'All Areas').map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="+91 98450XXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="font-bold text-stone-700 flex items-center gap-1.5 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#160824]" />
                  <span>Login User ID (Username) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMemberUserId}
                  onChange={(e) =>
                    setNewMemberUserId(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                    )
                  }
                  placeholder="e.g., priya"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold text-stone-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#160824]" />
                    <span>Login Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomDigits = Math.floor(1000 + Math.random() * 9000);
                      setNewMemberPassword(`eden${randomDigits}`);
                    }}
                    className="text-[10px] font-bold text-[#8C4A56] hover:underline cursor-pointer"
                  >
                    Generate Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  placeholder="e.g., eden123"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold text-stone-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D6B77A]" />
              <span>Create Team Login Account</span>
            </button>
          </form>

          {/* Active & Disabled Team Accounts List with Area Divide */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-[#160824]">
                Team Login Accounts ({team.length})
              </h3>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {['All Areas', ...getCustomAreas().filter((a) => a !== 'All Areas')].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setTeamAreaFilter(area)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      teamAreaFilter === area
                        ? 'bg-[#160824] text-[#F5E2B8]'
                        : 'bg-[#FAF7F2] text-stone-700 border border-stone-200'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {team.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                No team accounts created yet.
              </p>
            ) : (
              <div className="space-y-3">
                {team
                  .filter((m) => {
                    if (teamAreaFilter === 'All Areas') return true;
                    return m.area && m.area.toLowerCase().includes(teamAreaFilter.toLowerCase());
                  })
                  .map((m) => {
                  const isPassVisible = Boolean(visiblePasswords[m.id]);
                  const userIdDisplay =
                    m.userId || m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const passDisplay = m.password || 'eden123';

                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        m.active !== false
                          ? 'bg-[#FAF7F2] border-[#E6DAC8]'
                          : 'bg-stone-100/80 border-stone-200 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-sm text-[#160824]">
                              {m.name}
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#8C4A56]/15 text-[#8C4A56]">
                              {m.role}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                              📍 {m.area || 'Bangalore'}
                            </span>
                            {/* Real-time Availability Badge (Requirement 4.B) */}
                            <button
                              type="button"
                              onClick={async () => {
                                await updateTeamMemberAvailability(m.id, !(m.isAvailable !== false));
                                onRefresh();
                              }}
                              title="Click to toggle availability"
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition ${
                                m.isAvailable !== false
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  m.isAvailable !== false ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              />
                              <span>
                                {m.isAvailable !== false ? 'Online / Free' : 'Offline / Busy'}
                              </span>
                            </button>
                          </div>
                          <p className="font-mono-num text-xs text-stone-600 flex items-center gap-2">
                            <span>Phone: {m.phone}</span>
                            <a
                              href={`tel:${m.phone}`}
                              className="text-[11px] text-[#8C4A56] font-bold underline"
                            >
                              Call Now
                            </a>
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyTeamCredentials(m)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>

                          <a
                            href={buildTeamWhatsAppShareUrl(m)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setEditingTeamMember({ ...m })}
                            className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleTeamMemberActive(m)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 text-[11px] font-bold cursor-pointer"
                          >
                            {m.active !== false ? 'Disable' : 'Enable'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveTeamMember(m)}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Credentials Box */}
                      <div className="mt-3 pt-2.5 border-t border-[#E6DAC8]/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="px-3 py-2 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                          <span className="text-stone-500 font-medium">User ID:</span>
                          <span className="font-mono-num font-bold text-[#160824]">
                            {userIdDisplay}
                          </span>
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                          <span className="text-stone-500 font-medium">Password:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num font-bold text-[#160824]">
                              {isPassVisible ? passDisplay : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setVisiblePasswords((prev) => ({
                                  ...prev,
                                  [m.id]: !prev[m.id],
                                }))
                              }
                              className="text-stone-400 hover:text-stone-700 cursor-pointer"
                            >
                              {isPassVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Edit Team Member Credentials Modal */}
          {editingTeamMember && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6DAC8] shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-[#160824]">
                      Edit Team Account &amp; Password
                    </h3>
                    <p className="text-xs text-stone-500">{editingTeamMember.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingTeamMember(null)}
                    className="p-1.5 rounded-xl bg-stone-100 text-stone-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedTeamMember} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTeamMember.name}
                      onChange={(e) =>
                        setEditingTeamMember({
                          ...editingTeamMember,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Role</label>
                      <select
                        value={editingTeamMember.role}
                        onChange={(e) =>
                          setEditingTeamMember({
                            ...editingTeamMember,
                            role: e.target.value as TeamMember['role'],
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold"
                      >
                        <option value="Assistant Makeup Artist">
                          Assistant Makeup Artist
                        </option>
                        <option value="Hairstylist">Hairstylist</option>
                        <option value="Saree Drapist">Saree Drapist</option>
                        <option value="Other Team Member">Other Team Member</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={editingTeamMember.phone}
                        onChange={(e) =>
                          setEditingTeamMember({
                            ...editingTeamMember,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        Login User ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingTeamMember.userId || ''}
                        onChange={(e) =>
                          setEditingTeamMember({
                            ...editingTeamMember,
                            userId: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_.-]/g, ''),
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        Login Password *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingTeamMember.password || ''}
                        onChange={(e) =>
                          setEditingTeamMember({
                            ...editingTeamMember,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-mono-num font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingTeamMember(null)}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#160824] text-[#F5E2B8] font-bold cursor-pointer"
                    >
                      Save Credentials
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          6. CLOUDINARY PHOTO LIBRARY & GALLERY MANAGEMENT
      ===================================================================== */}
      {activeSubScreen === 'gallery-management' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#8C4A56]">
                  Cloudinary Cloud Name: {CLOUDINARY_CLOUD_NAME} · Preset: {CLOUDINARY_UPLOAD_PRESET}
                </p>
                <h3 className="font-bold text-base text-[#160824]">
                  Upload New Photo to Cloudinary &amp; Website Gallery
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                value={newGalleryAlt}
                onChange={(e) => setNewGalleryAlt(e.target.value)}
                placeholder="Photo title / caption (e.g. HD South Indian Bridal Look)"
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300"
              />
              <select
                value={newGalleryCat}
                onChange={(e) =>
                  setNewGalleryCat(
                    e.target.value as Exclude<GalleryFilterCategory, 'All'>
                  )
                }
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-stone-300 font-semibold"
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

            <label className="w-full py-3.5 rounded-2xl bg-[#160824] hover:bg-[#261139] text-[#F5E2B8] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4 text-[#D6B77A]" />
              <span>
                {uploadingImg
                  ? 'Uploading Photo to Cloudinary...'
                  : 'Select & Upload Photo to Cloudinary'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadNewGalleryImage}
                className="hidden"
              />
            </label>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#160824]">
                  Uploaded Cloud &amp; Studio Photos ({cloudSortedGallery.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Assign any uploaded photo to a specific product or set it as the Hero Banner
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-600 font-semibold shrink-0">
                  Link to Product:
                </span>
                <select
                  value={selectedServiceForImg}
                  onChange={(e) => setSelectedServiceForImg(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-stone-300 text-xs font-semibold max-w-[210px]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {cloudSortedGallery.map((img) => (
                <div
                  key={img.id}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DAC8] flex gap-3.5 items-start"
                >
                  <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 bg-white border border-stone-200">
                    <SmartImage
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                    <p className="font-bold text-[#160824] truncate">{img.alt}</p>
                    <p className="text-[11px] text-stone-500">
                      {img.galleryCategory || img.category}
                      {isCloudinaryUrl(img.url) ? ' · Cloudinary CDN ✓' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAssignImageToService(img.url)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#160824] text-[#F5E2B8] text-[10px] font-bold cursor-pointer"
                      >
                        Use on Product
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAsHeroImage(img.url)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#F3ECE0] border border-[#D6B77A]/50 text-[#160824] text-[10px] font-bold cursor-pointer"
                      >
                        Set Hero Banner
                      </button>
                      <label className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-[10px] font-bold cursor-pointer">
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
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-[10px] font-bold cursor-pointer"
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

      {/* =====================================================================
          7. DATA EXPORT & DEMO RESET
      ===================================================================== */}
      {activeSubScreen === 'data-export' && (
        <div className="bg-white rounded-3xl p-5 border border-[#E6DAC8] space-y-4">
          <h3 className="font-bold text-base text-[#160824]">
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
              className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3ECE0] border border-[#E6DAC8] text-[#160824] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Bookings CSV (Excel)</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="p-4 rounded-2xl bg-[#160824] text-[#F5E2B8] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D6B77A]" />
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
              className="w-full py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore Initial Demo Bookings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
