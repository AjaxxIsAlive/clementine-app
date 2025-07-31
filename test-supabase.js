const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Connection Test');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey ? supabaseKey.length : 'missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('\n🧪 Testing Supabase Connection...');
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ Basic connection failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Basic connection successful:', data);
    }

    // Test 2: Check if RPC function exists
    console.log('\n2️⃣ Testing RPC function...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('set_config', {
      setting_name: 'test.value',
      setting_value: 'test'
    });
    
    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError);
      console.error('RPC Error details:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code
      });
    } else {
      console.log('✅ RPC function successful:', rpcData);
    }

    // Test 3: Test user_memory table access
    console.log('\n3️⃣ Testing user_memory table...');
    const { data: memoryData, error: memoryError } = await supabase
      .from('user_memory')
      .select('*')
      .limit(1);
    
    if (memoryError) {
      console.error('❌ user_memory table access failed:', memoryError);
      console.error('Memory Error details:', {
        message: memoryError.message,
        details: memoryError.details,
        hint: memoryError.hint,
        code: memoryError.code
      });
    } else {
      console.log('✅ user_memory table access successful:', memoryData);
    }

    // Test 4: Test inserting data
    console.log('\n4️⃣ Testing data insertion...');
    const testUserId = 'test_user_' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        email: 'test@example.com',
        name: 'Test User'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Data insertion failed:', insertError);
      console.error('Insert Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Data insertion successful:', insertData);
      
      // Clean up test data
      await supabase.from('user_profiles').delete().eq('user_id', testUserId);
    }

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

testSupabaseConnection().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
});
