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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          status: UserStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
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
          quantidade: number;
          lancado_por: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          quantidade: number;
          lancado_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          quantidade?: number;
          lancado_por?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      gerar_eventos_fixos: {
        Args: { p_data: string };
        Returns: Database["public"]["Tables"]["eventos"]["Row"][];
      };
      tem_acesso: { Args: Record<string, never>; Returns: boolean };
      pode_lancar: { Args: Record<string, never>; Returns: boolean };
      eh_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      evento_tipo: EventoTipo;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Evento = Database["public"]["Tables"]["eventos"]["Row"];
export type Contagem = Database["public"]["Tables"]["contagens"]["Row"];
