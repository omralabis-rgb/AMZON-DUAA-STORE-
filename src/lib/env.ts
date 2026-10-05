/**
 * Safe helper for environment variables
 */
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  WHATSAPP_NUMBER: import.meta.env.VITE_WHATSAPP_NUMBER || '966500000000',
  isSupabaseConfigured(): boolean {
    return Boolean(this.SUPABASE_URL && this.SUPABASE_ANON_KEY && !this.SUPABASE_URL.includes('your-project-id'));
  },
};
