import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { COR_BARRA, SCRIPT_TEMA, TEMA_PADRAO } from "@/lib/tema";

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
  // Mesma cor da faixa do topo, para a barra de status do celular emendar com
  // o app. O script de tema troca para a cor do claro quando for o caso.
  themeColor: COR_BARRA[TEMA_PADRAO],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
      data-tema={TEMA_PADRAO}
      // O script abaixo pode trocar o data-tema antes de o React hidratar.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col bg-fundo text-texto">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
