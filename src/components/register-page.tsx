import { useState } from "react";
import { apiRegister } from "../lib/auth-api";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff, Lock, Mail, User, Building2, Phone, MapPin } from "lucide-react";
import logoLapakoo from "../assets/images/logo-lapakoo.png";

interface RegisterPageProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (email: string) => void;
}

export function RegisterPage({ onBackToLogin, onRegisterSuccess }: RegisterPageProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    storeName: "",
    storeAddress: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!formData.fullName || !formData.email || !formData.phone || 
        !formData.storeName || !formData.storeAddress || 
        !formData.password || !formData.confirmPassword) {
      setError("Semua field harus diisi");
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format email tidak valid");
      setIsLoading(false);
      return;
    }

    // Phone validation
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Format nomor telepon tidak valid");
      setIsLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Anda harus menyetujui syarat dan ketentuan");
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRegister({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        store_name: formData.storeName,
        store_address: formData.storeAddress,
      });

      if (!res.ok && 'error' in res) {
        setError(res.error);
        setIsLoading(false);
        return;
      }

      // Simpan session dari response registrasi
      const TOKEN_KEY = 'auth.token';
      const EXPIRES_KEY = 'auth.expiresAt';
      localStorage.setItem(TOKEN_KEY, res.session.token);
      localStorage.setItem(EXPIRES_KEY, String(res.session.expiresAt));

      onRegisterSuccess(formData.email);
    } catch {
      setError("Gagal mendaftar. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-2xl my-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img src={logoLapakoo} alt="LapaKoo" className="h-16 mx-auto object-contain" />
          </div>
          <p className="text-muted-foreground">
            Daftar sebagai penjual dan mulai berjualan
          </p>
        </div>

        {/* Register Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Buat Akun Penjual</CardTitle>
            <CardDescription>
              Lengkapi form di bawah untuk mendaftar sebagai penjual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Informasi Pribadi</h3>
                
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Ahmad Rizki"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email and Phone in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seller@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="081234567890"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground">Informasi Toko</h3>
                
                {/* Store Name */}
                <div className="space-y-2">
                  <Label htmlFor="storeName">Nama Toko</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="storeName"
                      name="storeName"
                      type="text"
                      placeholder="Toko Ahmad Electronics"
                      value={formData.storeName}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Store Address */}
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Alamat Toko</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="storeAddress"
                      name="storeAddress"
                      type="text"
                      placeholder="Jl. Sudirman No. 123, Jakarta"
                      value={formData.storeAddress}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground">Keamanan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Password minimal 8 karakter
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2 pt-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  Saya menyetujui{" "}
                  <a href="#" className="text-primary hover:underline">
                    syarat dan ketentuan
                  </a>{" "}
                  serta{" "}
                  <a href="#" className="text-primary hover:underline">
                    kebijakan privasi
                  </a>{" "}
                  yang berlaku
                </label>
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Mendaftar..." : "Daftar Sekarang"}
              </Button>

              {/* Back to Login */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Sudah punya akun? </span>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Masuk di sini
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Dengan mendaftar, Anda akan dapat mengelola produk, pesanan, dan analitik penjualan Anda
        </p>
      </div>
    </div>
  );
}
