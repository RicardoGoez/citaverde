"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  QrCode,
  Clock,
  LogOut,
} from "lucide-react";
import { User } from "@/lib/types";

const menuItems = [
  { path: "/usuario", label: "Mi Dashboard", icon: LayoutDashboard },
  { path: "/usuario/reservar", label: "Reservar Cita", icon: Calendar },
  { path: "/usuario/mis-citas", label: "Mis Citas", icon: Calendar },
  { path: "/usuario/turnos", label: "Turnos Digitales", icon: Ticket },
  { path: "/usuario/qr", label: "Mi QR", icon: QrCode },
  { path: "/usuario/tracking", label: "Estado en Tiempo Real", icon: Clock },
];

export function UserSidebar() {
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
        <p className="text-xs text-muted-foreground">Usuario</p>
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
          <div className="bg-accent rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
