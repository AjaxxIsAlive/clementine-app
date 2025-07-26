import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Mic, MicOff, Send, Volume2, VolumeX, RotateCcw } from 'lucide-react';
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
  if (!hasStartedConversation) {
    initializeConversation();
  }
}, [hasStartedConversation, initializeConversation]);

  const playVoiceFlowAudio = (audioUrl) => {
    console.log('playVoiceFlowAudio called with:', audioUrl?.substring(0, 50) + '...');
    return new Promise((resolve, reject) => {
      if (!audioUrl) {
        resolve();
        return;
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

      audio.src = audioUrl;
      setIsSpeaking(true);
      audio.play().catch(reject);
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
          if (speechService.isSpeechSynthesisSupported()) {
            setIsSpeaking(true);
            await speechService.speak(response.text);
            setIsSpeaking(false);
          }
        }
      } else if (isVoiceEnabled && speechService.isSpeechSynthesisSupported()) {
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
  }, []);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

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

      // Play VoiceFlow audio if available and voice is enabled
      if (isVoiceEnabled && response.audioUrl) {
        try {
          await playVoiceFlowAudio(response.audioUrl);
        } catch (error) {
          console.error('Error playing response audio:', error);
          // Fallback to browser TTS if VoiceFlow audio fails
          if (speechService.isSpeechSynthesisSupported()) {
            setIsSpeaking(true);
            await speechService.speak(response.text);
            setIsSpeaking(false);
          }
        }
      } else if (isVoiceEnabled && speechService.isSpeechSynthesisSupported()) {
        // Fallback to browser TTS if no audio URL
        setIsSpeaking(true);
        await speechService.speak(response.text);
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
  };

  const startVoiceRecording = async () => {
    if (!speechService.isSpeechRecognitionSupported()) {
      alert('Voice recording is not supported in your browser.');
      return;
    }

    try {
      setIsListening(true);
      speechService.stopSpeaking();
      setIsSpeaking(false);
      
      const transcript = await speechService.startListening();
      setIsListening(false);
      
      if (transcript.trim()) {
        await sendMessage(transcript);
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setIsListening(false);
      alert('Voice recording failed. Please try again or type your message.');
    }
  };

  const stopVoiceRecording = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
    }
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const resetConversation = () => {
    voiceFlowAPI.resetSession();
    setMessages([]);
    setHasStartedConversation(false);
    speechService.stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
          <div className="flex space-x-4">
            {/* Voice Button */}
            <button
              type="button"
              onClick={isListening ? stopVoiceRecording : startVoiceRecording}
              disabled={isLoading || isSpeaking}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : speechService.isSpeechRecognitionSupported()
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <div className="flex-1 flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message or use voice..."
                disabled={isLoading || isListening}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
              
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
          </div>
          
          {/* Status Indicators */}
          <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
            <div className="flex space-x-4">
              {isListening && (
                <span className="text-red-500 font-medium animate-pulse">
                  🎤 Listening...
                </span>
              )}
              {isSpeaking && (
                <span className="text-blue-500 font-medium">
                  🔊 Clementine is speaking...
                </span>
              )}
            </div>
            
            <div className="text-xs">
              {speechService.isSpeechRecognitionSupported() 
                ? "Voice input supported" 
                : "Voice input not available"}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;