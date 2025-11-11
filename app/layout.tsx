import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWASetup } from "@/components/pwa-setup";
import { PushNotificationsSetup } from "@/components/push-notifications-setup";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CitaVerde - Sistema de Gestión de Citas y Turnos",
  description: "Sistema completo de gestión de citas médicas, turnos digitales y colas inteligentes",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CitaVerde",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "CitaVerde",
    title: "CitaVerde - Sistema de Gestión de Citas",
    description: "Sistema completo de gestión de citas médicas",
  },
  twitter: {
    card: "summary",
    title: "CitaVerde",
    description: "Sistema completo de gestión de citas médicas",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16A34A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <PWASetup />
        <PushNotificationsSetup />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
