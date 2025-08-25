#!/usr/bin/env node

// Add personal_data column to profiles table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE;

if (!supabaseServiceKey) {
  console.error('❌ REACT_APP_SUPABASE_SERVICE_ROLE environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPersonalDataColumn() {
  console.log('🔧 Adding personal_data column to profiles table...');
  
  try {
    // Execute SQL to add the column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS personal_data JSONB DEFAULT '{}';
        
        COMMENT ON COLUMN profiles.personal_data IS 'Stores extracted personal information from conversations';
      `
    });
    
    if (error) {
      console.error('❌ Error adding column:', error);
      
      // Try alternative approach using direct SQL
      console.log('🔄 Trying alternative approach...');
      const { error: altError } = await supabase
        .from('profiles')
        .update({ personal_data: {} })
        .eq('id', 'dummy'); // This will fail but might show us the issue
        
      console.log('Alternative error:', altError);
    } else {
      console.log('✅ Successfully added personal_data column');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

addPersonalDataColumn().catch(console.error);
