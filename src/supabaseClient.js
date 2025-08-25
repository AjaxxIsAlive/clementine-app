// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// Single, app-wide client with consistent auth storage
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'clementine-auth', // one key everywhere
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'clementine-app'
    }
  }
});

// Admin client with service role for admin operations (bypasses RLS)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'clementine-admin'
    }
  }
}) : null;

export default supabase;
export { supabase, supabaseAdmin };