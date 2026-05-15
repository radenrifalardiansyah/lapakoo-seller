import { useState, useRef, useEffect } from "react";
import { storeApi, type ApiStore } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Settings, Store, MapPin, Phone, Mail, Globe, Camera, Pencil, X, Check, Clock,
  Palette, Truck, Shield, Lock, Eye, EyeOff, Smartphone, Monitor,
  LogOut as LogOutIcon, AlertTriangle, Package, Star, MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { useTenant } from "../contexts/TenantContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreInfo {
  storeName: string; description: string; address: string;
  city: string; province: string; postalCode: string;
  phone: string; email: string; website: string;
  operationalHours: string; logo: string | null;
}

interface NotificationSettings {
  emailNewOrder: boolean; smsPayment: boolean; pushNotification: boolean;
  emailLowStock: boolean; emailPromotion: boolean;
}

interface StoreDecoration {
  themeColor: string; tagline: string; bannerImage: string | null;
  showReviews: boolean; showBestSellers: boolean;
}

interface CourierService {
  id: string; name: string; enabled: boolean; estimatedDays: string;
}

interface ShippingConfig {
  couriers: CourierService[];
  freeShippingMin: string;
  packagingFee: string;
  processingDays: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultStoreInfo: StoreInfo = {
  storeName: "Toko Ahmad Electronics", description: "Toko elektronik terpercaya dengan produk berkualitas tinggi dan harga terbaik.",
  address: "Jl. Sudirman No. 123", city: "Jakarta Pusat", province: "DKI Jakarta",
  postalCode: "10220", phone: "+62 812-3456-7890", email: "toko.ahmad@email.com",
  website: "www.tokoahmad.com", operationalHours: "Senin - Sabtu, 08:00 - 20:00", logo: null,
};

const defaultNotifications: NotificationSettings = {
  emailNewOrder: true, smsPayment: true, pushNotification: true,
  emailLowStock: false, emailPromotion: false,
};

const defaultDecoration: StoreDecoration = {
  themeColor: "#3b82f6", tagline: "Elektronik Terbaik, Harga Terjangkau!",
  bannerImage: null, showReviews: true, showBestSellers: true,
};

const DEFAULT_COURIERS: CourierService[] = [
  { id: "jne",      name: "JNE",           enabled: true,  estimatedDays: "1–3 hari" },
  { id: "jt",       name: "J&T Express",   enabled: true,  estimatedDays: "1–3 hari" },
  { id: "sicepat",  name: "SiCepat",       enabled: true,  estimatedDays: "1–2 hari" },
  { id: "anteraja", name: "Anteraja",      enabled: false, estimatedDays: "1–3 hari" },
  { id: "pos",      name: "Pos Indonesia", enabled: false, estimatedDays: "2–5 hari" },
  { id: "gosend",   name: "GoSend",        enabled: true,  estimatedDays: "Same Day" },
  { id: "grab",     name: "Grab Express",  enabled: false, estimatedDays: "Same Day" },
  { id: "tiki",     name: "TIKI",          enabled: false, estimatedDays: "2–4 hari" },
];

const defaultShipping: ShippingConfig = {
  couriers: DEFAULT_COURIERS,
  freeShippingMin: "500000",
  packagingFee: "5000",
  processingDays: "1",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THEME_COLORS = [
  { value: "#3b82f6", label: "Biru" },
  { value: "#10b981", label: "Hijau" },
  { value: "#f59e0b", label: "Kuning" },
  { value: "#ef4444", label: "Merah" },
  { value: "#8b5cf6", label: "Ungu" },
  { value: "#f97316", label: "Oranye" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#ec4899", label: "Pink" },
  { value: "#64748b", label: "Abu-abu" },
  { value: "#0f172a", label: "Hitam" },
];

function getPasswordStrength(pwd: string): { score: number; label: string; colorClass: string } {
  if (!pwd) return { score: 0, label: "", colorClass: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Lemah",       colorClass: "bg-red-400" };
  if (score === 2) return { score, label: "Sedang",      colorClass: "bg-yellow-400" };
  if (score === 3) return { score, label: "Kuat",        colorClass: "bg-blue-500" };
  return              { score: 4, label: "Sangat Kuat", colorClass: "bg-green-500" };
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

// ─── Mock Sessions ────────────────────────────────────────────────────────────

const MOCK_SESSIONS = [
  { id: "s1", device: "Chrome — Windows 11", location: "Jakarta, Indonesia", ip: "180.252.xxx.xxx", lastActive: "Sekarang", isCurrent: true },
  { id: "s2", device: "Safari — iPhone 14",  location: "Jakarta, Indonesia", ip: "114.122.xxx.xxx", lastActive: "2 jam lalu", isCurrent: false },
  { id: "s3", device: "Firefox — MacOS",     location: "Bandung, Indonesia", ip: "36.82.xxx.xxx",   lastActive: "1 hari lalu", isCurrent: false },
];

// ─── Main Component ───────────────────────────────────────────────────────────

function mapApiStore(s: ApiStore): StoreInfo {
  return {
    storeName: s.store_name ?? s.name ?? defaultStoreInfo.storeName,
    description: s.description ?? defaultStoreInfo.description,
    address: s.address ?? defaultStoreInfo.address,
    city: s.city ?? defaultStoreInfo.city,
    province: s.province ?? defaultStoreInfo.province,
    postalCode: s.postal_code ?? defaultStoreInfo.postalCode,
    phone: s.phone ?? defaultStoreInfo.phone,
    email: s.email ?? defaultStoreInfo.email,
    website: s.website ?? defaultStoreInfo.website,
    operationalHours: s.operational_hours ?? defaultStoreInfo.operationalHours,
    logo: s.logo_url ?? s.logo ?? defaultStoreInfo.logo,
  }
}

export function SettingsPage() {
  const { hasFeature } = useTenant();

  // ── Profil toko ──
  const [storeInfo, setStoreInfo]   = useState<StoreInfo>(defaultStoreInfo);
  const [formData, setFormData]     = useState<StoreInfo>(defaultStoreInfo);
  const [isEditing, setIsEditing]   = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load store data dari API on mount
  useEffect(() => {
    storeApi.get().then(apiStore => {
      const mapped = mapApiStore(apiStore)
      setStoreInfo(mapped)
      setFormData(mapped)
    }).catch(() => { /* gunakan default */ })
  }, []);

  // ── Notifikasi ──
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);

  // ── Dekorasi ──
  const [decoration, setDecoration]       = useState<StoreDecoration>(defaultDecoration);
  const [decoEditing, setDecoEditing]     = useState(false);
  const [decoDraft, setDecoDraft]         = useState<StoreDecoration>(defaultDecoration);
  const [decoSaved, setDecoSaved]         = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  // ── Pengiriman ──
  const [shipping, setShipping]           = useState<ShippingConfig>(defaultShipping);
  const [shippingEditing, setShippingEditing] = useState(false);
  const [shippingDraft, setShippingDraft] = useState<ShippingConfig>(defaultShipping);
  const [shippingSaved, setShippingSaved] = useState(false);

  // ── Keamanan ──
  const [twoFactor, setTwoFactor]         = useState(false);
  const [loginNotif, setLoginNotif]       = useState(true);
  const [sessions, setSessions]           = useState(MOCK_SESSIONS);
  const [showPwdForm, setShowPwdForm]     = useState(false);
  const [currentPwd, setCurrentPwd]       = useState("");
  const [newPwd, setNewPwd]               = useState("");
  const [confirmPwd, setConfirmPwd]       = useState("");
  const [showCur, setShowCur]             = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [showConf, setShowConf]           = useState(false);
  const [pwdError, setPwdError]           = useState("");
  const [pwdSuccess, setPwdSuccess]       = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // ── Profil handlers ──
  const handleEditStart = () => { setFormData({ ...storeInfo }); setIsEditing(true); setSaveSuccess(false); };
  const handleCancel    = () => { setFormData({ ...storeInfo }); setIsEditing(false); };
  const handleSave      = async () => {
    setSavingStore(true)
    try {
      const payload: ApiStore = {
        store_name: formData.storeName,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postalCode,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        operational_hours: formData.operationalHours,
        logo_url: formData.logo ?? undefined,
      }
      await storeApi.update(payload)
    } catch {
      // Simpan lokal meskipun API gagal
    } finally {
      setSavingStore(false)
    }
    setStoreInfo({ ...formData }); setIsEditing(false); setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  const handleChange = (field: keyof StoreInfo, value: string) =>
    setFormData(p => ({ ...p, [field]: value }));
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(p => ({ ...p, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // ── Dekorasi handlers ──
  const handleDecoSave = () => {
    setDecoration({ ...decoDraft }); setDecoEditing(false); setDecoSaved(true);
    setTimeout(() => setDecoSaved(false), 3000);
  };
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setDecoDraft(p => ({ ...p, bannerImage: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // ── Pengiriman handlers ──
  const toggleCourier = (id: string) =>
    setShippingDraft(p => ({
      ...p, couriers: p.couriers.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c),
    }));
  const handleShippingSave = () => {
    setShipping({ ...shippingDraft }); setShippingEditing(false); setShippingSaved(true);
    setTimeout(() => setShippingSaved(false), 3000);
  };

  // ── Password handler ──
  const handleChangePwd = () => {
    setPwdError("");
    if (!currentPwd) { setPwdError("Masukkan kata sandi saat ini"); return; }
    if (newPwd.length < 8) { setPwdError("Kata sandi baru minimal 8 karakter"); return; }
    if (newPwd !== confirmPwd) { setPwdError("Konfirmasi kata sandi tidak cocok"); return; }
    setPwdSuccess(true);
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    setShowPwdForm(false);
    setTimeout(() => setPwdSuccess(false), 3000);
  };

  const pwdStrength = getPasswordStrength(newPwd);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan &amp; Profil</h1>
          <p className="text-muted-foreground">Kelola informasi toko, tampilan, pengiriman, dan keamanan akun</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Perubahan berhasil disimpan</span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* 1. INFORMASI TOKO                         */}
      {/* ══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />Informasi Toko
            </CardTitle>
            {!isEditing ? (
              <Button size="sm" onClick={handleEditStart}>
                <Pencil className="w-4 h-4 mr-1.5" />Edit Profil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1.5" />Batal
                </Button>
                <Button size="sm" onClick={handleSave} disabled={savingStore}>
                  <Check className="w-4 h-4 mr-1.5" />{savingStore ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center overflow-hidden">
                {(isEditing ? formData.logo : storeInfo.logo) ? (
                  <img src={(isEditing ? formData.logo : storeInfo.logo) as string} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 text-muted-foreground/50" />
                )}
              </div>
              {isEditing && (
                <>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Logo Toko</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isEditing ? "Klik ikon kamera untuk upload logo. Format: JPG, PNG. Maks 2MB." : "Logo toko yang ditampilkan kepada pembeli"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { field: "storeName" as const, label: "Nama Toko", icon: <Store className="w-3.5 h-3.5" />, span: true },
              { field: "description" as const, label: "Deskripsi Toko", span: true, textarea: true },
              { field: "address" as const, label: "Alamat", icon: <MapPin className="w-3.5 h-3.5" />, span: true },
              { field: "city" as const, label: "Kota" },
              { field: "province" as const, label: "Provinsi" },
              { field: "postalCode" as const, label: "Kode Pos", maxLen: 5 },
              { field: "phone" as const, label: "No. Telepon", icon: <Phone className="w-3.5 h-3.5" />, type: "tel" },
              { field: "email" as const, label: "Email Toko", icon: <Mail className="w-3.5 h-3.5" />, type: "email" },
              { field: "website" as const, label: "Website", icon: <Globe className="w-3.5 h-3.5" /> },
              { field: "operationalHours" as const, label: "Jam Operasional", icon: <Clock className="w-3.5 h-3.5" /> },
            ].map(({ field, label, icon, span, textarea, type, maxLen }) => (
              <div key={field} className={`${span ? "md:col-span-2" : ""} space-y-1.5`}>
                <Label className="flex items-center gap-1.5">{icon}{label}</Label>
                {isEditing ? (
                  textarea ? (
                    <Textarea value={formData[field] ?? ""} onChange={e => handleChange(field, e.target.value)} rows={3} />
                  ) : (
                    <Input value={formData[field] ?? ""} onChange={e => handleChange(field, e.target.value)}
                      type={type ?? "text"} maxLength={maxLen} />
                  )
                ) : (
                  <p className="text-sm text-muted-foreground py-2">{storeInfo[field] || "—"}</p>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleCancel}><X className="w-4 h-4 mr-2" />Batal</Button>
              <Button onClick={handleSave} disabled={savingStore}><Check className="w-4 h-4 mr-2" />{savingStore ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════ */}
      {/* 2. DEKORASI TOKO                          */}
      {/* ══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />Dekorasi Toko
            </CardTitle>
            <div className="flex items-center gap-2">
              {decoSaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />Tersimpan
                </span>
              )}
              {!decoEditing ? (
                <Button size="sm" onClick={() => { setDecoDraft({ ...decoration }); setDecoEditing(true); }}>
                  <Pencil className="w-4 h-4 mr-1.5" />Edit Dekorasi
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDecoEditing(false)}>
                    <X className="w-4 h-4 mr-1.5" />Batal
                  </Button>
                  <Button size="sm" onClick={handleDecoSave}>
                    <Check className="w-4 h-4 mr-1.5" />Simpan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warna Tema */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />Warna Tema Toko
            </Label>
            {decoEditing ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {THEME_COLORS.map(c => (
                    <button key={c.value} type="button"
                      onClick={() => setDecoDraft(p => ({ ...p, themeColor: c.value }))}
                      title={c.label}
                      className={`w-8 h-8 rounded-full transition-all border-2 ${decoDraft.themeColor === c.value ? "border-foreground scale-110 shadow-md" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <label className="text-xs text-muted-foreground">Warna kustom:</label>
                  <input type="color" value={decoDraft.themeColor}
                    onChange={e => setDecoDraft(p => ({ ...p, themeColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer border border-input" />
                  <span className="text-xs font-mono text-muted-foreground">{decoDraft.themeColor}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: decoration.themeColor }} />
                <span className="text-sm text-muted-foreground font-mono">{decoration.themeColor}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Tagline */}
          <div className="space-y-1.5">
            <Label>Slogan / Tagline Toko</Label>
            {decoEditing ? (
              <Input value={decoDraft.tagline}
                onChange={e => setDecoDraft(p => ({ ...p, tagline: e.target.value }))}
                placeholder="Contoh: Belanja Mudah, Harga Hemat!" maxLength={80} />
            ) : (
              <p className="text-sm text-muted-foreground py-2 italic">"{decoration.tagline}"</p>
            )}
          </div>

          {/* Banner */}
          <div className="space-y-2">
            <Label>Banner Toko</Label>
            {decoEditing ? (
              <div className="space-y-2">
                <div
                  onClick={() => bannerRef.current?.click()}
                  className="h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors overflow-hidden relative group"
                >
                  {decoDraft.bannerImage ? (
                    <>
                      <img src={decoDraft.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">Klik untuk upload banner (rasio 16:3)</p>
                    </div>
                  )}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                {decoDraft.bannerImage && (
                  <Button variant="outline" size="sm" onClick={() => setDecoDraft(p => ({ ...p, bannerImage: null }))}>
                    <X className="w-3.5 h-3.5 mr-1.5" />Hapus Banner
                  </Button>
                )}
              </div>
            ) : (
              decoration.bannerImage ? (
                <div className="h-24 rounded-xl overflow-hidden border">
                  <img src={decoration.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">Belum ada banner ditetapkan</p>
              )
            )}
          </div>

          <Separator />

          {/* Tampilan toggle */}
          <div className="space-y-3">
            <Label>Elemen Tampilan</Label>
            {[
              { key: "showReviews" as const, label: "Tampilkan Rating & Ulasan", icon: <MessageSquare className="w-4 h-4 text-muted-foreground" />, desc: "Tampilkan rating dan komentar produk di halaman toko" },
              { key: "showBestSellers" as const, label: "Tampilkan Produk Terlaris", icon: <Star className="w-4 h-4 text-muted-foreground" />, desc: "Sorot produk dengan penjualan terbanyak di etalase" },
            ].map(({ key, label, icon, desc }) => (
              <div key={key} className="flex items-center justify-between py-1.5">
                <div className="flex items-start gap-2.5">
                  {icon}
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={decoEditing ? decoDraft[key] : decoration[key]}
                  onCheckedChange={v => {
                    if (decoEditing) setDecoDraft(p => ({ ...p, [key]: v }))
                  }}
                  disabled={!decoEditing}
                />
              </div>
            ))}
          </div>

          {decoEditing && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setDecoEditing(false)}><X className="w-4 h-4 mr-2" />Batal</Button>
              <Button onClick={handleDecoSave}><Check className="w-4 h-4 mr-2" />Simpan Dekorasi</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════ */}
      {/* 3. LAYANAN PENGIRIMAN                     */}
      {/* ══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />Layanan Pengiriman
            </CardTitle>
            <div className="flex items-center gap-2">
              {shippingSaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />Tersimpan
                </span>
              )}
              {!shippingEditing ? (
                <Button size="sm" onClick={() => { setShippingDraft({ ...shipping, couriers: shipping.couriers.map(c => ({ ...c })) }); setShippingEditing(true); }}>
                  <Pencil className="w-4 h-4 mr-1.5" />Edit Pengiriman
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShippingEditing(false)}>
                    <X className="w-4 h-4 mr-1.5" />Batal
                  </Button>
                  <Button size="sm" onClick={handleShippingSave}>
                    <Check className="w-4 h-4 mr-1.5" />Simpan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Courier list */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />Kurir Tersedia
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(shippingEditing ? shippingDraft.couriers : shipping.couriers).map(c => (
                <div key={c.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    c.enabled ? "border-primary/30 bg-primary/5" : "border-muted bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${c.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {c.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.estimatedDays}</p>
                    </div>
                  </div>
                  <Switch
                    checked={c.enabled}
                    onCheckedChange={() => shippingEditing && toggleCourier(c.id)}
                    disabled={!shippingEditing}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 min-w-0">
              <Label>Gratis Ongkir Mulai (Rp)</Label>
              {shippingEditing ? (
                <>
                  <Input type="number" min={0} value={shippingDraft.freeShippingMin}
                    onChange={e => setShippingDraft(p => ({ ...p, freeShippingMin: e.target.value }))} />
                  {shippingDraft.freeShippingMin && (
                    <p className="text-[10px] text-muted-foreground tabular-nums truncate">{formatPrice(Number(shippingDraft.freeShippingMin))}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-2 tabular-nums truncate">
                  {shipping.freeShippingMin === "0" || !shipping.freeShippingMin ? "Tidak ada" : formatPrice(Number(shipping.freeShippingMin))}
                </p>
              )}
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>Biaya Kemasan (Rp)</Label>
              {shippingEditing ? (
                <>
                  <Input type="number" min={0} value={shippingDraft.packagingFee}
                    onChange={e => setShippingDraft(p => ({ ...p, packagingFee: e.target.value }))} />
                  {shippingDraft.packagingFee && (
                    <p className="text-[10px] text-muted-foreground tabular-nums truncate">{formatPrice(Number(shippingDraft.packagingFee))}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-2 tabular-nums truncate">
                  {shipping.packagingFee ? formatPrice(Number(shipping.packagingFee)) : "Rp 0"}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Waktu Proses Pesanan</Label>
              {shippingEditing ? (
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={7} value={shippingDraft.processingDays}
                    onChange={e => setShippingDraft(p => ({ ...p, processingDays: e.target.value }))} />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">hari kerja</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">{shipping.processingDays} hari kerja</p>
              )}
            </div>
          </div>

          {shippingEditing && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShippingEditing(false)}><X className="w-4 h-4 mr-2" />Batal</Button>
              <Button onClick={handleShippingSave}><Check className="w-4 h-4 mr-2" />Simpan Pengiriman</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════ */}
      {/* 4. NOTIFIKASI                             */}
      {/* ══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { key: "emailNewOrder"    as const, label: "Email Pesanan Baru",     desc: "Terima notifikasi email saat ada pesanan masuk" },
            { key: "smsPayment"       as const, label: "SMS Alert Pembayaran",   desc: "Terima SMS saat pembayaran berhasil" },
            { key: "pushNotification" as const, label: "Push Notifikasi",        desc: "Notifikasi langsung di browser atau aplikasi" },
            ...(hasFeature("advanced-notifications") ? [
              { key: "emailLowStock"    as const, label: "Email Stok Rendah",      desc: "Peringatan email saat stok produk hampir habis" },
              { key: "emailPromotion"   as const, label: "Info Promosi & Program", desc: "Update promosi dan program seller terbaru" },
            ] : []),
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={notifications[key] ? "default" : "secondary"}>
                  {notifications[key] ? "Aktif" : "Nonaktif"}
                </Badge>
                <Switch checked={notifications[key]} onCheckedChange={() => setNotifications(p => ({ ...p, [key]: !p[key] }))} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════ */}
      {/* 5. KEAMANAN & AKUN                        */}
      {/* ══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />Keamanan &amp; Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Kata sandi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />Kata Sandi
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Terakhir diubah: 3 bulan lalu</p>
              </div>
              {pwdSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />Kata sandi berhasil diubah
                </span>
              )}
              {!showPwdForm && (
                <Button size="sm" variant="outline" onClick={() => setShowPwdForm(true)}>
                  Ganti Kata Sandi
                </Button>
              )}
            </div>

            {showPwdForm && (
              <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                {/* Current password */}
                <div className="space-y-1.5">
                  <Label>Kata Sandi Saat Ini</Label>
                  <div className="relative">
                    <Input type={showCur ? "text" : "password"} value={currentPwd}
                      onChange={e => setCurrentPwd(e.target.value)} placeholder="Masukkan kata sandi saat ini" />
                    <button type="button" onClick={() => setShowCur(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <Label>Kata Sandi Baru</Label>
                  <div className="relative">
                    <Input type={showNew ? "text" : "password"} value={newPwd}
                      onChange={e => setNewPwd(e.target.value)} placeholder="Minimal 8 karakter" />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPwd && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(n => (
                          <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= pwdStrength.score ? pwdStrength.colorClass : "bg-muted"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Kekuatan: <strong>{pwdStrength.label}</strong></p>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div className="space-y-1.5">
                  <Label>Konfirmasi Kata Sandi Baru</Label>
                  <div className="relative">
                    <Input type={showConf ? "text" : "password"} value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)} placeholder="Ulangi kata sandi baru" />
                    <button type="button" onClick={() => setShowConf(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPwd && newPwd && confirmPwd !== newPwd && (
                    <p className="text-xs text-red-500">Kata sandi tidak cocok</p>
                  )}
                </div>

                {pwdError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{pwdError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm"
                    onClick={() => { setShowPwdForm(false); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); setPwdError(""); }}>
                    Batal
                  </Button>
                  <Button size="sm" onClick={handleChangePwd}>
                    <Check className="w-4 h-4 mr-1.5" />Simpan Kata Sandi
                  </Button>
                </div>
              </div>
            )}
          </div>

          {hasFeature("two-factor-auth") && (
            <>
              <Separator />

              {/* 2FA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />Verifikasi 2 Langkah (2FA)
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tambahkan lapisan keamanan ekstra saat login
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={twoFactor ? "default" : "secondary"}>
                      {twoFactor ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                  </div>
                </div>
                {twoFactor && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-sm text-blue-800">
                    <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">2FA Aktif</p>
                      <p className="text-xs mt-0.5">Kode OTP akan dikirim ke nomor telepon terdaftar setiap kali login.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notifikasi login */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notifikasi Login Baru</p>
              <p className="text-xs text-muted-foreground">Kirim email saat ada perangkat baru yang login</p>
            </div>
            <Switch checked={loginNotif} onCheckedChange={setLoginNotif} />
          </div>

          <Separator />

          {/* Sesi aktif */}
          <div className="space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Monitor className="w-4 h-4" />Sesi Login Aktif
            </p>
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${s.isCurrent ? "border-green-200 bg-green-50" : "border-muted"}`}>
                  <div className="flex items-center gap-3">
                    <Monitor className={`w-4 h-4 shrink-0 ${s.isCurrent ? "text-green-600" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{s.device}</p>
                      <p className="text-xs text-muted-foreground">{s.ip} · {s.location}</p>
                      <p className="text-xs text-muted-foreground">{s.lastActive}</p>
                    </div>
                  </div>
                  {s.isCurrent ? (
                    <Badge variant="outline" className="border-green-300 text-green-700 text-xs shrink-0">Sesi Ini</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 shrink-0"
                      onClick={() => setSessions(prev => prev.filter(x => x.id !== s.id))}>
                      <LogOutIcon className="w-3.5 h-3.5 mr-1" />Cabut
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Danger zone */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />Zona Berbahaya
            </p>
            <div className="p-4 border border-red-200 rounded-xl bg-red-50 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-red-800">Hapus Akun Seller</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Semua data toko, produk, dan riwayat pesanan akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                </p>
              </div>
              <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setDeleteAccountOpen(true)}>
                Hapus Akun
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete account confirm */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />Hapus Akun Seller
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">Apakah Anda benar-benar yakin ingin menghapus akun?</span>
              <span className="block font-medium text-foreground">Tindakan ini akan menghapus secara permanen:</span>
              <ul className="list-disc list-inside text-sm space-y-0.5">
                <li>Semua data profil dan informasi toko</li>
                <li>Seluruh katalog produk</li>
                <li>Riwayat pesanan dan transaksi</li>
                <li>Data pelanggan dan reseller</li>
              </ul>
              <span className="block font-medium text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal, Jangan Hapus</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">
              Ya, Hapus Akun Saya
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
