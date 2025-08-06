// SUPABASE API TEST FUNCTIONS
// Test these endpoints before configuring VoiceFlow

import { memoryService } from './memoryService.js';

class SupabaseApiTester {
  constructor() {
    this.baseUrl = 'https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1';
    this.headers = {
      'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  // Test 1: Check if user exists (GET)
  async testGetUser(userId) {
    console.log('🧪 Testing GET user:', userId);
    try {
      const response = await fetch(`${this.baseUrl}/users?user_id=eq.${userId}`, {
        method: 'GET',
        headers: this.headers
      });
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GET user HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
      
      const data = await response.json();
      console.log('✅ GET user response:', data);
      return { success: true, data, exists: data.length > 0 };
    } catch (error) {
      console.error('❌ GET user failed:', error);
      return { success: false, error };
    }
  }

  // Test 2: Create new user (POST)
  async testCreateUser(userId) {
    console.log('🧪 Testing POST create user:', userId);
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          user_id: userId,
          returning_user: false,
          session_count: 1
        })
      });
      
      // Check if response is ok and has content
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ POST user HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
      
      // Handle empty response body
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : null;
      console.log('✅ POST user response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ POST user failed:', error);
      return { success: false, error };
    }
  }

  // Test 3: Update user (PATCH)
  async testUpdateUser(userId, sessionCount) {
    console.log('🧪 Testing PATCH update user:', userId);
    try {
      const response = await fetch(`${this.baseUrl}/users?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          session_count: sessionCount + 1,
          returning_user: true,
          last_session: new Date().toISOString()
        })
      });
      
      // Check if response is ok and has content
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PATCH user HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
      
      // Handle empty response body
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : null;
      console.log('✅ PATCH user response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ PATCH user failed:', error);
      return { success: false, error };
    }
  }

  // Test 4: Save conversation (POST)
  async testSaveConversation(userId, message, response) {
    console.log('🧪 Testing POST conversation for:', userId);
    try {
      const result = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          user_id: userId,
          message: message,
          response: response
        })
      });
      
      // Check if response is ok and has content
      if (!result.ok) {
        const errorText = await result.text();
        console.error('❌ POST conversation HTTP error:', result.status, errorText);
        return { success: false, error: `HTTP ${result.status}: ${errorText}` };
      }
      
      // Handle empty response body
      const responseText = await result.text();
      const data = responseText ? JSON.parse(responseText) : null;
      console.log('✅ POST conversation response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ POST conversation failed:', error);
      return { success: false, error };
    }
  }

  // Test 5: Get conversations (GET)
  async testGetConversations(userId, limit = 5) {
    console.log('🧪 Testing GET conversations for:', userId);
    try {
      const response = await fetch(`${this.baseUrl}/conversations?user_id=eq.${userId}&order=timestamp.desc&limit=${limit}`, {
        method: 'GET',
        headers: this.headers
      });
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GET conversations HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
      
      const data = await response.json();
      console.log('✅ GET conversations response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ GET conversations failed:', error);
      return { success: false, error };
    }
  }

  // Complete test sequence
  async runFullTest(userId = null) {
    // Generate unique test user ID if not provided
    if (!userId) {
      userId = `test_user_${Date.now()}`;
    }
    
    console.log('🚀 Starting full Supabase API test sequence...');
    console.log('🔍 Testing with user ID:', userId);
    
    // Test 1: Check if user exists
    const getUserResult = await this.testGetUser(userId);
    
    if (!getUserResult.success) {
      console.error('❌ Basic GET test failed - check your Supabase connection');
      return false;
    }
    
    // Test 2: Create user if doesn't exist
    if (!getUserResult.exists) {
      const createResult = await this.testCreateUser(userId);
      if (!createResult.success) {
        console.error('❌ User creation failed');
        return false;
      }
      console.log('✅ User created successfully');
    } else {
      console.log('ℹ️ User already exists, skipping creation');
    }
    
    // Test 3: Update user session
    const updateResult = await this.testUpdateUser(userId, 1);
    if (!updateResult.success) {
      console.error('❌ User update failed');
      return false;
    }
    console.log('✅ User updated successfully');
    
    // Test 4: Save conversation
    const saveResult = await this.testSaveConversation(
      userId, 
      'Hello, this is a test message', 
      'Hi! This is a test response from the assistant.'
    );
    if (!saveResult.success) {
      console.error('❌ Conversation save failed');
      return false;
    }
    console.log('✅ Conversation saved successfully');
    
    // Test 5: Get conversations
    const getConversationsResult = await this.testGetConversations(userId);
    if (!getConversationsResult.success) {
      console.error('❌ Conversation retrieval failed');
      return false;
    }
    console.log('✅ Conversations retrieved successfully');
    
    console.log('🎉 All Supabase API tests passed! Ready for VoiceFlow integration.');
    console.log('📊 Summary: All 5 API endpoints working correctly');
    return true;
  }
}

// Export for use in browser console or React app
const apiTester = new SupabaseApiTester();

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.supabaseApiTester = apiTester;
  console.log('💡 Run window.supabaseApiTester.runFullTest() in console to test APIs');
}

export default apiTester;
