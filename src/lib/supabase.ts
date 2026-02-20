import { createClient } from '@supabase/supabase-js';
import { SyncItem } from '../types/synaps';

export type Database = {
  public: {
    Tables: {
      sync_items: {
        Row: SyncItem;
        Insert: Omit<SyncItem, 'id' | 'created_at'>;
        Update: Partial<Omit<SyncItem, 'id' | 'created_at'>>;
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);