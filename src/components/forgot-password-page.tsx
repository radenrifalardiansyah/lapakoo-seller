import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Mail, ArrowLeft, CheckCircle2, Store } from "lucide-react";
import logoLapakoo from "../assets/images/logo-lapakoo.png";
import { useTenant } from "../contexts/TenantContext";

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const { tenant } = useTenant();
  const primaryColor = tenant?.primaryColor ?? '#6366f1';
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simple validation
    if (!email) {
      setError("Email harus diisi");
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true);
      setIsLoading(false);
    }, 1500);
  };

  const sharedLayout = (card: React.ReactNode) => (
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
          {card}
          <p className="text-center text-xs text-white/40 mt-4">
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

  if (isSuccess) {
    return sharedLayout(
      <Card className="border shadow-sm">
        <CardHeader className="text-center pt-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <CardTitle>Email Terkirim!</CardTitle>
          <CardDescription>
            Kami telah mengirimkan link reset password ke email Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 text-center font-medium">{email}</p>
            <p className="text-xs text-blue-700 text-center mt-1">
              Silakan cek inbox atau folder spam Anda
            </p>
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>Instruksi selanjutnya:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Buka email dari kami</li>
              <li>Klik link reset password</li>
              <li>Buat password baru Anda</li>
            </ul>
          </div>
          <Button onClick={onBackToLogin} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Login
          </Button>
          <div className="text-center">
            <button
              onClick={() => { setIsSuccess(false); setEmail(""); }}
              className="text-sm text-primary hover:underline"
            >
              Tidak menerima email? Kirim ulang
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return sharedLayout(
    <Card className="border shadow-sm">
      <CardHeader className="pb-4 pt-6 text-center">
        <CardTitle className="text-lg">Lupa Password?</CardTitle>
        <CardDescription>
          Masukkan email Anda dan kami akan mengirimkan link untuk reset password
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
                placeholder="seller@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Mengirim..." : "Kirim Link Reset Password"}
          </Button>
          <Button type="button" onClick={onBackToLogin} variant="ghost" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Login
          </Button>
        </form>
        <div className="mt-5 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Catatan:</strong> Link reset password akan kedaluwarsa dalam 1 jam.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
