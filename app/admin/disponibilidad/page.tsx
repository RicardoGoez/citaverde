"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Plus, Edit, Trash2, CheckCircle, Calendar, CalendarDays } from "lucide-react";
import { useToasts } from "@/lib/hooks/use-toast";
import { getDisponibilidades, createDisponibilidad, updateDisponibilidad, deleteDisponibilidad, getProfesionales } from "@/lib/actions/database";

interface Disponibilidad {
  id: string;
  profesional_id: string;
  profesional: string;
  tipo: "jornada" | "ausencia" | "festivo" | "vacacion";
  dia_semana?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  hora_inicio?: string;
  hora_fin?: string;
  motivo?: string;
  recurrente: boolean;
}

export default function DisponibilidadPage() {
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Disponibilidad | null>(null);
  const [formData, setFormData] = useState<Partial<Disponibilidad>>({
    tipo: "jornada",
    recurrente: false,
  });
  const { success: showSuccess, error: showError } = useToasts();

  useEffect(() => {
    cargarDisponibilidades();
  }, []);

  const cargarDisponibilidades = async () => {
    try {
      const data = await getDisponibilidades();
      // Mapear datos de Supabase al formato esperado
      const mappedData = data.map((item: any) => ({
        ...item,
        profesional: item.profesional_id, // En una versión real, se buscaría el nombre del profesional
      }));
      setDisponibilidades(mappedData as Disponibilidad[]);
    } catch (error) {
      showError("Error", "No se pudieron cargar las disponibilidades");
      // Fallback a datos mock
      const mockData: Disponibilidad[] = [
        {
          id: "d1",
          profesional_id: "prof1",
          profesional: "Dr. Juan Pérez",
          tipo: "jornada",
          dia_semana: 1,
          hora_inicio: "08:00",
          hora_fin: "17:00",
          recurrente: true,
        },
      ];
      setDisponibilidades(mockData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.profesional_id) {
      showError("Error", "Seleccione un profesional");
      return;
    }

    try {
      if (editingItem) {
        await updateDisponibilidad(editingItem.id, formData);
        await cargarDisponibilidades();
        showSuccess("Éxito", "Disponibilidad actualizada");
      } else {
        await createDisponibilidad(formData as any);
        await cargarDisponibilidades();
        showSuccess("Éxito", "Disponibilidad creada");
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ tipo: "jornada", recurrente: false });
    } catch (error) {
      showError("Error", "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar esta disponibilidad?")) {
      try {
        await deleteDisponibilidad(id);
        await cargarDisponibilidades();
        showSuccess("Éxito", "Eliminado correctamente");
      } catch (error) {
        showError("Error", "Error al eliminar");
      }
    }
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, any> = {
      jornada: "bg-blue-500",
      ausencia: "bg-yellow-500",
      festivo: "bg-red-500",
      vacacion: "bg-green-500",
    };
    return colors[tipo] || "bg-gray-500";
  };

  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111827]">Disponibilidad</h1>
          <p className="text-[#6B7280] mt-1">Gestiona jornadas y ausencias de profesionales</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Disponibilidad
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {disponibilidades.map((item) => (
          <Card key={item.id} className="border border-[#E5E7EB] shadow-sm hover:shadow transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getTipoBadge(item.tipo)}>
                    <Clock className="h-3 w-3 mr-1" />
                    {item.tipo.toUpperCase()}
                  </Badge>
                  <CardTitle className="text-lg">{item.profesional}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingItem(item); setFormData(item); setIsDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {item.dia_semana !== undefined && (
                <div className="text-sm">
                  <span className="text-[#6B7280]">Día:</span>{" "}
                  <span className="font-medium">{diasSemana[item.dia_semana]}</span>
                </div>
              )}
              {(item.fecha_inicio || item.fecha_fin) && (
                <div className="text-sm">
                  <span className="text-[#6B7280]">Período:</span>{" "}
                  <span className="font-medium">
                    {item.fecha_inicio} - {item.fecha_fin}
                  </span>
                </div>
              )}
              {(item.hora_inicio || item.hora_fin) && (
                <div className="text-sm">
                  <span className="text-[#6B7280]">Horario:</span>{" "}
                  <span className="font-medium">
                    {item.hora_inicio} - {item.hora_fin}
                  </span>
                </div>
              )}
              {item.motivo && (
                <div className="text-sm">
                  <span className="text-[#6B7280]">Motivo:</span> {item.motivo}
                </div>
              )}
              {item.recurrente && (
                <Badge variant="outline">Recurrente</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Disponibilidad" : "Nueva Disponibilidad"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#111827]">Tipo</label>
                <select
                  value={formData.tipo || "jornada"}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md"
                >
                  <option value="jornada">Jornada</option>
                  <option value="ausencia">Ausencia</option>
                  <option value="festivo">Festivo</option>
                  <option value="vacacion">Vacación</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827]">Profesional</label>
                <Input value={formData.profesional || ""} placeholder="Seleccione profesional" readOnly />
              </div>
            </div>

            {formData.tipo === "jornada" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#111827]">Día de la semana</label>
                    <select
                      value={formData.dia_semana || ""}
                      onChange={(e) => setFormData({ ...formData, dia_semana: parseInt(e.target.value) })}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md"
                    >
                      <option value="">Seleccione</option>
                      {diasSemana.map((dia, idx) => (
                        <option key={idx} value={idx}>{dia}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#111827]">Recurrente</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.recurrente}
                        onChange={(e) => setFormData({ ...formData, recurrente: e.target.checked })}
                      />
                      <span className="text-sm text-[#6B7280]">Semanal</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#111827]">Hora inicio</label>
                    <Input
                      type="time"
                      value={formData.hora_inicio || ""}
                      onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#111827]">Hora fin</label>
                    <Input
                      type="time"
                      value={formData.hora_fin || ""}
                      onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {formData.tipo !== "jornada" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#111827]">Fecha inicio</label>
                  <Input
                    type="date"
                    value={formData.fecha_inicio || ""}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111827]">Fecha fin</label>
                  <Input
                    type="date"
                    value={formData.fecha_fin || ""}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[#111827]">Motivo</label>
              <Textarea
                value={formData.motivo || ""}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Motivo de la ausencia..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <CheckCircle className="h-4 w-4 mr-2" />
                {editingItem ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
