import { useState, type ElementType } from 'react'
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3, Settings,
  Users, CreditCard, Bell, HelpCircle, LogOut,
  AlertTriangle, Handshake, Megaphone, UserCog, Warehouse,
  ChevronLeft, ChevronRight, ChevronDown, Brain,
} from 'lucide-react'
import miniLogo from '../assets/images/mini-logo-lapakoo.png'
import { cn } from "./ui/utils"
import { useTenant } from '../contexts/TenantContext'
import { useAuth } from '../contexts/AuthContext'
import type { FeatureKey } from '../types/tenant'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'
import { getPackageTheme } from '../lib/packageTheme'

interface SellerSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  productBadge?: number
  orderBadge?: number
  resellerBadge?: number
  marketingBadge?: number
  notificationBadge?: number
}

const mainNavItems: { id: FeatureKey; label: string; icon: ElementType }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'products',   label: 'Produk',     icon: Package },
  { id: 'warehouse',  label: 'Gudang',     icon: Warehouse },
  { id: 'orders',     label: 'Pesanan',    icon: ShoppingCart },
  { id: 'analytics',  label: 'Analitik',   icon: BarChart3 },
  { id: 'ai-insights', label: 'Bisnis AI', icon: Brain },
  { id: 'customers',  label: 'Pelanggan',  icon: Users },
  { id: 'resellers',  label: 'Reseller',   icon: Handshake },
  { id: 'marketing',  label: 'Pemasaran',  icon: Megaphone },
  { id: 'payments',   label: 'Keuangan',   icon: CreditCard },
  { id: 'team',       label: 'Tim',        icon: UserCog },
]

const bottomNavItems: { id: FeatureKey; label: string; icon: ElementType }[] = [
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
  { id: 'settings',      label: 'Pengaturan', icon: Settings },
  { id: 'help',          label: 'Bantuan',    icon: HelpCircle },
]

