/* eslint-disable react-hooks/exhaustive-deps, no-use-before-define */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Volume2, Send, MessageSquare } from 'lucide-react';
import voiceFlowAPI from '../services/voiceflow';

function VoiceFlowAPIChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Web Speech API with better configuration
  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Optimized settings for better voice recognition
      recognitionRef.current.continuous = false; // Single utterance mode
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          handleSendMessage(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [handleSendMessage]);

  // Initialize conversation
  const initializeConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await voiceFlowAPI.startConversation();
      
      const newMessage = {
        id: Date.now(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        audioUrl: response.audioUrl
      };
      
      setMessages([newMessage]);
      setHasStartedConversation(true);
      
      // Auto-play welcome audio
      if (response.audioUrl) {
        playVoiceFlowAudio(response.audioUrl);
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
  }, []);

  useEffect(() => {
    if (!hasStartedConversation) {
      initializeConversation();
    }
  }, [hasStartedConversation, initializeConversation]);

  // Play VoiceFlow audio
  const playVoiceFlowAudio = (audioUrl) => {
    return new Promise((resolve, reject) => {
      if (!audioUrl) {
        resolve();
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.src = audioUrl;
      
      audio.onended = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsSpeaking(false);
        reject(error);
      };

      setIsSpeaking(true);
      audio.play().catch(reject);
    });
  };

  // Send message to VoiceFlow
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
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        audioUrl: response.audioUrl
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Play VoiceFlow audio response
      if (response.audioUrl) {
        try {
          await playVoiceFlowAudio(response.audioUrl);
        } catch (error) {
          console.error('Audio playback failed:', error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Voice input controls
  const startVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        setError('Failed to start voice recognition');
      }
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isSpeaking) {
      stopAudio();
    } else if (isListening) {
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
            VoiceFlow API + Custom UI
            <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full ml-2 animate-pulse">
              🔗 API INTEGRATION 🔗
            </span>
          </h1>
          <p className="text-gray-600">
            Your interface + VoiceFlow's conversational AI + ElevenLabs voice
          </p>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 mb-4">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
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
                  {message.audioUrl && !message.isUser && (
                    <button
                      onClick={() => playVoiceFlowAudio(message.audioUrl)}
                      className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                    >
                      🔊 Replay audio
                    </button>
                  )}
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

        {/* Input Interface */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
          <div className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message or click mic for voice..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={isListening}
            />

            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={isLoading}
              className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[64px] ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : isSpeaking
                  ? 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
              title={
                isListening ? "Stop listening" : 
                isSpeaking ? "Stop audio playback" : 
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
          
          {/* Status */}
          <div className="mt-4 flex justify-between items-center text-sm">
            <div>
              {isListening && (
                <span className="text-red-500 font-bold animate-pulse">
                  🔴 Listening... Click mic to stop
                </span>
              )}
              
              {isSpeaking && (
                <span className="text-blue-500 font-bold">
                  🔊 Playing Clementine's response... Click mic to stop
                </span>
              )}
              
              {error && (
                <span className="text-red-600 font-medium">
                  ⚠️ {error}
                </span>
              )}
            </div>
            
            <span className="text-gray-500 text-xs">
              Powered by VoiceFlow + ElevenLabs
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VoiceFlowAPIChat;
