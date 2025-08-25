// Test script for browser console to verify user recognition
// Run this in the browser console at http://localhost:3000

console.log('🔍 Testing Clementine user recognition...');

// Import the auth service (it should be available globally)
const authService = window.authService || new (await import('./services/authService.js')).default();

async function testUserRecognition() {
  console.log('\n🧪 Step 1: Testing login with existing user...');
  
  // Try logging in with DOT (the user we found earlier)
  const loginResult = await authService.login('dot@mail.com');
  
  if (loginResult.success) {
    console.log('✅ Login successful!');
    console.log('👤 User data:', loginResult.user);
    console.log('🔗 Session ID:', loginResult.sessionId);
    console.log('📚 Conversation history:', loginResult.conversationHistory?.length || 0, 'conversations');
    
    console.log('\n🧪 Step 2: Checking what gets sent to VoiceFlow...');
    
    // Check localStorage
    const storedUser = JSON.parse(localStorage.getItem('clementine_user') || '{}');
    console.log('💾 Stored user data:', storedUser);
    
    console.log('\n🧪 Step 3: Testing VoiceFlow context...');
    
    // Import and test VoiceFlow service
    const voiceflowService = window.voiceflowService || new (await import('./services/voiceflow.js')).default();
    
    // Test what context would be sent
    const context = await voiceflowService.setUserContext(storedUser);
    console.log('📤 VoiceFlow context set:', context);
    
    console.log('\n🎯 Recognition Test Results:');
    console.log('- User recognized:', !!loginResult.user);
    console.log('- Session ID available:', !!loginResult.sessionId);
    console.log('- Conversation history loaded:', loginResult.conversationHistory?.length > 0);
    console.log('- Enhanced context sent to VoiceFlow:', !!context);
    
  } else {
    console.error('❌ Login failed:', loginResult.error);
  }
}

// Run the test
testUserRecognition().catch(console.error);
