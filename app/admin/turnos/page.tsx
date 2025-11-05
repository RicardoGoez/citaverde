"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, Users, CheckCircle2, Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getTurnos, getUsuarios, getServicios, getSedes } from "@/lib/actions/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTurno, setEditingTurno] = useState<any>(null);
  const { success, error } = useToasts();
  
  // Form state
  const [formData, setFormData] = useState({
    user_id: "",
    servicio: "",
    sede_id: "",
    numero: 0,
    estado: "en_espera",
    tiempo_estimado: 0,
    prioridad: "normal",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [turnosData, usuariosData, serviciosData, sedesData] = await Promise.all([
          getTurnos(),
          getUsuarios(),
          getServicios(),
          getSedes(),
        ]);
        setTurnos(turnosData);
        setUsuarios(usuariosData);
        setServicios(serviciosData);
        setSedes(sedesData);
      } catch (err) {
        console.error("Error cargando turnos:", err);
        error("Error", "No se pudieron cargar los turnos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [error]);

  const handleOpenDialog = (turno?: any) => {
    if (turno) {
      setIsEditing(true);
      setEditingTurno(turno);
      setFormData({
        user_id: turno.user_id,
        servicio: turno.servicio,
        sede_id: turno.sede_id || "",
        numero: turno.numero,
        estado: turno.estado,
        tiempo_estimado: turno.tiempo_estimado || 0,
        prioridad: turno.prioridad || "normal",
      });
    } else {
      setIsEditing(false);
      setEditingTurno(null);
      const maxNumero = turnos.length > 0 ? Math.max(...turnos.map(t => t.numero)) : 0;
      setFormData({
        user_id: "",
        servicio: "",
        sede_id: "",
        numero: maxNumero + 1,
        estado: "en_espera",
        tiempo_estimado: 0,
        prioridad: "normal",
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (turno: any) => {
    if (confirm(`¿Estás seguro de eliminar el turno #${turno.numero}?`)) {
      try {
        setTurnos(turnos.filter(t => t.id !== turno.id));
        success("Eliminado", `Turno #${turno.numero} eliminado exitosamente`);
      } catch (err) {
        error("Error", "No se pudo eliminar el turno");
      }
    }
  };

  const getUserName = (userId: string) => {
    const user = usuarios.find(u => u.id === userId);
    return user?.name || "Desconocido";
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        success("Actualizado", "Turno actualizado exitosamente");
      } else {
        const newId = `TUR-${Date.now().toString().slice(-6)}`;
        const nuevoTurno = {
          id: newId,
          ...formData,
        };
        setTurnos([...turnos, nuevoTurno]);
        success("Creado", `Turno #${formData.numero} creado exitosamente`);
      }
      setIsDialogOpen(false);
    } catch (err) {
      error("Error", "No se pudo guardar el turno");
    }
  };

  const filteredTurnos = turnos.filter(turno => {
    const userName = getUserName(turno.user_id);
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           turno.servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           turno.numero?.toString().includes(searchTerm);
  });

  const getEstadoBadge = (estado: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      en_espera: { variant: "warning", label: "En Espera" },
      en_atencion: { variant: "default", label: "En Atención" },
      atendido: { variant: "success", label: "Atendido" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };
    const config = configs[estado] || { variant: "default", label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const turnosActivos = filteredTurnos.filter(t => t.estado !== "atendido" && t.estado !== "cancelado");
  const turnosHistorial = filteredTurnos.filter(t => t.estado === "atendido" || t.estado === "cancelado");

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0f172a]">Turnos Digitales</h1>
          <p className="text-[#64748b] mt-1">Gestión de colas y turnos en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <Input
              placeholder="Buscar turnos..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d]"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
          Nuevo Turno
        </Button>
      </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Turnos Activos</CardTitle>
            <CardDescription>Turnos esperando o en atención</CardDescription>
          </CardHeader>
          <CardContent>
            {turnosActivos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#64748b]">No hay turnos activos</p>
              </div>
            ) : (
            <div className="space-y-3">
                {turnosActivos.map((turno) => (
                  <div
                    key={turno.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#dcfce7] to-white border border-[#86efac]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white font-bold text-lg">
                        {turno.numero}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#0f172a]">{turno.servicio}</p>
                        <p className="text-sm text-[#64748b]">{getUserName(turno.user_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <div className="text-right">
                        {getEstadoBadge(turno.estado)}
                        {turno.tiempo_estimado > 0 && (
                          <p className="text-xs text-[#64748b] mt-1">
                            ~{turno.tiempo_estimado} min
                          </p>
                        )}
                        </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(turno)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(turno)}
                        className="h-8 w-8 text-[#ef4444] hover:text-[#dc2626]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Últimos Atendidos</CardTitle>
            <CardDescription>Turnos completados recientemente</CardDescription>
          </CardHeader>
          <CardContent>
            {turnos.filter(t => t.estado === "atendido").length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#64748b]">No hay turnos atendidos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {turnos
                  .filter(t => t.estado === "atendido")
                  .slice(0, 5)
                  .map((turno) => (
                    <div
                      key={turno.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#e2e8f0]"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
                        <div>
                          <p className="font-medium text-[#0f172a]">#{turno.numero}</p>
                          <p className="text-sm text-[#64748b]">{turno.servicio}</p>
                        </div>
                      </div>
                      <Badge variant="success">Atendido</Badge>
                    </div>
                  ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Crear/Editar Turno */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onOpenChange={setIsDialogOpen} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifica la información del turno" : "Completa los datos para crear un nuevo turno"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="numero" className="text-sm font-medium">Número *</label>
                <Input
                  id="numero"
                  type="number"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label htmlFor="user_id" className="text-sm font-medium">Usuario *</label>
                <select
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  required
                >
                  <option value="">Selecciona un usuario</option>
                  {usuarios.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="servicio" className="text-sm font-medium">Servicio *</label>
                <Input
                  id="servicio"
                  value={formData.servicio}
                  onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                  placeholder="Consulta General"
                  required
                />
              </div>
              <div>
                <label htmlFor="sede_id" className="text-sm font-medium">Sede</label>
                <select
                  id="sede_id"
                  value={formData.sede_id}
                  onChange={(e) => setFormData({ ...formData, sede_id: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                >
                  <option value="">Selecciona una sede</option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="estado" className="text-sm font-medium">Estado</label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                >
                  <option value="en_espera">En Espera</option>
                  <option value="en_atencion">En Atención</option>
                  <option value="atendido">Atendido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label htmlFor="prioridad" className="text-sm font-medium">Prioridad</label>
                <select
                  id="prioridad"
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                >
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label htmlFor="tiempo_estimado" className="text-sm font-medium">Tiempo Estimado (min)</label>
                <Input
                  id="tiempo_estimado"
                  type="number"
                  value={formData.tiempo_estimado}
                  onChange={(e) => setFormData({ ...formData, tiempo_estimado: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? "Guardar Cambios" : "Crear Turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
