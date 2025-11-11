"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  Building2,
  Ticket,
  Package,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
} from "lucide-react";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const menuItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/agenda-disponibilidad", label: "Agenda y Disponibilidad", icon: Calendar },
  { path: "/admin/citas", label: "Citas", icon: Calendar },
  { path: "/admin/colas-turnos", label: "Colas y Turnos", icon: Ticket },
  { path: "/admin/profesionales", label: "Doctores", icon: Users },
  { path: "/admin/desempeno-profesionales", label: "Desempeño Profesionales", icon: TrendingUp },
  { path: "/admin/sedes", label: "Sedes", icon: Building2 },
  { path: "/admin/recursos", label: "Recursos", icon: Package },
  { path: "/admin/configuracion", label: "Configuración", icon: Settings },
  { path: "/admin/analitica", label: "Analítica y Reportes", icon: FileText },
];

export function AdminSidebar({ isOpen, onOpenChange }: { isOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // Detectar si es mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const SidebarContent = () => (
    <>
      {/* Logo - Minimalista */}
      <div className={cn("border-b border-[#E5E7EB] transition-all duration-300 relative bg-[#F9FAFB]", isMobile ? "p-4" : "p-6")}>
        {!isCollapsed && !isMobile && (
          <>
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300">
              <img 
                src="/icon-512.png" 
                alt="CitaVerde" 
                className="h-10 w-10 rounded-lg transition-transform duration-300 hover:scale-105"
              />
              <div>
                <h1 className="text-xl font-semibold text-[#111827] transition-all duration-300">
                  CitaVerde
                </h1>
                <p className="text-xs text-[#6B7280] transition-all duration-300">Panel Administrativo</p>
              </div>
            </div>
          </>
        )}
        {isMobile && (
          <div className="flex items-center gap-3">
            <img 
              src="/icon-512.png" 
              alt="CitaVerde" 
              className="h-12 w-12 rounded-lg"
            />
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                CitaVerde
              </h2>
              <p className="text-xs text-[#6B7280]">Panel Administrativo</p>
            </div>
          </div>
        )}
        {isCollapsed && !isMobile && (
          <img 
            src="/icon-512.png" 
            alt="CitaVerde" 
            className="h-12 w-12 rounded-lg mx-auto animate-in fade-in zoom-in duration-300 transition-transform hover:scale-105"
          />
        )}
        {/* Toggle Button - Solo en desktop/tablet */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className={cn(
              "absolute h-6 w-6 rounded-full bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center hover:bg-[#F3F4F6] transition-all duration-300 z-10",
              isCollapsed 
                ? "-right-3 top-16" 
                : "-right-3 top-1/2 -translate-y-1/2"
            )}
            aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            <ChevronRight 
              className={cn(
                "h-4 w-4 text-[#6B7280] transition-transform duration-300",
                !isCollapsed && "rotate-180"
              )} 
            />
          </button>
        )}
      </div>

      {/* Navigation - Sidebar fijo */}
      <nav className={cn("flex-1 overflow-y-auto space-y-1 transition-all duration-300", isMobile ? "p-4" : "p-4")}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} onClick={() => isMobile && onOpenChange?.(false)}>
              <div
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 group hover:translate-x-1",
                  isActive
                    ? "bg-[#16A34A] text-white"
                    : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]",
                  isCollapsed && !isMobile && "justify-center hover:translate-x-0"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-300", isCollapsed && !isMobile && "mx-auto")} />
                  {(!isCollapsed || isMobile) && (
                    <span className="font-medium animate-in fade-in duration-200">{item.label}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

             {/* Información del usuario en la parte inferior */}
       {user && (
         <div className={cn("border-t border-[#E5E7EB] bg-white p-3 transition-all duration-300", isMobile ? "p-4" : "p-4")}>
           {!isCollapsed || isMobile ? (
             <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
               <div className="h-8 w-8 rounded-full bg-[#16A34A] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 transition-transform duration-300 hover:scale-110">
                 {user.name.charAt(0)}
               </div>
               <div className="min-w-0 flex-1">
                 <p className="text-xs font-semibold text-[#111827] truncate capitalize">{user.role}</p>
                 <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
               </div>
             </div>
           ) : (
             <div className="flex justify-center animate-in fade-in zoom-in duration-300">
               <div className="h-8 w-8 rounded-full bg-[#16A34A] flex items-center justify-center text-white font-semibold text-sm transition-transform duration-300 hover:scale-110">
                 {user.name.charAt(0)}
               </div>
             </div>
           )}
         </div>
       )}
    </>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menú de navegación</SheetTitle>
          </SheetHeader>
          <div className="h-full flex flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop/Tablet: Sidebar normal
  return (
    <div className="relative h-screen">
      <div className={cn("h-full bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 ease-in-out", isCollapsed ? "w-16" : "w-64")}>
        <SidebarContent />
      </div>
    </div>
  );
}

export function AdminSidebarTrigger({ onToggle }: { onToggle: () => void }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <Button variant="ghost" size="icon" onClick={onToggle} className="md:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  );
}
