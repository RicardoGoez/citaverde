"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CalendarDays } from "lucide-react";

// Importar los componentes de las páginas existentes
import CalendarioView from "../calendario/page";
import DisponibilidadView from "../disponibilidad/page";

export default function AgendaDisponibilidadPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-sans">Agenda y Disponibilidad</h1>
          <p className="text-muted-foreground mt-1 font-sans">Gestiona horarios, jornadas y disponibilidad</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calendario" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="disponibilidad" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Disponibilidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          <CalendarioView />
        </TabsContent>

        <TabsContent value="disponibilidad" className="space-y-4">
          <DisponibilidadView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
