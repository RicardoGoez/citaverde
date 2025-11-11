import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xcdjpdnbgzsqrwtxmxmm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZGpwZG5iZ3pzcXJ3dHhteG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDExODMsImV4cCI6MjA3NzAxNzE4M30.KrHvYdc9OFR8UgF9qyi2s-i27XTB3D86dyRezQRlIKg';

// Cliente de Supabase para operaciones del servidor (con permisos de Auth)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});


