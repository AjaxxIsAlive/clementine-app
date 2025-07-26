class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    
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

  // Initialize speech recognition with mobile handling
  initializeSpeechRecognition() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Mobile-optimized settings
    if (this.isMobile) {
      this.recognition.continuous = false; // Better for mobile
      this.recognition.interimResults = false; // Reduce processing on mobile
    } else {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
    }
    
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal && this.onResult) {
        this.onResult(result[0].transcript);
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      let errorMessage = 'Speech recognition error';
      
      // Mobile-specific error handling
      if (this.isMobile) {
        switch (event.error) {
          case 'not-allowed':
            errorMessage = this.isIOS 
              ? 'Microphone blocked. Check Safari settings.' 
              : 'Microphone permission denied. Please allow access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Try speaking closer to your device.';
            break;
          case 'network':
            errorMessage = 'Network error. Check your internet connection.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not working. Check device settings.';
            break;
          default:
            errorMessage = `Voice recognition failed: ${event.error}`;
        }
      }
      
      if (this.onError) this.onError(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) this.onEnd();
    };
  }

  // Start listening with permission check
  async startListening() {
    // Check permissions first on mobile
    if (this.isMobile && this.permissionStatus.microphone !== 'granted') {
      const permissionResult = await this.requestMobilePermissions();
      if (!permissionResult.success) {
        if (this.onError) this.onError(permissionResult.message);
        return false;
      }
    }

    try {
      if (!this.recognition) {
        this.initializeSpeechRecognition();
      }
      
      this.recognition.start();
      return true;
    } catch (error) {
      const errorMessage = this.isMobile 
        ? 'Voice input failed. Please check microphone permissions.' 
        : 'Speech recognition failed to start';
      if (this.onError) this.onError(errorMessage);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
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
        const errorMessage = this.isMobile 
          ? 'Voice playback failed. Check device volume settings.' 
          : 'Text-to-speech error';
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