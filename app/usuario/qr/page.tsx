"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRDisplay } from "@/components/ui/qr-display";
import { 
  QrCode, 
  Camera,
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ScanLine,
  Info,
  Download,
  Calendar,
  Clock,
  Building,
  User,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { getCitas } from "@/lib/actions/database";
import { generateQRCode } from "@/lib/utils/qr";
import { useToasts } from "@/lib/hooks/use-toast";
import Link from "next/link";

// Reemplazo de react-qr-reader por ZXing para compatibilidad con React 19

export default function QRPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: showSuccess, error: showError } = useToasts();
  const [mode, setMode] = useState<'display' | 'scan' | 'loading'>('loading');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cita, setCita] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      const citaId = searchParams.get('cita');
      const reemitir = searchParams.get('reemitir');
      
      if (citaId) {
        // Modo mostrar QR de cita
        await loadCitaAndGenerateQR(citaId, reemitir === 'true');
      } else {
        // Modo escanear QR
        setMode('scan');
      }
    };

    init();

    return () => {
      setCameraActive(false);
      setScanning(false);
    };
  }, [searchParams]);

  const loadCitaAndGenerateQR = async (citaId: string, reemitir: boolean) => {
    try {
      const citas = await getCitas();
      const citaEncontrada = citas.find(c => c.id === citaId);
      
      if (!citaEncontrada) {
        showError("Error", "Cita no encontrada");
        setMode('scan');
        return;
      }

      setCita(citaEncontrada);

      // Si no tiene QR o se solicita reemitir, generar uno nuevo
      if (!citaEncontrada.qr_code || reemitir) {
        const nuevoQR = `CITA-${citaId}-${Date.now()}`;
        
        // Actualizar la cita con el nuevo QR en la base de datos
        const response = await fetch('/api/citas/' + citaId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_code: nuevoQR })
        });

        if (response.ok) {
          const qrImageUrl = await generateQRCode(nuevoQR);
          setQrUrl(qrImageUrl);
          citaEncontrada.qr_code = nuevoQR;
          setCita(citaEncontrada);
          if (reemitir) {
            showSuccess("Éxito", "QR reemitido correctamente");
          }
        } else {
          throw new Error('Error actualizando QR');
        }
      } else {
        // Usar el QR existente
        const qrImageUrl = await generateQRCode(citaEncontrada.qr_code);
        setQrUrl(qrImageUrl);
      }

      setMode('display');
    } catch (error) {
      console.error("Error cargando cita:", error);
      showError("Error", "Error al cargar la información de la cita");
      setMode('scan');
    }
  };

  const handleDownloadQR = async () => {
    if (!qrUrl) return;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-cita-${cita?.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess("Éxito", "QR descargado correctamente");
    } catch (error) {
      console.error("Error descargando QR:", error);
      showError("Error", "Error al descargar el QR");
    }
  };

  const handleActivateCamera = async () => {
    try {
      setError(null);
      setCameraError(null);
      setResult(null);
      setSuccess(false);

      setCameraActive(true);
      setScanning(true);

      // Inicializar lector ZXing
      const codeReader = new BrowserMultiFormatReader({
        // @ts-ignore - Options not fully typed but works
        timeBetweenDecodingAttempts: 500
      });
      codeReaderRef.current = codeReader;

      const videoEl = videoRef.current;
      if (!videoEl) throw new Error('Video element no disponible');

      await codeReader.decodeFromVideoDevice(undefined, videoEl, (result, err) => {
        if (result) {
          handleScan(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          console.error('Error decodificando:', err);
        }
      });
    } catch (err: any) {
      console.error("Error accediendo a la cámara:", err);
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.");
      setCameraActive(false);
    }
  };

  const handleScan = (data: any) => {
    if (data) {
      setResult(data);
      setScanning(false);
      processQRCode(data);
    }
  };

  const handleError = (err: any) => {
    console.error("Error en el escáner:", err);
    setCameraError("Error en el escáner de códigos QR");
    setCameraActive(false);
    setScanning(false);
  };

  const processQRCode = async (qrData: string) => {
    setProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrData }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setError(null);
        setTimeout(() => resetScanner(), 3000);
      } else {
        setError(data.message || "Error procesando el código QR");
        setSuccess(false);
      }
    } catch (err: any) {
      console.error("Error procesando QR:", err);
      setError("Error al procesar el código QR. Intenta nuevamente.");
      setSuccess(false);
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setCameraActive(false);
    setScanning(false);
    setResult(null);
    setError(null);
    setSuccess(false);
    setProcessing(false);

    try {
      // @ts-ignore - API methods exist at runtime
      codeReaderRef.current?.reset?.();
      codeReaderRef.current?.stopContinuousDecode?.();
    } catch {}
  };

  const handleRetry = () => {
    resetScanner();
    handleActivateCamera();
  };

  // Modo de carga
  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  // Modo mostrar QR de cita
  if (mode === 'display' && cita) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/usuario/mis-citas">
              <button className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 hover:border-[#16A34A] hover:bg-[#16A34A]/5 transition-all shadow-sm">
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Código QR de la Cita</h1>
              <p className="text-xs text-gray-500">Presenta este código al llegar</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Panel QR */}
            <Card className="border-2 border-gray-200 bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 pb-3 border-b">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center">
                      <QrCode className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Tu Código QR</h2>
                      <p className="text-xs text-gray-500">Cita #{cita.id}</p>
                    </div>
                  </div>

                  {qrUrl ? (
                    <>
                      <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
                        <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                      </div>
                      <p className="text-xs text-gray-600">
                        Escanea este código al llegar a la sede para tu check-in automático
                      </p>
                    </>
                  ) : (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-12 w-12 animate-spin text-[#16A34A]" />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleDownloadQR}
                      className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white"
                      disabled={!qrUrl}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                    <Button
                      onClick={() => loadCitaAndGenerateQR(cita.id, true)}
                      variant="outline"
                      className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reemitir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel Información */}
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-blue-100">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Info className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Información de la Cita</h2>
                      <p className="text-xs text-blue-600">Detalles</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <Calendar className="h-4 w-4 text-[#16A34A] mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Fecha y Hora</p>
                        <p className="text-xs text-gray-600">{cita.fecha} a las {cita.hora}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <Building className="h-4 w-4 text-[#16A34A] mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Sede</p>
                        <p className="text-xs text-gray-600">{cita.sede || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <User className="h-4 w-4 text-[#16A34A] mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Profesional</p>
                        <p className="text-xs text-gray-600">{cita.profesional || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <FileText className="h-4 w-4 text-[#16A34A] mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Servicio</p>
                        <p className="text-xs text-gray-600">{cita.servicio || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 mt-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                        <Info className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-gray-900 mb-1">Instrucciones</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Presenta este código QR al llegar a la sede. Se escaneará automáticamente para confirmar tu llegada y agilizar la atención.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Modo escanear QR
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 hover:border-[#16A34A] hover:bg-[#16A34A]/5 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Escanear QR</h1>
            <p className="text-xs text-gray-500">Check-in automático</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Panel Izquierdo: Escáner (2/3 del espacio) */}
          <div className="md:col-span-2">
            <Card className="border-2 border-gray-200 bg-white shadow-lg">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header minimalista */}
                  <div className="flex items-center gap-2 pb-3 border-b">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Escáner de Cámara</h2>
                      <p className="text-xs text-gray-500">Enfoca el código QR</p>
                    </div>
                  </div>
                  
                  {/* Área de escaneo compacta */}
                  <div className="flex justify-center">
                    {cameraActive && scanning ? (
                      <div className="w-full space-y-3">
                        <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-[#16A34A]">
                          <video ref={videoRef} className="w-full h-64 object-cover" autoPlay muted playsInline />
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-white rounded-lg shadow-lg animate-pulse"></div>
                          </div>
                        </div>
                        
                        {processing && (
                          <div className="bg-[#16A34A]/10 border border-[#16A34A] rounded-lg p-3 flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-[#16A34A]" />
                            <span className="text-xs font-medium text-[#16A34A]">Procesando...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="relative h-64 rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center shadow-lg overflow-hidden">
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0" style={{
                              backgroundImage: `repeating-linear-gradient(45deg, #16A34A 0px, #16A34A 8px, transparent 8px, transparent 16px)`
                            }}></div>
                          </div>
                          
                          <div className="relative z-10 text-center space-y-3 px-4">
                            {success ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-center">
                                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-md">
                                    <CheckCircle className="h-12 w-12 text-[#16A34A]" />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 mb-1">¡Check-in exitoso!</h3>
                                  <p className="text-xs text-gray-600">Código procesado correctamente</p>
                                </div>
                              </div>
                            ) : error ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-center">
                                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                                    <XCircle className="h-12 w-12 text-red-600" />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-gray-900 mb-1">Error</h3>
                                  <p className="text-xs text-gray-600 mb-2">{error}</p>
                                  <Button
                                    onClick={handleRetry}
                                    size="sm"
                                    className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs h-8"
                                  >
                                    Reintentar
                                  </Button>
                                </div>
                              </div>
                            ) : cameraError ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-center">
                                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                                    <AlertCircle className="h-12 w-12 text-yellow-600" />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-gray-900 mb-1">Error de cámara</h3>
                                  <p className="text-xs text-gray-600 mb-2">{cameraError}</p>
                                  <Button
                                    onClick={handleActivateCamera}
                                    size="sm"
                                    className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs h-8"
                                  >
                                    Intentar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center justify-center">
                                  <div className="relative">
                                    <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-[#16A34A]/10 to-[#15803D]/10 flex items-center justify-center border-2 border-[#16A34A]/30">
                                      <QrCode className="h-14 w-14 text-[#16A34A]" />
                                    </div>
                                    <div className="absolute -inset-1 border-2 border-[#16A34A] rounded-xl animate-pulse"></div>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-gray-900 mb-1">Listo para escanear</h3>
                                  <p className="text-xs text-gray-500">Activa la cámara para comenzar</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estado compacto */}
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="flex items-center gap-2 justify-center">
                      <ScanLine className={`h-3.5 w-3.5 ${scanning ? 'text-[#16A34A] animate-pulse' : 'text-gray-400'}`} />
                      <p className="text-xs font-medium text-gray-600">
                        {scanning ? "Escaneando..." : "Presiona para activar"}
                      </p>
                    </div>
                  </div>

                  {/* Botón compacto */}
                  <div>
                    {!cameraActive && !success && !error && !cameraError && (
                      <Button
                        onClick={handleActivateCamera}
                        className="w-full h-11 bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Activar Cámara
                      </Button>
                    )}

                    {(error || cameraError || success) && (
                      <Button
                        onClick={resetScanner}
                        variant="outline"
                        size="sm"
                        className="w-full h-10 border border-gray-300 hover:border-[#16A34A] hover:bg-[#16A34A]/5 text-xs"
                      >
                        Volver al inicio
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Derecho: Instrucciones compactas (1/3 del espacio) */}
          <div className="md:col-span-1">
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-lg h-full">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header compacto */}
                  <div className="flex items-center gap-2 pb-3 border-b border-blue-100">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Guía Rápida</h2>
                      <p className="text-xs text-blue-600">4 pasos</p>
                    </div>
                  </div>

                  {/* Lista compacta */}
                  <div className="space-y-2.5">
                    {[
                      { num: 1, text: "Activa la cámara" },
                      { num: 2, text: "Apunta al código QR" },
                      { num: 3, text: "Detecta automáticamente" },
                      { num: 4, text: "Recibe confirmación" }
                    ].map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-gray-200 hover:border-[#16A34A] hover:shadow-sm transition-all group"
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-110 transition-transform">
                          {item.num}
                        </div>
                        <p className="text-xs font-medium text-gray-700">{item.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Consejo compacto */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                        <Info className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-gray-900 mb-1">Consejo</h4>
                        <p className="text-xs text-gray-600 leading-tight">Mantén el código centrado y enfocado.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
