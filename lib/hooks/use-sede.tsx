"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { getSedes } from "@/lib/actions/database";

interface Sede {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

interface SedeContextType {
  sedeSeleccionada: Sede | null;
  sedes: Sede[];
  setSedeSeleccionada: (sede: Sede | null) => void;
  loading: boolean;
}

const SedeContext = createContext<SedeContextType | undefined>(undefined);

export function SedeProvider({ children }: { children: ReactNode }) {
  const [sedeSeleccionada, setSedeSeleccionadaState] = useState<Sede | null>(null);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarSedeDelUsuario = useCallback(async () => {
    try {
      const sedesData = await getSedes();
      setSedes(sedesData);
      
      // Obtener información del usuario actual
      const userStr = sessionStorage.getItem("user");
      let usuario: any = null;
      if (userStr) {
        try {
          usuario = JSON.parse(userStr);
        } catch (e) {
          console.error("Error parseando usuario:", e);
        }
      }

      // Si es recepcionista y tiene sede_id asignada, usar esa sede (obligatoria)
      if (usuario && (usuario.role === 'recepcionista' || usuario.role === 'Recepcionista')) {
        if (usuario.sede_id) {
          const sedeUsuario = sedesData.find((s: Sede) => s.id === usuario.sede_id);
          if (sedeUsuario) {
            setSedeSeleccionadaState(sedeUsuario);
            // No guardar en localStorage para recepcionistas, siempre usar la del usuario
            setLoading(false);
            return;
          } else {
            console.error("La sede asignada al recepcionista no existe en el sistema");
            setLoading(false);
            return;
          }
        } else {
          console.warn("El recepcionista no tiene una sede asignada. Contacta al administrador.");
          setLoading(false);
          return;
        }
      }

      // Para admin o si el recepcionista no tiene sede asignada, usar lógica normal
      const sedeGuardada = localStorage.getItem("sedeSeleccionada");
      if (sedeGuardada && sedesData.length > 0) {
        try {
          const sede = JSON.parse(sedeGuardada);
          // Verificar que la sede aún existe en la lista
          const sedeEncontrada = sedesData.find((s: Sede) => s.id === sede.id);
          if (sedeEncontrada) {
            setSedeSeleccionadaState(sedeEncontrada);
          } else if (sedesData.length > 0) {
            // Si la sede guardada no existe, seleccionar la primera disponible
            setSedeSeleccionadaState(sedesData[0]);
            localStorage.setItem("sedeSeleccionada", JSON.stringify(sedesData[0]));
          }
        } catch (e) {
          // Si hay error parseando, usar la primera sede
          if (sedesData.length > 0) {
            setSedeSeleccionadaState(sedesData[0]);
            localStorage.setItem("sedeSeleccionada", JSON.stringify(sedesData[0]));
          }
        }
      } else if (sedesData.length > 0) {
        // Si no hay sede guardada, seleccionar la primera
        setSedeSeleccionadaState(sedesData[0]);
        localStorage.setItem("sedeSeleccionada", JSON.stringify(sedesData[0]));
      }
    } catch (error) {
      console.error("Error cargando sedes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarSedeDelUsuario();
  }, [cargarSedeDelUsuario]);

  // Escuchar cambios en la sede del usuario (cuando se actualiza desde Roles y Permisos)
  useEffect(() => {
    const handleUserSedeChanged = async () => {
      // Recargar la sede del usuario desde sessionStorage
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        try {
          const usuario = JSON.parse(userStr);
          // Si es recepcionista, recargar la sede
          if (usuario && (usuario.role === 'recepcionista' || usuario.role === 'Recepcionista')) {
            console.log("🔄 Recargando sede del recepcionista desde evento userSedeChanged");
            setLoading(true);
            
            // Recargar sedes y obtener la nueva sede del usuario
            const sedesData = await getSedes();
            setSedes(sedesData);
            
            // Obtener el usuario actualizado desde sessionStorage
            const nuevaUserStr = sessionStorage.getItem("user");
            if (nuevaUserStr) {
              const usuarioActualizado = JSON.parse(nuevaUserStr);
              const nuevaSede = sedesData.find((s: Sede) => s.id === usuarioActualizado.sede_id);
              
              if (nuevaSede) {
                console.log("✅ Sede actualizada (local):", nuevaSede.name);
                setSedeSeleccionadaState(nuevaSede);
                setLoading(false);
                
                // Disparar evento de cambio de sede para que las páginas se actualicen
                window.dispatchEvent(new CustomEvent('sedeChanged', { 
                  detail: nuevaSede 
                }));
              } else {
                console.error("❌ No se encontró la sede con ID:", usuarioActualizado.sede_id);
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          }
        } catch (e) {
          console.error("Error recargando sede del usuario:", e);
          setLoading(false);
        }
      }
    };

    // Escuchar evento local (misma pestaña)
    window.addEventListener('userSedeChanged', handleUserSedeChanged);
    
    // Escuchar cambios desde otras pestañas usando BroadcastChannel
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel('user-updates');
      broadcastChannel.onmessage = async (event) => {
        console.log("📨 Mensaje recibido en BroadcastChannel:", event.data);
        if (event.data.type === 'userUpdated') {
          const userStr = sessionStorage.getItem("user");
          if (userStr) {
            try {
              const usuarioLogueado = JSON.parse(userStr);
              console.log("👤 Usuario logueado:", usuarioLogueado.id, "Usuario actualizado:", event.data.userId);
              // Si el usuario actualizado es el que está logueado
              if (usuarioLogueado.id === event.data.userId) {
                console.log("🔄 ✅ Coincidencia! Actualizando recepcionista desde otra pestaña");
                // Actualizar sessionStorage con los nuevos datos
                const usuarioActualizadoCompleto = {
                  ...usuarioLogueado,
                  ...event.data.updates
                };
                console.log("💾 Actualizando sessionStorage con:", usuarioActualizadoCompleto);
                sessionStorage.setItem("user", JSON.stringify(usuarioActualizadoCompleto));
                
                // Recargar la sede desde sessionStorage actualizado
                if (usuarioActualizadoCompleto.role === 'recepcionista' || usuarioActualizadoCompleto.role === 'Recepcionista') {
                  console.log("📍 Nueva sede asignada:", usuarioActualizadoCompleto.sede_id);
                  setLoading(true);
                  
                  // Recargar sedes y actualizar la sede seleccionada
                  const sedesData = await getSedes();
                  setSedes(sedesData);
                  
                  const nuevaSede = sedesData.find((s: Sede) => s.id === usuarioActualizadoCompleto.sede_id);
                  if (nuevaSede) {
                    console.log("✅ Sede actualizada correctamente:", nuevaSede.name);
                    setSedeSeleccionadaState(nuevaSede);
                    setLoading(false);
                    
                    // Disparar evento de cambio de sede para que las páginas recarguen datos
                    window.dispatchEvent(new CustomEvent('sedeChanged', { 
                      detail: nuevaSede 
                    }));
                  } else {
                    console.error("❌ No se encontró la sede con ID:", usuarioActualizadoCompleto.sede_id);
                    setLoading(false);
                  }
                }
              } else {
                console.log("⏭️ El usuario actualizado no es el logueado, ignorando");
              }
            } catch (e) {
              console.error("❌ Error procesando actualización de usuario:", e);
              setLoading(false);
            }
          } else {
            console.log("⚠️ No hay usuario en sessionStorage");
          }
        }
      };
      console.log("✅ BroadcastChannel inicializado para escuchar actualizaciones de usuario");
    } catch (error) {
      console.error("❌ Error inicializando BroadcastChannel:", error);
    }
    
    return () => {
      window.removeEventListener('userSedeChanged', handleUserSedeChanged);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [cargarSedeDelUsuario]);

  const setSedeSeleccionada = (sede: Sede | null) => {
    // Verificar si el usuario actual es recepcionista
    const userStr = sessionStorage.getItem("user");
    let usuario: any = null;
    if (userStr) {
      try {
        usuario = JSON.parse(userStr);
      } catch (e) {
        console.error("Error parseando usuario:", e);
      }
    }

    // Si es recepcionista, no permitir cambiar la sede (debe usar la asignada)
    if (usuario && (usuario.role === 'recepcionista' || usuario.role === 'Recepcionista')) {
      console.warn("Los recepcionistas no pueden cambiar su sede asignada");
      return; // No permitir cambiar la sede
    }

    // Para admin, permitir cambiar la sede normalmente
    setSedeSeleccionadaState(sede);
    if (sede) {
      localStorage.setItem("sedeSeleccionada", JSON.stringify(sede));
      // Disparar evento personalizado para que las páginas se actualicen
      window.dispatchEvent(new CustomEvent('sedeChanged', { detail: sede }));
    } else {
      localStorage.removeItem("sedeSeleccionada");
    }
  };

  return (
    <SedeContext.Provider value={{ sedeSeleccionada, sedes, setSedeSeleccionada, loading }}>
      {children}
    </SedeContext.Provider>
  );
}

export function useSede() {
  const context = useContext(SedeContext);
  if (context === undefined) {
    throw new Error("useSede must be used within a SedeProvider");
  }
  return context;
}

