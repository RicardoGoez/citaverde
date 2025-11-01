"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Ticket, QrCode, Bell, ArrowRight } from "lucide-react";

export default function Home() {
  const fadeIn = "animate-in fade-in duration-700";
  const slideIn = "animate-in slide-in-from-bottom-4 duration-700";
  const scaleIn = "animate-in zoom-in-95 duration-700";

  const features = [
    {
      title: "Reserva de Citas",
      description: "Sistema completo de reserva de citas en línea con selección de sede, servicio y profesional",
      icon: Calendar,
    },
    {
      title: "Turnos Digitales",
      description: "Turnos digitales desde móvil para esperar fuera de la fila física",
      icon: Ticket,
    },
    {
      title: "QR Code",
      description: "Check-in rápido con códigos QR únicos para cada cita",
      icon: QrCode,
    },
    {
      title: "Notificaciones",
      description: "Recordatorios por email, SMS y WhatsApp antes de la cita",
      icon: Bell,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f0fdf4] to-white">
      {/* Header */}
      <header className={`border-b border-[#e2e8f0] bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm flex-shrink-0 ${fadeIn}`}>
        <div className="container mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-all hover:scale-105">
            <img src="/icon-512.png" alt="CitaVerde" className="h-8 w-8 md:h-10 md:w-10 rounded-lg shadow-sm" />
            <h1 className="text-xl md:text-2xl font-bold text-[#16a34a]">CitaVerde</h1>
            </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login" className="text-[#334155] hover:text-[#16a34a] transition-colors font-medium text-sm hover:scale-105">
              Iniciar Sesión
            </Link>
            <Button asChild size="sm" className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs md:text-sm px-3 md:px-4 transition-all hover:scale-105">
            <Link href="/register">Registrarse</Link>
          </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center">
      {/* Hero Section */}
        <section className="container mx-auto px-4 py-8 md:py-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-[#0f172a] mb-4 leading-tight ${slideIn}`}>
          Gestión de Citas y Turnos Digitales
        </h2>
            <p className={`text-base md:text-lg text-[#64748b] mb-6 leading-relaxed ${slideIn}`} style={{ animationDelay: '0.1s' }}>
          Optimiza la atención al paciente con nuestro sistema completo de gestión de citas, turnos digitales y códigos QR para check-in automático.
        </p>
            <div className={scaleIn} style={{ animationDelay: '0.2s' }}>
              <Button size="lg" className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-8 text-base md:text-lg h-12 md:h-14 shadow-lg hover:shadow-xl transition-all hover:scale-105" asChild>
                <Link href="/register">
              Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
            </div>
        </div>
      </section>

      {/* Features Grid */}
        <section className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center mb-4 md:mb-6">
            <h3 className={`text-2xl md:text-3xl font-bold text-[#0f172a] mb-2 ${fadeIn}`}>
              Características Principales
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
                <Card key={index} className={`border border-[#e2e8f0] shadow-md hover:shadow-xl hover:border-[#16a34a] transition-all bg-white group ${slideIn}`} style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                  <CardHeader className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all flex-shrink-0">
                        <Icon className="h-5 w-5 text-[#16a34a]" />
                      </div>
                      <div>
                        <CardTitle className="text-base md:text-lg text-[#0f172a] mb-1">{feature.title}</CardTitle>
                        <CardDescription className="text-sm text-[#64748b] leading-tight">{feature.description}</CardDescription>
                      </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dcfce7] bg-white py-4 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <span className="text-xs text-[#64748b]">© 2024 CitaVerde. Todos los derechos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
