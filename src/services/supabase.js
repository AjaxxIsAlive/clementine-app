import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing Supabase environment variables - memory will fallback to localStorage')
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Helper function to set user context for RLS
export const setUserContext = async (userId) => {
  if (!supabase) return
  
  try {
    // Try to call the set_config function, but don't fail if it doesn't work
    const { error } = await supabase.rpc('set_config', {
      setting_name: 'app.current_user_id',
      setting_value: userId
    })
    
    if (error && error.code !== '42883') {
      // Ignore "function does not exist" errors during development
      console.error('Error setting user context:', error)
    }
  } catch (error) {
    // Silently handle RLS context issues during development
    console.debug('⚠️ RLS context setting skipped:', error.message)
  }
}
