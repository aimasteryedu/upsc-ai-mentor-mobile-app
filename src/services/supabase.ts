import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Supabase configuration
const supabaseUrl = 'https://sbqkzzjbigcgtgyletqw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza2FucGJzYnBhZHZnYnVyaGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTIzNTIsImV4cCI6MjA3MjgyODM1Mn0.jR-H_shjTKVVsD0mJeVxdcOFK7Ryq-G8F97osKfdCOY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Supabase
export async function initSupabase() {
  try {
    // Store credentials securely for future use
    await SecureStore.setItemAsync('SUPABASE_URL', supabaseUrl);
    await SecureStore.setItemAsync('SUPABASE_ANON_KEY', supabaseAnonKey);
    console.log('Supabase initialized successfully');
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
}

export { supabase };
