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

let ok = 0, falhou = 0, pulado = 0;
const bom = (m, d="") => { ok++; console.log("  \x1b[32m✓\x1b[0m", m, d); };
const ruim = (m, d="") => { falhou++; console.log("  \x1b[31m✗\x1b[0m", m, d); };
// Sem dado para testar não é falha — é verificação que não dá para fazer.
// Com o banco vazio (antes do primeiro culto real) isso é o normal.
const pula = (m, d="") => { pulado++; console.log("  \x1b[90m–\x1b[0m", m, `\x1b[90m${d}\x1b[0m`); };

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
// Os filtros saem do que existe no banco agora, e não de datas fixas: com
// datas chumbadas a auditoria passava a acusar falha toda vez que os dados
// mudavam, sem nada de errado nas permissões.
const umaData = alvoEvento?.data;
const temEspecial = ev.some((e) => e.tipo === "evento_especial");
const umHorario = ev.find((e) => e.tipo === "culto_fixo")?.horario;

const leituras = [
  ["dashboard: totais por data",      `totais_por_data?select=data,total_cultos&tem_culto_fixo=is.true&order=data.desc&limit=5`, ev.length],
  ["histórico: com filtro de período", umaData && `totais_por_data?select=data,total&data=gte.${umaData}&data=lte.${umaData}`, ev.length],
  ["histórico: filtro por tipo",       `totais_por_data?select=data&tem_evento_especial=is.true`, temEspecial],
  ["gráfico: série de um horário",     umHorario && `contagens?select=quantidade,eventos!inner(data,horario)&eventos.tipo=eq.culto_fixo&eventos.horario=eq.${umHorario}&limit=5`, ct.length],
  ["gráfico: eventos especiais",       `contagens?select=quantidade,eventos!inner(data,nome)&eventos.tipo=eq.evento_especial`, temEspecial && ct.length],
  ["gráfico: opções de horário",       `horarios_padrao?select=dia_semana,horario,nome&ativo=is.true`, true],
  ["detalhe do dia: eventos",          umaData && `eventos?select=id,nome,horario,tipo&data=eq.${umaData}`, ev.length],
  ["detalhe do dia: contagens",        `contagens?select=evento_id,quantidade&limit=5`, ct.length],
  ["próprio perfil",                   `profiles?select=email,role,status`, true],
];
for (const [rotulo, caminho, temDado] of leituras) {
  if (!caminho || !temDado) {
    pula(rotulo.padEnd(34), "sem dado no banco para provar");
    continue;
  }
  const r = await fetch(`${U}/rest/v1/${caminho}`, { headers: H });
  const corpo = await r.json();
  const n = Array.isArray(corpo) ? corpo.length : 0;
  if (r.ok && n > 0) {
    bom(`${rotulo.padEnd(34)} ${n} linhas`);
  } else {
    // 200 com zero linhas aqui é falha de verdade: o dado existe e a RLS
    // escondeu dele.
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
  // Sem uma linha existente para mirar, o PostgREST responde 400 por id
  // inválido — o que não diria nada sobre permissão.
  if (caminho.includes("undefined")) {
    pula(rotulo.padEnd(24), "sem linha existente para tentar alterar");
    continue;
  }
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
if (!alvoContagem) {
  pula("contagem intacta", "não havia contagem no banco");
} else {
  const depois = await (await fetch(`${U}/rest/v1/contagens?select=id,quantidade&id=eq.${alvoContagem.id}`, { headers: H })).json();
  if (depois[0]?.quantidade === alvoContagem.quantidade) {
    bom(`contagem intacta (${alvoContagem.quantidade})`);
  } else {
    ruim("contagem foi alterada!", JSON.stringify(depois));
  }
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

console.log(
  `\n${ok} passaram, ${falhou} falharam` +
    (pulado ? `, ${pulado} puladas por falta de dado no banco` : ""),
);
if (pulado && !falhou) {
  console.log(
    "\x1b[90mAs puladas não indicam problema: o banco está sem contagens.\n" +
      "Rode de novo depois do primeiro culto lançado para cobrir tudo.\x1b[0m",
  );
}
process.exit(falhou ? 1 : 0);
