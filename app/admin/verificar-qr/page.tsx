"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { useToasts } from "@/lib/hooks/use-toast";
import { obtenerLogsQR } from "@/lib/actions/qr-checkin";

export default function VerificarQRPage() {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const { addToast, error: showError, success: showSuccess } = useToasts();

  const handleVerificar = async () => {
    if (!qrCode.trim()) {
      showError("Error", "Ingrese un código QR");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/qr-checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCode }),
      });

      const data = await response.json();
      setResultado(data);

      if (data.success) {
        showSuccess("Éxito", data.message);
      } else {
        showError("Error", data.message);
      }

      // Recargar logs
      await cargarLogs();
    } catch (error) {
      console.error("Error verificando QR:", error);
      showError("Error", "Error al verificar el código QR");
    } finally {
      setLoading(false);
    }
  };

  const cargarLogs = async () => {
    try {
      const data = await obtenerLogsQR({});
      setLogs(data || []);
    } catch (error) {
      console.error("Error cargando logs:", error);
    }
  };

  useEffect(() => {
    cargarLogs();
  }, []);

  const getResultadoBadge = (resultado: string) => {
    const configs: Record<string, { variant: any; icon: any }> = {
      exitoso: { variant: "success", icon: CheckCircle2 },
      fallido: { variant: "destructive", icon: XCircle },
      usado: { variant: "destructive", icon: XCircle },
      vencido: { variant: "warning", icon: Clock },
      invalido: { variant: "destructive", icon: XCircle },
    };
    const config = configs[resultado] || { variant: "default", icon: Search };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {resultado.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#111827]">Verificación QR</h1>
        <p className="text-[#6B7280] mt-1">Escanea o ingresa códigos QR para verificar check-in</p>
      </div>

      {/* Verificador de QR */}
      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Verificar Código QR
          </CardTitle>
          <CardDescription>
            Ingresa un código QR para verificar su validez y registrar el check-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Código QR..."
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleVerificar()}
              className="flex-1"
            />
            <Button onClick={handleVerificar} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Verificar
            </Button>
          </div>

          {resultado && (
            <div
              className={`p-4 rounded-lg border ${
                resultado.success
                  ? "bg-[#F0FDF4] border-[#86EFAC]"
                  : "bg-[#FEF2F2] border-[#FCA5A5]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {resultado.success ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[#EF4444]" />
                )}
                <span className={`font-semibold ${resultado.success ? "text-[#16A34A]" : "text-[#EF4444]"}`}>
                  {resultado.success ? "Check-in Exitoso" : "Error de Verificación"}
                </span>
              </div>
              <p className="text-sm text-[#6B7280]">{resultado.message}</p>
              {resultado.citaId && (
                <div className="mt-2 text-sm text-[#6B7280]">
                  <strong>ID Cita:</strong> {resultado.citaId}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs de Auditoría */}
      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardHeader>
          <CardTitle>Logs de Auditoría</CardTitle>
          <CardDescription>Registro de todos los escaneos de códigos QR</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-[#6B7280] py-8">No hay logs registrados</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[#111827]">
                        {log.qr_code.substring(0, 20)}...
                      </span>
                      {getResultadoBadge(log.resultado)}
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      {log.ip_address && (
                        <>
                          {" • "}
                          <span>IP: {log.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
