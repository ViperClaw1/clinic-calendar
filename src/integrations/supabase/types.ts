export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointment_types: {
        Row: {
          name: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          ends_at: string
          id: string
          location_id: string
          notes: string | null
          patient_id: string
          physician_id: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type: string
        }
        Insert: {
          ends_at: string
          id?: string
          location_id: string
          notes?: string | null
          patient_id: string
          physician_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type: string
        }
        Update: {
          ends_at?: string
          id?: string
          location_id?: string
          notes?: string | null
          patient_id?: string
          physician_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["name"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor?: string | null
          at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor?: string | null
          at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      clinic_members: {
        Row: {
          physician_id: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          physician_id?: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          physician_id?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: true
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          id: string
          name: string
          timezone: string
        }
        Insert: {
          address: string
          id?: string
          name: string
          timezone: string
        }
        Update: {
          address?: string
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          date_of_birth: string | null
          email: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          date_of_birth?: string | null
          email: string
          id?: string
          name: string
          phone: string
        }
        Update: {
          date_of_birth?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      physician_availability: {
        Row: {
          end_time: string
          id: string
          location_id: string
          physician_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          end_time: string
          id?: string
          location_id: string
          physician_id: string
          start_time: string
          weekday: number
        }
        Update: {
          end_time?: string
          id?: string
          location_id?: string
          physician_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "physician_availability_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physician_availability_physician_id_location_id_fkey"
            columns: ["physician_id", "location_id"]
            isOneToOne: false
            referencedRelation: "physician_locations"
            referencedColumns: ["physician_id", "location_id"]
          },
        ]
      }
      physician_locations: {
        Row: {
          location_id: string
          physician_id: string
        }
        Insert: {
          location_id: string
          physician_id: string
        }
        Update: {
          location_id?: string
          physician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physician_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physician_locations_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
        ]
      }
      physicians: {
        Row: {
          avatar_url: string | null
          id: string
          name: string
          specialty: string
        }
        Insert: {
          avatar_url?: string | null
          id?: string
          name: string
          specialty: string
        }
        Update: {
          avatar_url?: string | null
          id?: string
          name?: string
          specialty?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_physician_availability: {
        Args: { p_location_id: string; p_physician_id: string; p_ranges: Json }
        Returns: undefined
      }
      timemultirange: { Args: never; Returns: unknown }
    }
    Enums: {
      appointment_status:
        | "confirmed"
        | "pending"
        | "cancelled"
        | "completed"
        | "no-show"
      member_role: "admin" | "receptionist" | "physician" | "viewer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_status: [
        "confirmed",
        "pending",
        "cancelled",
        "completed",
        "no-show",
      ],
      member_role: ["admin", "receptionist", "physician", "viewer"],
    },
  },
} as const

