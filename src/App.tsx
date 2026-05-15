import { useState, useCallback, useEffect } from "react";
import { SplashScreen } from "./components/splash-screen";
import { TenantProvider, useTenant } from "./contexts/TenantContext";
import { InventoryProvider, useInventory } from "./contexts/InventoryContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ROLE_LABEL } from "./lib/permissions";
import { Lock } from "lucide-react";
import { SellerSidebar } from "./components/seller-sidebar";
import { DashboardOverview } from "./components/dashboard-overview";
import { ProductManagement } from "./components/product-management";
import { WarehouseManagement } from "./components/warehouse-management";
import { OrderManagement, initialOrders } from "./components/order-management";
import { AnalyticsDashboard } from "./components/analytics-dashboard";
import { AIInsightsPage } from "./components/ai-insights-page";
import { CustomersPage } from "./components/customers-page";
import { PaymentsPage } from "./components/payments-page";
import { LoginPage } from "./components/login-page";
import { ForgotPasswordPage } from "./components/forgot-password-page";
import { SettingsPage } from "./components/settings-page";
import { ResellerPage, initialResellers } from "./components/reseller-page";
import { MarketingPage, initialVouchers } from "./components/marketing-page";
import { HelpPage } from "./components/help-page";
import { TeamPage } from "./components/team-page";
import { LiveChat } from "./components/live-chat";
import { UserProfileDialog } from "./components/user-profile-dialog";
import { MobileHeader } from "./components/mobile-header";
import { MobileBottomNav } from "./components/mobile-bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Bell, LogOut, Store, AlertTriangle, ChevronDown } from "lucide-react";

