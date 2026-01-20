export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          company_id: string | null
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
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
      bots: {
        Row: {
          channels: string[] | null
          company_id: string | null
          created_at: string
          flows: Json
          id: string
          name: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          channels?: string[] | null
          company_id?: string | null
          created_at?: string
          flows?: Json
          id: string
          name: string
          status: string
          updated_at?: string
          version: string
        }
        Update: {
          channels?: string[] | null
          company_id?: string | null
          created_at?: string
          flows?: Json
          id?: string
          name?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "bots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          agendamento: string | null
          company_id: string | null
          conversation_id: string | null
          corretiva: boolean
          created_at: string
          descricao: string
          google_sheet_id: string | null
          id: string
          local: string
          metadata: Json | null
          numero_chamado: string
          placa: string
          status: string
          updated_at: string
        }
        Insert: {
          agendamento?: string | null
          company_id?: string | null
          conversation_id?: string | null
          corretiva: boolean
          created_at?: string
          descricao: string
          google_sheet_id?: string | null
          id?: string
          local: string
          metadata?: Json | null
          numero_chamado: string
          placa: string
          status?: string
          updated_at?: string
        }
        Update: {
          agendamento?: string | null
          company_id?: string | null
          conversation_id?: string | null
          corretiva?: boolean
          created_at?: string
          descricao?: string
          google_sheet_id?: string | null
          id?: string
          local?: string
          metadata?: Json | null
          numero_chamado?: string
          placa?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string
          phone: string | null
          tags: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone?: string | null
          tags?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string | null
          tags?: Json | null
          updated_at?: string
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
          access_token: string | null
          archived: boolean | null
          assigned_to: string | null
          bot_active: boolean | null
          channel: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          archived?: boolean | null
          assigned_to?: string | null
          bot_active?: boolean | null
          channel: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          archived?: boolean | null
          assigned_to?: string | null
          bot_active?: boolean | null
          channel?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          company_id: string | null
          created_at: string
          error_message: string | null
          id: string
          instance_name: string
          last_cursor: string | null
          metadata: Json | null
          phase: string
          processed_items: number | null
          status: string
          total_items: number | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instance_name: string
          last_cursor?: string | null
          metadata?: Json | null
          phase?: string
          processed_items?: number | null
          status?: string
          total_items?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instance_name?: string
          last_cursor?: string | null
          metadata?: Json | null
          phase?: string
          processed_items?: number | null
          status?: string
          total_items?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_conversations: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_group: boolean
          participants: string[]
          title: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          participants: string[]
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          participants?: string[]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          read_by: string[] | null
          sender_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          read_by?: string[] | null
          sender_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          read_by?: string[] | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "internal_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      lid_phone_mapping: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          instance_name: string | null
          lid: string
          phone: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          instance_name?: string | null
          lid: string
          phone: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          instance_name?: string | null
          lid?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lid_phone_mapping_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lid_phone_mapping_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          contact_phone: string
          content: string
          conversation_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          instance_name: string
          max_retries: number | null
          media_url: string | null
          message_type: string | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_phone: string
          content: string
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_name: string
          max_retries?: number | null
          media_url?: string | null
          message_type?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_phone?: string
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_name?: string
          max_retries?: number | null
          media_url?: string | null
          message_type?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          permissions: Json | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
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
      smtp_settings: {
        Row: {
          company_id: string
          created_at: string
          from_email: string
          from_name: string | null
          id: string
          is_active: boolean | null
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_security: string
          smtp_user: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          from_email: string
          from_name?: string | null
          id?: string
          is_active?: boolean | null
          smtp_host: string
          smtp_password: string
          smtp_port?: number
          smtp_security?: string
          smtp_user: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          from_email?: string
          from_name?: string | null
          id?: string
          is_active?: boolean | null
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_security?: string
          smtp_user?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smtp_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_status: {
        Row: {
          contact_id: string | null
          conversation_id: string | null
          expires_at: string | null
          id: string
          is_typing: boolean | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          conversation_id?: string | null
          expires_at?: string | null
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          conversation_id?: string | null
          expires_at?: string | null
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          created_at: string
          custom_message: string | null
          last_seen: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          last_seen?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          last_seen?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_instances: {
        Row: {
          bot_enabled: boolean | null
          company_id: string | null
          connection_state: string | null
          created_at: string
          id: string
          instance_name: string
          last_sync: string | null
          phone_number: string | null
          qr_code: string | null
          status: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          bot_enabled?: boolean | null
          company_id?: string | null
          connection_state?: string | null
          created_at?: string
          id?: string
          instance_name: string
          last_sync?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          bot_enabled?: boolean | null
          company_id?: string | null
          connection_state?: string | null
          created_at?: string
          id?: string
          instance_name?: string
          last_sync?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_statuses: {
        Row: {
          background_color: string | null
          caption: string | null
          company_id: string | null
          contact_id: string | null
          content: string | null
          content_type: string
          created_at: string
          expires_at: string | null
          id: string
          instance_name: string
          media_url: string | null
          message_id: string | null
          metadata: Json | null
          remote_jid: string
          thumbnail_base64: string | null
          viewed: boolean | null
          viewed_at: string | null
        }
        Insert: {
          background_color?: string | null
          caption?: string | null
          company_id?: string | null
          contact_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          instance_name: string
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          remote_jid: string
          thumbnail_base64?: string | null
          viewed?: boolean | null
          viewed_at?: string | null
        }
        Update: {
          background_color?: string | null
          caption?: string | null
          company_id?: string | null
          contact_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          instance_name?: string
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          remote_jid?: string
          thumbnail_base64?: string | null
          viewed?: boolean | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_statuses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_statuses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_typing_status: { Args: never; Returns: undefined }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_company_ids: { Args: { _user_id: string }; Returns: string[] }
      get_web_conversation_messages: {
        Args: { p_access_token: string; p_conversation_id: string }
        Returns: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_type: string
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      send_web_conversation_message: {
        Args: {
          p_access_token: string
          p_content: string
          p_conversation_id: string
        }
        Returns: string
      }
    }
    Enums: {
      user_status: "online" | "away" | "busy" | "offline"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_status: ["online", "away", "busy", "offline"],
    },
  },
} as const
