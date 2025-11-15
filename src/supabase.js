import { createClient } from '@supabase/supabase-js';

// Replace with actual Supabase project URL and anon key for production
const supabaseUrl = 'https://your-project-ref.supabase.co'; // Placeholder URL
const supabaseKey = 'your-anon-key'; // Placeholder key

export const supabase = createClient(supabaseUrl, supabaseKey);
