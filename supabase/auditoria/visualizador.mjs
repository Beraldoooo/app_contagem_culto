/**
 * Auditoria do papel 'visualizador' contra a API real do Supabase.
 *
 * Confere que ele LÊ tudo do dashboard, histórico e gráficos, e que toda
 * escrita é recusada pela RLS — sem passar pelo app, para que esconder botões
 * no front não influencie o resultado.
 *
 * Como rodar (a conta precisa estar como 'visualizador'):
 *   node supabase/auditoria/visualizador.mjs
 *
 * Sai com código 0 se tudo passou, 1 se alguma verificação falhou, 2 se a
 * conta não estiver no papel certo.
 */
import fs from "node:fs";

const env = fs.readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
const ler = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))[1].trim().replace(/^["']|["']$/g, "");
const U = ler("NEXT_PUBLIC_SUPABASE_URL"), K = ler("NEXT_PUBLIC_SUPABASE_ANON_KEY");

let ok = 0, falhou = 0;
const bom = (m, d="") => { ok++; console.log("  \x1b[32m✓\x1b[0m", m, d); };
const ruim = (m, d="") => { falhou++; console.log("  \x1b[31m✗\x1b[0m", m, d); };

const s = await (await fetch(`${U}/auth/v1/token?grant_type=password`, {
  method: "POST", headers: { apikey: K, "Content-Type": "application/json" },
  body: JSON.stringify({ email: "teste.contagem@example.com", password: "teste123456" }),
})).json();

const H = { apikey: K, Authorization: "Bearer " + s.access_token };
const HW = { ...H, "Content-Type": "application/json", Prefer: "return=representation" };

const perfil = (await (await fetch(`${U}/rest/v1/profiles?select=role,status`, { headers: H })).json())[0];
console.log(`\nConta: ${perfil.role} / ${perfil.status}\n`);
if (perfil.role !== "visualizador") {
  console.log("\x1b[33mPRECISA SER 'visualizador' para esta auditoria valer.\x1b[0m");
  process.exit(2);
}

// alvos existentes para tentar alterar
const ev = await (await fetch(`${U}/rest/v1/eventos?select=id,data,horario,tipo&order=data.desc&limit=5`, { headers: H })).json();
const ct = await (await fetch(`${U}/rest/v1/contagens?select=id,evento_id,quantidade&limit=1`, { headers: H })).json();
const alvoEvento = ev[0], alvoContagem = ct[0];

console.log("=== LEITURA — tudo deve funcionar (Fases 3 e 4) ===");
const leituras = [
  ["dashboard: totais por data",      `totais_por_data?select=data,total_cultos&tem_culto_fixo=is.true&order=data.desc&limit=5`],
  ["histórico: com filtro de período", `totais_por_data?select=data,total&data=gte.2026-06-01&data=lte.2026-07-31&order=data.desc`],
  ["histórico: filtro por tipo",       `totais_por_data?select=data&tem_evento_especial=is.true`],
  ["gráfico: série de um horário",     `contagens?select=quantidade,eventos!inner(data,horario)&eventos.tipo=eq.culto_fixo&eventos.horario=eq.10:00:00&limit=5`],
  ["gráfico: eventos especiais",       `contagens?select=quantidade,eventos!inner(data,nome)&eventos.tipo=eq.evento_especial`],
  ["gráfico: opções de horário",       `horarios_padrao?select=dia_semana,horario,nome&ativo=is.true`],
  ["detalhe do dia: eventos",          `eventos?select=id,nome,horario,tipo&data=eq.2026-09-13`],
  ["detalhe do dia: contagens",        `contagens?select=evento_id,quantidade&limit=5`],
  ["próprio perfil",                   `profiles?select=email,role,status`],
];
for (const [rotulo, caminho] of leituras) {
  const r = await fetch(`${U}/rest/v1/${caminho}`, { headers: H });
  const corpo = await r.json();
  const n = Array.isArray(corpo) ? corpo.length : 0;
  if (r.ok && n > 0) {
    bom(`${rotulo.padEnd(34)} ${n} linhas`);
  } else {
    ruim(rotulo, `status ${r.status} ${JSON.stringify(corpo).slice(0, 80)}`);
  }
}

console.log("\n=== ESCRITA — tudo deve ser bloqueado ===");
const bloqueado = (r, corpo) => r.status === 403 || r.status === 401 || (r.ok && Array.isArray(corpo) && corpo.length === 0);
const escritas = [
  ["INSERT contagem nova", "POST",   `contagens`, { evento_id: ev.find(e=>e.id!==alvoContagem?.evento_id)?.id ?? alvoEvento.id, quantidade: 999, lancado_por: s.user.id }],
  ["UPDATE contagem",      "PATCH",  `contagens?id=eq.${alvoContagem?.id}`, { quantidade: 999 }],
  ["DELETE contagem",      "DELETE", `contagens?id=eq.${alvoContagem?.id}`, null],
  ["INSERT evento",        "POST",   `eventos`, { tipo: "evento_especial", nome: "Invasao", data: "2026-09-19", horario: "23:00", created_by: s.user.id }],
  ["UPDATE evento",        "PATCH",  `eventos?id=eq.${alvoEvento.id}`, { nome: "Alterado" }],
  ["DELETE evento",        "DELETE", `eventos?id=eq.${alvoEvento.id}`, null],
  ["UPDATE horário padrão","PATCH",  `horarios_padrao?dia_semana=eq.0`, { ativo: false }],
  ["auto-promoção a admin","PATCH",  `profiles?id=eq.${s.user.id}`, { role: "admin_geral" }],
  ["promover outro",       "PATCH",  `profiles?role=eq.pendente`, { status: "aprovado" }],
];
for (const [rotulo, metodo, caminho, corpo] of escritas) {
  const r = await fetch(`${U}/rest/v1/${caminho}`, { method: metodo, headers: HW, ...(corpo ? { body: JSON.stringify(corpo) } : {}) });
  let dados = null; try { dados = await r.json(); } catch {}
  if (bloqueado(r, dados)) {
    const detalhe = Array.isArray(dados) && !dados.length ? ", 0 linhas" : "";
    bom(`${rotulo.padEnd(24)} bloqueado`, `(${r.status}${detalhe})`);
  } else {
    ruim(`${rotulo.padEnd(24)} PASSOU!`, `${r.status} ${JSON.stringify(dados).slice(0, 90)}`);
  }
}

console.log("\n=== FUNÇÃO DO BANCO ===");
const r = await fetch(`${U}/rest/v1/rpc/gerar_eventos_fixos`, { method: "POST", headers: HW, body: JSON.stringify({ p_data: "2026-09-20" }) });
const corpo = await r.json();
if (bloqueado(r, corpo)) {
  bom("gerar_eventos_fixos bloqueado", `(${r.status})`);
} else {
  ruim("gerar_eventos_fixos PASSOU!", JSON.stringify(corpo).slice(0, 90));
}

console.log("\n=== NADA FOI ALTERADO? ===");
const depois = await (await fetch(`${U}/rest/v1/contagens?select=id,quantidade&id=eq.${alvoContagem?.id}`, { headers: H })).json();
if (depois[0]?.quantidade === alvoContagem?.quantidade) {
  bom(`contagem intacta (${alvoContagem?.quantidade})`);
} else {
  ruim("contagem foi alterada!", JSON.stringify(depois));
}
const evDepois = await (await fetch(`${U}/rest/v1/eventos?select=id,nome&id=eq.${alvoEvento.id}`, { headers: H })).json();
if (evDepois[0]?.nome) {
  bom(`evento intacto ("${evDepois[0].nome}")`);
} else {
  ruim("evento sumiu!");
}
const perfilDepois = (await (await fetch(`${U}/rest/v1/profiles?select=role`, { headers: H })).json())[0];
if (perfilDepois.role === "visualizador") {
  bom("papel continua visualizador");
} else {
  ruim(`papel virou ${perfilDepois.role}!`);
}

console.log(`\n${ok} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
