import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Mail,
  Store,
  Package as PackageIcon,
  Globe,
  ShieldCheck,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { Tenant } from '../types/tenant';

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  tenant: Tenant | null;
  onGoToSettings: () => void;
  onLogout: () => void;
}

const PACKAGE_BADGE: Record<string, { label: string; className: string }> = {
  starter:  { label: 'Starter',  className: 'bg-slate-100 text-slate-700 border-slate-200' },
  pro:      { label: 'Pro',      className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  business: { label: 'Business', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const STATUS_LABEL: Record<Tenant['status'], string> = {
  active:    'Aktif',
  inactive:  'Tidak Aktif',
  suspended: 'Ditangguhkan',
};

const STATUS_CLASS: Record<Tenant['status'], string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive:  'bg-slate-100 text-slate-700 border-slate-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

export function UserProfileDialog({
  open,
  onClose,
  userEmail,
  tenant,
  onGoToSettings,
  onLogout,
}: UserProfileDialogProps) {
  const primaryColor = tenant?.primaryColor ?? '#6366f1';
  const displayName = tenant?.ownerName || (userEmail ?? '').split('@')[0] || 'User';
  const pkg = tenant ? PACKAGE_BADGE[tenant.package.id] : undefined;
  const joinDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil Pengguna</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg leading-tight truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  <UserIcon className="w-3 h-3 mr-1" />
                  Pemilik Toko
                </Badge>
                {tenant && (
                  <Badge variant="outline" className={STATUS_CLASS[tenant.status]}>
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {STATUS_LABEL[tenant.status]}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Store info */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Nama Toko:</span>
              <span className="font-medium truncate">{tenant?.storeName ?? '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Subdomain:</span>
              <span className="font-medium truncate">
                {tenant?.subdomain && tenant.subdomain !== '__default__'
                  ? `${tenant.subdomain}.seller.id`
                  : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Email Toko:</span>
              <span className="font-medium truncate">{tenant?.email ?? '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Login Terakhir:</span>
              <span className="font-medium">{joinDate}</span>
            </div>
          </div>

          <Separator />

          {/* Package info */}
          {tenant && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PackageIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Paket Berlangganan</span>
                </div>
                {pkg && (
                  <Badge variant="outline" className={pkg.className}>
                    {pkg.label}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Max Produk</p>
                  <p className="font-semibold">
                    {tenant.package.maxProducts === -1 ? 'Unlimited' : tenant.package.maxProducts}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Pengguna</p>
                  <p className="font-semibold">
                    {tenant.package.maxUsers === -1 ? 'Unlimited' : tenant.package.maxUsers}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Pesanan</p>
                  <p className="font-semibold">
                    {tenant.package.maxOrders === -1 ? 'Unlimited' : tenant.package.maxOrders}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Gudang</p>
                  <p className="font-semibold">
                    {tenant.package.maxWarehouses === -1 ? 'Unlimited' : tenant.package.maxWarehouses}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Keluar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Tutup</Button>
            <Button
              onClick={() => {
                onClose();
                onGoToSettings();
              }}
            >
              <SettingsIcon className="w-4 h-4 mr-1.5" />
              Edit Profil
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
