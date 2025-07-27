import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, Square, Volume2, VolumeX, Send, MessageSquare } from 'lucide-react';

function CustomVoiceFlowChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  
  const runtimeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize VoiceFlow Runtime SDK
  useEffect(() => {
    const initializeVoiceFlow = async () => {
      try {
        // Load VoiceFlow Runtime SDK
        const script = document.createElement('script');
        script.src = 'https://cdn.voiceflow.com/runtime/bundle.mjs';
        script.type = 'module';
        script.crossOrigin = 'anonymous';
        
        script.onload = async () => {
          if (window.VoiceflowRuntime) {
            // Initialize with your credentials
            runtimeRef.current = new window.VoiceflowRuntime({
              versionID: process.env.REACT_APP_VOICEFLOW_VERSION_ID,
              projectID: process.env.REACT_APP_VOICEFLOW_PROJECT_ID,
              apiKey: process.env.REACT_APP_VOICEFLOW_API_KEY,
              
              // Voice configuration
              config: {
                voice: {
                  enabled: true,
                  language: 'en-US',
                  autoplay: true,
                },
                tts: {
                  enabled: true,
                },
                stt: {
                  enabled: true,
                  continuous: true,
                }
              }
            });

            // Set up event listeners
            runtimeRef.current.on('voice.start', () => {
              setIsListening(true);
              setError('');
            });

            runtimeRef.current.on('voice.end', () => {
              setIsListening(false);
            });

            runtimeRef.current.on('voice.transcript', (data) => {
              setTranscript(data.transcript);
            });

            runtimeRef.current.on('voice.audio.start', () => {
              setIsSpeaking(true);
            });

            runtimeRef.current.on('voice.audio.end', () => {
              setIsSpeaking(false);
            });

            runtimeRef.current.on('voice.error', (error) => {
              setError(error.message);
              setIsListening(false);
            });

            runtimeRef.current.on('message', (message) => {
              // Handle incoming messages from VoiceFlow
              const newMessage = {
                id: Date.now(),
                text: message.text || message.message,
                isUser: false,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, newMessage]);
            });

            // Launch the conversation
            await runtimeRef.current.launch();
            
            // Add welcome message
            const welcomeMessage = {
              id: Date.now(),
              text: "Hi! I'm Clementine, your relationship advisor. How can I help you today?",
              isUser: false,
              timestamp: new Date()
            };
            setMessages([welcomeMessage]);
          }
        };

        document.head.appendChild(script);

        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (error) {
        console.error('Failed to initialize VoiceFlow:', error);
        setError('Failed to initialize voice chat');
      }
    };

    initializeVoiceFlow();
  }, []);

  // Send text message to VoiceFlow
  const handleSendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || isLoading || !runtimeRef.current) return;

    setError('');
    setIsLoading(true);

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      // Send message to VoiceFlow Runtime
      await runtimeRef.current.sendMessage(messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Voice input controls
  const startVoiceInput = async () => {
    if (runtimeRef.current && !isListening) {
      try {
        await runtimeRef.current.startVoiceInput();
      } catch (error) {
        setError('Failed to start voice input');
      }
    }
  };

  const stopVoiceInput = async () => {
    if (runtimeRef.current && isListening) {
      try {
        await runtimeRef.current.stopVoiceInput();
      } catch (error) {
        setError('Failed to stop voice input');
      }
    }
  };

  const stopAudio = async () => {
    if (runtimeRef.current && isSpeaking) {
      try {
        await runtimeRef.current.stopAudio();
      } catch (error) {
        setError('Failed to stop audio');
      }
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
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
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Custom UI + VoiceFlow Tech
            <span className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full ml-2 animate-pulse">
              🎨 CUSTOM UI 🎨
            </span>
          </h1>
          <p className="text-gray-600">
            Your beautiful interface powered by VoiceFlow's voice technology
          </p>
        </div>

        {/* Chat Messages - Your Custom UI */}
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 mb-4">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
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
            
            {/* Live Voice Transcript */}
            {transcript && isListening && (
              <div className="flex justify-end">
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl">
                  <p className="text-sm italic">🎤 "{transcript}"</p>
                </div>
              </div>
            )}
            
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

        {/* Custom Input Interface */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
          <div className="flex space-x-4">
            {/* Text Input */}
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message or use voice..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={isListening}
              />
            </div>

            {/* Voice Control Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={isLoading}
              className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[64px] ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : isSpeaking
                  ? 'bg-blue-500 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
              title={
                isListening ? "Stop listening" : 
                isSpeaking ? "Clementine is speaking" : 
                "Start voice input"
              }
            >
              {isListening ? (
                <Square className="w-5 h-5" />
              ) : isSpeaking ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || isListening}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isLoading || !inputMessage.trim() || isListening
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Status and Controls */}
          <div className="mt-4 flex justify-between items-center text-sm">
            <div className="flex space-x-4">
              {isListening && (
                <span className="text-red-500 font-bold animate-pulse">
                  🔴 Listening... Click mic to stop
                </span>
              )}
              
              {isSpeaking && (
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500 font-bold">
                    🔊 Clementine is speaking...
                  </span>
                  <button
                    onClick={stopAudio}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {error && (
                <span className="text-red-600 font-medium">
                  ⚠️ {error}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={`text-xs px-2 py-1 rounded ${
                  isVoiceEnabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isVoiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomVoiceFlowChat;
