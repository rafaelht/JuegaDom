import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgqjwghfhyryogmnfwyf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWp3Z2hmaHlyeW9nbW5md3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjI5MjMsImV4cCI6MjA2NzkzODkyM30.gzc3MZHSk1qUhFWBqGDHHeQqBnsJYnDnadltGTDDQb8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de datos para Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      lottery_numbers: {
        Row: {
          id: string;
          user_id: string;
          numbers: string;
          mas_number: string | null;
          game_type: string;
          generated_at: string;
          is_deleted: boolean;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          numbers: string;
          mas_number?: string | null;
          game_type: string;
          generated_at?: string;
          is_deleted?: boolean;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          numbers?: string;
          mas_number?: string | null;
          game_type?: string;
          generated_at?: string;
          is_deleted?: boolean;
          deleted_at?: string | null;
        };
      };
      number_statistics: {
        Row: {
          id: number;
          number: number;
          game_type: string;
          frequency: number;
          last_appearance: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          number: number;
          game_type: string;
          frequency?: number;
          last_appearance?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          number?: number;
          game_type?: string;
          frequency?: number;
          last_appearance?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 