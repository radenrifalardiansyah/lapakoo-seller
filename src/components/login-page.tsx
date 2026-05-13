import { useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Store, Eye, EyeOff, Lock, Mail, Crown, ShieldCheck, User as UserIcon } from "lucide-react";
import { useTenant } from "../contexts/TenantContext";
import { useAuth } from "../contexts/AuthContext";

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

  const storeName = tenant?.storeName ?? "Seller Panel";
  const primaryColor = tenant?.primaryColor ?? '#6366f1';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{storeName}</h1>
          <p className="text-sm text-muted-foreground">Masuk ke dashboard penjual Anda</p>
          {tenant && (
            <span
              className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Paket {tenant.package.name}
            </span>
          )}
        </div>

        {/* Login Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Selamat Datang Kembali</CardTitle>
            <CardDescription>
              Masukkan kredensial Anda untuk mengakses dashboard
            </CardDescription>
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

            <div className="mt-5 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-600">Demo Credentials</p>
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
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
        </p>
      </div>
    </div>
  );
}
