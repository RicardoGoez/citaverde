"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Send,
  MessageSquare,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToasts } from "@/lib/hooks/use-toast";
import { getUsuarios, getTurnos, getCitas } from "@/lib/actions/database";
import { NotificationService } from "@/lib/services/notifications";

interface Mensaje {
  id: string;
  destinatario: string;
  mensaje: string;
  fecha: Date;
  tipo: 'informacion' | 'alerta' | 'retraso' | 'cierre';
}

export default function MensajesRecepcionista() {
  const [mensaje, setMensaje] = useState("");
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [tipoMensaje, setTipoMensaje] = useState<'informacion' | 'alerta' | 'retraso' | 'cierre'>('informacion');
  const [mensajesEnviados, setMensajesEnviados] = useState<Mensaje[]>([]);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ usuariosEnEspera: 0, citasHoy: 0 });
  const { success, error } = useToasts();

  useEffect(() => {
    loadStats();
  }, []);

  const opcionesDestinatarios = [
    { id: 'todos', label: 'Todos los usuarios en espera', icon: Users },
    { id: 'cola_general', label: 'Cola de Atención General', icon: MessageSquare },
    { id: 'cola_urgencias', label: 'Cola de Urgencias', icon: AlertCircle },
    { id: 'citas_confirmadas', label: 'Citas Confirmadas Hoy', icon: Calendar },
  ];

  const loadStats = async () => {
    try {
      const turnosData = await getTurnos({ estado: 'en_espera' });
      const citasHoy = new Date().toISOString().split('T')[0];
      const citasData = await getCitas({ estado: 'confirmada' });
      
      setStats({
        usuariosEnEspera: turnosData.length,
        citasHoy: citasData.filter((c: any) => c.fecha?.startsWith(citasHoy)).length
      });
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    }
  };

  const handleEnviar = async () => {
    if (!mensaje.trim()) {
      error("Error", "El mensaje no puede estar vacío");
      return;
    }

    if (destinatarios.length === 0) {
      error("Error", "Selecciona al menos un destinatario");
      return;
    }

    setSending(true);

    try {
      // Obtener usuarios para enviar mensajes
      const usuariosParaNotificar = await getUsuariosParaNotificar();
      
      if (usuariosParaNotificar.length === 0) {
        error("Error", "No hay usuarios para notificar en los destinatarios seleccionados");
        setSending(false);
        return;
      }

      // Enviar notificaciones
      let enviados = 0;
      let fallidos = 0;

      for (const usuario of usuariosParaNotificar) {
        const resultado = await NotificationService.send({
          to: usuario.email,
          subject: `Mensaje Importante - ${tipoMensaje.charAt(0).toUpperCase() + tipoMensaje.slice(1)}`,
          message: mensaje,
          type: 'email'
        });

        if (resultado) {
          enviados++;
        } else {
          fallidos++;
        }
      }

      // Guardar en historial
      const nuevoMensaje: Mensaje = {
        id: Date.now().toString(),
        destinatario: `${usuariosParaNotificar.length} usuarios`,
        mensaje,
        fecha: new Date(),
        tipo: tipoMensaje
      };

      setMensajesEnviados([nuevoMensaje, ...mensajesEnviados]);
      setMensaje("");
      setDestinatarios([]);
      
      if (fallidos > 0) {
        success("Parcialmente enviado", `${enviados} mensajes enviados, ${fallidos} fallaron`);
      } else {
        success("Enviado", `${enviados} mensajes enviados correctamente`);
      }

      // Recargar estadísticas
      await loadStats();
    } catch (err: any) {
      console.error("Error enviando mensajes:", err);
      error("Error", err.message || "No se pudieron enviar los mensajes");
    } finally {
      setSending(false);
    }
  };

  const getUsuariosParaNotificar = async () => {
    const usuarios = await getUsuarios();
    const usuariosParaNotificar: any[] = [];

    for (const destinatario of destinatarios) {
      if (destinatario === 'todos') {
        // Todos los usuarios en espera
        const turnosData = await getTurnos({ estado: 'en_espera' });
        const userIds = new Set(turnosData.map((t: any) => t.user_id));
        usuariosParaNotificar.push(...usuarios.filter(u => userIds.has(u.id)));
      } else if (destinatario === 'citas_confirmadas') {
        // Citas confirmadas hoy
        const citasHoy = new Date().toISOString().split('T')[0];
        const citasData = await getCitas({ estado: 'confirmada' });
        const citasHoyData = citasData.filter((c: any) => c.fecha?.startsWith(citasHoy));
        const userIds = new Set(citasHoyData.map((c: any) => c.user_id));
        usuariosParaNotificar.push(...usuarios.filter(u => userIds.has(u.id)));
      } else if (destinatario.startsWith('cola_')) {
        // Colas específicas
        const turnosData = await getTurnos({ estado: 'en_espera' });
        const turnosEnCola = turnosData.filter((t: any) => 
          t.cola?.toLowerCase().includes(destinatario.replace('cola_', ''))
        );
        const userIds = new Set(turnosEnCola.map((t: any) => t.user_id));
        usuariosParaNotificar.push(...usuarios.filter(u => userIds.has(u.id)));
      }
    }

    // Eliminar duplicados
    return usuariosParaNotificar.filter((u, index, self) => 
      index === self.findIndex((us) => us.id === u.id)
    );
  };

  const toggleDestinatario = (id: string) => {
    setDestinatarios(prev => 
      prev.includes(id) 
        ? prev.filter(d => d !== id)
        : [...prev, id]
    );
  };

  const templates = {
    retraso: "Estimado/a usuario, le informamos que hay un retraso en la atención. Su turno será llamado en breve. Disculpe las molestias.",
    cierre: "Estimado/a usuario, informamos que temporalmente se ha cerrado esta cola. Por favor, diríjase a otra ventanilla. Disculpe las molestias.",
    alerta: "ALERTA: Por favor, manténgase en el área designada. Su turno será llamado próximamente.",
    informacion: "Recuerde tener a mano su documento de identidad y cualquier documentación requerida para su atención."
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'alerta':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'retraso':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'cierre':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'alerta':
      case 'cierre':
        return <AlertCircle className="h-4 w-4" />;
      case 'retraso':
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Envío de Mensajes Masivos</h1>
          <p className="text-sm text-[#6B7280] mt-1">Comunícate con los usuarios en tiempo real</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-[#2563EB]">{stats.usuariosEnEspera}</p>
            <p className="text-xs text-[#6B7280]">En espera</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#16A34A]">{stats.citasHoy}</p>
            <p className="text-xs text-[#6B7280]">Citas hoy</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario de envío */}
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Nuevo Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selección de destinatarios */}
            <div>
              <Label className="mb-2">Destinatarios</Label>
              <div className="space-y-2 mt-2">
                {opcionesDestinatarios.map((opcion) => {
                  const Icon = opcion.icon;
                  return (
                    <button
                      key={opcion.id}
                      onClick={() => toggleDestinatario(opcion.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        destinatarios.includes(opcion.id)
                          ? 'border-[#2563EB] bg-[#EFF6FF]'
                          : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        destinatarios.includes(opcion.id)
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{opcion.label}</span>
                      {destinatarios.includes(opcion.id) && (
                        <CheckCircle className="h-5 w-5 text-[#2563EB] ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipo de mensaje */}
            <div>
              <Label htmlFor="tipo">Tipo de Mensaje</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { value: 'informacion', label: 'Información', color: 'bg-blue-500' },
                  { value: 'alerta', label: 'Alerta', color: 'bg-red-500' },
                  { value: 'retraso', label: 'Retraso', color: 'bg-orange-500' },
                  { value: 'cierre', label: 'Cierre', color: 'bg-red-600' },
                ].map((tipo) => (
                  <button
                    key={tipo.value}
                    onClick={() => {
                      setTipoMensaje(tipo.value as any);
                      setMensaje(templates[tipo.value as keyof typeof templates] || "");
                    }}
                    className={`p-2 rounded-lg text-sm font-medium text-white transition-all ${
                      tipoMensaje === tipo.value
                        ? `${tipo.color} ring-2 ring-offset-2`
                        : 'bg-gray-400 hover:bg-gray-500'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de mensaje */}
            <div>
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea
                id="mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="mt-2 min-h-[150px]"
              />
            </div>

            {/* Botón enviar */}
            <Button
              onClick={handleEnviar}
              disabled={sending}
              className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Mensaje
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Historial de mensajes */}
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mensajes Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            {mensajesEnviados.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {mensajesEnviados.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 border-2 border-[#E5E7EB] rounded-lg hover:border-[#CBD5E1] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className={`${getTipoColor(msg.tipo)} border`}
                      >
                        {getTipoIcon(msg.tipo)}
                        <span className="ml-1">{msg.tipo}</span>
                      </Badge>
                      <span className="text-xs text-[#6B7280]">
                        {msg.fecha.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[#111827] mb-2">{msg.mensaje}</p>
                    <p className="text-xs text-[#6B7280]">A: {msg.destinatario}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#6B7280]">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay mensajes enviados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
