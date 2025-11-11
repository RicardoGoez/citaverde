"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, Ticket, MessageSquare, Clock, User, LogOut } from "lucide-react";
import { SedeProvider } from "@/lib/hooks/use-sede";
import RecepcionistaHeaderSede from "@/components/layout/recepcionista-header-sede";

export default function RecepcionistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    
    if (!userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      if (user.role !== "recepcionista" && user.role !== "admin") {
        router.push("/login");
        return;
      }
      
      setUserName(user.name || user.email || "Recepción");
      setUserEmail(user.email || "");
    } catch (error) {
      router.push("/login");
      return;
    }

    // Actualizar hora inicial
    setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    
    // Actualizar hora cada minuto
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);

    setIsLoading(false);

    return () => clearInterval(interval);
  }, [router, pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A] mx-auto"></div>
          <p className="mt-4 text-[#6B7280]">Cargando...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/recepcionista", label: "Dashboard", icon: Home },
    { path: "/recepcionista/citas", label: "Citas", icon: Calendar },
    { path: "/recepcionista/turnos", label: "Turnos", icon: Ticket },
    { path: "/recepcionista/mensajes", label: "Mensajes", icon: MessageSquare },
  ];

  return (
    <SedeProvider>
      <div className="flex flex-col h-screen bg-[#F5F5F5]">
        {/* Header superior - Oculto en móvil */}
        <header className="hidden md:block bg-white border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y sede */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <img 
                  src="/icon-512.png" 
                  alt="CitaVerde" 
                  className="h-8 w-8 rounded-lg"
                />
              <h1 className="text-xl font-bold text-[#111827]">CitaVerde</h1>
              </div>
              <RecepcionistaHeaderSede />
            </div>

          {/* Hora y usuario */}
          <div className="flex items-center gap-6">
            {currentTime && (
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Clock className="h-4 w-4" />
                <span>{currentTime}</span>
              </div>
            )}
            
            {/* Perfil */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#111827]">{userName}</p>
                  <p className="text-xs text-[#6B7280]">Recepción</p>
                </div>
              </button>

              {/* Menú desplegable */}
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
            </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navegación por pestañas - Oculto en móvil */}
      <nav className="hidden md:block bg-white border-b border-[#E5E7EB] px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap
                  ${isActive 
                    ? 'text-[#2563EB] border-b-2 border-[#2563EB] bg-[#F0F9FF]' 
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto md:pb-0 pb-16">{children}</main>

      {/* Barra inferior fija para móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-4 py-2 safe-area-inset-bottom z-50">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all
                  ${isActive 
                    ? 'text-[#2563EB] bg-[#F0F9FF]' 
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
                  }
                `}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      </div>
    </SedeProvider>
  );
}
