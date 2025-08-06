# 🚀 VoiceFlow API Configuration - Quick Copy-Paste Reference

## 📋 Your Actual API Settings (Ready to Copy)

### Headers for ALL API Blocks:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Ynptd3ZtbmNjcnFqcG5udHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODM1NjQsImV4cCI6MjA2OTU1OTU2NH0.I2W9ESPLABl_4cmlgTf8NVLhCEsvyhMAxa5qbxBzV-c

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Ynptd3ZtbmNjcnFqcG5udHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODM1NjQsImV4cCI6MjA2OTU1OTU2NH0.I2W9ESPLABl_4cmlgTf8NVLhCEsvyhMAxa5qbxBzV-c

Content-Type: application/json
```

---

## 🔧 VoiceFlow API Blocks Configuration

### API Block 1: Check User Exists
- **Method:** GET
- **URL:** `https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users?user_id=eq.{user_id}`
- **Headers:** Use headers above
- **Response Variable:** `user_check_result`

### API Block 2: Create New User
- **Method:** POST
- **URL:** `https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users`
- **Headers:** Use headers above
- **Body:**
```json
{
  "user_id": "{user_id}",
  "returning_user": false,
  "session_count": 1
}
```
- **Response Variable:** `new_user_result`

### API Block 3: Update User Session
- **Method:** PATCH
- **URL:** `https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users?user_id=eq.{user_id}`
- **Headers:** Use headers above
- **Body:**
```json
{
  "session_count": "{session_count_plus_one}",
  "returning_user": true,
  "last_session": "{current_timestamp}"
}
```
- **Response Variable:** `user_update_result`

### API Block 4: Save Conversation
- **Method:** POST
- **URL:** `https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/conversations`
- **Headers:** Use headers above
- **Body:**
```json
{
  "user_id": "{user_id}",
  "message": "{user_message}",
  "response": "{assistant_response}"
}
```
- **Response Variable:** `conversation_save_result`

### API Block 5: Get Conversation History
- **Method:** GET
- **URL:** `https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/conversations?user_id=eq.{user_id}&order=timestamp.desc&limit=5`
- **Headers:** Use headers above
- **Response Variable:** `conversation_history`

---

## 📊 VoiceFlow Variables to Create

1. **user_id** (Text)
2. **returning_user** (Boolean)
3. **session_count** (Number)
4. **session_count_plus_one** (Number)
5. **current_timestamp** (Text)
6. **user_message** (Text)
7. **assistant_response** (Text)
8. **user_check_result** (Object)
9. **new_user_result** (Object)
10. **user_update_result** (Object)
11. **conversation_save_result** (Object)
12. **conversation_history** (Array)

---

## ✅ Status
- [x] Database schema created
- [x] API endpoints tested (5/5 passing)
- [x] Configuration files ready
- [ ] VoiceFlow dashboard configured
- [ ] End-to-end testing

**Next:** Configure these API blocks in your VoiceFlow dashboard!
