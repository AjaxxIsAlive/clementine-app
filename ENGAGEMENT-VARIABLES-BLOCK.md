# VoiceFlow Engagement Variables Set Block

## Block Type: Set Block (Variable Assignment)
## Placement: After User Identity Variables Set Block

### Variables to Create and Initialize:

#### 1. interaction_count (Number)
- **Default Value:** 0
- **Purpose:** Tracks total number of user interactions in the session
- **Usage:** Increment after each user input

#### 2. last_interaction_timestamp (Text)  
- **Default Value:** ""
- **Purpose:** Stores timestamp of most recent user interaction
- **Usage:** Update with current timestamp on each interaction

#### 3. interaction_duration (Number)
- **Default Value:** 0  
- **Purpose:** Tracks duration of user interactions in seconds
- **Usage:** Calculate time between interactions

#### 4. user_engagement_score (Number)
- **Default Value:** 0
- **Purpose:** Calculates overall user engagement level
- **Usage:** Algorithm based on interaction frequency and duration

#### 5. conversation_context (Text)
- **Default Value:** ""
- **Purpose:** Stores current conversation topic or context
- **Usage:** Track conversation themes for better responses

#### 6. interaction_type (Text)
- **Default Value:** ""
- **Purpose:** Categorizes type of current user interaction
- **Usage:** Values like "query", "command", "navigation", "casual"

## Set Block Configuration:

### In VoiceFlow Set Block:
```
interaction_count = 0
last_interaction_timestamp = ""
interaction_duration = 0
user_engagement_score = 0
conversation_context = ""
interaction_type = ""
```

## Flow Integration:
```
User Identity Variables Set Block → Engagement Variables Set Block → Continue Flow
```

## Dynamic Updates During Conversation:

### After Each User Input:
```
interaction_count = {interaction_count} + 1
last_interaction_timestamp = {current_timestamp}
interaction_type = {determined_type}
conversation_context = {current_topic}
```

### Engagement Score Calculation:
```
user_engagement_score = (interaction_count * 10) + (interaction_duration / 60)
```
