import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcdjpdnbgzsqrwtxmxmm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZGpwZG5iZ3pzcXJ3dHhteG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDExODMsImV4cCI6MjA3NzAxNzE4M30.KrHvYdc9OFR8UgF9qyi2s-i27XTB3D86dyRezQRlIKg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
