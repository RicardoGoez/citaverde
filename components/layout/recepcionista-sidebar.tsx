"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Ticket,
  QrCode,
  Phone,
  Settings,
  LogOut,
} from "lucide-react";
import { User } from "@/lib/types";

const menuItems = [
  { path: "/recepcionista", label: "Dashboard", icon: LayoutDashboard },
  { path: "/recepcionista/citas", label: "Citas", icon: Calendar },
  { path: "/recepcionista/turnos", label: "Turnos Activos", icon: Ticket },
  { path: "/recepcionista/llamadas", label: "Llamar Turnos", icon: Phone },
  { path: "/recepcionista/qr", label: "Check-in QR", icon: QrCode },
  { path: "/recepcionista/pacientes", label: "Pacientes", icon: Users },
  { path: "/recepcionista/configuracion", label: "Configuración", icon: Settings },
];

export function RecepcionistaSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">ReservaFlow</h1>
        <p className="text-xs text-muted-foreground">Recepción</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className="p-4 border-t border-border">
          <div className="bg-accent rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full font-medium">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
