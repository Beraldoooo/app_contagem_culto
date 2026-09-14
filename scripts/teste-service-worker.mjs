/**
 * Roda o public/sw.js de verdade num ambiente simulado, duas vezes com versões
 * diferentes, para conferir se o activate apaga os caches da versão anterior.
 */
import fs from "node:fs";
import vm from "node:vm";

const codigo = fs.readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

let ok = 0, falhou = 0;
const bom = (m) => { ok++; console.log("  ✓", m); };
const ruim = (m, d="") => { falhou++; console.log("  ✗", m, d); };

// --- API de caches simulada -------------------------------------------------
const armazem = new Map();
const caches = {
  async open(nome) {
    if (!armazem.has(nome)) armazem.set(nome, new Map());
    const c = armazem.get(nome);
    return {
      addAll: async (urls) => urls.forEach((u) => c.set(u, "conteudo")),
      match: async (u) => c.get(u),
      put: async (req, res) => c.set(String(req), res),
    };
  },
  keys: async () => [...armazem.keys()],
  delete: async (nome) => armazem.delete(nome),
  match: async () => undefined,
};

async function rodarCicloDeVida(versao) {
  const ouvintes = {};
  const self = {
    location: { href: `http://localhost:3000/sw.js?v=${versao}` },
    addEventListener: (tipo, fn) => { ouvintes[tipo] = fn; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  const contexto = vm.createContext({ self, caches, fetch: async () => ({ ok: true }), URL, Response, console, Promise });
  vm.runInContext(codigo, contexto);

  // install
  let esperar;
  await ouvintes.install({ waitUntil: (p) => { esperar = p; } });
  await esperar;
  // activate
  await ouvintes.activate({ waitUntil: (p) => { esperar = p; } });
  await esperar;
}

console.log("=== publicação 1 (versão abc123) ===");
await rodarCicloDeVida("abc123");
console.log("  caches:", [...armazem.keys()]);
const v1 = [...armazem.keys()];
if (v1.some((k) => k.includes("abc123"))) {
  bom("criou cache com a versão da URL");
} else {
  ruim("cache sem a versão", v1.join());
}

// simula lixo de uma versão bem antiga que ficou no aparelho
armazem.set("contagem-culto-shell-v1", new Map([["/velho", "x"]]));
armazem.set("contagem-culto-runtime-v1", new Map([["/velho", "x"]]));
console.log("  (injetei caches de uma versão antiga:", [...armazem.keys()].filter(k=>k.endsWith("v1")).join(", "), ")");

console.log("\n=== publicação 2 (versão def456) ===");
await rodarCicloDeVida("def456");
const v2 = [...armazem.keys()];
console.log("  caches:", v2);

if (v2.some((k) => k.includes("def456"))) {
  bom("criou cache da versão nova");
} else {
  ruim("faltou o cache novo");
}
if (!v2.some((k) => k.includes("abc123"))) {
  bom("apagou o cache da publicação anterior");
} else {
  ruim("sobrou cache antigo", v2.join());
}
if (!v2.some((k) => k.endsWith("v1"))) {
  bom("apagou o lixo da versão bem antiga");
} else {
  ruim("sobrou lixo v1", v2.join());
}
// o cache de runtime só nasce ao buscar um estático; aqui nenhum fetch rolou
if (v2.every((k) => k.includes("def456"))) {
  bom(`sobrou só o que é da versão atual (${v2.length})`);
} else {
  ruim("sobrou algo de outra versão", v2.join());
}

console.log(`\n${ok} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
