// DEBUG CURRENT USER STATE
// Run this in the browser console to see current user state

console.log('=== CURRENT USER DEBUG ===');

// Check localStorage
console.log('📦 localStorage data:');
const keys = [
  'clementine_user_id',
  'clementine_user_email', 
  'clementine_user_name',
  'clementine_user_credentials',
  'clementine_user_name',
  'clementine_user_age',
  'clementine_user_occupation',
  'clementine_relationship_status',
  'clementine_partner_name',
  'clementine_session_count',
  'clementine_last_active'
];

keys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    console.log(`  ${key}: ${value}`);
  }
});

// Check what user ID is being generated
const email = localStorage.getItem('clementine_user_email');
const name = localStorage.getItem('clementine_user_name');
const timestamp = Date.now();

if (email && name) {
  const generatedUserId = `clementine_${name}_${email.replace(/[@.]/g, '')}_${timestamp}`;
  console.log(`🆔 Current user ID pattern: ${generatedUserId}`);
}

console.log('=== END DEBUG ===');
