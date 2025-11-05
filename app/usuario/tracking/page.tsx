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
  QrCode,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getTurnos, updateTurno, getColas } from "@/lib/actions/database";
import { getSedes } from "@/lib/actions/database";
import { useToasts } from "@/lib/hooks/use-toast";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { QRDisplay } from "@/components/ui/qr-display";

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
  
  // Estados para QR
  const [qrUrl, setQrUrl] = useState<string | null>(null);

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
          
          // Generar QR si existe
          if (turnoActual.qr_code) {
            const { generateQRCode } = await import("@/lib/utils/qr");
            const qrImageUrl = await generateQRCode(turnoActual.qr_code);
            setQrUrl(qrImageUrl);
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
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 mb-4">
                    <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">No hay turno activo</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6">
                    Toma un turno para ver el seguimiento en tiempo real
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button className="bg-[#16A34A] hover:bg-[#15803D] w-full sm:w-auto" asChild>
                      <Link href="/usuario/turnos">
                        Tomar Turno
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto" asChild>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seguimiento de Turno</h1>
              <p className="text-sm sm:text-base text-gray-600">Monitorea tu posición en tiempo real</p>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <Link href="/usuario">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </div>

          {/* Turno Actual - Destacado - Optimizado para móvil */}
          <Card className="border-2 border-[#16A34A] shadow-xl bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-xl sm:text-2xl">Tu Turno</CardTitle>
                <Badge className={`${estadoConfig.bg} ${estadoConfig.text} ${estadoConfig.border} border-2 px-3 py-1 text-sm`}>
                  {estadoConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl sm:text-3xl font-bold text-white">#{turno.numero}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">{turno.servicio}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{turno.cola}</p>
                    {turno.estado === 'en_atencion' && (
                      <div className="flex items-center gap-2 mt-2 text-blue-600 font-semibold text-xs sm:text-sm animate-pulse">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        ¡Te están llamando!
                      </div>
                    )}
                  </div>
                </div>
                {turno.estado === 'en_espera' && (
                  <Button
                    onClick={handleTransferClick}
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50 w-full sm:w-auto"
                  >
                    <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Transferir</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Métricas - Compactas responsive */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="border border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold">{personasAntes}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">personas antes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold">{tiempoEstimado}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">minutos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-xs sm:text-sm font-bold truncate">{turno.servicio}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Duración: {turno.tiempo_estimado} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR del Turno - Nueva sección */}
          {turno.qr_code && (
            <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="h-5 w-5 text-[#16A34A]" />
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Código QR</h3>
                  </div>
                  <div className="flex justify-center">
                    <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-[#16A34A]">
                      {qrUrl && <QRDisplay data={turno.qr_code} size={160} className="w-40 h-40 sm:w-48 sm:h-48" />}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-md">
                    Presenta este código en la recepción cuando sea tu turno
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cola Actual - Compacta responsive */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <CardTitle className="text-base sm:text-lg">Cola Actual</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">Turnos en espera</CardDescription>
            </CardHeader>
            <CardContent>
              {turnosEnCola.length > 0 ? (
                <div className="space-y-2">
                  {turnosEnCola.slice(0, 5).map((t: any) => (
                    <div
                      key={t.id}
                      className={`p-2.5 sm:p-3 rounded-lg border-2 transition-all ${
                        t.id === turnoId
                          ? 'border-[#16A34A] bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            t.id === turnoId
                              ? 'bg-[#16A34A] text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            <span className="font-bold text-sm sm:text-base">#{t.numero}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{t.paciente || 'Usuario'}</p>
                            <p className="text-xs text-gray-600 truncate">{t.servicio}</p>
                          </div>
                        </div>
                        {t.id === turnoId && (
                          <Badge className="bg-[#16A34A] text-white text-xs flex-shrink-0">Tu Turno</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {turnosEnCola.length > 5 && (
                    <p className="text-xs sm:text-sm text-gray-600 text-center pt-2">
                      Y {turnosEnCola.length - 5} más en la cola
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-600 py-4">No hay turnos en la cola</p>
              )}
            </CardContent>
          </Card>

          {/* Información de la Sede - Compacta responsive */}
          {sede && (
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  <CardTitle className="text-base sm:text-lg">Ubicación</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{sede.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{sede.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-900">{sede.phone}</span>
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
