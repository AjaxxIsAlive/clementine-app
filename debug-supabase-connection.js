// DEBUG SUPABASE CONNECTION AND SCHEMA
// Run this in browser console to test Supabase directly

console.log('=== SUPABASE DEBUG ===');

// Test basic connection
import { memoryService } from './src/services/memoryService.js';

// Test user creation with detailed logging
const testUserId = 'clementine_anthony_anthonypaulsmailgmailcom_1753991265954';
const testEmail = 'anthonypaulsmail@gmail.com';
const testName = 'Anthony';

console.log('Testing Supabase connection...');

// First, let's check if we can query the tables
const testConnection = async () => {
  try {
    // Test if tables exist by querying them
    const { data: profiles, error: profileError } = await memoryService.supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (profileError) {
      console.error('❌ user_profiles table error:', profileError);
    } else {
      console.log('✅ user_profiles table accessible');
    }

    const { data: memory, error: memoryError } = await memoryService.supabase
      .from('user_memory') 
      .select('count')
      .limit(1);
    
    if (memoryError) {
      console.error('❌ user_memory table error:', memoryError);
    } else {
      console.log('✅ user_memory table accessible');
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
};

testConnection();
