import { useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff, Lock, Mail, Store } from "lucide-react";
import { useTenant } from "../contexts/TenantContext";
import { useAuth } from "../contexts/AuthContext";
const logoLapakoo = "/logo-transparent.png";

interface LoginPageProps {
  onForgotPassword: () => void;
}


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


  const primaryColor = tenant?.primaryColor ?? '#6366f1';

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">

      {/* Kiri — logo (putih) */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-12 px-8 bg-white">
        <div className="flex items-center gap-5">
          <img
            src={logoLapakoo}
            alt="LapaKoo"
            className="object-contain"
            style={{ width: tenant ? '130px' : '230px', imageRendering: 'crisp-edges' }}
          />
          {tenant && (
            <>
              <div className="w-px h-14" style={{ backgroundColor: primaryColor, opacity: 0.35 }} />
              <div className="flex flex-col items-center gap-1.5">
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
        <p className="text-slate-400 text-[11px] tracking-[0.2em] uppercase">Belanja Seru, Lapak Ceria</p>
      </div>

      {/* Kanan — form (ungu) */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-8" style={{ backgroundColor: '#4c1d95' }}>
        <div className="w-full max-w-md">
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

            </CardContent>
          </Card>

          <p className="text-center text-xs text-white/40 mt-6">
            &copy; {new Date().getFullYear()} LapaKoo. All rights reserved.
            <br />
            by{" "}
            <a
              href="https://eleven-digital.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors underline underline-offset-2"
            >
              PT. Eleven Digital Indonesia
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
