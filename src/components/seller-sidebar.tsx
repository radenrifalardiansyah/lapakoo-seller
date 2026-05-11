import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3, Settings,
  Store, Users, CreditCard, Bell, HelpCircle, LogOut,
  AlertTriangle, Handshake, Megaphone,
} from 'lucide-react'
import { cn } from "./ui/utils"

interface SellerSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  productBadge?: number
  orderBadge?: number
  resellerBadge?: number
  marketingBadge?: number
}

const baseNavigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products',  label: 'Produk',    icon: Package },
  { id: 'orders',    label: 'Pesanan',   icon: ShoppingCart },
  { id: 'analytics', label: 'Analitik',  icon: BarChart3 },
  { id: 'customers', label: 'Pelanggan', icon: Users },
  { id: 'resellers', label: 'Reseller',  icon: Handshake },
  { id: 'marketing', label: 'Pemasaran', icon: Megaphone },
  { id: 'payments',  label: 'Keuangan',  icon: CreditCard },
]

const bottomItems = [
  { id: 'notifications', label: 'Notifikasi', icon: Bell,       badge: '3' },
  { id: 'settings',      label: 'Pengaturan', icon: Settings },
  { id: 'help',          label: 'Bantuan',    icon: HelpCircle },
]

export function SellerSidebar({ activeTab, onTabChange, productBadge, orderBadge, resellerBadge, marketingBadge }: SellerSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    const handler = () => setIsCollapsed(v => !v)
    window.addEventListener('toggle-sidebar', handler)
    return () => window.removeEventListener('toggle-sidebar', handler)
  }, [])

  const navigationItems = baseNavigationItems.map(item => ({
    ...item,
    badge:
      item.id === 'products'  && productBadge  != null && productBadge  > 0 ? String(productBadge)  :
      item.id === 'orders'    && orderBadge    != null && orderBadge    > 0 ? String(orderBadge)    :
      item.id === 'resellers' && resellerBadge != null && resellerBadge > 0 ? String(resellerBadge) :
      item.id === 'marketing' && marketingBadge!= null && marketingBadge> 0 ? String(marketingBadge):
      undefined,
  }))

  const NavItem = ({ id, label, icon: Icon, badge }: { id: string; label: string; icon: React.ElementType; badge?: string }) => {
    const isActive = activeTab === id
    return (
      <button
        onClick={() => { onTabChange(id); setIsCollapsed(true) }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
          isActive
            ? "bg-indigo-50 text-indigo-700 font-semibold"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-gray-400")} />
        <span className="flex-1 text-left">{label}</span>
        {badge && (
          <span className="text-[10px] h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center font-bold bg-indigo-600 text-white">
            {badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      {!isCollapsed && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setIsCollapsed(true)} />
      )}

      <div className={cn(
        "fixed md:relative left-0 top-0 z-50 h-screen w-64 flex flex-col bg-white border-r border-gray-100",
        "transition-transform duration-300 ease-in-out md:translate-x-0",
        isCollapsed ? "-translate-x-full" : "translate-x-0"
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Seller Center</p>
            <p className="text-xs text-indigo-500 font-medium">Toko Ahmad</p>
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3 space-y-0.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-2">Menu Utama</p>
            {navigationItems.map(item => <NavItem key={item.id} {...item} />)}
          </nav>
        </div>

        {/* Quick Stats */}
        <div className="mx-3 mb-3 rounded-xl bg-indigo-50 border border-indigo-100 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Hari Ini</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Penjualan</span>
            <span className="text-xs font-bold text-indigo-700">Rp 2.5jt</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Pesanan Baru</span>
            <span className="text-xs font-bold text-indigo-700">5</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />Stok Rendah
            </span>
            <span className="text-xs font-bold text-amber-600">12</span>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="p-3 border-t border-gray-100 space-y-0.5">
          {bottomItems.map(item => <NavItem key={item.id} {...item} />)}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150">
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Keluar</span>
          </button>
        </div>
      </div>
    </>
  )
}
