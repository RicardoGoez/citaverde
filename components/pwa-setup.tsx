"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

export function PWASetup() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Verificar si fue descartado recientemente
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      // Mostrar de nuevo después de 7 días
      if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return; // Salir temprano si fue descartado recientemente
      }
    }

    // Registrar Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((registration) => {
          console.log("✅ Service Worker registrado:", registration);
          setSwRegistration(registration);

          // Detectar actualizaciones del Service Worker (sin molestar al usuario)
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Hay una nueva versión disponible
                  console.log('🔄 Nueva versión disponible - actualizando automáticamente');
                  // Actualizar automáticamente sin molestar al usuario
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });

          // Verificar periódicamente si hay actualizaciones
          setInterval(() => {
            registration.update();
          }, 60000); // Cada minuto
        })
        .catch((error) => {
          console.error("❌ Error registrando Service Worker:", error);
        });

      // Listen for controlling SW changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Controller cambió, recargando...');
        window.location.reload();
      });
    }

    // Capturar evento beforeinstallprompt (prompt de instalación)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Solo mostrar prompt si no está instalada
      if (!window.matchMedia('(display-mode: standalone)').matches &&
          !(window.navigator as any).standalone) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Verificar si ya está instalado (iOS)
    if ((window.navigator as any).standalone === true) {
      setShowInstallPrompt(false);
    }

    // Verificar si está en modo standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) return;

    // Android/Chrome/Edge
    if (deferredPrompt) {
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("✅ Usuario aceptó instalar la PWA");
      } else {
        console.log("❌ Usuario rechazó instalar la PWA");
      }

      setDeferredPrompt(null);
    }

    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Recordar que el usuario no quiere ver el prompt por un tiempo
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  // No renderizar nada si no hay prompt disponible
  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300 md:max-w-sm">
      <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-green-200 rounded-xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <img src="/icon-192.png" alt="CitaVerde" className="h-10 w-10 rounded" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Instalar CitaVerde</h3>
              <p className="text-xs text-gray-600 mt-0.5">Accede rápido desde tu pantalla de inicio</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          {isIOS ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-medium mb-2">
                📱 Instrucciones para iOS:
              </p>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. Toca el botón Compartir <span className="inline-block">⎙</span></li>
                <li>2. Selecciona "Agregar a pantalla de inicio"</li>
                <li>3. ¡Listo! Encuéntrala en tu home</li>
              </ol>
            </div>
          ) : (
            <Button
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar ahora
            </Button>
          )}

          {!isIOS && (
            <button
              onClick={handleDismiss}
              className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Tal vez después
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

