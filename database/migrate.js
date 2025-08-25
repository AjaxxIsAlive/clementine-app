import { supabaseAdmin } from '../src/services/supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Running conversation tables migration...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'conversations-schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabaseAdmin.rpc('sql', { query: sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Created tables: conversations, messages');
    console.log('🔒 RLS policies enabled');
    console.log('🔍 Indexes created for performance');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
