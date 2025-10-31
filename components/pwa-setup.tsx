"use client";

import { useEffect, useState } from "react";

export function PWASetup() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Registrar Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado:", registration);
        })
        .catch((error) => {
          console.error("Error registrando Service Worker:", error);
        });
    }

    // Capturar evento beforeinstallprompt (prompt de instalación)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Verificar si ya está instalado
    if ((window as any).navigator.standalone === true || 
        (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("Usuario aceptó instalar la PWA");
    } else {
      console.log("Usuario rechazó instalar la PWA");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // No renderizar nada, solo registrar el Service Worker
  return null;
}

