import { useState, type ElementType } from 'react'
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Warehouse, Users, Handshake, Megaphone, CreditCard,
  Settings, Bell, HelpCircle, LogOut, MoreHorizontal, Brain, UserCog,
} from 'lucide-react'
import { cn } from './ui/utils'
import { useTenant } from '../contexts/TenantContext'
import type { FeatureKey } from '../types/tenant'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet'

interface MobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  productBadge?: number
  orderBadge?: number
  resellerBadge?: number
  marketingBadge?: number
}

const primaryTabs: { id: FeatureKey; label: string; icon: ElementType }[] = [
  { id: 'dashboard', label: 'Beranda',  icon: LayoutDashboard },
  { id: 'orders',    label: 'Pesanan',  icon: ShoppingCart },
  { id: 'products',  label: 'Produk',   icon: Package },
  { id: 'analytics', label: 'Analitik', icon: BarChart3 },
]

const moreItems: { id: FeatureKey; label: string; icon: ElementType }[] = [
  { id: 'warehouse',     label: 'Gudang',     icon: Warehouse },
  { id: 'ai-insights',   label: 'Bisnis AI',  icon: Brain },
  { id: 'customers',     label: 'Pelanggan',  icon: Users },
  { id: 'resellers',     label: 'Reseller',   icon: Handshake },
  { id: 'marketing',     label: 'Pemasaran',  icon: Megaphone },
  { id: 'payments',      label: 'Keuangan',   icon: CreditCard },
  { id: 'team',          label: 'Tim',        icon: UserCog },
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
  { id: 'settings',      label: 'Pengaturan', icon: Settings },
  { id: 'help',          label: 'Bantuan',    icon: HelpCircle },
]

export function MobileBottomNav({
  activeTab, onTabChange, onLogout,
  productBadge, orderBadge, resellerBadge, marketingBadge,
}: MobileBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const { tenant, hasFeature } = useTenant()
  const primaryColor = tenant?.primaryColor ?? '#6366f1'

  const badgeFor = (id: string): number | undefined => {
    if (id === 'products'  && productBadge   && productBadge  > 0) return productBadge
    if (id === 'orders'    && orderBadge     && orderBadge    > 0) return orderBadge
    if (id === 'resellers' && resellerBadge  && resellerBadge > 0) return resellerBadge
    if (id === 'marketing' && marketingBadge && marketingBadge > 0) return marketingBadge
    return undefined
  }

  const visiblePrimary = primaryTabs.filter(t => hasFeature(t.id))
  const visibleMore    = moreItems.filter(t => hasFeature(t.id))
  const isMoreActive   = moreItems.some(m => m.id === activeTab)

  const handleTap = (id: string) => {
    setMoreOpen(false)
    onTabChange(id)
  }

  const renderBadge = (badge: number | undefined, position: 'tab' | 'card') => {
    if (badge === undefined) return null
    const posClass = position === 'tab' ? '-top-1 -right-2.5' : 'top-1.5 right-1.5'
    return (
      <span
        className={cn(
          'absolute text-[9px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white',
          posClass,
        )}
        style={{ backgroundColor: primaryColor }}
      >
        {badge > 99 ? '99+' : badge}
      </span>
    )
  }

  const PrimaryTab = ({ id, label, icon: Icon }: { id: string; label: string; icon: ElementType }) => {
    const isActive = activeTab === id
    const badge = badgeFor(id)
    return (
      <button
        type="button"
        onClick={() => handleTap(id)}
        className={cn(
          'relative flex flex-col items-center justify-center gap-1 flex-1 pt-2 pb-1.5 transition-colors active:scale-[0.96]',
          isActive ? '' : 'text-gray-400 active:text-gray-700',
        )}
        style={isActive ? { color: primaryColor } : undefined}
      >
        {isActive && (
          <span
            className="absolute top-0 w-8 h-[3px] rounded-b-full"
            style={{ backgroundColor: primaryColor }}
          />
        )}
        <div className="relative">
          <Icon className={cn('w-[22px] h-[22px] transition-transform', isActive && 'scale-110')} strokeWidth={isActive ? 2.4 : 2} />
          {renderBadge(badge, 'tab')}
        </div>
        <span className={cn('text-[10px] leading-none', isActive ? 'font-bold' : 'font-medium')}>{label}</span>
      </button>
    )
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_-12px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch px-1">
          {visiblePrimary.map(t => <PrimaryTab key={t.id} {...t} />)}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 flex-1 pt-2 pb-1.5 transition-colors active:scale-[0.96]',
              (moreOpen || isMoreActive) ? '' : 'text-gray-400 active:text-gray-700',
            )}
            style={(moreOpen || isMoreActive) ? { color: primaryColor } : undefined}
          >
            {(moreOpen || isMoreActive) && (
              <span
                className="absolute top-0 w-8 h-[3px] rounded-b-full"
                style={{ backgroundColor: primaryColor }}
              />
            )}
            <MoreHorizontal className="w-[22px] h-[22px]" strokeWidth={(moreOpen || isMoreActive) ? 2.4 : 2} />
            <span className={cn('text-[10px] leading-none', (moreOpen || isMoreActive) ? 'font-bold' : 'font-medium')}>
              Lainnya
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl p-0 max-h-[85vh] border-0"
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <span className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          <SheetHeader className="px-5 pt-1 pb-3">
            <SheetTitle className="text-[15px]">Menu Lainnya</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-2 px-4 pb-4">
            {visibleMore.map(item => {
              const isActive = activeTab === item.id
              const badge = badgeFor(item.id)
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTap(item.id)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1.5 px-1 py-3 rounded-2xl border bg-white transition-all active:scale-[0.96]',
                    isActive ? '' : 'border-gray-100 active:bg-gray-50',
                  )}
                  style={isActive
                    ? { backgroundColor: `${primaryColor}12`, borderColor: `${primaryColor}40`, color: primaryColor }
                    : undefined}
                >
                  <Icon
                    className="w-[22px] h-[22px] shrink-0"
                    style={isActive ? { color: primaryColor } : { color: '#6b7280' }}
                  />
                  <span className={cn(
                    'text-[11px] font-semibold leading-tight text-center',
                    !isActive && 'text-gray-700',
                  )}>
                    {item.label}
                  </span>
                  {renderBadge(badge, 'card')}
                </button>
              )
            })}
          </div>
          <div
            className="px-4 pt-3 border-t border-gray-100"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => { setMoreOpen(false); onLogout() }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-500 active:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
