"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Ticket, QrCode } from "lucide-react";

// Importar los componentes de las páginas existentes
import ColasView from "../colas/page";
import TurnosView from "../turnos/page";
import VerificarQRView from "../verificar-qr/page";

export default function ColasTurnosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-sans">Colas y Turnos</h1>
          <p className="text-muted-foreground mt-1 font-sans">Gestiona colas activas, turnos y verificación QR</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="colas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colas" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Colas
          </TabsTrigger>
          <TabsTrigger value="turnos" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Turnos
          </TabsTrigger>
          <TabsTrigger value="verificar-qr" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Verificar QR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colas" className="space-y-4">
          <ColasView />
        </TabsContent>

        <TabsContent value="turnos" className="space-y-4">
          <TurnosView />
        </TabsContent>

        <TabsContent value="verificar-qr" className="space-y-4">
          <VerificarQRView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
