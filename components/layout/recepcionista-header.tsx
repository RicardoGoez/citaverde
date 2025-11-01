"use client";

import { useState, useEffect } from "react";
import { Bell, Search, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function RecepcionistaHeader() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      setUserInfo(JSON.parse(userStr));
    }

    // Actualizar hora inicial
    setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));

    // Actualizar hora cada minuto
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar citas, turnos, pacientes..."
            className="pl-10 font-sans"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            5
          </Badge>
        </Button>
        <Badge variant="success">Sistema Activo</Badge>

        {/* Hora */}
        {currentTime && (
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{currentTime}</span>
          </div>
        )}

        {/* Perfil */}
        {userInfo && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] rounded-lg transition-colors">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-900">{userInfo.name}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-64">
              <div className="space-y-4">
                {/* Información del usuario */}
                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827]">{userInfo.name}</p>
                    <p className="text-sm text-[#6B7280]">{userInfo.email}</p>
                    {userInfo.phone && (
                      <p className="text-xs text-[#6B7280]">{userInfo.phone}</p>
                    )}
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Recepcionista
                    </Badge>
                  </div>
                </div>
                
                {/* Botón de cerrar sesión */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2]"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </header>
  );
}
