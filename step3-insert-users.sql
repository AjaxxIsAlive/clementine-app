-- STEP 3: INSERT TEST USERS (Run after Step 2)

INSERT INTO profiles (id, first_name, email, session_id, last_session_date, personal_data) VALUES
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Alice',
    'alice@test.com',
    'vf_b47ac10b-58cc-4372-a567-0e02b2c3d479_' || extract(epoch from now())::bigint || '_alice',
    NOW() - INTERVAL '2 days',
    '{"attachmentStyle": ["secure"], "relationshipStatus": ["in relationship"], "familyInfo": ["close with parents"], "conversationTopics": ["relationship advice"]}'::jsonb
),
(
    'c47ac10b-58cc-4372-a567-0e02b2c3d480',
    'Bob',
    'bob@test.com',
    'vf_c47ac10b-58cc-4372-a567-0e02b2c3d480_' || extract(epoch from now())::bigint || '_bob',
    NOW() - INTERVAL '1 day',
    '{"attachmentStyle": ["anxious"], "relationshipStatus": ["single"], "familyInfo": ["distant from family"], "emotionalTriggers": ["fear of abandonment"], "conversationTopics": ["dating anxiety"]}'::jsonb
),
(
    'd47ac10b-58cc-4372-a567-0e02b2c3d481',
    'Charlie',
    'charlie@test.com',
    'vf_d47ac10b-58cc-4372-a567-0e02b2c3d481_' || extract(epoch from now())::bigint || '_charlie',
    NOW() - INTERVAL '3 hours',
    '{"attachmentStyle": ["avoidant"], "relationshipStatus": ["complicated"], "familyInfo": ["only child"], "importantDates": ["anniversary: June 12"], "conversationTopics": ["commitment issues"]}'::jsonb
),
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d482',
    'DOT',
    'dot@mail.com',
    'vf_e47ac10b-58cc-4372-a567-0e02b2c3d482_' || extract(epoch from now())::bigint || '_dot',
    NOW() - INTERVAL '30 minutes',
    '{"attachmentStyle": ["secure"], "relationshipStatus": ["single"], "familyInfo": ["close with sister"], "importantDates": ["birthday: March 15"], "emotionalTriggers": ["stress about work"], "conversationTopics": ["career", "self-improvement"]}'::jsonb
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d483',
    'Sarah',
    'sarah@test.com',
    'vf_f47ac10b-58cc-4372-a567-0e02b2c3d483_' || extract(epoch from now())::bigint || '_sarah',
    NOW() - INTERVAL '1 hour',
    '{"attachmentStyle": ["anxious"], "relationshipStatus": ["dating"], "familyInfo": ["close with mom"], "emotionalTriggers": ["jealousy", "overthinking"], "conversationTopics": ["relationship communication", "trust issues"]}'::jsonb
);
