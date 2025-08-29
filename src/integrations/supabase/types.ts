export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_knowledge: {
        Row: {
          agent_id: string
          answer: string | null
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          question: string | null
          type: string
          url: string | null
        }
        Insert: {
          agent_id: string
          answer?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          question?: string | null
          type: string
          url?: string | null
        }
        Update: {
          agent_id?: string
          answer?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          question?: string | null
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_processes: {
        Row: {
          agent_id: string
          created_at: string
          description: string
          id: string
          order: number
        }
        Insert: {
          agent_id: string
          created_at?: string
          description: string
          id?: string
          order: number
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string
          id?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_processes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          channels: string[]
          company_id: string
          created_at: string
          description: string | null
          function: Database["public"]["Enums"]["agent_function"]
          id: string
          name: string
          status: Database["public"]["Enums"]["agent_status"]
          template: Database["public"]["Enums"]["agent_template"]
          tone: string | null
          updated_at: string
        }
        Insert: {
          channels?: string[]
          company_id: string
          created_at?: string
          description?: string | null
          function: Database["public"]["Enums"]["agent_function"]
          id?: string
          name: string
          status?: Database["public"]["Enums"]["agent_status"]
          template: Database["public"]["Enums"]["agent_template"]
          tone?: string | null
          updated_at?: string
        }
        Update: {
          channels?: string[]
          company_id?: string
          created_at?: string
          description?: string | null
          function?: Database["public"]["Enums"]["agent_function"]
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["agent_status"]
          template?: Database["public"]["Enums"]["agent_template"]
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          channel: Database["public"]["Enums"]["event_channel"]
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          end: string
          id: string
          is_from_google: boolean | null
          location: string | null
          reminder_minutes: number
          start: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["event_channel"]
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          end: string
          id?: string
          is_from_google?: boolean | null
          location?: string | null
          reminder_minutes: number
          start: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["event_channel"]
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end?: string
          id?: string
          is_from_google?: boolean | null
          location?: string | null
          reminder_minutes?: number
          start?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar: string | null
          channel: Database["public"]["Enums"]["conversation_channel"]
          company_id: string
          created_at: string
          id: string
          name: string
          preview: string | null
          time: string
          unread: number
        }
        Insert: {
          avatar?: string | null
          channel: Database["public"]["Enums"]["conversation_channel"]
          company_id: string
          created_at?: string
          id?: string
          name: string
          preview?: string | null
          time: string
          unread?: number
        }
        Update: {
          avatar?: string | null
          channel?: Database["public"]["Enums"]["conversation_channel"]
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          preview?: string | null
          time?: string
          unread?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender: Database["public"]["Enums"]["message_sender"]
          timestamp: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: Database["public"]["Enums"]["message_sender"]
          timestamp: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: Database["public"]["Enums"]["message_sender"]
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          contact_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at: string
          id?: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          note_id: string
          text: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          note_id: string
          text: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          note_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      insert_demo_data: {
        Args: { company_id: string }
        Returns: undefined
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      user_belongs_to_company: {
        Args: { company_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      agent_function: "SDR" | "Suporte" | "Vendas" | "Genérico"
      agent_status: "active" | "training" | "error"
      agent_template: "SDR" | "Suporte N1" | "Vendas" | "Genérico"
      conversation_channel: "whatsapp" | "instagram" | "messenger" | "telegram"
      event_channel: "Interno" | "Videochamada" | "Telefone"
      event_status: "confirmed" | "tentative" | "cancelled"
      message_sender: "user" | "agent" | "bot"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_function: ["SDR", "Suporte", "Vendas", "Genérico"],
      agent_status: ["active", "training", "error"],
      agent_template: ["SDR", "Suporte N1", "Vendas", "Genérico"],
      conversation_channel: ["whatsapp", "instagram", "messenger", "telegram"],
      event_channel: ["Interno", "Videochamada", "Telefone"],
      event_status: ["confirmed", "tentative", "cancelled"],
      message_sender: ["user", "agent", "bot"],
    },
  },
} as const
