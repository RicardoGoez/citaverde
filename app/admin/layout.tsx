"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar, AdminSidebarTrigger } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Verificar si hay un usuario en sessionStorage
    const userStr = sessionStorage.getItem("user");
    
    if (!userStr) {
      // Si no hay usuario, redirigir al login
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Verificar que tenga rol de admin o recepcionista
      if (user.role !== "admin" && user.role !== "recepcionista") {
        router.push("/login");
        return;
      }
    } catch (error) {
      // Si hay error parseando, redirigir al login
      router.push("/login");
      return;
    }

    setIsLoading(false);
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a34a] mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
      {/* Desktop Sidebar - Fijo a toda la altura */}
      <div className="hidden md:block h-full">
        <AdminSidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <AdminSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header con trigger para mobile */}
        <div className="border-b border-[#e0e0e0] bg-white px-4 md:px-6">
          <div className="flex items-center h-16">
            <AdminSidebarTrigger onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <AdminHeader />
          </div>
        </div>
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
