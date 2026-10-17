import type { NextConfig } from "next";

/**
 * Identificador desta build, usado para versionar o cache do service worker.
 *
 * Na Vercel usa o hash do commit; fora dela, o instante da build. O
 * next.config é avaliado uma vez por build, então o valor muda a cada
 * publicação — que é o gatilho para o service worker limpar o cache antigo.
 */
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? String(Date.now());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  async redirects() {
    return [
      // "Tendência" virou "Relatórios". Mantém funcionando os atalhos e links
      // antigos; os filtros na URL (?serie=…) vão junto.
      // A tela de Relatórios virou Acompanhamento (17/10/2026); links e
      // favoritos antigos continuam funcionando.
      { source: "/tendencia", destination: "/acompanhamento", permanent: true },
      { source: "/relatorios", destination: "/acompanhamento", permanent: true },
    ];
  },
};

export default nextConfig;
