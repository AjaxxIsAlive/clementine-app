import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Volume2, VolumeX, Mail, ArrowLeft, Heart } from 'lucide-react';

function ChatPage() {
  const [hoveredArea, setHoveredArea] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [chatMode, setChatMode] = useState('voice'); // 'voice' or 'text'
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const imageRef = useRef(null);
  const navigate = useNavigate();

  // Update image size when window resizes or image loads
  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        // Small delay to ensure image is fully rendered
        setTimeout(() => {
          const rect = imageRef.current.getBoundingClientRect();
          setImageSize({ width: rect.width, height: rect.height });
        }, 50);
      }
    };

    updateImageSize();
    window.addEventListener('resize', updateImageSize);
    
    return () => window.removeEventListener('resize', updateImageSize);
  }, []);

  const handleFaceClick = () => {
    // This will be where we trigger VoiceFlow conversation
    console.log('🎤 Starting voice conversation with Clementine...');
    // VoiceFlow integration will go here
  };

  const handleAreaEnter = (area) => {
    setHoveredArea(area);
  };

  const handleAreaLeave = () => {
    setHoveredArea(null);
  };
      setIsProcessingVoice(false);
    } catch (error) {
      console.error('Error stopping playback:', error);
      setIsSpeaking(false);
      setIsProcessingVoice(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    setError('');

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await voiceFlowAPI.interact(messageText);
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: response.text || response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Enhanced voice processing with error handling
      if (isVoiceEnabled && response.audioUrl) {
        setIsProcessingVoice(true);
        try {
          await playVoiceFlowAudio(response.audioUrl);
        } catch (error) {
          console.error('VoiceFlow audio failed:', error);
          setError('Audio playback failed');
          
          // Fallback to browser TTS
          if (speechService.synthesis) {
            try {
              setIsSpeaking(true);
              await speechService.speak(response.text);
              setIsSpeaking(false);
            } catch (ttsError) {
              console.error('TTS fallback failed:', ttsError);
              setError('Voice synthesis unavailable');
            }
          }
        } finally {
          setIsProcessingVoice(false);
        }
      } else if (isVoiceEnabled && speechService.synthesis) {
        setIsProcessingVoice(true);
        try {
          setIsSpeaking(true);
          await speechService.speak(response.text);
          setIsSpeaking(false);
        } catch (error) {
          console.error('TTS failed:', error);
          setError('Voice synthesis failed');
        } finally {
          setIsProcessingVoice(false);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Connection failed');
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isVoiceEnabled]);

  useEffect(() => {
    // Detect mobile and check permissions
    const checkMobileAndPermissions = async () => {
      const isMobileDevice = speechService.isMobile;
      setIsMobile(isMobileDevice);
      
      // Check current permission status
      const permissions = await speechService.checkPermissionStatus();
      setPermissionStatus(permissions);
      
      // Show permission request on mobile if needed
      if (isMobileDevice && permissions.microphone === 'unknown') {
        setShowPermissionRequest(true);
      }
    };
    
    checkMobileAndPermissions();

    // Set up speech service callbacks
    speechService.onResult = (transcript) => {
      console.log('🎯 ChatPage received speech result:', transcript);
      console.log('🚀 About to call handleSendMessage with transcript:', transcript);
      
      // Small delay to ensure UI state is properly updated
      setTimeout(() => {
        handleSendMessage(transcript);
        setIsListening(false);
        setIsProcessingVoice(false); // Clear processing state when result is received
      }, 50);
    };

    speechService.onError = (error) => {
      console.error('Speech error received:', error);
      setError(error);
      setIsListening(false);
      setIsProcessingVoice(false); // Clear processing state on error
    };

    speechService.onStart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError('');
      setIsProcessingVoice(false); // Clear processing state when actually started
    };

    speechService.onEnd = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      setIsProcessingVoice(false); // Clear processing state when ended
    };

    return () => {
      speechService.cleanup();
    };
  }, [handleSendMessage]);

  const playVoiceFlowAudio = (audioUrl) => {
    console.log('playVoiceFlowAudio called with:', audioUrl?.substring(0, 50) + '...');
    return new Promise((resolve, reject) => {
      if (!audioUrl) {
        resolve();
        return;
      }

      // Stop any current audio first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      
      audio.onended = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsSpeaking(false);
        reject(error);
      };

      // Mobile-specific audio handling
      audio.preload = 'metadata';
      audio.crossOrigin = 'anonymous';
      audio.src = audioUrl;
      
      setIsSpeaking(true);
      
      // For mobile browsers, we need to handle autoplay restrictions
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Audio autoplay blocked:', error);
          setIsSpeaking(false);
          reject(error);
        });
      }
    });
  };

  const initializeConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await voiceFlowAPI.startConversation();
      console.log('VoiceFlow response object:', response);
      console.log('Response has audioUrl?', !!response.audioUrl);
      console.log('AudioUrl starts with:', response.audioUrl?.substring(0, 50));
      
      const newMessage = {
        id: Date.now(),
        text: response.text || response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages([newMessage]);
      setHasStartedConversation(true);
      
      // Play VoiceFlow audio if available and voice is enabled
      if (isVoiceEnabled && response.audioUrl) {
        try {
          await playVoiceFlowAudio(response.audioUrl);
        } catch (error) {
          console.error('Error playing welcome audio:', error);
          // Fallback to browser TTS if VoiceFlow audio fails
          if (speechService.synthesis) {
            setIsSpeaking(true);
            await speechService.speak(response.text);
            setIsSpeaking(false);
          }
        }
      } else if (isVoiceEnabled && speechService.synthesis) {
        // Fallback to browser TTS if no audio URL
        setIsSpeaking(true);
        await speechService.speak(response.text);
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      const fallbackMessage = {
        id: Date.now(),
        text: "Hi! I'm Clementine, your relationship advisor. How can I help you today?",
        isUser: false,
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setHasStartedConversation(true);
    } finally {
      setIsLoading(false);
    }
  }, [isVoiceEnabled]);

  useEffect(() => {
    if (!hasStartedConversation) {
      initializeConversation();
    }
  }, [hasStartedConversation, initializeConversation]);

  const requestPermissions = async () => {
    setError('');
    
    try {
      const result = await speechService.requestMobilePermissions();
      
      if (result.success) {
        setPermissionStatus(result.permissions);
        setShowPermissionRequest(false);
        setError('');
      } else {
        setPermissionStatus(result.permissions);
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to request permissions. Please try again.');
    }
  };

  const handleVoiceInput = async () => {
    console.log('🎤 handleVoiceInput called', { 
      isProcessingVoice, 
      isListening, 
      isSpeaking, 
      isMobile, 
      permissionStatus,
      speechServiceExists: !!speechService,
      speechRecognitionSupported: !!window.SpeechRecognition || !!window.webkitSpeechRecognition
    });
    
    // If currently speaking, stop the speech instead of starting voice input
    if (isSpeaking) {
      console.log('🛑 Stopping speech playback');
      setIsProcessingVoice(false); // Clear processing state immediately
      await stopPlayback();
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isProcessingVoice) {
      console.log('⚠️ Already processing voice, returning');
      return;
    }

    // On mobile, check permissions first
    if (isMobile && permissionStatus.microphone !== 'granted') {
      console.log('Mobile permission not granted, showing request');
      setShowPermissionRequest(true);
      return;
    }

    if (isListening) {
      // Stop listening
      console.log('🛑 Manually stopping listening');
      speechService.stopListening();
      setIsListening(false);
    } else {
      // Start voice input
      console.log('🎤 Starting voice input');
      
      setError('');
      setIsProcessingVoice(true);
      
      try {
        const success = await speechService.startListening();
        console.log('Speech service start result:', success);
        if (!success) {
          // Permission might have been revoked, show request again
          if (isMobile) {
            setShowPermissionRequest(true);
          }
        }
      } catch (error) {
        console.error('Voice input error:', error);
        setError('Voice input failed. Please try again.');
      } finally {
        setIsProcessingVoice(false);
      }
    }
  };

  // Push-to-talk: Start recording when button is pressed
  const handleVoiceStart = async () => {
    console.log('🎤 handleVoiceStart called (push-to-talk START)');
    
    // If currently speaking, stop the speech instead of starting voice input
    if (isSpeaking) {
      console.log('🛑 Stopping speech playback');
      await stopPlayback();
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isListening) {
      console.log('⚠️ Already listening, returning');
      return;
    }

    // On mobile, check permissions first
    if (isMobile && permissionStatus.microphone !== 'granted') {
      console.log('Mobile permission not granted, showing request');
      setShowPermissionRequest(true);
      return;
    }

    // Start voice input
    console.log('🎤 Starting push-to-talk recording');
    setError('');
    
    try {
      const success = await speechService.startListening();
      console.log('Speech service start result:', success);
      if (!success) {
        if (isMobile) {
          setShowPermissionRequest(true);
        }
      }
    } catch (error) {
      console.error('Voice input error:', error);
      setError('Voice input failed. Please try again.');
    }
  };

  // Push-to-talk: Stop recording when button is released
  const handleVoiceEnd = () => {
    console.log('🛑 handleVoiceEnd called (push-to-talk END)');
    
    if (isListening) {
      console.log('🛑 Stopping push-to-talk recording');
      speechService.stopListening();
      setIsListening(false);
    }
  };

  const toggleSpeech = async () => {
    if (isSpeaking) {
      await stopPlayback();
    }
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const resetConversation = () => {
    voiceFlowAPI.resetSession();
    setMessages([]);
    setHasStartedConversation(false);
    speechService.synthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div 
      className="min-h-screen pb-24"
      style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)',
        animation: 'gradient-shift 3s ease infinite'
      }}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Mobile Permission Request Modal */}
        {showPermissionRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Enable Voice Chat
                </h3>
                
                <p className="text-gray-600 text-sm mb-6">
                  {isMobile && speechService.isIOS ? 
                    "Clementine needs microphone access to hear you. You'll see a permission popup - please tap 'Allow'." :
                    "Clementine needs microphone access to have voice conversations with you."
                  }
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={requestPermissions}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    Allow Microphone Access
                  </button>
                  
                  <button
                    onClick={() => setShowPermissionRequest(false)}
                    className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Chat with Clementine
            <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full ml-2 animate-pulse">
              🔥 UPDATED v3.0 🔥
            </span>
          </h1>
          <p className="text-gray-600">
            Voice chat with your AI relationship advisor
          </p>
          
          {/* Controls */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={toggleSpeech}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isVoiceEnabled 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{isVoiceEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
            
            <button
              onClick={resetConversation}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Chat</span>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 mb-4">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && hasStartedConversation && (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Starting conversation with Clementine...</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                      : message.isError
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.isUser ? 'text-pink-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    <span className="text-sm">Clementine is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
          <div className="flex space-x-4">
            {/* Text Input */}
            <div className="flex-1 flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage(inputMessage)}
                placeholder="✨ ALWAYS ACTIVE TEXT INPUT ✨"
                style={{
                  backgroundColor: '#fef2f2',
                  borderColor: '#ef4444',
                  borderWidth: '3px'
                }}
                className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              
              {/* Microphone/Stop Button - Push-to-Talk */}
              <button
                // Touch events for mobile push-to-talk
                onTouchStart={(e) => {
                  e.preventDefault();
                  console.log('📱 TOUCH START - Push-to-talk BEGIN');
                  handleVoiceStart();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  console.log('📱 TOUCH END - Push-to-talk RELEASE');
                  handleVoiceEnd();
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  console.log('� TOUCH CANCEL - Push-to-talk RELEASE');
                  handleVoiceEnd();
                }}
                // Mouse events for desktop
                onMouseDown={(e) => {
                  e.preventDefault();
                  console.log('🖱️ MOUSE DOWN - Push-to-talk BEGIN (desktop)');
                  handleVoiceStart();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  console.log('🖱️ MOUSE UP - Push-to-talk RELEASE (desktop)');
                  handleVoiceEnd();
                }}
                onMouseLeave={(e) => {
                  if (isListening) {
                    e.preventDefault();
                    console.log('🖱️ MOUSE LEAVE - Push-to-talk RELEASE (desktop)');
                    handleVoiceEnd();
                  }
                }}
                // Click fallback for stopping speech
                onClick={(e) => {
                  e.preventDefault();
                  console.log('�🔥 BUTTON CLICKED! States:', { isLoading, isListening, isSpeaking, isProcessingVoice });
                  // Only use click for stopping speech, not for voice input
                  if (isSpeaking) {
                    handleVoiceInput();
                  }
                }}
                style={{
                  backgroundColor: isListening ? '#dc2626' : isSpeaking ? '#b91c1c' : '#ec4899',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transform: isListening ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  opacity: 1, // Always available
                  minWidth: '64px',
                  minHeight: '64px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
                className="px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[64px]"
                disabled={false} // Never disabled
                title={
                  isListening ? "🛑 RELEASE TO STOP RECORDING" : 
                  isSpeaking ? "🛑 TAP TO STOP CLEMENTINE" :
                  isMobile ? "🎤 HOLD TO TALK" : "🎤 HOLD/CLICK TO TALK"
                }
              >
                {isListening ? (
                  <Square className="w-5 h-5" />
                ) : isProcessingVoice && !isSpeaking ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isSpeaking ? (
                  <Square className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${
                isLoading || !inputMessage.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Enhanced Status Indicators */}
          <div className="mt-4 flex justify-between items-center text-sm">
            <div className="flex space-x-4">
              {/* Debug States */}
              <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                🐛 DEBUG: L:{isListening ? '✅' : '❌'} S:{isSpeaking ? '✅' : '❌'} P:{isProcessingVoice ? '✅' : '❌'} Load:{isLoading ? '✅' : '❌'}
              </div>
              
              {isListening && (
                <span className="text-red-500 font-bold animate-pulse text-lg">
                  🔴 Listening... Tap mic to stop
                </span>
              )}
              
              {isSpeaking && (
                <span className="text-blue-500 font-bold animate-pulse text-lg">
                  🔊 Speaking... Tap mic to stop
                </span>
              )}
              
              {isProcessingVoice && (
                <span className="text-purple-500 font-medium animate-pulse">
                  🎤 Processing your voice...
                </span>
              )}
              
              {error && (
                <span className="text-red-600 font-medium">
                  ⚠️ {error}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {isMobile && permissionStatus.microphone === 'denied' ? 
                "Microphone access denied" :
                isMobile && permissionStatus.microphone === 'unknown' ? 
                "Tap mic to enable voice" :
                isListening ? "Recording voice..." :
                isSpeaking ? "Tap mic to interrupt" :
                "Tap mic to talk"
              }
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;