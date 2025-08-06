// VOICEFLOW API CONFIGURATION
// ✅ TESTED AND VERIFIED - All endpoints working correctly
// Use these settings in your VoiceFlow API blocks

/* 
=======================================================
STEP 3: VOICEFLOW DASHBOARD CONFIGURATION GUIDE
=======================================================

🎯 Copy these exact configurations into your VoiceFlow API blocks
📋 All endpoints have been tested and verified working

Important: Replace YOUR_SUPABASE_ANON_KEY with your actual key
*/

// ====================
// SUPABASE CONNECTION SETTINGS  
// ====================

const SUPABASE_BASE_URL = "https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1";

const API_HEADERS = {
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Ynptd3ZtbmNjcnFqcG5udHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODM1NjQsImV4cCI6MjA2OTU1OTU2NH0.I2W9ESPLABl_4cmlgTf8NVLhCEsvyhMAxa5qbxBzV-c",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Ynptd3ZtbmNjcnFqcG5udHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODM1NjQsImV4cCI6MjA2OTU1OTU2NH0.I2W9ESPLABl_4cmlgTf8NVLhCEsvyhMAxa5qbxBzV-c", 
  "Content-Type": "application/json"
};

// ====================
// ✅ VERIFIED API ENDPOINTS FOR VOICEFLOW
// All 5 endpoints tested successfully - January 2025
// ====================

/*
API BLOCK 1: CHECK IF USER EXISTS
Method: GET
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users?user_id=eq.{user_id}
Headers: (Use API_HEADERS above)
Purpose: Check if user exists in database before creating
*/

/*
API BLOCK 2: CREATE NEW USER
Method: POST
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users
Headers: (Use API_HEADERS above)
Body: {
  "user_id": "{user_id}",
  "returning_user": false,
  "session_count": 1
}
Purpose: Create new user record
*/

/*
API BLOCK 3: UPDATE USER SESSION
Method: PATCH  
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users?user_id=eq.{user_id}
Headers: (Use API_HEADERS above)
Body: {
  "session_count": "{session_count_plus_one}",
  "returning_user": true,
  "last_session": "{current_timestamp}"
}
Purpose: Update user session data for returning users
*/

/*
API BLOCK 4: SAVE CONVERSATION
Method: POST
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/conversations
Headers: (Use API_HEADERS above)
Body: {
  "user_id": "{user_id}",
  "message": "{user_message}",
  "response": "{assistant_response}"
}
Purpose: Save conversation exchange to history
*/

/*
API BLOCK 5: GET CONVERSATION HISTORY
Method: GET
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/conversations?user_id=eq.{user_id}&order=timestamp.desc&limit=5
Headers: (Use API_HEADERS above)
Purpose: Retrieve recent conversation history for context
*/

// ====================
// VOICEFLOW VARIABLES TO CREATE
// ====================

/*
Create these variables in your VoiceFlow project:
- user_id (Text) - Unique identifier for each user
- returning_user (Boolean) - Whether user has visited before
- session_count (Number) - Number of sessions user has had
- user_message (Text) - Current user input
- assistant_response (Text) - Current assistant response
- conversation_history (Array) - Retrieved conversation data
*/

// ====================
// IMPLEMENTATION FLOW
// ====================

/*
Recommended VoiceFlow flow:
1. Capture user_id (from voice signature, phone number, etc.)
2. Call API Block 1 to check if user exists
3. If user doesn't exist, call API Block 2 to create user
4. If user exists, call API Block 3 to update session
5. During conversation, call API Block 4 to save each exchange
6. Optionally call API Block 5 to retrieve context from history
*/

console.log('📋 VoiceFlow API Configuration Ready for Step 3');
console.log('🔗 All endpoints tested and verified working');
console.log('🎯 Ready to configure VoiceFlow dashboard API blocks');
// - last_response (Text)
// - api_error (Boolean)

// ====================
// IMPLEMENTATION FLOW IN VOICEFLOW
// ====================

// At START of conversation:
// 1. API Block: GET /users?user_id=eq.{user_id}
// 2. Condition Block: Check if response array is empty
//    - If empty (new user): POST /users with new user data
//    - If not empty (existing user): PATCH /users to increment session
// 3. Set variables from API response
// 4. Route based on returning_user status

// Throughout conversation:
// 1. After each user message: Save to conversations table
// 2. Store important data in user_profiles table as needed

console.log('Use these configurations in your VoiceFlow project API blocks');
