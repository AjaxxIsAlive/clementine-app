class VoiceFlowAPI {
  constructor() {
    this.projectID = process.env.REACT_APP_VOICEFLOW_PROJECT_ID;
    this.versionID = process.env.REACT_APP_VOICEFLOW_VERSION_ID; 
    this.apiKey = process.env.REACT_APP_VOICEFLOW_API_KEY;
    this.baseURL = 'https://general-runtime.voiceflow.com';
    this.userID = this.generateUserID();
    
    if (!this.projectID || !this.versionID || !this.apiKey) {
      console.error('VoiceFlow credentials missing from environment variables');
    }
  }

  generateUserID() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  async interact(message) {
    try {
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
            tts: true,  // Enable text-to-speech
            stripSSML: false,  // Keep SSML for voice control
            stopAll: true,
            excludeTypes: ['block', 'debug', 'flow']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`VoiceFlow API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.extractResponseWithAudio(data);
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

  async startConversation() {
    try {
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
            tts: true,  // Enable text-to-speech
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
      return this.extractResponseWithAudio(data);
    } catch (error) {
      console.error('VoiceFlow start conversation error:', error);
      return {
        text: "Hi! I'm Clementine, your relationship advisor. How can I help you today?",
        audioUrl: null
      };
    }
  }

  resetSession() {
    this.userID = this.generateUserID();
  }
}

const voiceFlowAPIInstance = new VoiceFlowAPI();
export default voiceFlowAPIInstance;