"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (`public/sw.js`).
 *
 * Só roda em produção: em desenvolvimento o SW atrapalharia o hot reload.
 * Para testar o comportamento de PWA localmente: `npm run build && npm start`.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      // A versão vai na URL: quando ela muda, o navegador entende que é outro
      // service worker, instala o novo e o activate apaga os caches antigos.
      const versao = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

      navigator.serviceWorker
        .register(`/sw.js?v=${versao}`, { scope: "/", updateViaCache: "none" })
        .catch((error) => {
          console.error("Falha ao registrar o service worker:", error);
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
