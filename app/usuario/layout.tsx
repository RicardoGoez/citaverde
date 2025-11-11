"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, User, Clock, LogOut } from "lucide-react";

export default function UsuarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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
      
      if (user.role !== "usuario" && user.role !== "admin") {
        router.push("/login");
        return;
      }
      
      setUserName(user.name || user.email || "Usuario");
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
  }, [router]);

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

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F5]">
      {/* Header con perfil */}
      <header className="bg-white border-b border-[#E5E7EB] px-4 py-3 md:px-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/usuario" className="flex items-center gap-2">
              <img 
                src="/icon-512.png" 
                alt="CitaVerde" 
                className="h-8 w-8 rounded-lg"
              />
              <h1 className="text-xl font-bold text-[#111827] hidden sm:block">CitaVerde</h1>
            </Link>
          </div>
          
          {/* Hora y Perfil */}
          <div className="flex items-center gap-4">
            {/* Hora */}
            {currentTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
                <span className="font-medium">{currentTime}</span>
            </div>
            )}

            {/* Perfil y menú */}
            <div className="relative">
              {/* Avatar */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block text-sm font-medium text-[#111827]">{userName}</span>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
