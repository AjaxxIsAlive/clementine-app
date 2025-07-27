class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    this.speechTimeout = null; // Instance variable for timeout
    this.fallbackTimeout = null; // Backup timeout in case events don't fire
    
    // Push-to-talk result storage - collect ALL results
    this.collectedResults = [];
    this.latestInterimResult = null;
    this.processedResults = new Set(); // Track which results we've already processed
    
    // Session tracking to prevent cross-contamination
    this.currentSessionId = null;
    this.sessionCounter = 0;
    
    // Mobile permission tracking
    this.permissionStatus = {
      microphone: 'unknown', // 'granted', 'denied', 'unknown'
      speech: 'unknown'
    };
    
    // Mobile browser detection
    this.isMobile = this.detectMobile();
    this.isIOS = this.detectIOS();
    this.isAndroid = this.detectAndroid();
  }

  // Mobile browser detection methods
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  detectAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  // Check current permission status
  async checkPermissionStatus() {
    try {
      // Check microphone permission
      if (navigator.permissions && navigator.permissions.query) {
        const micPermission = await navigator.permissions.query({ name: 'microphone' });
        this.permissionStatus.microphone = micPermission.state;
        
        // Listen for permission changes
        micPermission.onchange = () => {
          this.permissionStatus.microphone = micPermission.state;
        };
      }
      
      // Check speech recognition support
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        this.permissionStatus.speech = 'supported';
      } else {
        this.permissionStatus.speech = 'unsupported';
      }
      
      return this.permissionStatus;
    } catch (error) {
      console.log('Permission check failed:', error);
      return this.permissionStatus;
    }
  }

  // Request mobile permissions explicitly
  async requestMobilePermissions() {
    if (!this.isMobile) {
      return { success: true, message: 'Desktop browser - no special permissions needed' };
    }

    try {
      // Step 1: Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Immediately stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      this.permissionStatus.microphone = 'granted';
      
      // Step 2: Test speech recognition
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        this.permissionStatus.speech = 'supported';
        return { 
          success: true, 
          message: 'Microphone and speech permissions granted',
          permissions: this.permissionStatus
        };
      } else {
        return { 
          success: false, 
          message: 'Speech recognition not supported on this browser',
          permissions: this.permissionStatus
        };
      }
      
    } catch (error) {
      this.permissionStatus.microphone = 'denied';
      
      let message = 'Microphone permission denied';
      if (this.isIOS) {
        message = 'Microphone access denied. Please enable in Safari settings: Settings > Safari > Microphone';
      } else if (this.isAndroid) {
        message = 'Microphone access denied. Please allow microphone access when prompted';
      }
      
      return { 
        success: false, 
        message: message,
        error: error.message,
        permissions: this.permissionStatus
      };
    }
  }

  // Browser compatibility check
  checkBrowserCompatibility() {
    const issues = [];
    
    // Check speech recognition support
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      issues.push('Speech recognition not supported in this browser');
    }
    
    // Check getUserMedia support for microphone
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('Microphone access not supported in this browser');
    }
    
    // Browser-specific warnings
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('firefox')) {
      issues.push('Firefox has limited speech recognition support. Chrome or Safari recommended.');
    }
    if (userAgent.includes('edge')) {
      issues.push('Microsoft Edge speech recognition may be unreliable. Chrome recommended.');
    }
    
    // Check if running in secure context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      issues.push('Speech recognition requires HTTPS in production');
    }
    
    return {
      isSupported: issues.length === 0,
      issues: issues,
      userAgent: userAgent,
      isSecure: window.isSecureContext
    };
  }

  // Initialize speech recognition with mobile handling
  initializeSpeechRecognition() {
    const compatibility = this.checkBrowserCompatibility();
    
    if (!compatibility.isSupported) {
      console.log('❌ Browser compatibility issues:', compatibility.issues);
      throw new Error(`Speech recognition not supported: ${compatibility.issues.join(', ')}`);
    }
    
    console.log('✅ Browser compatibility check passed');
    
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Push-to-talk optimized settings - truly continuous recording
    if (this.isMobile) {
      this.recognition.continuous = true; // Enable continuous for push-to-talk
      this.recognition.interimResults = true; // Show interim results for feedback
    } else {
      // Desktop: Use continuous mode for push-to-talk
      this.recognition.continuous = true; // Continuous recording while button is held
      this.recognition.interimResults = true; // Show interim results for feedback
    }
    
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Clear any existing timeouts
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout);
      this.speechTimeout = null;
    }
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }
    
    // Clear any stored results from previous session
    this.collectedResults = [];
    this.latestInterimResult = null;
    this.processedResults = new Set(); // Track which results we've already processed
    
    // Note: Session ID will be generated in startListening()
    console.log('🔧 Speech recognition initialized (session will be created on start)');

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started for session:', this.currentSessionId);
      this.isListening = true;
      if (this.onStart) this.onStart();
      
      // No automatic timeout for push-to-talk mode - user controls duration
      // Keep a safety fallback timeout to prevent stuck sessions
      this.fallbackTimeout = setTimeout(() => {
        console.log('🚨 SAFETY timeout (60s) - force stopping stuck recognition for session:', this.currentSessionId);
        if (this.isListening && this.currentSessionId) {
          this.isListening = false;
          if (this.recognition) {
            try {
              this.recognition.abort();
            } catch (e) {
              console.log('Error aborting recognition:', e);
            }
          }
          if (this.onError) this.onError('Session timeout. Please try again.');
          if (this.onEnd) this.onEnd();
        }
      }, 60000); // 60 second safety timeout only
    };

    this.recognition.onresult = (event) => {
      const activeSessionId = this.currentSessionId;
      console.log('🗣️ Speech recognition result received for session:', activeSessionId, '| Total results:', event.results.length);
      
      // Ignore results from old sessions
      if (!this.isListening || !activeSessionId) {
        console.log('⚠️ Ignoring result - not listening or no active session');
        return;
      }
      
      // Clear safety timeout since we got a result
      if (this.fallbackTimeout) {
        console.log('✅ Clearing safety timeout due to result');
        clearTimeout(this.fallbackTimeout);
        this.fallbackTimeout = null;
      }
      
      // Process ALL results, not just the latest one
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        const confidence = result[0].confidence || 0;
        const isFinal = result.isFinal;
        
        console.log(`📝 Session: ${activeSessionId} | Result ${i}: "${transcript}" | Confidence: ${confidence} | Final: ${isFinal}`);
        
        if (isFinal) {
          // Check if we've already processed this result
          const resultKey = `${i}_${transcript}`;
          if (!this.processedResults) {
            this.processedResults = new Set();
          }
          
          if (!this.processedResults.has(resultKey) && transcript) {
            console.log('📝 NEW final result for session:', activeSessionId, '| Text:', transcript);
            this.collectedResults.push(transcript);
            this.processedResults.add(resultKey);
            console.log('📚 Session:', activeSessionId, '| All collected results:', this.collectedResults);
          } else {
            console.log('🔄 Duplicate or empty result, skipping:', resultKey);
          }
        } else {
          // Store the latest interim result for live feedback
          console.log('⏳ Interim result for session:', activeSessionId, '| Text:', transcript);
          this.latestInterimResult = transcript;
        }
      }
      
      // After processing all results, combine all interim results from this event
      if (activeSessionId === this.currentSessionId) {
        let combinedInterim = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result.isFinal && result[0]) {
            const transcript = result[0].transcript.trim();
            if (transcript) {
              combinedInterim += (combinedInterim ? ' ' : '') + transcript;
            }
          }
        }
        if (combinedInterim) {
          this.latestInterimResult = combinedInterim;
          console.log('🔗 Combined interim for session:', activeSessionId, '| Full text:', combinedInterim);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.log('❌ Speech recognition error:', event.error);
      
      // Clear safety timeout on error
      if (this.fallbackTimeout) {
        console.log('🧹 Clearing safety timeout due to error');
        clearTimeout(this.fallbackTimeout);
        this.fallbackTimeout = null;
      }
      
      let errorMessage = 'Speech recognition error';
      
      // Handle specific errors differently for push-to-talk
      switch (event.error) {
        case 'aborted':
          // Don't show error for aborted - it's usually intentional
          return;
        case 'no-speech':
          // For push-to-talk, no-speech during long pauses is normal
          if (this.isListening) {
            console.log('🔄 No speech detected but user still holding - continuing...');
            return; // Don't treat as error, keep listening
          }
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'not-allowed':
          errorMessage = this.isMobile 
            ? (this.isIOS ? 'Microphone blocked. Check Safari settings.' : 'Microphone permission denied. Please allow access.')
            : 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Check your internet connection.';
          break;
        case 'audio-capture':
          errorMessage = this.isMobile 
            ? 'Microphone not working. Check device settings.'
            : 'Microphone not working. Check device settings.';
          break;
        default:
          errorMessage = `Voice recognition failed: ${event.error}`;
      }
      
      this.isListening = false;
      if (this.onError) this.onError(errorMessage);
    };

    this.recognition.onend = () => {
      const sessionId = this.currentSessionId;
      console.log('🔚 Speech recognition ended for session:', sessionId, '| isListening:', this.isListening);
      
      // Clear safety timeout when recognition ends
      if (this.fallbackTimeout) {
        console.log('🧹 Clearing safety timeout on end for session:', sessionId);
        clearTimeout(this.fallbackTimeout);
        this.fallbackTimeout = null;
      }
      
      // If we're still supposed to be listening (user still holding button), restart recognition
      if (this.isListening && sessionId) {
        console.log('🔄 Recognition ended but user still holding button - restarting session:', sessionId);
        try {
          this.recognition.start();
        } catch (error) {
          console.log('❌ Failed to restart recognition for session:', sessionId, '| Error:', error);
          this.isListening = false;
          this.currentSessionId = null;
          if (this.onEnd) this.onEnd();
        }
      } else {
        // User released button or session was cleared, normal end
        console.log('✅ Normal recognition end for session:', sessionId);
        if (this.onEnd) this.onEnd();
      }
    };
    
    // Timeout is now stored as instance variable this.speechTimeout
  }

  // Start listening with permission check
  async startListening() {
    console.log('🚀 startListening called, current state:', {
      isListening: this.isListening,
      hasRecognition: !!this.recognition,
      isMobile: this.isMobile,
      micPermission: this.permissionStatus.microphone
    });
    
    // Check permissions first on mobile
    if (this.isMobile && this.permissionStatus.microphone !== 'granted') {
      console.log('📱 Requesting mobile permissions...');
      const permissionResult = await this.requestMobilePermissions();
      if (!permissionResult.success) {
        console.log('❌ Permission request failed:', permissionResult.message);
        if (this.onError) this.onError(permissionResult.message);
        return false;
      }
    }

    try {
      if (!this.recognition) {
        console.log('🔧 Initializing speech recognition...');
        this.initializeSpeechRecognition();
      }
      
      // Generate new session ID here, not in initialization
      this.sessionCounter++;
      this.currentSessionId = `session_${this.sessionCounter}_${Date.now()}`;
      console.log('🆔 Starting new speech session:', this.currentSessionId);
      
      // Clear any stored results from previous session
      this.collectedResults = [];
      this.latestInterimResult = null;
      this.processedResults = new Set();
      
      console.log('▶️ Starting recognition...');
      this.recognition.start();
      return true;
    } catch (error) {
      console.log('❌ Failed to start recognition:', error.message);
      const errorMessage = this.isMobile 
        ? 'Voice input failed. Please check microphone permissions.' 
        : `Speech recognition failed to start: ${error.message}`;
      if (this.onError) this.onError(errorMessage);
      return false;
    }
  }

  stopListening() {
    const sessionId = this.currentSessionId;
    console.log('🛑 stopListening called for session:', sessionId, '| isListening:', this.isListening);
    
    if (this.recognition && this.isListening && sessionId) {
      this.isListening = false; // Set this first to prevent error messages
      
      // Clear safety timeout when manually stopping
      if (this.fallbackTimeout) {
        console.log('🧹 Clearing safety timeout on manual stop for session:', sessionId);
        clearTimeout(this.fallbackTimeout);
        this.fallbackTimeout = null;
      }
      
      // Combine all collected results into one transcript
      let finalTranscript = '';
      
      if (this.collectedResults.length > 0) {
        // Join all final results with spaces
        finalTranscript = this.collectedResults.join(' ').trim();
        console.log('✅ Session:', sessionId, '| Combined final results:', finalTranscript);
      } else if (this.latestInterimResult) {
        // If no final results, use interim result
        finalTranscript = this.latestInterimResult.trim();
        console.log('✅ Session:', sessionId, '| Using interim result:', finalTranscript);
      }
      
      // Clear session data BEFORE processing result to prevent race conditions
      this.collectedResults = [];
      this.latestInterimResult = null;
      this.processedResults = new Set(); // Clear processed results tracking
      const completedSessionId = this.currentSessionId;
      this.currentSessionId = null; // Clear session ID to ignore any delayed results
      
      if (finalTranscript && this.onResult) {
        console.log('✅ Processing transcript for completed session:', completedSessionId, '| Text:', finalTranscript);
        // Use setTimeout to ensure this happens after current call stack
        setTimeout(() => {
          this.onResult(finalTranscript);
        }, 0);
      } else {
        console.log('❌ No speech result collected for session:', completedSessionId);
      }
      
      this.recognition.stop();
    } else {
      console.log('⚠️ stopListening called but recognition not active or no session');
    }
  }

  // Force stop without triggering callbacks (for cleanup)
  abort() {
    console.log('💥 abort called');
    
    if (this.recognition && this.isListening) {
      this.isListening = false;
      
      // Clear safety timeout on abort
      if (this.fallbackTimeout) {
        console.log('🧹 Clearing safety timeout on abort');
        clearTimeout(this.fallbackTimeout);
        this.fallbackTimeout = null;
      }
      
      this.recognition.abort();
    }
  }

  // Text-to-speech with mobile optimization
  speak(text) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Text-to-speech not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Mobile-optimized voice settings
      if (this.isMobile) {
        utterance.rate = 0.9; // Slightly slower for mobile
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
      } else {
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => {
        console.log('TTS error:', error);
        const errorMessage = this.isMobile 
          ? 'Voice playback failed. Check device volume settings.' 
          : `Text-to-speech error: ${error.error || 'unknown'}`;
        reject(new Error(errorMessage));
      };

      // iOS Safari fix for speech synthesis
      if (this.isIOS) {
        setTimeout(() => {
          this.synthesis.speak(utterance);
        }, 100);
      } else {
        this.synthesis.speak(utterance);
      }
    });
  }

  // Stop any current speech playback
  stopPlayback() {
    return new Promise((resolve) => {
      if (this.synthesis) {
        this.synthesis.cancel();
        // Small delay to ensure cancellation is complete
        setTimeout(resolve, 100);
      } else {
        resolve();
      }
    });
  }

  // Get available voices (mobile-optimized)
  getVoices() {
    const voices = this.synthesis.getVoices();
    
    // Filter for better mobile voices
    if (this.isMobile) {
      return voices.filter(voice => 
        voice.lang.startsWith('en') && 
        (voice.localService || voice.default)
      );
    }
    
    return voices.filter(voice => voice.lang.startsWith('en'));
  }

  // Cleanup method
  cleanup() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}
const speechServiceInstance = new SpeechService();
export default speechServiceInstance;