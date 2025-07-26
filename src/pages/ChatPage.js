import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Volume2, VolumeX, RotateCcw, Mic, Square } from 'lucide-react';
import voiceFlowAPI from '../services/voiceflow';
import speechService from '../services/speechService';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [error, setError] = useState('');

  // Mobile permission states
  const [permissionStatus, setPermissionStatus] = useState({
    microphone: 'unknown',
    speech: 'unknown'
  });
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const stopPlayback = useCallback(async () => {
    try {
      // Stop VoiceFlow audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Stop speech synthesis
      await speechService.stopPlayback();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error stopping playback:', error);
      setIsSpeaking(false);
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
      console.log('Speech result:', transcript);
      handleSendMessage(transcript);
      setIsListening(false);
    };

    speechService.onError = (error) => {
      console.error('Speech error:', error);
      setError(error);
      setIsListening(false);
    };

    speechService.onStart = () => {
      setIsListening(true);
      setError('');
    };

    speechService.onEnd = () => {
      setIsListening(false);
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
    // Prevent multiple simultaneous requests
    if (isProcessingVoice) {
      return;
    }

    // On mobile, check permissions first
    if (isMobile && permissionStatus.microphone !== 'granted') {
      setShowPermissionRequest(true);
      return;
    }

    if (isListening) {
      // Stop listening
      speechService.stopListening();
      setIsListening(false);
    } else {
      // Stop any current playback before starting to listen
      await stopPlayback();
      
      setError('');
      setIsProcessingVoice(true);
      
      try {
        const success = await speechService.startListening();
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

  const startRecording = () => {
    if (!isListening && !isProcessingVoice) {
      handleVoiceInput();
    }
  };

  const stopRecording = () => {
    if (isListening) {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
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
          {/* Stop Speaking Button */}
          {isSpeaking && (
            <div className="flex items-center justify-center mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-600 font-medium mr-3">
                🔊 Clementine is speaking...
              </span>
              <button
                onClick={stopPlayback}
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors flex items-center text-sm"
                title="Stop speaking"
              >
                <Square className="w-4 h-4 mr-1" />
                Stop
              </button>
            </div>
          )}

          <div className="flex space-x-4">
            {/* Text Input */}
            <div className="flex-1 flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Type your message..."
                disabled={isLoading || isListening}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
              
              {/* Microphone Button */}
              <button
                onClick={handleVoiceInput}
                className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[48px] ${
                  isListening 
                    ? 'bg-red-500 text-white scale-105 shadow-lg' 
                    : isProcessingVoice
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'bg-pink-500 text-white hover:bg-pink-600 shadow-md'
                }`}
                disabled={isLoading}
                title={isListening ? "Tap to stop recording" : "Tap to start voice message"}
              >
                {isListening ? (
                  <Square className="w-5 h-5" />
                ) : isProcessingVoice ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || isListening}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${
                isLoading || !inputMessage.trim() || isListening
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
              {isListening && (
                <span className="text-red-500 font-bold animate-pulse text-lg">
                  🔴 Listening... Tap mic again to stop
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
                "Tap mic button to talk"
              }
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;