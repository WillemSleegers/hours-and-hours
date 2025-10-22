export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          id: string
          project_id: string
          date: string
          time_slot: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          date: string
          time_slot: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          date?: string
          time_slot?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          day_start_hour: number
          day_end_hour: number
          time_increment: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_start_hour?: number
          day_end_hour?: number
          time_increment?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_start_hour?: number
          day_end_hour?: number
          time_increment?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
