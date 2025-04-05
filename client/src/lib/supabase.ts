import { createClient } from '@supabase/supabase-js';

// Create a single Supabase client for the entire application
// Read API key and URL from environment variables or use default for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