function NotificationsPage() {
  const { hasFeature } = useTenant();
  const notifications = [
    { color: "bg-blue-500", text: "Pesanan baru dari Ahmad Rizki", time: "5 menit yang lalu", badge: "Baru", variant: "default" as const, feature: null },
    { color: "bg-orange-500", text: "Stok iPhone 14 Pro hampir habis", time: "2 jam yang lalu", badge: "Stok", variant: "outline" as const, feature: 'low-stock-alerts' as const },
    { color: "bg-green-500", text: "Pembayaran Rp 15.999.000 berhasil", time: "1 hari yang lalu", badge: "Pembayaran", variant: "secondary" as const, feature: null },
  ].filter(n => !n.feature || hasFeature(n.feature));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifikasi</h1>
        <p className="text-muted-foreground">Pantau semua notifikasi penting dari toko Anda</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifikasi Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 ${n.color} rounded-full shrink-0`} />
                <div className="flex-1">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-xs text-muted-foreground">{n.time}</p>
                </div>
                <Badge variant={n.variant}>{n.badge}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Loading & Error screens ──────────────────────────────────────────────────

function TenantLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto animate-pulse">
          <Store className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Memuat data toko...</p>
      </div>
    </div>
  );
}

function TenantErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Toko Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Pastikan subdomain yang Anda akses sudah benar, atau hubungi administrator.
        </p>
      </div>
    </div>
  );
}

// ─── Inner app (has access to TenantContext) ──────────────────────────────────

function AppInner({ onLogoutComplete }: { onLogoutComplete: () => void }) {
  const { tenant, loading, error, hasFeature, refreshTenant, resetTenant } = useTenant();
  const { products, totalStockOf } = useInventory();
  const { user, token, loading: authLoading, logout, canAccessTab } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [productAction, setProductAction] = useState<'add' | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sinkronisasi tenant dengan sesi login — fetch store data setelah user login
  useEffect(() => {
    if (token) {
      refreshTenant(token);
    } else {
      resetTenant();
    }
  }, [token, refreshTenant, resetTenant]);

  const goToOrders = () => {
    setActiveTab("orders");
  };

  const goToAddProduct = () => {
    setActiveTab("products");
    setProductAction("add");
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab("dashboard");
    setShowForgotPassword(false);
    setShowLogoutConfirm(false);
    onLogoutComplete();
  };

  const requestLogout = () => setShowLogoutConfirm(true);

  if (loading || authLoading) return <TenantLoadingScreen />;
  if (error)   return <TenantErrorScreen message={error} />;

  if (!user) {
    if (showForgotPassword) {
      return <ForgotPasswordPage onBackToLogin={() => setShowForgotPassword(false)} />;
    }
    return (
      <LoginPage onForgotPassword={() => setShowForgotPassword(true)} />
    );
  }

  const userEmail = user.email;

  const renderContent = () => {
    if (!hasFeature(activeTab as Parameters<typeof hasFeature>[0])) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <p className="font-semibold text-gray-700">Fitur tidak tersedia</p>
          <p className="text-sm text-muted-foreground text-center">
            Fitur ini tidak termasuk dalam paket <strong>{tenant?.package.name}</strong> Anda.
          </p>
        </div>
      );
    }
    if (!canAccessTab(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <Lock className="w-10 h-10 text-gray-400" />
          <p className="font-semibold text-gray-700">Akses ditolak</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Role <strong>{ROLE_LABEL[user.role]}</strong> tidak memiliki izin untuk membuka halaman ini.
          </p>
        </div>
      );
    }
    switch (activeTab) {
      case "dashboard":     return <DashboardOverview onAddProduct={goToAddProduct} onViewAllOrders={goToOrders} />;
      case "products":      return <ProductManagement initialAction={productAction} onActionConsumed={() => setProductAction(null)} />;
      case "warehouse":     return <WarehouseManagement />;
      case "orders":        return <OrderManagement />;
      case "analytics":     return <AnalyticsDashboard />;
      case "ai-insights":   return <AIInsightsPage />;
      case "customers":     return <CustomersPage />;
      case "resellers":     return <ResellerPage />;
      case "marketing":     return <MarketingPage />;
      case "payments":      return <PaymentsPage />;
      case "notifications": return <NotificationsPage />;
      case "settings":      return <SettingsPage />;
      case "help":          return <HelpPage onNavigate={setActiveTab} />;
      case "team":          return <TeamPage />;
      default:              return <DashboardOverview />;
    }
  };

  const productBadge   = hasFeature('low-stock-alerts')
    ? products.filter(p => totalStockOf(p.id) <= 5).length
    : 0;
  const orderBadge     = initialOrders.filter(o => o.status === 'pending').length;
  const resellerBadge  = initialResellers.filter(r => r.status === 'pending').length;
  const marketingBadge = initialVouchers.filter(v => {
    const now = new Date();
    return !v.disabled && new Date(v.endDate + 'T23:59:59') > now && new Date(v.startDate) <= now && v.used < v.quota;
  }).length;

  const primaryColor = tenant?.primaryColor ?? '#6366f1';

  return (
    <div className="flex h-screen bg-background">
      <SellerSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={requestLogout}
        productBadge={productBadge}
        orderBadge={orderBadge}
        resellerBadge={resellerBadge}
        marketingBadge={marketingBadge}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader
          userEmail={userEmail}
          hasNotifications={(orderBadge + productBadge + resellerBadge + marketingBadge) > 0}
          onProfileClick={() => setShowProfile(true)}
          onNotificationsClick={() => setActiveTab('notifications')}
        />
        <header className="hidden md:flex border-b border-gray-100 bg-white px-4 md:px-6 py-3 items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              aria-label="Lihat profil pengguna"
              className="flex items-center gap-2 border border-gray-200 rounded-full pl-1 pr-2 sm:pr-3 py-1 sm:py-1.5 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
            >
              <div
                className="w-6 h-6 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white text-xs sm:text-[10px] font-bold shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <p className="hidden sm:block text-xs font-medium text-gray-700">{userEmail.split('@')[0]}</p>
              <ChevronDown className="hidden sm:block w-3 h-3 text-gray-400" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={requestLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Keluar</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6">
            {renderContent()}
          </div>
        </main>
      </div>
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={requestLogout}
        productBadge={productBadge}
        orderBadge={orderBadge}
        resellerBadge={resellerBadge}
        marketingBadge={marketingBadge}
      />
      <LiveChat />
      <UserProfileDialog
        open={showProfile}
        onClose={() => setShowProfile(false)}
        userEmail={userEmail}
        tenant={tenant}
        onGoToSettings={() => setActiveTab('settings')}
        onLogout={requestLogout}
      />

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-500" />
              Keluar dari Aplikasi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar? Anda perlu login kembali untuk mengakses toko Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);
  const handleLogoutComplete = useCallback(() => setSplashDone(false), []);

  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      {splashDone && (
        <TenantProvider>
          <AuthProvider>
            <InventoryProvider>
              <AppInner onLogoutComplete={handleLogoutComplete} />
            </InventoryProvider>
          </AuthProvider>
        </TenantProvider>
      )}
    </>
  );
}
