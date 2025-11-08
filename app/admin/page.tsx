"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Briefcase, Building2, Ticket, Settings, Plus, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { getCitas, getTurnos, getServicios, getProfesionales, getSedes } from "@/lib/actions/database";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboard() {
  const [citas, setCitas] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const citasData = await getCitas();
        const turnosData = await getTurnos();
        setCitas(citasData);
        setTurnos(turnosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calcular estadísticas reales
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const citasHoy = citas.filter(c => {
    const fecha = new Date(c.fecha);
    return fecha >= hoy && fecha < new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
  });

  const citasPendientes = citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;
  const citasCompletadas = citas.filter(c => c.estado === 'completada').length;
  const turnosActivos = turnos.filter(t => t.estado === 'en_espera' || t.estado === 'en_atencion').length;

  // Accesos rápidos
  const quickAccess = [
    {
      title: "Nueva Cita",
      description: "Crear una nueva cita",
      icon: Calendar,
      link: "/admin/citas",
    },
    {
      title: "Profesionales",
      description: "Gestionar profesionales",
      icon: Users,
      link: "/admin/profesionales",
    },
    {
      title: "Servicios",
      description: "Gestionar servicios",
      icon: Briefcase,
      link: "/admin/servicios",
    },
    {
      title: "Sedes",
      description: "Gestionar ubicaciones",
      icon: Building2,
      link: "/admin/sedes",
    },
    {
      title: "Turnos",
      description: "Gestionar turnos",
      icon: Ticket,
      link: "/admin/turnos",
    },
    {
      title: "Configuración",
      description: "Ajustes del sistema",
      icon: Settings,
      link: "/admin/configuracion",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#111827]">Dashboard</h1>
        <p className="text-[#6B7280] mt-1">Resumen general del sistema</p>
      </div>

      {/* Métricas - Diseño Minimalista */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-[#E5E7EB] shadow-sm hover:shadow transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280] mb-1">Citas del Día</p>
                <p className="text-3xl font-semibold text-[#111827]">{citasHoy.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                <Calendar className="h-6 w-6 text-[#111827]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] shadow-sm hover:shadow transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280] mb-1">Pendientes</p>
                <p className="text-3xl font-semibold text-[#111827]">{citasPendientes}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#111827]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] shadow-sm hover:shadow transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280] mb-1">Completadas</p>
                <p className="text-3xl font-semibold text-[#16A34A]">{citasCompletadas}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-[#16A34A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] shadow-sm hover:shadow transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280] mb-1">Turnos Activos</p>
                <p className="text-3xl font-semibold text-[#111827]">{turnosActivos}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                <Ticket className="h-6 w-6 text-[#111827]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-xl font-semibold text-[#111827] mb-4">Accesos Rápidos</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.link}>
                <Card className="border border-[#E5E7EB] shadow-sm hover:border-[#16A34A] hover:shadow transition-all group cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-[#F3F4F6] flex items-center justify-center group-hover:bg-[#16A34A] transition-colors">
                        <Icon className="h-6 w-6 text-[#111827] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#111827] mb-1">{item.title}</h3>
                        <p className="text-sm text-[#6B7280]">{item.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
