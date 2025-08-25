-- STEP 5: VERIFICATION (Run after Step 4)

-- Verify everything is working
SELECT 'VERIFICATION COMPLETE' as status;

SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
UNION ALL
SELECT 'conversations' as table_name, count(*) as row_count FROM conversations
UNION ALL
SELECT 'messages' as table_name, count(*) as row_count FROM messages;

-- Show sample users
SELECT first_name, email, 
       CASE WHEN personal_data IS NOT NULL THEN 'Has personal data' ELSE 'No personal data' END as data_status
FROM profiles 
ORDER BY last_session_date DESC;
