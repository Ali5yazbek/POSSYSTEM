import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase project URL and anon key
const supabaseUrl = 'https://ppirdszxvlbiqpndemet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaXJkc3p4dmxiaXFwbmRlbWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjQxMzIsImV4cCI6MjA3MzIwMDEzMn0.do6OX5zQdk6fSq52ALVl7L07JVDk515iHyhOko85duU';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);