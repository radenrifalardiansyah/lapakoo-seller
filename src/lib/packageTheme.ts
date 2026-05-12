import { Sparkles, Zap, Crown, type LucideIcon } from 'lucide-react'

export interface PackageTheme {
  label: string
  icon: LucideIcon
  /** Tailwind classes for the package chip (background + text + border) */
  chipClass: string
  /** Tailwind gradient class for ribbons / accents — e.g. "from-emerald-400 to-teal-500" */
  gradient: string
  /** Subtle background tint for cards — e.g. "bg-emerald-50/50" */
  tint: string
  /** Border accent class — e.g. "border-emerald-200" */
  border: string
  /** Hex accent color (for inline styles) */
  accent: string
}

const THEMES: Record<string, PackageTheme> = {
  starter: {
    label: 'Starter',
    icon: Sparkles,
    chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gradient: 'from-emerald-400 to-teal-500',
    tint: 'bg-emerald-50/50',
    border: 'border-emerald-200',
    accent: '#10b981',
  },
  pro: {
    label: 'Pro',
    icon: Zap,
    chipClass: 'bg-sky-50 text-sky-700 border-sky-200',
    gradient: 'from-sky-500 to-indigo-600',
    tint: 'bg-sky-50/50',
    border: 'border-sky-200',
    accent: '#0ea5e9',
  },
  business: {
    label: 'Business',
    icon: Crown,
    chipClass: 'bg-gradient-to-r from-violet-50 to-amber-50 text-violet-700 border-violet-200',
    gradient: 'from-violet-500 via-fuchsia-500 to-amber-400',
    tint: 'bg-violet-50/50',
    border: 'border-violet-200',
    accent: '#8b5cf6',
  },
}

export function getPackageTheme(packageId?: string): PackageTheme {
  return THEMES[packageId ?? ''] ?? THEMES.starter
}
