import { Bell } from 'lucide-react'
import { useTenant } from '../contexts/TenantContext'
import miniLogo from '../assets/images/mini-logo-lapakoo.png'

interface MobileHeaderProps {
  userEmail: string
  hasNotifications?: boolean
  onProfileClick: () => void
  onNotificationsClick: () => void
}

export function MobileHeader({
  userEmail,
  hasNotifications = false,
  onProfileClick,
  onNotificationsClick,
}: MobileHeaderProps) {
  const { tenant } = useTenant()
  const primaryColor = tenant?.primaryColor ?? '#6366f1'

  return (
    <div
      className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <img
              src={miniLogo}
              alt="LapaKoo"
              className="w-10 h-10 object-contain drop-shadow-sm"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          <p className="text-[13px] font-semibold text-gray-800 truncate">
            {tenant?.storeName ?? 'Toko Saya'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-100 transition-colors"
            aria-label="Notifikasi"
          >
            <Bell className="w-[18px] h-[18px]" />
            {hasNotifications && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-white"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={onProfileClick}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
            style={{ backgroundColor: primaryColor }}
            aria-label="Profil"
          >
            {((userEmail ?? '').charAt(0) || 'U').toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}
