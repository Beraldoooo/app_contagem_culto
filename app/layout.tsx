import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { ServiceWorkerRegister } from "@/components/service-worker-register";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Contagem Culto",
    template: "%s · Contagem Culto",
  },
  description:
    "Registro e histórico da contagem de presença nos cultos e eventos.",
  applicationName: "Contagem Culto",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Contagem Culto",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    // Mesma cor da faixa do topo (--superficie), para a barra de status
    // do celular emendar com o app.
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14171e" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-fundo text-texto">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
