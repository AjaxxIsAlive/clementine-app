// Anthony Memory Migration Script
// Consolidates the two Anthony accounts and migrates memory data

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

const OLD_USER_ID = 'clementine_anthonypaulsmail_gmail_com_1753922654482';
const NEW_USER_ID = 'clementine_anthony_anthonypaulsmailgmailcom_1753991265954';

async function migrateAnthonyMemory() {
  console.log('🔄 Migrating Anthony\'s memory data...\n');

  try {
    // 1. Get old memory data
    console.log('1. Fetching old memory data...');
    const { data: oldMemory, error: oldMemoryError } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', OLD_USER_ID)
      .maybeSingle();

    if (oldMemoryError) {
      console.error('❌ Error fetching old memory:', oldMemoryError);
      return false;
    }

    if (!oldMemory) {
      console.log('⚠️ No old memory found for migration');
      return false;
    }

    console.log('✅ Found old memory data:', {
      sessions: oldMemory.session_count,
      name: oldMemory.user_name,
      age: oldMemory.user_age,
      occupation: oldMemory.user_occupation
    });

    // 2. Check if new user already has memory
    console.log('\n2. Checking new user memory...');
    const { data: newMemory, error: newMemoryError } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', NEW_USER_ID)
      .maybeSingle();

    if (newMemoryError && newMemoryError.code !== 'PGRST116') {
      console.error('❌ Error checking new memory:', newMemoryError);
      return false;
    }

    if (newMemory) {
      console.log('⚠️ New user already has memory, merging...');
      // Merge logic: take higher session count, keep most recent data
      const mergedMemory = {
        ...oldMemory,
        user_id: NEW_USER_ID,
        session_count: Math.max(oldMemory.session_count || 0, newMemory.session_count || 0),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('user_memory')
        .update(mergedMemory)
        .eq('user_id', NEW_USER_ID);

      if (updateError) {
        console.error('❌ Error updating merged memory:', updateError);
        return false;
      }

      console.log('✅ Memory merged successfully');
    } else {
      console.log('📝 Creating new memory record...');
      // Create new memory record with old data
      const migratedMemory = {
        ...oldMemory,
        user_id: NEW_USER_ID,
        updated_at: new Date().toISOString()
      };
      delete migratedMemory.id; // Remove old ID

      const { error: insertError } = await supabase
        .from('user_memory')
        .insert(migratedMemory);

      if (insertError) {
        console.error('❌ Error creating new memory:', insertError);
        return false;
      }

      console.log('✅ Memory migrated successfully');
    }

    // 3. Clean up old records (optional)
    console.log('\n3. Cleaning up old records...');
    
    const { error: deleteMemoryError } = await supabase
      .from('user_memory')
      .delete()
      .eq('user_id', OLD_USER_ID);

    if (deleteMemoryError) {
      console.warn('⚠️ Could not delete old memory:', deleteMemoryError);
    } else {
      console.log('✅ Old memory record deleted');
    }

    const { error: deleteProfileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', OLD_USER_ID);

    if (deleteProfileError) {
      console.warn('⚠️ Could not delete old profile:', deleteProfileError);
    } else {
      console.log('✅ Old profile record deleted');
    }

    // 4. Verify final state
    console.log('\n4. Verifying migration...');
    const { data: finalMemory } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', NEW_USER_ID)
      .maybeSingle();

    if (finalMemory) {
      console.log('🎉 Migration completed successfully!');
      console.log('📊 Final memory state:', {
        user_id: finalMemory.user_id,
        user_name: finalMemory.user_name,
        session_count: finalMemory.session_count,
        user_age: finalMemory.user_age,
        user_occupation: finalMemory.user_occupation,
        relationship_status: finalMemory.relationship_status || 'single'
      });
      return true;
    } else {
      console.error('❌ Migration verification failed');
      return false;
    }

  } catch (error) {
    console.error('💥 Migration error:', error);
    return false;
  }
}

// Run migration
migrateAnthonyMemory()
  .then(success => {
    if (success) {
      console.log('\n✅ Anthony\'s memory has been successfully migrated!');
      console.log('🔄 Refresh the app to see the changes.');
    } else {
      console.log('\n❌ Migration failed. Check the errors above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Script error:', error);
    process.exit(1);
  });