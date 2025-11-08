"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { login } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login({ email: formData.email, password: formData.password });
      
      if (result.error === 'EMAIL_NO_VERIFICADO') {
        setError("Tu email no ha sido verificado. Por favor, verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.");
        // Mostrar opción para reenviar email
        return;
      }

      if (result.user) {
        // Guardar usuario en sessionStorage
        sessionStorage.setItem("user", JSON.stringify(result.user));
        // Redirigir según el rol del usuario
        if (result.user.role === "recepcionista") {
          router.push("/recepcionista");
        } else if (result.user.role === "admin") {
          router.push("/admin");
        } else if (result.user.role === "usuario") {
          router.push("/usuario");
        } else {
          router.push("/");
        }
      } else {
        setError(result.error || "Credenciales inválidas. Por favor, intenta de nuevo.");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dcfce7] via-white to-[#bbf7d0] px-4 py-8 md:py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header con logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="/icon-512.png"
              alt="CitaVerde Logo"
              width={96}
              height={96}
              className="rounded-2xl shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#16a34a] mb-1">CitaVerde</h1>
            <p className="text-sm md:text-base text-[#64748b]">Sistema de Gestión de Citas</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl md:text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription className="text-sm">Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[#334155]">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-11 md:h-12 border-[#e2e8f0] focus:border-[#16a34a] focus:ring-[#16a34a] text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#334155]">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-11 md:h-12 border-[#e2e8f0] focus:border-[#16a34a] focus:ring-[#16a34a] text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#16a34a] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white h-11 md:h-12 text-base font-medium shadow-md disabled:opacity-50"
              >
                {isLoading ? "Iniciando sesión..." : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-xs md:text-sm text-[#64748b]">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-[#16a34a] hover:underline font-medium">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
