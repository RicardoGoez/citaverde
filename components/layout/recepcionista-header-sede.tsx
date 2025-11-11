"use client";

import { Building2 } from "lucide-react";
import { useSede } from "@/lib/hooks/use-sede";
import { useState, useEffect } from "react";

export default function RecepcionistaHeaderSede() {
  const { sedeSeleccionada, loading } = useSede();
  const [userSedeName, setUserSedeName] = useState<string>("");

  // Obtener el nombre de la sede asignada al recepcionista
  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Si el usuario tiene sede_id, usaremos la sede del contexto
        // que debería inicializarse con la sede del usuario
        if (sedeSeleccionada) {
          setUserSedeName(sedeSeleccionada.name);
        }
      } catch (error) {
        console.error("Error obteniendo sede del usuario:", error);
      }
    }
  }, [sedeSeleccionada]);

  if (loading || !sedeSeleccionada) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
        <Building2 className="h-4 w-4" />
        <span>Cargando...</span>
      </div>
    );
  }

  // Solo mostrar la sede asignada, sin selector
  return (
    <div className="flex items-center gap-2 text-sm text-[#6B7280]">
      <Building2 className="h-4 w-4" />
      <span className="font-medium text-[#111827]">{sedeSeleccionada.name || userSedeName}</span>
    </div>
  );
}

