# 🚀 VoiceFlow AI Integration - Step 3: Dashboard Configuration

## ✅ Prerequisites Completed
- [x] **Step 1**: Database schema created and verified
- [x] **Step 2**: API endpoints tested and working (5/5 passing)
- [ ] **Step 3**: VoiceFlow dashboard configuration (IN PROGRESS)

## 🎯 Step 3: Configure VoiceFlow Dashboard API Blocks

### 📋 Quick Setup Checklist

1. **Login to VoiceFlow Dashboard**
   - Go to your VoiceFlow project: **SUPABASE_CONNECTED** 
   - Project ID: `688c14289efd1e7c4a05798d`
   - Version ID: `688c14289efd1e7c4a05798e`

2. **Get Your Supabase API Key**
   - Go to Supabase Project Settings → API
   - Copy your **anon/public** API key
   - Replace `YOUR_SUPABASE_ANON_KEY` in all configurations below

### 🔧 API Block Configurations

#### API Block 1: Check User Exists
```
Name: Check User Exists
Method: GET
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users?user_id=eq.{user_id}

Headers:
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

Response Variable: user_check_result
```

#### API Block 2: Create New User
```
Name: Create New User
Method: POST
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users

Headers:
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

Body (JSON):
{
  "user_id": "{user_id}",
  "returning_user": false,
  "session_count": 1
}

Response Variable: new_user_result
```

#### API Block 3: Update User Session
```
Name: Update User Session
Method: PATCH
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users?user_id=eq.{user_id}

Headers:
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

Body (JSON):
{
  "session_count": "{session_count_plus_one}",
  "returning_user": true,
  "last_session": "{current_timestamp}"
}

Response Variable: user_update_result
```

#### API Block 4: Save Conversation
```
Name: Save Conversation
Method: POST
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/conversations

Headers:
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

Body (JSON):
{
  "user_id": "{user_id}",
  "message": "{user_message}",
  "response": "{assistant_response}"
}

Response Variable: conversation_save_result
```

#### API Block 5: Get Conversation History
```
Name: Get Conversation History
Method: GET
URL: https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/conversations?user_id=eq.{user_id}&order=timestamp.desc&limit=5

Headers:
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

Response Variable: conversation_history
```

### 📊 VoiceFlow Variables to Create

Create these variables in your VoiceFlow project:

1. **user_id** (Text) - Unique identifier for each user
2. **returning_user** (Boolean) - Whether user has visited before  
3. **session_count** (Number) - Number of sessions user has had
4. **session_count_plus_one** (Number) - Calculated field for updates
5. **current_timestamp** (Text) - Current ISO timestamp
6. **user_message** (Text) - Current user input
7. **assistant_response** (Text) - Current assistant response
8. **user_check_result** (Object) - Response from user check API
9. **new_user_result** (Object) - Response from create user API
10. **user_update_result** (Object) - Response from update user API
11. **conversation_save_result** (Object) - Response from save conversation API
12. **conversation_history** (Array) - Retrieved conversation data

### 🔄 Recommended Flow Logic

```
START CONVERSATION
├── Capture user_id (phone number, voice signature, etc.)
├── Call "Check User Exists" API
├── IF user_check_result is empty:
│   ├── Call "Create New User" API
│   └── Set returning_user = false
├── ELSE:
│   ├── Calculate session_count_plus_one
│   ├── Call "Update User Session" API  
│   └── Set returning_user = true
├── DURING CONVERSATION:
│   ├── Capture user_message
│   ├── Generate assistant_response
│   └── Call "Save Conversation" API
└── OPTIONALLY:
    └── Call "Get Conversation History" API for context
```

### 🧪 Testing Your Configuration

After setting up the API blocks:

1. **Test Individual Blocks**
   - Use VoiceFlow's API testing feature
   - Verify each block returns expected responses

2. **Test Full Flow**
   - Run a complete conversation
   - Check Supabase database for saved data

3. **Verify Memory Persistence**
   - Start a new conversation with same user_id
   - Confirm returning_user logic works

### 🔍 Troubleshooting

**Common Issues:**
- **401 Unauthorized**: Check your API key is correct
- **404 Not Found**: Verify your Supabase project URL
- **Empty Responses**: This is normal for POST/PATCH operations
- **Variable Not Found**: Ensure all variables are created in VoiceFlow

**Debug Steps:**
1. Test individual API blocks in VoiceFlow
2. Check Supabase logs for failed requests
3. Verify variable names match exactly
4. Confirm headers are set on all blocks

### 🎉 Success Criteria

You'll know Step 3 is complete when:
- [x] All 5 API blocks are configured in VoiceFlow
- [x] Individual API blocks test successfully
- [x] Full conversation flow works end-to-end
- [x] User data is saved to Supabase
- [x] Conversation history is preserved
- [x] Returning user logic functions correctly

### ▶️ Next: Step 4 - End-to-End Testing

Once Step 3 is complete, we'll proceed to comprehensive end-to-end testing of the full voice chat system with persistent memory.

---

📞 **Need Help?** 
- Check the browser console for detailed API test results
- Review Supabase logs for server-side issues  
- Verify all environment variables are set correctly
