import authService from './authService';

class VoiceFlowAPI {
  constructor() {
    this.projectID = process.env.REACT_APP_VOICEFLOW_PROJECT_ID;
    this.versionID = process.env.REACT_APP_VOICEFLOW_VERSION_ID; 
    this.apiKey = process.env.REACT_APP_VOICEFLOW_API_KEY;
    this.baseURL = 'https://general-runtime.voiceflow.com';
    this.userID = this.generateUserID();
    this.currentConversationId = null;
    
    if (!this.projectID || !this.versionID || !this.apiKey) {
      console.error('VoiceFlow credentials missing from environment variables');
    }
  }

  generateUserID() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

    // Set user context with enhanced persistent memory
  setUserContext(userId, context = {}) {
    console.log('🎯 VoiceFlow user context set:', { userID: userId, variables: context });
    
    // Get enhanced conversation context for persistent memory
    const memoryContext = authService.getConversationContext(userId);
    
    // Build comprehensive context for VoiceFlow
    const enhancedContext = {
      name: context.userName || memoryContext?.userName || 'User',
      email: context.email || memoryContext?.email || '',
      hasConversationHistory: memoryContext?.hasHistory || false,
      conversationCount: memoryContext?.conversationCount || 0,
      lastSessionDate: memoryContext?.lastSessionDate || '',
      
      // Personal data for persistent memory
      attachmentStyle: memoryContext?.personalData?.attachment_style || '',
      relationshipStatus: memoryContext?.personalData?.relationship_status || '',
      loveLanguage: memoryContext?.personalData?.love_language || '',
      
      // Memory summary for VoiceFlow bot context
      memorySummary: memoryContext?.memorySummary || '',
      
      // Recent conversation themes
      recentTopics: this.extractRecentTopics(memoryContext?.recentMessages || []),
      
      ...context // Include any additional context passed in
    };
    
    this.userContext = {
      userID: userId,
      variables: enhancedContext
    };
    
    console.log('🧠 Enhanced memory context loaded:', {
      hasHistory: enhancedContext.hasConversationHistory,
      memorySummary: enhancedContext.memorySummary.substring(0, 100) + '...',
      recentTopics: enhancedContext.recentTopics
    });
  }

  // Extract recent conversation topics for context
  extractRecentTopics(recentMessages) {
    if (!recentMessages || recentMessages.length === 0) return [];
    
    const topics = new Set();
    const topicKeywords = {
      'relationship_issues': ['relationship', 'dating', 'boyfriend', 'girlfriend', 'marriage', 'partner'],
      'family_dynamics': ['family', 'mother', 'father', 'parent', 'sibling', 'family dynamics'],
      'emotional_support': ['anxiety', 'depression', 'stressed', 'worried', 'emotional', 'feelings'],
      'attachment_concerns': ['attachment', 'trust', 'abandonment', 'commitment', 'intimacy'],
      'communication': ['communication', 'talking', 'express', 'listen', 'understand'],
      'conflict_resolution': ['fight', 'argument', 'conflict', 'disagreement', 'resolve'],
      'self_improvement': ['self', 'improve', 'better', 'grow', 'change', 'personal growth']
    };
    
    recentMessages.slice(0, 10).forEach(message => {
      const content = message.content.toLowerCase();
      
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          topics.add(topic);
        }
      }
    });
    
    return Array.from(topics).slice(0, 5); // Return top 5 topics
  }

  // Start conversation with user context - Following Grok's launch pattern
  async startConversation(userId, userData = {}) {
    try {
      this.setUserContext(userId, userData);
      const userVars = this.userContext.variables; // Get the enhanced context
      
      console.log(`🚀 Starting VoiceFlow conversation for user: ${userVars.userName}`);
      console.log('🧠 User context being sent to VoiceFlow:', {
        hasHistory: userVars.hasConversationHistory,
        memorySummary: userVars.memorySummary?.substring(0, 100) + '...',
        attachmentStyle: userVars.attachmentStyle,
        relationshipStatus: userVars.relationshipStatus
      });
      
      const response = await fetch(`${this.baseURL}/state/${this.versionID}/user/${this.userID}/interact`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action: {
            type: 'launch'
          },
          config: {
            tts: true,
            stripSSML: false,
            stopAll: true,
            excludeTypes: ['block', 'debug', 'flow']
          },
          // Set user variables following Grok's approach
          state: {
            variables: userVars
          }
        })
      });

      if (!response.ok) {
        throw new Error(`VoiceFlow API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const result = this.extractResponseWithAudio(data);
      
      // Create new conversation for database persistence
      if (userId) {
        const conversationResult = await authService.createConversation(userId, 'VoiceFlow Chat Session');
        if (conversationResult.success) {
          this.currentConversationId = conversationResult.conversation.id;
          console.log('💾 New conversation created for persistent memory');
          
          // Save the welcome message
          await authService.saveConversationMessage(
            userId, 
            result.text, 
            'assistant', 
            this.currentConversationId
          );
        }
      }
      
      return result;
    } catch (error) {
      console.error('VoiceFlow start conversation error:', error);
      return {
        text: "Hi! I'm Clementine, your relationship advisor. How can I help you today?",
        audioUrl: null
      };
    }
  }

  // Send message - Following Grok's interact pattern with persistent memory
  async interact(message, userId = null, userData = {}) {
    try {
      // Save user message to database for persistent memory
      if (userId && this.currentConversationId) {
        await authService.saveConversationMessage(
          userId, 
          message, 
          'user', 
          this.currentConversationId
        );
        console.log('💾 User message saved for persistent memory');
      }

      const response = await fetch(`${this.baseURL}/state/${this.versionID}/user/${this.userID}/interact`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action: {
            type: 'text',
            payload: message
          },
          config: {
            tts: true,
            stripSSML: false,
            stopAll: true,
            excludeTypes: ['block', 'debug', 'flow']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`VoiceFlow API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const result = this.extractResponseWithAudio(data);
      
      // Save assistant response to database for persistent memory
      if (userId && this.currentConversationId) {
        await authService.saveConversationMessage(
          userId, 
          result.text, 
          'assistant', 
          this.currentConversationId
        );
        console.log('💾 Assistant response saved for persistent memory');
      }
      
      return result;
    } catch (error) {
      console.error('VoiceFlow interaction error:', error);
      throw error;
    }
  }

  extractResponseWithAudio(data) {
    console.log('VoiceFlow raw response:', JSON.stringify(data, null, 2));
    if (!data || !Array.isArray(data)) {
      return {
        text: "I'm sorry, I didn't receive a proper response.",
        audioUrl: null
      };
    }

    // Extract text responses
    const textResponses = data
      .filter(item => item.type === 'text' || item.type === 'speak')
      .map(item => item.payload?.message || item.payload?.text || '')
      .filter(text => text.trim() !== '');

    // Extract audio responses (ElevenLabs audio URLs)
    const audioResponses = data
      .filter(item => item.payload?.audio?.src)
      .map(item => item.payload?.audio?.src || item.payload?.src || item.payload?.audio)
      .filter(url => url);

    const responseText = textResponses.length > 0 
      ? textResponses.join(' ') 
      : "I'm here to help with your relationship questions!";

    const audioUrl = audioResponses.length > 0 ? audioResponses[0] : null;

    return {
      text: responseText,
      audioUrl: audioUrl
    };
  }

  resetSession() {
    this.userID = this.generateUserID();
    this.currentConversationId = null;
  }
}

const voiceFlowAPIInstance = new VoiceFlowAPI();
export default voiceFlowAPIInstance;