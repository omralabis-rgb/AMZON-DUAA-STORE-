import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!env.isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }

  return supabaseClient;
}
