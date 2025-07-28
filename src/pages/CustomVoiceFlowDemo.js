import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, VolumeX, Send, Heart, Star } from 'lucide-react';

// DEMO VERSION - Shows what the Custom UI option would look like
// This is a working preview without VoiceFlow SDK dependencies
function CustomVoiceFlowDemo() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! I'm Clementine, your AI relationship advisor. How can I help you today?",
      sender: 'clementine',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Demo response generator
  const getDemoResponse = (userMessage) => {
    const responses = [
      "That's a really thoughtful question! In relationships, communication is key. Have you tried talking openly about your feelings?",
      "I understand how challenging that can be. Many couples face similar situations. What matters most is how you both choose to handle it together.",
      "It sounds like you're really caring about this relationship! That's wonderful. Remember, healthy relationships require effort from both people.",
      "That's definitely something worth exploring together. Have you considered what you both want from this relationship?",
      "I can hear the emotion in your words. It's completely normal to feel that way. What do you think would help you feel more secure?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Demo voice listening simulation
  const handleStartListening = () => {
    setIsListening(true);
    setTranscript('');
    
    // Simulate voice recognition
    setTimeout(() => {
      setTranscript('I need advice about...');
    }, 1000);
    
    setTimeout(() => {
      setTranscript('I need advice about my relationship');
    }, 2000);
    
    setTimeout(() => {
      setTranscript('I need advice about my relationship and communication');
    }, 3000);
  };

  const handleStopListening = () => {
    setIsListening(false);
    if (transcript) {
      handleSendMessage(transcript);
      setTranscript('');
    }
  };

  // Demo text-to-speech simulation
  const handlePlayback = async (text) => {
    setIsSpeaking(true);
    
    // Simulate speech duration (real version would use ElevenLabs)
    const speechDuration = Math.max(2000, text.length * 80);
    setTimeout(() => {
      setIsSpeaking(false);
    }, speechDuration);
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate processing delay
    setTimeout(() => {
      const response = getDemoResponse(messageText);
      const clementineMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'clementine',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, clementineMessage]);
      setIsLoading(false);

      // Auto-play voice response if enabled
      if (isVoiceEnabled) {
        handlePlayback(response);
      }
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)',
        animation: 'gradient-shift 3s ease infinite'
      }}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl h-screen flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Custom UI Preview
            <span className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full ml-2 animate-pulse">
              ⭐ YOUR DESIGN ⭐
            </span>
          </h1>
          <p className="text-gray-600">
            This is what Option 2 looks like - YOUR beautiful UI + VoiceFlow voice tech
          </p>
        </div>

        {/* Demo Notice */}
        <div className="bg-purple-100 border border-purple-300 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">✨ DEMO MODE - See What You Get</h3>
          </div>
          <p className="text-purple-700 text-sm mt-1">
            This shows your exact UI design with simulated VoiceFlow responses. The real version connects to your VoiceFlow project with ElevenLabs voice.
          </p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-pink-100 flex flex-col overflow-hidden">
          
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src="/images/clementine-face.jpg" 
                  alt="Clementine" 
                  className="w-10 h-10 rounded-full border-2 border-white"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div 
                  className="w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center" 
                  style={{display: 'none'}}
                >
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Clementine</h3>
                  <p className="text-xs opacity-90">AI Relationship Advisor</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className={`p-2 rounded-full transition-colors ${
                  isVoiceEnabled ? 'bg-white bg-opacity-20' : 'bg-red-500'
                }`}
              >
                {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  {message.sender === 'clementine' && isSpeaking && message === messages[messages.length - 1] && (
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Volume2 className="w-3 h-3 mr-1 animate-pulse" />
                      <span>Speaking...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Feedback */}
          {(isListening || transcript) && (
            <div className="px-4 py-2 bg-purple-50 border-t border-purple-100">
              <div className="flex items-center space-x-2">
                <Mic className={`w-4 h-4 text-purple-500 ${isListening ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-purple-700">
                  {isListening ? 'Listening...' : 'Processing voice...'}
                </span>
              </div>
              {transcript && (
                <p className="text-sm text-purple-600 mt-1 italic">"{transcript}"</p>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              
              {/* Voice Button */}
              <button
                onMouseDown={handleStartListening}
                onMouseUp={handleStopListening}
                onTouchStart={handleStartListening}
                onTouchEnd={handleStopListening}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500 text-white scale-110 shadow-lg' 
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg'
                }`}
                disabled={isLoading}
              >
                {isListening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or hold the mic to speak..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-white rounded-lg p-4 shadow-lg">
          <h3 className="font-semibold text-gray-800 mb-2">🎯 This is Option 2: Custom UI + VoiceFlow</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800">✨ What You Keep:</h4>
              <ul className="space-y-1">
                <li>• Your beautiful pink/purple design</li>
                <li>• Your Clementine branding</li>
                <li>• Your custom chat interface</li>
                <li>• Your gradient backgrounds</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">🚀 What VoiceFlow Adds:</h4>
              <ul className="space-y-1">
                <li>• Perfect voice recognition</li>
                <li>• ElevenLabs quality audio</li>
                <li>• Mobile optimization</li>
                <li>• Reliable conversation AI</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-3 font-medium">
            💡 Setup time: 30 minutes to connect VoiceFlow SDK to this exact interface
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomVoiceFlowDemo;
