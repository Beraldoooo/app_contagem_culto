"use client";

import { useActionState, useMemo, useState } from "react";

import { AcaoConfirmada } from "@/components/acao-confirmada";
import { Alerta } from "@/components/alerta";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Cartao, RotuloCartao, classesCampo } from "@/components/ui/base";
import {
  resumir,
  type Item,
  type Lancamento,
  type ValorItem,
} from "@/lib/contagem";

import { excluirContagem, salvarContagem, type EstadoContagem } from "./acoes";

export type ValoresIniciais = {
  adultos: number | null;
  homens: number | null;
  observacao: string;
  /** Por código do item. */
  itens: Record<string, ValorItem>;
};

const vazio = (): ValorItem => ({ servindo: null, publico: null });

/** "" vira null de propósito: vazio é "não contado", não zero. */
function paraNumero(texto: string): number | null {
  const limpo = texto.trim();
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}
const paraTexto = (n: number | null) => (n === null ? "" : String(n));

export function FormularioContagem({
  eventoId,
  nomeCulto,
  itens,
  iniciais,
  jaLancado,
  podeExcluir,
}: {
  eventoId: string;
  nomeCulto: string;
  itens: Item[];
  iniciais: ValoresIniciais;
  jaLancado: boolean;
  podeExcluir: boolean;
}) {
  const [estado, acao] = useActionState<EstadoContagem, FormData>(
    salvarContagem,
    {},
  );

  const [adultos, setAdultos] = useState(paraTexto(iniciais.adultos));
  const [homens, setHomens] = useState(paraTexto(iniciais.homens));
  const [valores, setValores] = useState<Record<string, ValorItem>>(() =>
    Object.fromEntries(
      itens.map((i) => [i.codigo, iniciais.itens[i.codigo] ?? vazio()]),
    ),
  );

  const lancamento: Lancamento = useMemo(
    () => ({
      adultos: paraNumero(adultos),
      homens: paraNumero(homens),
      observacao: "",
      itens: valores,
    }),
    [adultos, homens, valores],
  );
  const resumo = useMemo(() => resumir(itens, lancamento), [itens, lancamento]);

  const trocar = (codigo: string, campo: keyof ValorItem, texto: string) =>
    setValores((atual) => ({
      ...atual,
      [codigo]: { ...atual[codigo], [campo]: paraNumero(texto) },
    }));

  const homensDemais =
    resumo.adultos !== null &&
    resumo.homens !== null &&
    resumo.homens > resumo.adultos;

  const fora = itens.filter((i) => i.grupo === "fora");
  const pastoral = itens.filter((i) => i.grupo === "pastoral");
  const dentro = itens.filter((i) => i.grupo === "dentro");

  return (
    <div className="flex flex-col gap-4">
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="evento_id" value={eventoId} />

      {/* ----------------------------------------------------- congregação */}
      <Cartao as="section">
        <RotuloCartao>Congregação</RotuloCartao>
        <p className="mt-1 text-xs text-texto-3">
          Quem veio assistir. Não inclui quem está servindo.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <LinhaCampo
            rotulo="Adultos"
            name="adultos"
            valor={adultos}
            aoTrocar={setAdultos}
          />
          <LinhaCampo
            rotulo="Homens"
            dica="quantos daqueles adultos"
            name="homens"
            valor={homens}
            aoTrocar={setHomens}
            invalido={homensDemais}
          />
        </div>

        {homensDemais ? (
          <p className="mt-3 rounded-campo bg-perigo-suave px-3.5 py-2 text-sm text-perigo-texto">
            Homens não pode ser maior que Adultos.
          </p>
        ) : null}
      </Cartao>

      {/* ------------------------------------------------------------ fora */}
      <Cartao as="section">
        <RotuloCartao>Fora do culto</RotuloCartao>
        <p className="mt-1 text-xs text-texto-3">
          Por ministério: quem estava servindo e quantas crianças havia.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 pr-1 text-[11px] font-semibold uppercase tracking-wide text-texto-3">
            <span className="flex-1">Ministério</span>
            <span className="w-[72px] text-right sm:w-20">Servindo</span>
            <span className="w-[72px] text-right sm:w-20">Crianças</span>
          </div>

          {fora.map((item) => (
            <LinhaItem
              key={item.codigo}
              item={item}
              valor={valores[item.codigo]}
              aoTrocar={trocar}
              duasColunas
            />
          ))}
        </div>

        <p className="mt-3 text-xs text-texto-3">
          Campo em branco quer dizer <strong className="font-medium">não teve</strong> —
          diferente de zero. A linha some da mensagem.
        </p>
      </Cartao>

      {/* ---------------------------------------------------------- dentro */}
      <Cartao as="section">
        <RotuloCartao>Dentro do culto</RotuloCartao>
        <p className="mt-1 text-xs text-texto-3">
          Equipes servindo no salão. Pastores conta à parte.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {[...pastoral, ...dentro].map((item) => (
            <LinhaItem
              key={item.codigo}
              item={item}
              valor={valores[item.codigo]}
              aoTrocar={trocar}
            />
          ))}
        </div>
      </Cartao>

      {/* ----------------------------------------------------------- resumo */}
      <Cartao as="section">
        <RotuloCartao>O app calcula</RotuloCartao>
        <p className="mt-1 text-xs text-texto-3">Ninguém digita estes números.</p>

        <dl className="mt-4 flex flex-col gap-2 rounded-campo bg-marca-suave px-3.5 py-3 text-sm">
          <Derivado rotulo="Crianças" valor={resumo.criancas} destaque />
          <Derivado rotulo="PADS" valor={resumo.pads} destaque />
          <Derivado rotulo="Volts" valor={resumo.volts} destaque />
        </dl>

        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <Derivado rotulo="Servindo fora" valor={resumo.servindoFora} />
          <Derivado rotulo="Servindo dentro" valor={resumo.servindoDentro} />
          <Derivado rotulo="Equipe pastoral" valor={resumo.pastoral} />
        </dl>

        <div className="mt-4 flex flex-col gap-2">
          <Total
            rotulo="Total simples"
            nota="só congregação"
            valor={resumo.totalSimples}
            tom="sucesso"
          />
          <Total
            rotulo="Total detalhado"
            nota="com quem serviu"
            valor={resumo.totalDetalhado}
            tom="evento"
          />
        </div>
      </Cartao>

      {/* ------------------------------------------------------- observação */}
      <Cartao as="section">
        <RotuloCartao>Observação</RotuloCartao>
        <p className="mt-1 text-xs text-texto-3">
          Opcional. Para o que hoje vai anotado na margem do papel.
        </p>
        <textarea
          name="observacao"
          defaultValue={iniciais.observacao}
          maxLength={500}
          rows={2}
          placeholder="ex.: mais cinco da projeção que chegaram depois"
          className={`${classesCampo} mt-3 resize-y`}
        />
      </Cartao>

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
      {estado.ok ? <Alerta tom="info">{estado.ok}</Alerta> : null}

      <BotaoEnviar carregando="Salvando…">
        {jaLancado ? "Salvar correção" : "Salvar contagem"}
      </BotaoEnviar>
    </form>

    {/* Fora do <form> de propósito: AcaoConfirmada tem o form dela, e um
        formulário dentro do outro é HTML inválido. */}
    {jaLancado && podeExcluir ? (
      <AcaoConfirmada
        acao={excluirContagem}
        campos={{ evento_id: eventoId }}
        rotulo="Excluir lançamento"
        pergunta={`Excluir a contagem de ${nomeCulto}?`}
        consequencia="O culto volta a ficar pendente e sai das mensagens do dia. Para registrar que ninguém veio, salve 0 em vez de excluir."
        rotuloConfirmar="Excluir"
        tom="perigo"
      />
    ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function LinhaCampo({
  rotulo,
  dica,
  name,
  valor,
  aoTrocar,
  invalido,
}: {
  rotulo: string;
  dica?: string;
  name: string;
  valor: string;
  aoTrocar: (v: string) => void;
  invalido?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={name} className="flex-1 text-sm">
        {rotulo}
        {dica ? <span className="block text-xs text-texto-3">{dica}</span> : null}
      </label>
      <input
        id={name}
        name={name}
        value={valor}
        onChange={(e) => aoTrocar(e.target.value)}
        type="number"
        min={0}
        inputMode="numeric"
        aria-invalid={invalido || undefined}
        className={`${classesCampo} w-[88px] text-right tabular-nums ${
          invalido ? "border-perigo" : ""
        }`}
      />
    </div>
  );
}

function LinhaItem({
  item,
  valor,
  aoTrocar,
  duasColunas,
}: {
  item: Item;
  valor: ValorItem;
  aoTrocar: (codigo: string, campo: keyof ValorItem, texto: string) => void;
  duasColunas?: boolean;
}) {
  const campo = (tipo: "servindo" | "publico") => {
    const existe = tipo === "servindo" ? item.tem_servindo : item.tem_publico;
    const prefixo = tipo === "servindo" ? "s" : "p";
    if (!existe) {
      // Espaço reservado: sem ele as colunas desalinham e a leitura trava.
      return <div className="w-[72px] sm:w-20" aria-hidden />;
    }
    return (
      <input
        id={`${prefixo}_${item.codigo}`}
        name={`${prefixo}_${item.codigo}`}
        value={paraTexto(valor[tipo])}
        onChange={(e) => aoTrocar(item.codigo, tipo, e.target.value)}
        type="number"
        min={0}
        inputMode="numeric"
        aria-label={`${item.nome} — ${tipo === "servindo" ? "servindo" : "crianças"}`}
        className={`${classesCampo} w-[72px] text-right tabular-nums sm:w-20`}
      />
    );
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`${item.tem_servindo ? "s" : "p"}_${item.codigo}`}
        className="flex-1 text-sm"
      >
        {item.nome}
      </label>
      {campo("servindo")}
      {duasColunas ? campo("publico") : null}
    </div>
  );
}

function Derivado({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: number | null;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={destaque ? "text-marca-texto" : "text-texto-2"}>{rotulo}</dt>
      <dd
        className={`font-semibold tabular-nums ${
          destaque ? "text-marca-texto" : ""
        }`}
      >
        {valor === null ? "—" : valor}
      </dd>
    </div>
  );
}

function Total({
  rotulo,
  nota,
  valor,
  tom,
}: {
  rotulo: string;
  nota: string;
  valor: number;
  tom: "sucesso" | "evento";
}) {
  const cores =
    tom === "sucesso"
      ? "bg-sucesso-suave text-sucesso-texto"
      : "bg-evento-suave text-evento-texto";

  return (
    <div className={`flex items-baseline justify-between gap-3 rounded-campo px-3.5 py-2.5 ${cores}`}>
      <span className="text-sm font-medium">
        {rotulo}
        <span className="block text-xs font-normal opacity-80">{nota}</span>
      </span>
      <span className="text-2xl font-bold tabular-nums tracking-tight">{valor}</span>
    </div>
  );
}
