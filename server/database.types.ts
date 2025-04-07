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
      users: {
        Row: {
          id: number
          username: string
          password: string
        }
        Insert: {
          id?: number
          username: string
          password: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          id: number
          name: string
          description: string
          is_active: boolean
          timer_duration: number
          question_count: number
          weekly_leaderboard: boolean
          monthly_leaderboard: boolean
          reward: string
          game_type: string
          feltrinelli_game_id: string
          difficulty: number
          created_at: Date
        }
        Insert: {
          id?: number
          name: string
          description: string
          is_active?: boolean
          timer_duration: number
          question_count: number
          weekly_leaderboard?: boolean
          monthly_leaderboard?: boolean
          reward: string
          game_type?: string
          feltrinelli_game_id?: string
          difficulty?: number
          created_at?: Date
        }
        Update: {
          id?: number
          name?: string
          description?: string
          is_active?: boolean
          timer_duration?: number
          question_count?: number
          weekly_leaderboard?: boolean
          monthly_leaderboard?: boolean
          reward?: string
          game_type?: string
          feltrinelli_game_id?: string
          difficulty?: number
          created_at?: Date
        }
        Relationships: []
      }
      badges: {
        Row: {
          id: number
          name: string
          description: string
          icon: string
          color: string
          created_at: Date
        }
        Insert: {
          id?: number
          name: string
          description: string
          icon: string
          color: string
          created_at?: Date
        }
        Update: {
          id?: number
          name?: string
          description?: string
          icon?: string
          color?: string
          created_at?: Date
        }
        Relationships: []
      }
      game_badges: {
        Row: {
          id: number
          game_id: number
          badge_id: number
        }
        Insert: {
          id?: number
          game_id: number
          badge_id: number
        }
        Update: {
          id?: number
          game_id?: number
          badge_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_badges_badge_id_fkey"
            columns: ["badge_id"]
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_badges_game_id_fkey"
            columns: ["game_id"]
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      rewards: {
        Row: {
          id: number
          name: string
          description: string
          type: string
          value: string
          icon: string
          color: string
          available: number
          created_at: Date
        }
        Insert: {
          id?: number
          name: string
          description: string
          type: string
          value: string
          icon: string
          color: string
          available: number
          created_at?: Date
        }
        Update: {
          id?: number
          name?: string
          description?: string
          type?: string
          value?: string
          icon?: string
          color?: string
          available?: number
          created_at?: Date
        }
        Relationships: []
      }
      stats: {
        Row: {
          id: number
          total_games: number
          active_games: number
          active_users: number
          awarded_badges: number
          updated_at: Date
        }
        Insert: {
          id?: number
          total_games?: number
          active_games?: number
          active_users?: number
          awarded_badges?: number
          updated_at?: Date
        }
        Update: {
          id?: number
          total_games?: number
          active_games?: number
          active_users?: number
          awarded_badges?: number
          updated_at?: Date
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}