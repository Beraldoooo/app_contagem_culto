"use client";

import { useState } from "react";

import type { Profile, UserRole } from "@/types/database";

import { AcaoConfirmada } from "@/components/acao-confirmada";
import { classesCampo, Selo } from "@/components/ui/base";
import {
  alterarPapel,
  aprovarUsuario,
  banirUsuario,
  reverterBanimento,
} from "./acoes";

const ROTULO_ROLE: Record<UserRole, string> = {
  admin_geral: "Administrador Geral",
  contador: "Contador",
  visualizador: "Visualizador",
  pendente: "Pendente",
};

const PAPEIS: UserRole[] = ["visualizador", "contador", "admin_geral"];

function Etiqueta({
  children,
  tom,
}: {
  children: React.ReactNode;
  tom: "verde" | "ambar" | "vermelho" | "cinza";
}) {
  const tons = {
    verde: "sucesso",
    ambar: "aviso",
    vermelho: "perigo",
    cinza: "neutro",
  } as const;

  return <Selo tom={tons[tom]}>{children}</Selo>;
}

export function LinhaUsuario({
  perfil,
  souEu,
}: {
  perfil: Profile;
  souEu: boolean;
}) {
  const [papelEscolhido, setPapelEscolhido] = useState<UserRole>(
    PAPEIS.includes(perfil.role) ? perfil.role : "visualizador",
  );

  // O admin precisa saber quem é quem: nome em destaque e o e-mail embaixo.
  // Sem nome definido, o próprio e-mail serve de identificação.
  const quem = perfil.nome?.trim() || perfil.email;

  const mudouPapel = papelEscolhido !== perfil.role;
  const viraAdmin = papelEscolhido === "admin_geral";

  return (
    <li className="flex flex-col gap-4 rounded-cartao border border-borda bg-superficie p-5 shadow-cartao">
      <div className="flex flex-col gap-1.5">
        <span className="truncate text-[15px] font-semibold">{quem}</span>
        {quem !== perfil.email ? (
          <span className="-mt-1 truncate text-xs text-texto-3">{perfil.email}</span>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5">
          <Etiqueta tom={perfil.role === "admin_geral" ? "verde" : "cinza"}>
            {ROTULO_ROLE[perfil.role]}
          </Etiqueta>
          {perfil.status === "pendente" ? (
            <Etiqueta tom="ambar">Aguardando aprovação</Etiqueta>
          ) : null}
          {perfil.status === "banido" ? (
            <Etiqueta tom="vermelho">Banido</Etiqueta>
          ) : null}
          {souEu ? <Etiqueta tom="cinza">Você</Etiqueta> : null}
        </div>
      </div>

      {souEu ? (
        <p className="text-xs text-texto-3">
          Você não pode alterar o próprio acesso. Outro Administrador Geral faz
          essa mudança — assim ninguém se tranca para fora sozinho.
        </p>
      ) : null}

      {!souEu && perfil.status === "pendente" ? (
        <AcaoConfirmada
          acao={aprovarUsuario}
          campos={{ id: perfil.id }}
          rotulo="Aprovar acesso"
          pergunta={`Aprovar ${quem}?`}
          consequencia="Entra como Visualizador, podendo consultar totais e comparativos, mas sem lançar contagens. O papel pode ser mudado depois."
          rotuloConfirmar="Aprovar"
        />
      ) : null}

      {!souEu && perfil.status === "aprovado" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`papel-${perfil.id}`}
              className="text-xs font-medium text-texto-2"
            >
              Papel
            </label>
            <select
              id={`papel-${perfil.id}`}
              value={papelEscolhido}
              onChange={(e) => setPapelEscolhido(e.target.value as UserRole)}
              className={`${classesCampo} h-10 text-sm`}
            >
              {PAPEIS.map((papel) => (
                <option key={papel} value={papel}>
                  {ROTULO_ROLE[papel]}
                </option>
              ))}
            </select>
          </div>

          {mudouPapel ? (
            <AcaoConfirmada
              acao={alterarPapel}
              campos={{ id: perfil.id, role: papelEscolhido }}
              rotulo={`Alterar para ${ROTULO_ROLE[papelEscolhido]}`}
              tom={viraAdmin ? "atencao" : "neutro"}
              pergunta={`Mudar ${quem} de ${ROTULO_ROLE[perfil.role]} para ${ROTULO_ROLE[papelEscolhido]}?`}
              consequencia={
                viraAdmin
                  ? "Administrador Geral tem acesso total: aprova, promove e bane qualquer usuário — inclusive você."
                  : papelEscolhido === "contador"
                    ? "Contador pode criar eventos e lançar as contagens dos cultos."
                    : "Visualizador só consulta totais e comparativos, sem lançar contagens."
              }
              rotuloConfirmar={viraAdmin ? "Sim, promover a admin" : "Alterar"}
            />
          ) : null}

          <AcaoConfirmada
            acao={banirUsuario}
            campos={{ id: perfil.id }}
            rotulo="Banir"
            tom="perigo"
            pergunta={`Banir ${quem}?`}
            consequencia="Perde o acesso na hora: a sessão é encerrada no próximo carregamento e ele para de enxergar qualquer dado. Os lançamentos já feitos permanecem. Dá para reverter depois."
            rotuloConfirmar="Sim, banir"
          />
        </div>
      ) : null}

      {!souEu && perfil.status === "banido" ? (
        <AcaoConfirmada
          acao={reverterBanimento}
          campos={{ id: perfil.id }}
          rotulo="Reverter banimento"
          pergunta={`Devolver o acesso a ${quem}?`}
          consequencia={`Volta a entrar normalmente como ${ROTULO_ROLE[perfil.role]}.`}
          rotuloConfirmar="Reverter"
        />
      ) : null}
    </li>
  );
}
