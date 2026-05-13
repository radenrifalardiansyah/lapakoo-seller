import { useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff, Lock, Mail, Crown, ShieldCheck, User as UserIcon, ChevronDown, Store } from "lucide-react";
import { useTenant } from "../contexts/TenantContext";
import { useAuth } from "../contexts/AuthContext";
import logoLapakoo from "../assets/images/logo-lapakoo.png";

interface LoginPageProps {
  onForgotPassword: () => void;
}

interface DemoAccount {
  email: string;
  password: string;
  label: string;
  icon: typeof Crown;
  hint: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'budi@tokobudi.seller.id',
    password: 'demo123',
    label: 'Pemilik',
    icon: Crown,
    hint: 'akses penuh',
  },
  {
    email: 'siti@tokobudi.seller.id',
    password: 'demo123',
    label: 'Admin',
    icon: ShieldCheck,
    hint: 'tanpa Tim & Pengaturan edit',
  },
  {
    email: 'doni@tokobudi.seller.id',
    password: 'demo123',
    label: 'Staf',
    icon: UserIcon,
    hint: 'operasional pesanan',
  },
];

export function LoginPage({ onForgotPassword }: LoginPageProps) {
  const { tenant } = useTenant();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email dan password harus diisi");
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (!res.ok && 'error' in res) {
      setError(res.error);
    }
  };

  const fillCredentials = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  };

  const primaryColor = tenant?.primaryColor ?? '#6366f1';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 55%, #4c1d95 100%)' }}>

      {/* Orbs dekoratif */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(196,165,255,0.18) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)' }} />

      <div className="w-full max-w-3xl relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">

          {/* Kiri — logo */}
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="relative flex items-center gap-5">
              {/* Glow putih lebar — blend bg putih logo ke background */}
              <div className="absolute pointer-events-none"
                style={{
                  inset: '-120px',
                  background: 'radial-gradient(ellipse, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 38%, rgba(255,255,255,0.82) 55%, rgba(255,255,255,0.3) 72%, transparent 88%)',
                  filter: 'blur(18px)',
                }} />
              <img
                src={logoLapakoo}
                alt="LapaKoo"
                className="relative z-10 object-contain"
                style={{ width: tenant ? '130px' : '230px', imageRendering: 'crisp-edges' }}
              />
              {tenant && (
                <>
                  <div className="relative z-10 w-px h-14" style={{ backgroundColor: primaryColor, opacity: 0.35 }} />
                  <div className="relative z-10 flex flex-col items-center gap-1.5">
                    {tenant.logoUrl ? (
                      <img
                        src={tenant.logoUrl}
                        alt={tenant.storeName}
                        className="h-12 w-12 rounded-xl object-contain"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}22`, border: `1.5px solid ${primaryColor}55` }}
                      >
                        <Store className="h-6 w-6" style={{ color: primaryColor }} />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-center max-w-[90px] truncate" style={{ color: primaryColor }}>
                      {tenant.storeName}
                    </span>
                  </div>
                </>
              )}
            </div>
            <p className="text-white/35 text-[11px] tracking-[0.2em] uppercase">Belanja Seru, Lapak Ceria</p>
          </div>

          {/* Kanan — form */}
          <div className="w-full md:flex-1 md:max-w-md">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4 pt-6 text-center">
                <CardTitle className="text-lg">Selamat Datang Kembali</CardTitle>
                <CardDescription>
                  Masukkan kredensial Anda untuk mengakses dashboard
                </CardDescription>
                {tenant && (
                  <div className="mt-1">
                    <span
                      className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Paket {tenant.package.name}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@toko.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded" />
                      <span className="text-muted-foreground">Ingat saya</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline"
                      style={{ color: primaryColor }}
                      onClick={onForgotPassword}
                    >
                      Lupa password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-white"
                    style={{ backgroundColor: primaryColor }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Memproses..." : "Masuk"}
                  </Button>
                </form>

                <div className="mt-5 rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowDemo(!showDemo)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <span className="text-xs font-semibold text-slate-600">Demo Credentials</span>
                    <ChevronDown
                      className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
                      style={{ transform: showDemo ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                  {showDemo && (
                    <div className="p-3 space-y-2 bg-slate-50">
                      <p className="text-[11px] text-slate-500">Klik salah satu untuk auto-fill, password sama: <span className="font-mono">demo123</span></p>
                      <div className="space-y-1.5">
                        {DEMO_ACCOUNTS.map((acc) => {
                          const Icon = acc.icon;
                          return (
                            <button
                              key={acc.email}
                              type="button"
                              onClick={() => fillCredentials(acc)}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 active:bg-slate-50 transition-colors text-left"
                              disabled={isLoading}
                            >
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-slate-700 leading-tight">
                                  {acc.label} <span className="text-slate-400 font-normal">— {acc.hint}</span>
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono truncate">{acc.email}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-white/40 mt-6">
              &copy; {new Date().getFullYear()} LapaKoo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
