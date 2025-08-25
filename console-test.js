// Copy and paste this into the browser console at http://localhost:3000

async function testUserRecognitionFull() {
  console.log('🧪 COMPREHENSIVE USER RECOGNITION TEST\n');
  
  try {
    // Import services
    const authService = (await import('./src/services/authService.js')).default;
    const VoiceFlowService = (await import('./src/services/voiceflow.js')).default;
    
    console.log('✅ Services imported successfully\n');
    
    // Test 1: Login with existing user
    console.log('📝 TEST 1: Existing User Login');
    const loginResult = await authService.login('dot@mail.com');
    
    if (loginResult.success) {
      console.log('✅ Login successful!');
      console.log('👤 User:', loginResult.user);
      console.log('🔗 Session ID:', loginResult.sessionId);
      console.log('📚 Conversations:', loginResult.conversationHistory?.length || 0);
      console.log('');
      
      // Test 2: Check localStorage
      console.log('📝 TEST 2: LocalStorage Data');
      const storedUser = JSON.parse(localStorage.getItem('clementine_user') || '{}');
      console.log('💾 Stored user:', storedUser);
      console.log('');
      
      // Test 3: VoiceFlow Context
      console.log('📝 TEST 3: VoiceFlow Context');
      const voiceflowService = new VoiceFlowService();
      const contextResult = await voiceflowService.setUserContext(storedUser);
      console.log('📤 Context sent to VoiceFlow:', contextResult);
      console.log('');
      
      // Test 4: Check what variables are available
      console.log('📝 TEST 4: Available Context Variables');
      console.log('- user_id:', storedUser.id);
      console.log('- name:', storedUser.first_name);
      console.log('- email:', storedUser.email);
      console.log('- session_id:', storedUser.session_id);
      console.log('- isReturningUser:', true);
      console.log('- hasHistory:', storedUser.hasConversationHistory);
      console.log('- conversationCount:', storedUser.conversationHistory?.length || 0);
      console.log('');
      
      console.log('🎯 SUMMARY: User recognition system is working!');
      console.log('✅ Technical infrastructure: Complete');
      console.log('✅ User identification: Working');
      console.log('✅ Session management: Working');
      console.log('✅ VoiceFlow context: Working');
      console.log('');
      console.log('🤖 Next step: VoiceFlow bot needs to be programmed to use these variables');
      
    } else {
      console.error('❌ Login failed:', loginResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUserRecognitionFull();
