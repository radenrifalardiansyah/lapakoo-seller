import { useState, useEffect, useCallback } from 'react'
import { notificationsApi, type ApiNotification } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Skeleton } from './ui/skeleton'
import {
  Bell, ShoppingCart, CreditCard, Package, Handshake,
  Megaphone, Settings, Info, CheckCheck, RefreshCw,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUnread(n: ApiNotification) {
  return n.status === 'unread' || n.is_read === false || n.read === false
}

function typeConfig(type?: string): { icon: React.ElementType; dot: string; label: string } {
  switch (type) {
    case 'order':     return { icon: ShoppingCart, dot: 'bg-blue-500',   label: 'Pesanan' }
    case 'payment':   return { icon: CreditCard,   dot: 'bg-green-500',  label: 'Pembayaran' }
    case 'stock':
    case 'inventory': return { icon: Package,      dot: 'bg-amber-500',  label: 'Stok' }
    case 'reseller':  return { icon: Handshake,    dot: 'bg-purple-500', label: 'Reseller' }
    case 'marketing': return { icon: Megaphone,    dot: 'bg-pink-500',   label: 'Pemasaran' }
    case 'system':    return { icon: Settings,     dot: 'bg-gray-500',   label: 'Sistem' }
    default:          return { icon: Info,          dot: 'bg-indigo-500', label: 'Info' }
  }
}

function formatTime(ts?: string) {
  if (!ts) return ''
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60)      return 'Baru saja'
  if (diff < 3600)    return `${Math.floor(diff / 60)} menit yang lalu`
  if (diff < 86400)   return `${Math.floor(diff / 3600)} jam yang lalu`
  if (diff < 604800)  return `${Math.floor(diff / 86400)} hari yang lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

// ─── Single notification item ─────────────────────────────────────────────────

function NotifItem({
  n,
  onMarkRead,
}: {
  n: ApiNotification
  onMarkRead: (id: number | string) => void
}) {
  const unread = isUnread(n)
  const cfg    = typeConfig(n.type)
  const Icon   = cfg.icon
  const body   = n.body ?? n.message ?? ''

  return (
    <div
      className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
        unread ? 'bg-blue-50/50 border-blue-100' : 'bg-white'
      }`}
    >
      {/* icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        unread ? 'bg-blue-100' : 'bg-muted'
      }`}>
        <Icon className={`w-4 h-4 ${unread ? 'text-blue-600' : 'text-muted-foreground'}`} />
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${unread ? 'font-medium' : 'text-muted-foreground'}`}>
          {n.title}
        </p>
        {body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{body}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">{formatTime(n.created_at)}</p>
      </div>

      {/* right side */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Badge variant={unread ? 'default' : 'secondary'} className="text-[10px]">
          {cfg.label}
        </Badge>
        {unread && (
          <button
            onClick={() => onMarkRead(n.id)}
            className="text-[10px] text-blue-600 hover:underline whitespace-nowrap"
          >
            Tandai dibaca
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface NotificationsPageProps {
  onUnreadCountChange?: (count: number) => void
}

export function NotificationsPage({ onUnreadCountChange }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [markingAll, setMarkingAll]       = useState(false)
  const [tab, setTab]                     = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await notificationsApi.list()
      setNotifications(data)
      onUnreadCountChange?.(data.filter(isUnread).length)
    } catch {
      setError('Gagal memuat notifikasi')
    } finally {
      setLoading(false)
    }
  }, [onUnreadCountChange])

  useEffect(() => { load() }, [load])

  const handleMarkRead = (id: number | string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, status: 'read' as const, is_read: true, read: true } : n)
    )
    notificationsApi.markRead(id).catch(() => load())
    onUnreadCountChange?.(notifications.filter(n => n.id !== id && isUnread(n)).length)
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead()
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const, is_read: true, read: true }))
      )
      onUnreadCountChange?.(0)
    } catch {
      load()
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount  = notifications.filter(isUnread).length
  const displayed    = tab === 'unread' ? notifications.filter(isUnread) : notifications

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-7 h-7" />Notifikasi
            {unreadCount > 0 && (
              <span className="ml-1 text-sm font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">Pantau semua notifikasi penting dari toko Anda</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
              <CheckCheck className="w-4 h-4 mr-1.5" />
              {markingAll ? 'Memproses...' : 'Tandai Semua Dibaca'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">
            Semua
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
              {notifications.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Belum Dibaca
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {(['all', 'unread'] as const).map(t => (
          <TabsContent key={t} value={t}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="w-4 h-4" />
                  {t === 'all' ? 'Semua Notifikasi' : 'Belum Dibaca'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-center py-10 text-muted-foreground space-y-3">
                    <Bell className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-sm">{error}</p>
                    <Button variant="outline" size="sm" onClick={load}>Coba Lagi</Button>
                  </div>
                ) : loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <NotifSkeleton key={i} />)}
                  </div>
                ) : displayed.length === 0 ? (
                  <div className="text-center py-14 text-muted-foreground">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      {t === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Tidak ada notifikasi'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayed.map(n => (
                      <NotifItem key={n.id} n={n} onMarkRead={handleMarkRead} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
