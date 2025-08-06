# VoiceFlow Block #2: Create New User (API Block)

## Configuration for VoiceFlow Dashboard

### Block Type: API Block
### Method: POST
### URL: 
```
https://rzbzmwvmnccrqjpnntqf.supabase.co/rest/v1/users
```

### Headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Ynptd3ZtbmNjcnFqcG5udHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODM1NjQsImV4cCI6MjA2OTU1OTU2NH0.I2W9ESPLABl_4cmlgTf8NVLhCEsvyhMAxa5qbxBzV-c

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Ynptd3ZtbmNjcnFqcG5udHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODM1NjQsImV4cCI6MjA2OTU1OTU2NH0.I2W9ESPLABl_4cmlgTf8NVLhCEsvyhMAxa5qbxBzV-c

Content-Type: application/json
```

### Request Body (JSON):
```json
{
  "user_id": "{user_id}",
  "returning_user": false,
  "session_count": 1
}
```

### Response Variable: 
```
new_user_result
```

### When to Use:
- Call this block when Block #1 returns an empty array (user doesn't exist)
- Creates a new user record in the Supabase database
- Sets initial session count to 1

### Flow Logic:
```
Block #1 (Check User) → IF user_check_result is empty → Block #2 (Create User)
```
