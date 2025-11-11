"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, ArrowLeft, Phone } from "lucide-react";
import { register } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToasts } from "@/lib/hooks/use-toast";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { success, error: errorToast } = useToasts();

  // Validar número de teléfono colombiano (formato: 322 1235821)
  const validatePhoneColombia = (phone: string): boolean => {
    // Formato: 3XX XXXXXXX (10 dígitos, sin +57)
    // Acepta: 322 1235821, 3221235821, 300 1234567
    const phoneRegex = /^3\d{2}(\s?\d{7}|\d{7})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar longitud mínima de contraseña
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // Validar teléfono
    if (formData.phone && !validatePhoneColombia(formData.phone)) {
      setError("Ingresa un número de celular válido de Colombia (ej: 322 1235821)");
      return;
    }

    setIsLoading(true);

    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });

      if (user) {
        // Supabase Auth envía automáticamente el email de verificación
        // No necesitamos enviar email manualmente
        
        success(
          "Registro exitoso", 
          "Cuenta creada correctamente. Hemos enviado un email de verificación a tu correo. Por favor, verifica tu cuenta antes de iniciar sesión."
        );
        // Esperar un poco antes de redirigir para que se vea el toast
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError("Error al crear la cuenta. El correo ya puede estar en uso.");
        errorToast("Error", "No se pudo crear la cuenta");
      }
    } catch (err) {
      setError("Error al registrar. Por favor, intenta de nuevo.");
      errorToast("Error", "No se pudo registrar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dcfce7] via-white to-[#bbf7d0] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#16a34a] mb-2">CitaVerde</h1>
          <p className="text-[#64748b]">Sistema de Gestión de Citas y Turnos</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>Completa el formulario para registrarte</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-[#334155]">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-12 border-[#e2e8f0] focus:border-[#16a34a] focus:ring-[#16a34a]"
                    required
                  />
                </div>
              </div>

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
                    className="pl-10 h-12 border-[#e2e8f0] focus:border-[#16a34a] focus:ring-[#16a34a]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-[#334155]">
                  Teléfono Celular (Colombia)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="322 1235821"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 h-12 border-[#e2e8f0] focus:border-[#16a34a] focus:ring-[#16a34a]"
                  />
                </div>
                <p className="text-xs text-[#64748b]">Opcional: Formato 322 1235821 (10 dígitos)</p>
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
                    className="pl-10 pr-10 h-12 border-[#e2e8f0] focus:border-[#16a34a] focus:ring-[#16a34a]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-[#334155]">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10 h-12 border-[#e2e8f0] focus:border-[#16a34a] focus:ring-[#16a34a]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-medium shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#64748b]">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="text-[#16a34a] hover:text-[#15803d] font-medium flex items-center justify-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Iniciar Sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
