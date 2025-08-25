#!/usr/bin/env node

// Simple test script to verify auto-profile creation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Simulate the createUserProfile function
async function createUserProfile(email, displayName = null) {
  try {
    console.log('👤 Creating new user profile for:', email);
    
    // Extract name from email if no display name provided
    const firstName = displayName || email.split('@')[0];
    
    // Let Supabase generate the UUID for us
    const newUser = {
      email: email.toLowerCase().trim(),
      first_name: firstName,
      last_session_date: new Date().toISOString()
    };

    console.log('📝 Inserting new user profile:', newUser);
    
    // Use service role for user creation to bypass RLS
    const { data, error } = await (supabaseAdmin || supabase)
      .from('profiles')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create user profile:', error);
      
      // Handle duplicate email error gracefully
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log('⚠️ User already exists, attempting to fetch existing user...');
        
        const { data: existingUser, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email.toLowerCase().trim())
          .single();
          
        if (fetchError) {
          return { success: false, error: 'User creation failed and could not fetch existing user' };
        }
        
        console.log('✅ Found existing user:', existingUser.email);
        return { success: true, user: existingUser, created: false };
      }
      
      return { success: false, error: error.message };
    }

    console.log('✅ User profile created successfully:', data.email);
    return { success: true, user: data, created: true };
    
  } catch (error) {
    console.error('❌ Exception creating user profile:', error);
    return { success: false, error: error.message };
  }
}

async function testAutoProfile() {
  const testEmails = [
    'newuser1@test.com',
    'newuser2@example.com',
    'jane.doe@gmail.com'
  ];

  console.log('🧪 Testing auto-profile creation...');
  
  for (const email of testEmails) {
    console.log(`\n🔄 Testing with: ${email}`);
    const result = await createUserProfile(email);
    
    if (result.success) {
      console.log(`✅ ${result.created ? 'Created' : 'Found existing'} profile for ${result.user.email}`);
    } else {
      console.log(`❌ Failed for ${email}: ${result.error}`);
    }
  }
  
  console.log('\n🔍 Listing all profiles:');
  const { data: allProfiles, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_session_date')
    .order('last_session_date', { ascending: false });
    
  if (error) {
    console.error('❌ Failed to list profiles:', error);
  } else {
    console.table(allProfiles);
  }
}

testAutoProfile().catch(console.error);
