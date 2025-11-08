"use client";

import { useState, useEffect, useCallback } from "react";
import { hasPermission, getUserPermissions } from "@/lib/actions/database";

interface Permission {
  modulo: string;
  accion: string;
}

/**
 * Hook para verificar permisos del usuario actual
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Obtener usuario del sessionStorage
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      } catch (error) {
        console.error("Error parseando usuario:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadPermissions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const userPerms = await getUserPermissions(userId);
      setPermissions(userPerms);
    } catch (error) {
      console.error("Error cargando permisos:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadPermissions();
    }
  }, [userId, loadPermissions]);

  useEffect(() => {
    // Escuchar eventos de cambios en permisos
    const handlePermissionsChanged = () => {
      if (userId) {
        loadPermissions();
      }
    };

    window.addEventListener('permissionsChanged', handlePermissionsChanged);
    
    return () => {
      window.removeEventListener('permissionsChanged', handlePermissionsChanged);
    };
  }, [userId, loadPermissions]);

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  const checkPermission = async (modulo: string, accion: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      return await hasPermission(userId, modulo, accion);
    } catch (error) {
      console.error("Error verificando permiso:", error);
      return false;
    }
  };

  /**
   * Verificar si el usuario tiene un permiso (versión síncrona usando permisos cargados)
   * Si los permisos no están cargados, hace una verificación asíncrona
   */
  const hasPerm = (modulo: string, accion: string): boolean => {
    if (!userId) return false;

    // Si es admin, tiene todos los permisos
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userRole = user.role?.toLowerCase();
        if (userRole === 'admin' || userRole === 'administrador') {
          return true;
        }
      } catch (error) {
        // Ignorar errores de parsing
      }
    }

    // Si los permisos están cargados, verificar en ellos
    if (permissions.length > 0) {
      return permissions.some(
        (p) => p.modulo === modulo && p.accion === accion
      );
    }

    // Si no están cargados, retornar false por seguridad
    // (se actualizarán cuando se carguen)
    return false;
  };

  /**
   * Verificar permiso de forma asíncrona (más confiable para acciones críticas)
   */
  const hasPermAsync = async (modulo: string, accion: string): Promise<boolean> => {
    if (!userId) return false;
    return await checkPermission(modulo, accion);
  };

  return {
    permissions,
    loading,
    checkPermission,
    hasPerm,
    hasPermAsync,
    refreshPermissions: loadPermissions,
  };
}