export function SellerSidebar({
  activeTab, onTabChange, onLogout,
  productBadge, orderBadge, resellerBadge, marketingBadge, notificationBadge,
}: SellerSidebarProps) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const [isTodayCollapsed, setIsTodayCollapsed] = useState(
    () => localStorage.getItem('sidebar-today-collapsed') === 'true'
  )
  const { tenant, hasFeature } = useTenant()
  const { canAccessTab } = useAuth()

  const toggleDesktop = () => {
    setIsDesktopCollapsed(v => {
      localStorage.setItem('sidebar-collapsed', String(!v))
      return !v
    })
  }

  const toggleToday = () => {
    setIsTodayCollapsed(v => {
      localStorage.setItem('sidebar-today-collapsed', String(!v))
      return !v
    })
  }

  const badgeFor = (id: string) => {
    if (id === 'products'      && productBadge      && productBadge      > 0) return String(productBadge)
    if (id === 'orders'        && orderBadge        && orderBadge        > 0) return String(orderBadge)
    if (id === 'resellers'     && resellerBadge     && resellerBadge     > 0) return String(resellerBadge)
    if (id === 'marketing'     && marketingBadge    && marketingBadge    > 0) return String(marketingBadge)
    if (id === 'notifications' && notificationBadge && notificationBadge > 0) return String(notificationBadge)
    return undefined
  }

  const primaryColor = tenant?.primaryColor ?? '#6366f1'
  const theme = getPackageTheme(tenant?.package.id)
  const PkgIcon = theme.icon

  const NavItem = ({ id, label, icon: Icon }: { id: string; label: string; icon: ElementType }) => {
    const isActive = activeTab === id
    const badge = badgeFor(id)
    const btn = (
      <button
        onClick={() => onTabChange(id)}
        className={cn(
          "w-full flex items-center rounded-lg text-sm transition-all duration-150",
          isDesktopCollapsed ? "px-3 py-2.5 gap-3 md:justify-center md:px-0 md:gap-0" : "gap-3 px-3 py-2.5",
          isActive ? "font-semibold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium"
        )}
        style={isActive ? { backgroundColor: `${primaryColor}12`, color: primaryColor } : undefined}
      >
        <Icon
          className="h-4 w-4 shrink-0"
          style={isActive ? { color: primaryColor } : { color: '#9ca3af' }}
        />
        <span className={cn("flex-1 text-left", isDesktopCollapsed && "md:hidden")}>{label}</span>
        {badge && (
          <span
            className={cn(
              "text-[10px] h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center font-bold text-white",
              isDesktopCollapsed && "md:hidden"
            )}
            style={{ backgroundColor: primaryColor }}
          >
            {badge}
          </span>
        )}
      </button>
    )
    if (isDesktopCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">{label}{badge ? ` (${badge})` : ''}</TooltipContent>
        </Tooltip>
      )
    }
    return btn
  }

  const visibleMain   = mainNavItems.filter(item => hasFeature(item.id) && canAccessTab(item.id))
  const visibleBottom = bottomNavItems.filter(item => hasFeature(item.id) && canAccessTab(item.id))

  return (
    <>
      <div className={cn(
        "hidden md:flex relative left-0 top-0 z-50 h-screen flex-col bg-white border-r border-gray-100",
        "transition-all duration-300 ease-in-out",
        isDesktopCollapsed ? "md:w-16" : "md:w-64"
      )}>

        {/* Tier ribbon — gradient strip identifying the package tier */}
        <div className={cn("h-1 w-full shrink-0 bg-gradient-to-r", theme.gradient)} />

        {/* Logo / Store branding */}
        <div className={cn(
          "flex items-center border-b border-gray-100",
          isDesktopCollapsed ? "px-3 py-4 md:justify-center" : "gap-3 px-5 py-4"
        )}>
          <div className="w-11 h-11 shrink-0 flex items-center justify-center">
            <img
              src={miniLogo}
              alt="LapaKoo"
              className="w-11 h-11 object-contain drop-shadow-sm"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          <div className={cn("min-w-0 flex-1", isDesktopCollapsed && "md:hidden")}>
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">
              {tenant?.storeName ?? 'Seller Center'}
            </p>
            <span className={cn(
              "inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold leading-none",
              theme.chipClass
            )}>
              <PkgIcon className="w-3 h-3" />
              {tenant?.package.name ?? '—'}
            </span>
          </div>
          <button
            className="hidden md:flex w-6 h-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
            onClick={toggleDesktop}
            title={isDesktopCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {isDesktopCollapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto">
          <nav className={cn("p-3 space-y-0.5", isDesktopCollapsed && "md:px-2")}>
            <p className={cn(
              "text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-2",
              isDesktopCollapsed && "md:hidden"
            )}>
              Menu Utama
            </p>
            {visibleMain.map(item => <NavItem key={item.id} id={item.id} label={item.label} icon={item.icon} />)}
          </nav>
        </div>

        {/* Quick Stats */}
        <div
          className={cn(
            "mx-3 mb-3 rounded-xl border relative overflow-hidden",
            isTodayCollapsed ? "p-2" : "p-3 space-y-2",
            isDesktopCollapsed && "md:hidden"
          )}
          style={{ backgroundColor: `${theme.accent}0D`, borderColor: `${theme.accent}33` }}
        >
          <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", theme.gradient)} />
          <button
            onClick={toggleToday}
            className="w-full flex items-center justify-between cursor-pointer"
            aria-expanded={!isTodayCollapsed}
            title={isTodayCollapsed ? 'Perluas' : 'Ciutkan'}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>Hari Ini</p>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                isTodayCollapsed && "-rotate-90"
              )}
              style={{ color: theme.accent }}
            />
          </button>
          {!isTodayCollapsed && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Penjualan</span>
                <span className="text-xs font-bold" style={{ color: theme.accent }}>Rp 2.5jt</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Pesanan Baru</span>
                <span className="text-xs font-bold" style={{ color: theme.accent }}>5</span>
              </div>
              {hasFeature('low-stock-alerts') && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />Stok Rendah
                  </span>
                  <span className="text-xs font-bold text-amber-600">12</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Nav */}
        <div className={cn("p-3 border-t border-gray-100 space-y-0.5", isDesktopCollapsed && "md:px-2")}>
          {visibleBottom.map(item => <NavItem key={item.id} {...item} />)}
          {isDesktopCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150 md:px-0 px-3 md:gap-0 gap-3"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left md:hidden">Keluar</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Keluar</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Keluar</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
