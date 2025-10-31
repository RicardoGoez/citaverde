"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { 
  Clock,
  Users,
  MapPin,
  Phone,
  Ticket,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTurnos, updateTurno, getColas } from "@/lib/actions/database";
import { getSedes } from "@/lib/actions/database";
import { useToasts } from "@/lib/hooks/use-toast";
import { useNotifications } from "@/lib/hooks/use-notifications";

export default function TrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const turnoId = searchParams.get('turno');
  const { success, error } = useToasts();
  const { sendNotification, requestPermission } = useNotifications();
  
  const [turno, setTurno] = useState<any>(null);
  const [turnosEnCola, setTurnosEnCola] = useState<any[]>([]);
  const [sede, setSede] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [personasAntes, setPersonasAntes] = useState(0);
  const [tiempoEstimado, setTiempoEstimado] = useState(0);
  
  // Estados para transferencia
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [colasDisponibles, setColasDisponibles] = useState<any[]>([]);
  const [colaDestino, setColaDestino] = useState("");
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (!turnoId) {
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      try {
        const userStr = sessionStorage.getItem("user");
        if (!userStr) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userStr);
        
        // Cargar turnos
        const turnosData = await getTurnos();
        const turnoActual = turnosData.find((t: any) => t.id === turnoId);
        
        if (turnoActual) {
          setTurno(turnoActual);
          
          // Filtrar turnos en la misma cola
          const enCola = turnosData.filter((t: any) => 
            t.cola === turnoActual.cola && 
            t.estado !== 'atendido' && 
            t.estado !== 'cancelado' &&
            t.numero <= turnoActual.numero
          ).sort((a: any, b: any) => a.numero - b.numero);
          
          setTurnosEnCola(enCola);
          
          // Calcular personas antes
          const posicion = enCola.findIndex((t: any) => t.id === turnoId);
          setPersonasAntes(posicion);
          
          // Calcular tiempo estimado (personas antes * tiempo promedio)
          setTiempoEstimado(posicion * (turnoActual.tiempo_estimado || 15));
          
          // Cargar datos de la sede
          if (turnoActual.sede_id) {
            const sedesData = await getSedes();
            const sedeActual = sedesData.find((s: any) => s.id === turnoActual.sede_id);
            setSede(sedeActual);
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();

    // Actualizar cada 10 segundos
    const interval = setInterval(cargarDatos, 10000);
    return () => clearInterval(interval);
  }, [turnoId, router]);

  // Efecto para notificaciones cuando cambia el estado del turno
  useEffect(() => {
    const checkAndNotify = async () => {
      if (!turno) return;

      // Si el turno está en atención y antes estaba en espera, notificar
      if (turno.estado === 'en_atencion') {
        await sendNotification(
          "¡Es tu turno! 🎉",
          {
            body: `Tu turno #${turno.numero} está siendo llamado ahora. Dirígete a ${turno.servicio || "el servicio"}`,
            tag: `turno-${turno.id}`,
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            sound: true,
          }
        );
      }

      // Si solo quedan 2 personas antes, notificar
      if (personasAntes === 2 && turno.estado === 'en_espera') {
        await sendNotification(
          "Casi es tu turno ⏰",
          {
            body: `Solo quedan ${personasAntes} personas antes que tú. Prepárate.`,
            tag: `turno-prep-${turno.id}`,
          }
        );
      }
    };

    checkAndNotify();
  }, [turno, personasAntes, sendNotification]);

  // Solicitar permisos al cargar la página
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, any> = {
      en_espera: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", label: "En Espera" },
      en_atencion: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", label: "En Atención" },
      atendido: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "Atendido" },
      cancelado: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", label: "Cancelado" },
    };
    return colors[estado] || colors.en_espera;
  };

  const handleTransferClick = async () => {
    if (!turno) return;
    
    setIsTransferDialogOpen(true);
    
    // Cargar colas disponibles para el mismo servicio
    const allColas = await getColas();
    const colasCompatibles = allColas.filter(c => 
      c.servicio_id === turno.servicio_id && 
      c.id !== turno.cola_id && 
      c.is_active && 
      !c.is_cerrada
    );
    
    setColasDisponibles(colasCompatibles);
    
    if (colasCompatibles.length === 0) {
      error("Error", "No hay colas alternativas disponibles para este servicio");
      setIsTransferDialogOpen(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!colaDestino || !turno) return;
    
    setTransferring(true);
    
    try {
      const colaDestinoData = colasDisponibles.find(c => c.id === colaDestino);
      
      if (!colaDestinoData) {
        error("Error", "Cola no válida");
        return;
      }

      // Obtener el próximo número en la cola destino
      const turnosExistentes = await getTurnos();
      const turnosEnColaDestino = turnosExistentes.filter((t: any) => 
        (t.cola_id === colaDestino || t.cola === colaDestinoData.name) &&
        t.estado === 'en_espera'
      );
      
      const nuevoNumero = turnosEnColaDestino.length > 0 
        ? Math.max(...turnosEnColaDestino.map((t: any) => t.numero || 0)) + 1 
        : 1;

      // Actualizar el turno con la nueva cola
      await updateTurno(turno.id, {
        cola: colaDestinoData.name,
        cola_id: colaDestino,
        numero: nuevoNumero
      });

      success("Transferido", `Turno transferido a ${colaDestinoData.name} con número #${nuevoNumero}`);
      setIsTransferDialogOpen(false);
      setColaDestino("");
      
      // Recargar datos
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Error transfiriendo turno:", err);
      error("Error", err.message || "No se pudo transferir el turno");
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
  return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  if (!turno) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <div className="w-full px-4 md:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
      <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
              <Clock className="h-12 w-12 text-primary" />
            </div>
                  <h3 className="text-xl font-bold mb-2">No hay turno activo</h3>
                  <p className="text-gray-600 mb-6">
                    Toma un turno para ver el seguimiento en tiempo real
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button className="bg-[#16A34A] hover:bg-[#15803D]" asChild>
                      <Link href="/usuario/turnos">
                        Tomar Turno
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/usuario">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const estadoConfig = getEstadoColor(turno.estado);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seguimiento de Turno</h1>
              <p className="text-base text-gray-600">Monitorea tu posición en tiempo real</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/usuario">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </div>

          {/* Turno Actual - Destacado */}
          <Card className="border-2 border-[#16A34A] shadow-xl bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Tu Turno</CardTitle>
                <Badge className={`${estadoConfig.bg} ${estadoConfig.text} ${estadoConfig.border} border-2 px-4 py-1.5`}>
                  {estadoConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">#{turno.numero}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{turno.servicio}</h3>
                    <p className="text-sm text-gray-600">{turno.cola}</p>
                    {turno.estado === 'en_atencion' && (
                      <div className="flex items-center gap-2 mt-2 text-blue-600 font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        ¡Te están llamando!
                      </div>
                    )}
                  </div>
                </div>
                {turno.estado === 'en_espera' && (
                  <Button
                    onClick={handleTransferClick}
                    variant="outline"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Transferir
                  </Button>
                )}
          </div>
        </CardContent>
      </Card>

          {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-gray-200">
          <CardHeader>
                <CardTitle className="text-sm font-medium">Posición en Cola</CardTitle>
          </CardHeader>
          <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{personasAntes}</p>
                    <p className="text-xs text-gray-600">personas antes</p>
                  </div>
            </div>
          </CardContent>
        </Card>

            <Card className="border border-gray-200">
          <CardHeader>
                <CardTitle className="text-sm font-medium">Tiempo Estimado</CardTitle>
          </CardHeader>
          <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{tiempoEstimado}</p>
                    <p className="text-xs text-gray-600">minutos</p>
                  </div>
            </div>
          </CardContent>
        </Card>

            <Card className="border border-gray-200">
          <CardHeader>
                <CardTitle className="text-sm font-medium">Servicio</CardTitle>
          </CardHeader>
          <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Ticket className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate">{turno.servicio}</p>
                    <p className="text-xs text-gray-600">Duración: {turno.tiempo_estimado} min</p>
                  </div>
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Cola Actual */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Cola Actual
              </CardTitle>
              <CardDescription>Turnos en espera</CardDescription>
            </CardHeader>
            <CardContent>
              {turnosEnCola.length > 0 ? (
                <div className="space-y-2">
                  {turnosEnCola.slice(0, 5).map((t: any) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        t.id === turnoId
                          ? 'border-[#16A34A] bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            t.id === turnoId
                              ? 'bg-[#16A34A] text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            <span className="font-bold">#{t.numero}</span>
                          </div>
                          <div>
                            <p className="font-medium">{t.paciente || 'Usuario'}</p>
                            <p className="text-xs text-gray-600">{t.servicio}</p>
                          </div>
                        </div>
                        {t.id === turnoId && (
                          <Badge className="bg-[#16A34A] text-white">Tu Turno</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {turnosEnCola.length > 5 && (
                    <p className="text-sm text-gray-600 text-center pt-2">
                      Y {turnosEnCola.length - 5} más en la cola
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-4">No hay turnos en la cola</p>
              )}
            </CardContent>
          </Card>

          {/* Información de la Sede */}
          {sede && (
            <Card className="border border-gray-200">
        <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ubicación
                </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                      <p className="font-semibold text-gray-900">{sede.name}</p>
                      <p className="text-sm text-gray-600">{sede.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">{sede.phone}</span>
            </div>
          </div>
        </CardContent>
      </Card>
          )}
        </div>
      </div>

      {/* Dialog de Transferencia */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogClose onOpenChange={setIsTransferDialogOpen} />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              Transferir Turno
            </DialogTitle>
            <DialogDescription>
              Selecciona una cola alternativa para tu turno. Se asignará un nuevo número de turno.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Información del turno actual */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Info className="h-4 w-4" />
                <span className="font-semibold">Turno Actual</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-gray-900">
                  Turno #{turno?.numero} - {turno?.servicio}
                </p>
                <p className="text-sm text-gray-600">
                  Cola actual: {turno?.cola}
                </p>
              </div>
            </div>

            {/* Selector de cola destino */}
            {colasDisponibles.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Nueva Cola</Label>
                <Select value={colaDestino} onValueChange={setColaDestino}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona una cola alternativa" />
                  </SelectTrigger>
                  <SelectContent>
                    {colasDisponibles.map((cola) => (
                      <SelectItem key={cola.id} value={cola.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{cola.name}</span>
                          {cola.turnos_actuales > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {cola.turnos_actuales} turnos
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {colaDestino && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mt-2">
                    <p className="text-sm text-purple-900">
                      <strong>Importante:</strong> Se te asignará un nuevo número de turno en esta cola.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900 text-center">
                  No hay colas alternativas disponibles en este momento.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTransferDialogOpen(false);
                setColaDestino("");
              }}
              disabled={transferring}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={!colaDestino || transferring}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {transferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transfiriendo...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Confirmar Transferencia
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
