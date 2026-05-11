import { useState } from "react";
import { SellerSidebar } from "./components/seller-sidebar";
import { DashboardOverview } from "./components/dashboard-overview";
import { ProductManagement, initialProducts } from "./components/product-management";
import { OrderManagement, initialOrders } from "./components/order-management";
import { AnalyticsDashboard } from "./components/analytics-dashboard";
import { CustomersPage } from "./components/customers-page";
import { PaymentsPage } from "./components/payments-page";
import { LoginPage } from "./components/login-page";
import { RegisterPage } from "./components/register-page";
import { ForgotPasswordPage } from "./components/forgot-password-page";
import { SettingsPage } from "./components/settings-page";
import { ResellerPage, initialResellers } from "./components/reseller-page";
import { MarketingPage, initialVouchers } from "./components/marketing-page";
import { HelpPage } from "./components/help-page";
import { LiveChat } from "./components/live-chat";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Bell, HelpCircle, LogOut, Menu, Store } from "lucide-react";

function NotificationsPage() {
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
            {[
              { color: "bg-blue-500", text: "Pesanan baru dari Ahmad Rizki", time: "5 menit yang lalu", badge: "Baru", variant: "default" as const },
              { color: "bg-orange-500", text: "Stok iPhone 14 Pro hampir habis", time: "2 jam yang lalu", badge: "Stok", variant: "outline" as const },
              { color: "bg-green-500", text: "Pembayaran Rp 15.999.000 berhasil", time: "1 hari yang lalu", badge: "Pembayaran", variant: "secondary" as const },
            ].map((n, i) => (
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

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [authPage, setAuthPage] = useState<"login" | "register" | "forgot-password">("login");

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail("");
    setActiveTab("dashboard");
    setAuthPage("login");
  };

  if (!isAuthenticated) {
    switch (authPage) {
      case "register":
        return (
          <RegisterPage
            onBackToLogin={() => setAuthPage("login")}
            onRegisterSuccess={handleLogin}
          />
        );
      case "forgot-password":
        return <ForgotPasswordPage onBackToLogin={() => setAuthPage("login")} />;
      default:
        return (
          <LoginPage
            onLogin={handleLogin}
            onForgotPassword={() => setAuthPage("forgot-password")}
            onRegister={() => setAuthPage("register")}
          />
        );
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":     return <DashboardOverview />;
      case "products":      return <ProductManagement />;
      case "orders":        return <OrderManagement />;
      case "analytics":     return <AnalyticsDashboard />;
      case "customers":     return <CustomersPage />;
      case "resellers":     return <ResellerPage />;
      case "marketing":     return <MarketingPage />;
      case "payments":      return <PaymentsPage />;
      case "notifications": return <NotificationsPage />;
      case "settings":      return <SettingsPage />;
      case "help":          return <HelpPage />;
      default:              return <DashboardOverview />;
    }
  };

  const productBadge   = initialProducts.filter(p => p.stock <= 5).length
  const orderBadge     = initialOrders.filter(o => o.status === 'pending').length
  const resellerBadge  = initialResellers.filter(r => r.status === 'pending').length
  const marketingBadge = initialVouchers.filter(v => {
    const now = new Date()
    return !v.disabled && new Date(v.endDate + 'T23:59:59') > now && new Date(v.startDate) <= now && v.used < v.quota
  }).length

  return (
    <div className="flex h-screen bg-background">
      <SellerSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        productBadge={productBadge}
        orderBadge={orderBadge}
        resellerBadge={resellerBadge}
        marketingBadge={marketingBadge}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-gray-100 bg-white px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden -ml-1 shrink-0 text-indigo-600 hover:bg-indigo-50"
              onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex w-8 h-8 bg-indigo-600 rounded-xl items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 leading-tight">Seller Management</h2>
                <p className="text-[11px] text-indigo-500 font-medium leading-tight hidden md:block">Eleven Platform</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5">
              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-medium text-gray-700">{userEmail.split('@')[0]}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Keluar</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{renderContent()}</div>
        </main>
      </div>
      <LiveChat />
    </div>
  );
}
