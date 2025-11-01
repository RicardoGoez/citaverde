"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreVertical, Edit, Trash2, UserPlus } from "lucide-react";
import { getProfesionales, getSedes } from "@/lib/actions/database";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfesionalesPage() {
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const profesionalesData = await getProfesionales();
        const sedesData = await getSedes();
        setProfesionales(profesionalesData);
        setSedes(sedesData);
      } catch (error) {
        console.error("Error cargando profesionales:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getSedeName = (sedeId: string) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede?.name || "N/A";
  };

  const filteredProfesionales = profesionales.filter(prof =>
    prof.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estadisticas = [
    { label: "Total Doctores", value: profesionales.length },
    { label: "Activos", value: profesionales.filter(p => p.is_active).length },
    { label: "En Consulta", value: profesionales.filter(p => p.is_active).length },
    { label: "Ocupación", value: "83%" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0f172a]">Doctores</h1>
          <p className="text-[#64748b] mt-1">Gestiona el equipo médico</p>
        </div>
        <Button className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d]">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Doctor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {estadisticas.map((stat) => (
          <Card className="border-0 shadow-md" key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-[#64748b] mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-[#16a34a]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Doctores</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <Input
                  placeholder="Buscar doctores..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProfesionales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#64748b]">No hay doctores disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Doctor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Contacto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Sede</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Servicios</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[#64748b]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfesionales.map((profesional) => (
                    <tr key={profesional.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#0f172a]">{profesional.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#0f172a]">{profesional.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="text-[#0f172a]">{profesional.email}</div>
                          <div className="text-[#64748b]">{profesional.phone || "N/A"}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#475569]">{getSedeName(profesional.sede_id)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {profesional.servicios && profesional.servicios.slice(0, 2).map((servicio: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {servicio}
                            </Badge>
                          ))}
                          {profesional.servicios && profesional.servicios.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{profesional.servicios.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {profesional.is_active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-[#ef4444]" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
