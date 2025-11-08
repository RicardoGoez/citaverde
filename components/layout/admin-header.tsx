"use client";

import { useState, useEffect } from "react";
import { LogOut, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSede } from "@/lib/hooks/use-sede";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminHeader() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const { sedeSeleccionada, sedes, setSedeSeleccionada, loading: sedeLoading } = useSede();

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
    <div className="flex items-center justify-between gap-4 flex-1 px-4 h-16 border-b border-[#E5E7EB] bg-white">
      {/* Selector de Sede */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-[#6B7280]" />
        {!sedeLoading && sedeSeleccionada && sedes.length > 0 && (
          <Select
            value={sedeSeleccionada.id}
            onValueChange={(value) => {
              const sede = sedes.find(s => s.id === value);
              if (sede) {
                setSedeSeleccionada(sede);
              }
            }}
          >
            <SelectTrigger className="w-[200px] h-9 border-[#D1D5DB]">
              <SelectValue>
                <span className="font-medium text-[#111827]">{sedeSeleccionada.name}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sedes.map((sede) => (
                <SelectItem key={sede.id} value={sede.id}>
                  {sede.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-4">
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
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center text-white font-semibold shadow-md">
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden lg:block text-sm font-medium text-gray-900">{userInfo.name}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-64">
            <div className="space-y-4">
              {/* Información del usuario */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center text-white font-semibold shadow-md">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#111827]">{userInfo.name}</p>
                  <p className="text-sm text-[#6B7280]">{userInfo.email}</p>
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
    </div>
  );
}
