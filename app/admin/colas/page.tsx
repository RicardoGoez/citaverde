"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Users, Clock, XCircle, Edit, Power, PowerOff } from "lucide-react";
import { useState, useEffect } from "react";
import { getColas, updateCola, createCola, deleteCola, getServicios } from "@/lib/actions/database";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSede } from "@/lib/hooks/use-sede";

export default function ColasPage() {
  const [colas, setColas] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNuevaColaOpen, setIsNuevaColaOpen] = useState(false);
  const [selectedCola, setSelectedCola] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [nuevaColaData, setNuevaColaData] = useState({
    name: "",
    servicio_id: "",
    prioridad: "media" as "alta" | "media" | "baja",
    tiempo_estimado_total: 60
  });
  const { success, error: showError } = useToasts();

  const { sedeSeleccionada } = useSede();
  const { hasPerm, hasPermAsync, refreshPermissions } = usePermissions();

  // Escuchar cambios en permisos
  useEffect(() => {
    const handlePermissionsChanged = () => {
      refreshPermissions();
    };

    window.addEventListener('permissionsChanged', handlePermissionsChanged);
    
    return () => {
      window.removeEventListener('permissionsChanged', handlePermissionsChanged);
    };
  }, [refreshPermissions]);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!sedeSeleccionada) {
        setLoading(false);
        return;
      }

      try {
        const serviciosData = await getServicios(sedeSeleccionada.id);
        // Filtrar colas por servicios de la sede
        const allColas = await getColas();
        const colasFiltradas = allColas.filter((cola: any) => {
          return serviciosData.some((servicio: any) => servicio.id === cola.servicio_id);
        });
        setColas(colasFiltradas);
        setServicios(serviciosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [sedeSeleccionada]);

  const getPrioridadConfig = (prioridad: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      alta: { color: "text-red-600 bg-red-50 border-red-200", label: "Alta" },
      media: { color: "text-amber-600 bg-amber-50 border-amber-200", label: "Media" },
      baja: { color: "text-gray-600 bg-gray-50 border-gray-200", label: "Baja" },
    };
    return configs[prioridad] || { color: "text-gray-600 bg-gray-50 border-gray-200", label: prioridad };
  };

  const handleCerrarCola = (cola: any) => {
    setSelectedCola(cola);
    setReason("");
    setIsDialogOpen(true);
  };

  const handleAbrirCola = async (cola: any) => {
    // Verificar permiso
    const tienePermiso = await hasPermAsync('turnos', 'editar');
    if (!tienePermiso) {
      showError("Sin permisos", "No tienes permiso para editar colas. Este permiso puede haber sido removido.");
      return;
    }

    try {
      await updateCola(cola.id, {
        is_active: true,
        is_cerrada: false
      });
      
      // Recargar datos desde la BD
      const allColas = await getColas();
      const colasFiltradas = allColas.filter((c: any) => {
        return servicios.some((servicio: any) => servicio.id === c.servicio_id);
      });
      setColas(colasFiltradas);
      success("Cola abierta", `La cola "${cola.name}" ha sido reabierta`);
    } catch (err: any) {
      console.error("Error abriendo cola:", err);
      showError("Error", err.message || "No se pudo abrir la cola");
    }
  };

  const handleConfirmarCierre = async () => {
    if (!selectedCola) return;

    // Verificar permiso
    const tienePermiso = await hasPermAsync('turnos', 'editar');
    if (!tienePermiso) {
      showError("Sin permisos", "No tienes permiso para editar colas. Este permiso puede haber sido removido.");
      return;
    }

    try {
      await updateCola(selectedCola.id, {
        is_active: false,
        is_cerrada: true
      });
      
      // Recargar datos desde la BD
      const allColas = await getColas();
      const colasFiltradas = allColas.filter((c: any) => {
        return servicios.some((servicio: any) => servicio.id === c.servicio_id);
      });
      setColas(colasFiltradas);
      success("Cola cerrada", `La cola "${selectedCola.name}" ha sido cerrada`);
      setIsDialogOpen(false);
      setSelectedCola(null);
      setReason("");
    } catch (err: any) {
      console.error("Error cerrando cola:", err);
      showError("Error", err.message || "No se pudo cerrar la cola");
    }
  };

  const handleCrearCola = async () => {
    // Verificar permiso
    const tienePermiso = await hasPermAsync('turnos', 'crear');
    if (!tienePermiso) {
      showError("Sin permisos", "No tienes permiso para crear colas. Este permiso puede haber sido removido.");
      return;
    }

    if (!nuevaColaData.name || !nuevaColaData.servicio_id) {
      showError("Error", "Complete todos los campos requeridos");
      return;
    }

    try {
      await createCola(nuevaColaData);
      // Recargar datos desde la BD
      const allColas = await getColas();
      const colasFiltradas = allColas.filter((cola: any) => {
        return servicios.some((servicio: any) => servicio.id === cola.servicio_id);
      });
      setColas(colasFiltradas);
      success("Cola creada", `La cola "${nuevaColaData.name}" ha sido creada`);
      setIsNuevaColaOpen(false);
      setNuevaColaData({
        name: "",
        servicio_id: "",
        prioridad: "media",
        tiempo_estimado_total: 60
      });
    } catch (err: any) {
      console.error("Error creando cola:", err);
      showError("Error", err.message || "No se pudo crear la cola");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Colas</h1>
          <p className="text-muted-foreground mt-1">Organiza las colas por servicio y prioridad</p>
        </div>
        {hasPerm('turnos', 'crear') && (
          <Button 
            className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d]"
            onClick={() => setIsNuevaColaOpen(true)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Nueva Cola
          </Button>
        )}
      </div>

      {colas.length === 0 ? (
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">No hay colas disponibles</p>
            <p className="text-sm text-muted-foreground mt-1">Crea tu primera cola para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {colas.map((cola) => {
            const prioridadConfig = getPrioridadConfig(cola.priority || "media");
            return (
              <Card key={cola.id} className="border border-[#E5E7EB] hover:border-[#16A34A] shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  {/* Header compacto */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{cola.name || "Sin nombre"}</h3>
                      <p className="text-xs text-muted-foreground truncate">{cola.servicio_name || "Sin servicio"}</p>
                    </div>
                    <Badge variant={cola.is_active ? "success" : "destructive"} className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                      {cola.is_active ? "Activa" : "Cerrada"}
                    </Badge>
                  </div>

                  {/* Información compacta */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground uppercase">Prioridad</span>
                      <Badge className={`text-[10px] px-2 py-0 h-5 border ${prioridadConfig.color}`}>
                        {prioridadConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{cola.current_turns || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{cola.estimated_time || 0} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Motivo de cierre si está cerrada */}
                  {!cola.is_active && cola.reason && (
                    <div className="mt-2 pt-2 border-t border-[#E5E7EB]">
                      <p className="text-[10px] text-red-600 truncate flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {cola.reason}
                      </p>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                    {cola.is_active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleCerrarCola(cola)}
                      >
                        <PowerOff className="h-3 w-3 mr-1" />
                        Cerrar Cola
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => handleAbrirCola(cola)}
                      >
                        <Power className="h-3 w-3 mr-1" />
                        Reabrir Cola
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog para cerrar cola */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Cola</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cerrar la cola "{selectedCola?.name}"? Indica el motivo de la contingencia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Motivo *</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Mantenimiento preventivo, personal insuficiente..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmarCierre}>
              Cerrar Cola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Nueva Cola */}
      <Dialog open={isNuevaColaOpen} onOpenChange={setIsNuevaColaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Cola</DialogTitle>
            <DialogDescription>
              Crea una nueva cola para gestionar turnos de un servicio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cola-name">Nombre de la Cola *</Label>
              <Input
                id="cola-name"
                value={nuevaColaData.name}
                onChange={(e) => setNuevaColaData({ ...nuevaColaData, name: e.target.value })}
                placeholder="Ej: Cola Medicina General - Mañana"
              />
            </div>
            <div>
              <Label htmlFor="cola-servicio">Servicio *</Label>
              <Select
                value={nuevaColaData.servicio_id}
                onValueChange={(value) => setNuevaColaData({ ...nuevaColaData, servicio_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id}>
                      {servicio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cola-prioridad">Prioridad *</Label>
              <Select
                value={nuevaColaData.prioridad}
                onValueChange={(value: "alta" | "media" | "baja") => setNuevaColaData({ ...nuevaColaData, prioridad: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cola-tiempo">Tiempo Estimado (minutos)</Label>
              <Input
                id="cola-tiempo"
                type="number"
                value={nuevaColaData.tiempo_estimado_total}
                onChange={(e) => setNuevaColaData({ ...nuevaColaData, tiempo_estimado_total: parseInt(e.target.value) || 60 })}
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNuevaColaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearCola}>
              Crear Cola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
