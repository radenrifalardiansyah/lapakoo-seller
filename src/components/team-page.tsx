import { useState } from 'react'
import {
  Users, UserPlus, Pencil, Trash2, ShieldCheck, User, Crown,
  Mail, Eye, EyeOff, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react'
import { useTenant } from '../contexts/TenantContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'owner' | 'admin' | 'staff'
type UserStatus = 'active' | 'inactive'

interface TeamUser {
  id: number
  name: string
  email: string
  role: Role
  status: UserStatus
  lastLogin: string | null
  createdAt: string
}

// ─── Mock initial data (per tenant) ──────────────────────────────────────────

const MOCK_USERS: TeamUser[] = [
  {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi@tokobudi.seller.id',
    role: 'owner',
    status: 'active',
    lastLogin: '2026-05-12 08:30',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    name: 'Siti Rahayu',
    email: 'siti@tokobudi.seller.id',
    role: 'admin',
    status: 'active',
    lastLogin: '2026-05-11 14:22',
    createdAt: '2024-03-10',
  },
  {
    id: 3,
    name: 'Doni Prasetyo',
    email: 'doni@tokobudi.seller.id',
    role: 'staff',
    status: 'active',
    lastLogin: '2026-05-10 09:05',
    createdAt: '2024-06-01',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Pemilik',
  admin: 'Admin',
  staff: 'Staf',
}

const ROLE_COLORS: Record<Role, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-600',
}

const ROLE_ICONS: Record<Role, typeof Crown> = {
  owner: Crown,
  admin: ShieldCheck,
  staff: User,
}

function formatDate(val: string | null) {
  if (!val) return '—'
  return val.replace('T', ' ').slice(0, 16)
}

let nextId = 100

// ─── Dialog: Add / Edit User ──────────────────────────────────────────────────

interface UserDialogProps {
  user: TeamUser | null
  onSave: (data: Omit<TeamUser, 'id' | 'lastLogin' | 'createdAt'> & { password?: string }) => void
  onClose: () => void
  primaryColor: string
}

function UserDialog({ user, onSave, onClose, primaryColor }: UserDialogProps) {
  const isEdit = !!user
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>(user?.role ?? 'staff')
  const [status, setStatus] = useState<UserStatus>(user?.status ?? 'active')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Nama wajib diisi'
    if (!email.trim()) errs.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format email tidak valid'
    if (!isEdit && !password) errs.password = 'Password wajib diisi'
    else if (!isEdit && password.length < 8) errs.password = 'Minimal 8 karakter'
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ name: name.trim(), email: email.trim(), role, status, password: password || undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit User' : 'Tambah User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: '' })) }}
              placeholder="contoh: Siti Rahayu"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: '' })) }}
                placeholder="email@toko.com"
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2"
                disabled={isEdit}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            {isEdit && <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>}
          </div>

          {/* Password (add only) */}
          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: '' })) }}
                  placeholder="Minimal 8 karakter"
                  className="w-full border rounded-lg px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['admin', 'staff'] as Role[]).map(r => {
                const Icon = ROLE_ICONS[r]
                const isSelected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      isSelected ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    style={isSelected ? { backgroundColor: primaryColor } : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    {ROLE_LABELS[r]}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {role === 'admin' ? 'Admin dapat mengelola produk, pesanan, dan pelanggan.' : 'Staf hanya dapat melihat dan memproses pesanan.'}
            </p>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['active', 'inactive'] as UserStatus[]).map(s => {
                  const isSelected = status === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        isSelected
                          ? s === 'active'
                            ? 'bg-green-500 border-transparent text-white'
                            : 'bg-gray-400 border-transparent text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {s === 'active' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {s === 'active' ? 'Aktif' : 'Nonaktif'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
          <Button
            className="flex-1 text-white"
            style={{ backgroundColor: primaryColor }}
            onClick={handleSubmit}
          >
            {isEdit ? 'Simpan Perubahan' : 'Tambah User'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({ user, onConfirm, onClose }: {
  user: TeamUser
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Hapus User</p>
            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>
        <p className="text-sm text-gray-700">
          Apakah Anda yakin ingin menghapus <strong>{user.name}</strong>? User ini tidak akan bisa mengakses dashboard lagi.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={onConfirm}>
            Ya, Hapus
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TeamPage() {
  const { tenant } = useTenant()
  const [users, setUsers] = useState<TeamUser[]>(MOCK_USERS)
  const [dialogTarget, setDialogTarget] = useState<TeamUser | null | 'new'>(null)
  const [deleteTarget, setDeleteTarget] = useState<TeamUser | null>(null)

  const primaryColor = tenant?.primaryColor ?? '#6366f1'
  const maxUsers = tenant?.package.maxUsers ?? 1
  const isUnlimited = maxUsers === -1
  const atLimit = !isUnlimited && users.length >= maxUsers

  const openAdd = () => setDialogTarget('new')
  const openEdit = (u: TeamUser) => setDialogTarget(u)
  const closeDialog = () => setDialogTarget(null)

  const handleSave = (data: Omit<TeamUser, 'id' | 'lastLogin' | 'createdAt'> & { password?: string }) => {
    if (dialogTarget === 'new') {
      setUsers(v => [...v, {
        id: ++nextId,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        lastLogin: null,
        createdAt: new Date().toISOString().slice(0, 10),
      }])
    } else if (dialogTarget) {
      setUsers(v => v.map(u =>
        u.id === (dialogTarget as TeamUser).id
          ? { ...u, name: data.name, role: data.role, status: data.status }
          : u
      ))
    }
    closeDialog()
  }

  const handleDelete = (u: TeamUser) => {
    setUsers(v => v.filter(x => x.id !== u.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Tim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola akun karyawan yang dapat mengakses dashboard toko Anda
          </p>
        </div>
        <Button
          onClick={openAdd}
          disabled={atLimit}
          className="text-white flex items-center gap-2 shrink-0"
          style={!atLimit ? { backgroundColor: primaryColor } : undefined}
          title={atLimit ? `Batas maksimal ${maxUsers} user untuk paket ${tenant?.package.name}` : undefined}
        >
          <UserPlus className="w-4 h-4" />
          Tambah User
        </Button>
      </div>

      {/* Limit info card */}
      <div
        className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}20` }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {users.length} / {isUnlimited ? '∞' : maxUsers} User
            </p>
            <p className="text-xs text-gray-500">
              Paket <strong>{tenant?.package.name}</strong> —{' '}
              {isUnlimited ? 'Unlimited user' : `Maksimal ${maxUsers} user`}
            </p>
          </div>
        </div>

        {/* Progress bar (only for limited packages) */}
        {!isUnlimited && (
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-[11px] text-gray-500 mb-1">
              <span>Terpakai</span>
              <span>{Math.round((users.length / maxUsers) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (users.length / maxUsers) * 100)}%`,
                  backgroundColor: atLimit ? '#ef4444' : primaryColor,
                }}
              />
            </div>
          </div>
        )}

        {atLimit && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Batas user tercapai. Upgrade paket untuk menambah lebih banyak user.
          </div>
        )}
      </div>

      {/* User Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: primaryColor }} />
            Daftar User
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/70 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Nama</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Login Terakhir</th>
                  <th className="text-left px-4 py-3">Bergabung</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => {
                  const RoleIcon = ROLE_ICONS[u.role]
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {(u.name ?? '').charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                          <RoleIcon className="w-3 h-3" />
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className={u.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                          {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-xs">{formatDate(u.lastLogin)}</td>
                      <td className="px-4 py-4 text-gray-400 text-xs">{u.createdAt}</td>
                      <td className="px-4 py-4">
                        {u.role !== 'owner' && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {users.map(u => {
              const RoleIcon = ROLE_ICONS[u.role]
              return (
                <div key={u.id} className="px-4 py-4 flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {(u.name ?? '').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_COLORS[u.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[u.role]}
                      </span>
                      <Badge variant="secondary" className={`text-[10px] ${u.status === 'active' ? 'bg-green-100 text-green-700' : ''}`}>
                        {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Login terakhir: {formatDate(u.lastLogin)}</p>
                  </div>
                  {u.role !== 'owner' && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="p-2 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">Keterangan Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { role: 'owner' as Role, desc: 'Akses penuh ke semua fitur. Tidak dapat dihapus atau diubah rolenya.' },
              { role: 'admin' as Role, desc: 'Dapat mengelola produk, pesanan, pelanggan, pemasaran, dan keuangan.' },
              { role: 'staff' as Role, desc: 'Hanya dapat melihat dashboard, memproses pesanan, dan update stok.' },
            ]).map(({ role, desc }) => {
              const Icon = ROLE_ICONS[role]
              return (
                <div key={role} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${ROLE_COLORS[role]}`}>
                    <Icon className="w-3 h-3" />
                    {ROLE_LABELS[role]}
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {dialogTarget !== null && (
        <UserDialog
          user={dialogTarget === 'new' ? null : (dialogTarget as TeamUser)}
          onSave={handleSave}
          onClose={closeDialog}
          primaryColor={primaryColor}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          user={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
