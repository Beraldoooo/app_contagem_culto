/**
 * Tipos do banco (Supabase) — escritos à mão a partir de `supabase/schema.sql`.
 *
 * Depois de rodar o schema no seu projeto, regenere a partir da fonte real:
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin_geral" | "contador" | "visualizador" | "pendente";
export type UserStatus = "pendente" | "aprovado" | "banido";
export type EventoTipo = "culto_fixo" | "evento_especial";

/** Onde a equipe serve. "pastoral" é separado porque vai em linha própria nas mensagens. */
export type ItemGrupo = "fora" | "dentro" | "pastoral";
/** Em qual linha do resumo o público de um item é somado. */
export type SomaEm = "criancas" | "pads" | "volts";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          /** Nome de exibição. `null` = não informado (mostra o e-mail). */
          nome: string | null;
          role: UserRole;
          status: UserStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nome?: string | null;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nome?: string | null;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      horarios_padrao: {
        Row: {
          id: string;
          dia_semana: number;
          horario: string;
          nome: string;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          dia_semana: number;
          horario: string;
          nome: string;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          dia_semana?: number;
          horario?: string;
          nome?: string;
          ativo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      eventos: {
        Row: {
          id: string;
          tipo: EventoTipo;
          nome: string;
          data: string;
          horario: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tipo: EventoTipo;
          nome: string;
          data: string;
          horario: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tipo?: EventoTipo;
          nome?: string;
          data?: string;
          horario?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      contagens: {
        Row: {
          id: string;
          evento_id: string;
          /** @deprecated substituída por adultos + contagens_itens; sai num script futuro. */
          quantidade: number | null;
          adultos: number | null;
          homens: number | null;
          observacao: string | null;
          lancado_por: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          quantidade?: number | null;
          adultos?: number | null;
          homens?: number | null;
          observacao?: string | null;
          lancado_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          quantidade?: number | null;
          adultos?: number | null;
          homens?: number | null;
          observacao?: string | null;
          lancado_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contagens_evento_id_fkey";
            columns: ["evento_id"];
            // UNIQUE(evento_id): o embed devolve objeto, não lista
            isOneToOne: true;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      itens_contagem: {
        Row: {
          id: string;
          codigo: string;
          nome: string;
          grupo: ItemGrupo;
          tem_servindo: boolean;
          tem_publico: boolean;
          /** Em qual linha do resumo o público deste item soma. */
          soma_em: SomaEm | null;
          ordem: number;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          nome: string;
          grupo: ItemGrupo;
          tem_servindo?: boolean;
          tem_publico?: boolean;
          soma_em?: SomaEm | null;
          ordem: number;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          codigo?: string;
          nome?: string;
          grupo?: ItemGrupo;
          tem_servindo?: boolean;
          tem_publico?: boolean;
          soma_em?: SomaEm | null;
          ordem?: number;
          ativo?: boolean;
        };
        Relationships: [];
      };
      contagens_itens: {
        Row: {
          id: string;
          contagem_id: string;
          item_id: string;
          servindo: number | null;
          publico: number | null;
        };
        Insert: {
          id?: string;
          contagem_id: string;
          item_id: string;
          servindo?: number | null;
          publico?: number | null;
        };
        Update: {
          id?: string;
          contagem_id?: string;
          item_id?: string;
          servindo?: number | null;
          publico?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "contagens_itens_contagem_id_fkey";
            columns: ["contagem_id"];
            isOneToOne: false;
            referencedRelation: "contagens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contagens_itens_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "itens_contagem";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      resumo_por_evento: {
        Row: {
          evento_id: string;
          data: string;
          horario: string;
          tipo: EventoTipo;
          nome: string;
          contagem_id: string | null;
          adultos: number | null;
          homens: number | null;
          observacao: string | null;
          lancado_por: string | null;
          updated_at: string | null;
          /** null quando a categoria não foi contada — diferente de 0. */
          criancas: number | null;
          pads: number | null;
          volts: number | null;
          servindo_fora: number;
          servindo_dentro: number;
          pastoral: number;
          lancado: boolean;
          total_simples: number;
          total_detalhado: number;
        };
        Relationships: [];
      };
      totais_por_data: {
        Row: {
          data: string;
          tem_culto_fixo: boolean;
          tem_evento_especial: boolean;
          horarios: number;
          horarios_lancados: number;
          total: number;
          total_detalhado: number;
          horarios_cultos: number;
          lancados_cultos: number;
          total_cultos: number;
          horarios_eventos: number;
          lancados_eventos: number;
          total_eventos: number;
          homens_cultos: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      gerar_eventos_fixos: {
        Args: { p_data: string };
        Returns: Database["public"]["Tables"]["eventos"]["Row"][];
      };
      tem_acesso: { Args: Record<string, never>; Returns: boolean };
      pode_lancar: { Args: Record<string, never>; Returns: boolean };
      eh_admin: { Args: Record<string, never>; Returns: boolean };
      definir_meu_nome: { Args: { p_nome: string }; Returns: undefined };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      evento_tipo: EventoTipo;
      item_grupo: ItemGrupo;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Evento = Database["public"]["Tables"]["eventos"]["Row"];
export type Contagem = Database["public"]["Tables"]["contagens"]["Row"];
export type TotalPorData = Database["public"]["Views"]["totais_por_data"]["Row"];
