
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Volume2, VolumeX, Mail, ArrowLeft, Heart, LogOut, User, History, MessageCircle } from 'lucide-react';
import authService from '../services/authService';
import voiceFlowAPI from '../services/voiceflow';

function ChatPage({ user, sessionId, voiceFlowUserId, onLogout }) {
  const [hoveredArea, setHoveredArea] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [chatMode, setChatMode] = useState('voice');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isVoiceFlowLoaded, setIsVoiceFlowLoaded] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const imageRef = useRef(null);
  const navigate = useNavigate();

  // Update image size when window resizes or image loads
  useEffect(() => {
    const updateImageSize = () => {
      if (!imageRef.current) return;
      setTimeout(() => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        setImageSize({ width: rect.width, height: rect.height });
      }, 50);
    };

    updateImageSize();
    window.addEventListener('resize', updateImageSize);
    
    return () => window.removeEventListener('resize', updateImageSize);
  }, []);

  // Load user's conversation history and initialize VoiceFlow with context
  useEffect(() => {
    if (user?.id) {
      // Load conversation history from user data
      const storedUser = localStorage.getItem('clementine_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.conversationHistory) {
          setConversationHistory(userData.conversationHistory);
          console.log(`📚 Loaded ${userData.conversationHistory.length} previous conversations`);
        }
      }
      
      // Initialize conversation memory context
      const context = authService.getConversationContext(user.id);
      if (context) {
        console.log(`🧠 Initializing persistent memory for ${context.userName}`);
        console.log(`💭 ${context.hasHistory ? 'Returning user' : 'New user'} - ${context.conversationCount} conversations`);
      }
    }
    
    setIsVoiceFlowLoaded(true);
  }, [user]);

  // Handle face click - start VoiceFlow conversation with API
  const handleFaceClick = async () => {
    if (showChat || isProcessing) {
      console.log('💬 Chat already active or loading');
      return;
    }

    try {
      setIsProcessing(true);
      setShowChat(true);
      console.log('👆 Starting VoiceFlow conversation with API...');
      
      // Start conversation with user context - following Grok's approach but via API
      const response = await voiceFlowAPI.startConversation(user?.id, user);
      
      const welcomeMessage = {
        id: Date.now(),
        text: response.text,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        audioUrl: response.audioUrl
      };
      
      setChatMessages([welcomeMessage]);
      
      // Play audio if enabled
      if (isVoiceEnabled && response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        audio.play().catch(console.error);
      }
      
      console.log('✅ VoiceFlow conversation started with API');
    } catch (error) {
      console.error('❌ Error starting VoiceFlow conversation:', error);
      setChatMessages([{
        id: Date.now(),
        text: "Hello! I'm Clementine, your relationship advisor. I remember our previous conversations and I'm here to help!",
        sender: 'assistant',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Send message to VoiceFlow API with persistent memory
  const sendMessage = async () => {
    if (!currentMessage.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsProcessing(true);

    try {
      // Send message to VoiceFlow API with user context
      const response = await voiceFlowAPI.interact(messageToSend, user?.id, user);
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        audioUrl: response.audioUrl
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Play audio if enabled
      if (isVoiceEnabled && response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        audio.play().catch(console.error);
      }
      
    } catch (error) {
      console.error('❌ Error sending message to VoiceFlow:', error);
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to VoiceFlow right now. Please try again.",
        sender: 'assistant',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAreaEnter = (area) => {
    setHoveredArea(area);
  };

  const handleAreaLeave = () => {
    setHoveredArea(null);
  };

  // Get userID from Supabase user
  // VoiceFlow configuration (temporarily unused)
  // const vfUserID = user?.id || sessionId || 'guest';
  // const vfVars = {
  //   session_id: sessionId || 'guest',
  //   userName: user?.first_name || 'Guest',
  //   userEmail: user?.email || '',
  //   supabase_user_id: user?.id || ''
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* User Info Header */}
      {user && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-full px-4 py-2 shadow-lg flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-800">{user.first_name || user.email || user.username}</div>
            <div className="text-xs text-gray-500">
              {user.hasConversationHistory ? 
                `${conversationHistory.length} previous conversations` : 
                'New user - persistent memory enabled'
              }
            </div>
          </div>
          {conversationHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="View conversation history"
            >
              <History className="w-4 h-4 text-blue-500" />
            </button>
          )}
          <button
            onClick={onLogout}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Conversation History Panel */}
      {showHistory && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-80 max-h-60 bg-white rounded-lg shadow-xl border overflow-y-auto z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Previous Conversations</h3>
            <p className="text-xs text-gray-500">Persistent memory active</p>
          </div>
          <div className="p-4 space-y-2">
            {conversationHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">No previous conversations</p>
            ) : (
              conversationHistory.slice(0, 5).map((conversation, index) => (
                <div key={conversation.id || index} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium text-gray-800">{conversation.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(conversation.updated_at || conversation.created_at).toLocaleDateString()}
                    {conversation.messages && ` • ${conversation.messages.length} messages`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Controls */}
      <div className="absolute top-6 right-6 flex space-x-3">
        <button
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={`p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
            isVoiceEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setChatMode(chatMode === 'voice' ? 'text' : 'voice')}
          className={`p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
            chatMode === 'text' ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-80 text-gray-600'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <button
          onClick={() => {/* Email functionality */}}
          className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
        >
          <Mail className="w-5 h-5" />
        </button>
      </div>

      {/* Main Clementine Face */}
      <div className="relative max-w-sm mx-auto mb-8">
        <div className="relative" style={{ display: 'inline-block', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr'
          }}>
            
            {/* Base Image */}
            <img 
              ref={imageRef}
              src="/images/clementine-base.jpg" 
              alt="Clementine" 
              className="w-full h-auto rounded-3xl shadow-2xl cursor-pointer"
              style={{ 
                gridColumn: 1,
                gridRow: 1,
                gridArea: '1/1'
              }}
              onClick={handleFaceClick}
              onLoad={() => {
                if (imageRef.current) {
                  const rect = imageRef.current.getBoundingClientRect();
                  setImageSize({ width: rect.width, height: rect.height });
                }
              }}
            />
          </div>

          {/* Conversation Trigger Zone */}
          {imageSize.width > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                cursor: 'pointer'
              }}
              onMouseEnter={() => handleAreaEnter('conversation')}
              onMouseLeave={handleAreaLeave}
              onTouchStart={() => handleAreaEnter('conversation')}
              onTouchEnd={handleAreaLeave}
              onClick={handleFaceClick}
            >
              {hoveredArea === 'conversation' && (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-pink-600 bg-opacity-90 text-white px-4 py-2 rounded-full text-lg flex items-center gap-2 animate-pulse">
                    <Heart className="w-5 h-5" />
                    Start Talking
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        <div className="text-xs text-gray-500">
          {!showChat ? 
            "Click Clementine's face to start VoiceFlow API chat (no React Hook conflicts)" :
            "VoiceFlow API active - conversations saved to database"
          }
        </div>
        <div className="mt-2 text-xs">
          {isVoiceFlowLoaded ? (
            <span className="text-green-600">✅ VoiceFlow API & Memory Ready</span>
          ) : (
            <span className="text-orange-600">⏳ Loading VoiceFlow API...</span>
          )}
        </div>
      </div>

      {/* Title and Instructions */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Clementine - Version 4.1</h1>
        <p className="text-gray-600 mb-2">VoiceFlow API + Supabase + Persistent Memory</p>
        
        {!showChat ? (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-purple-600">VoiceFlow API Integration 🚀</p>
            <p>Direct API calls (no React Hook conflicts) with database persistence</p>
            <p className="text-xs">
              {conversationHistory.length > 0 ? 
                `Welcome back! I have ${conversationHistory.length} previous conversations with you.` :
                'New user - VoiceFlow API will start building your conversation history.'
              }
            </p>
          </div>
        ) : (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-green-600">VoiceFlow API Chat Active 💬</p>
            <p>Direct Dialog Manager API with persistent memory</p>
          </div>
        )}
      </div>

      {/* VoiceFlow API Chat Interface - No React Hook Conflicts */}
      <div className="mt-8 w-full max-w-md">
        {!showChat ? (
          <div className="p-6 border-2 border-green-300 rounded-lg bg-green-50">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🚀 VoiceFlow API + Persistent Memory Ready!</h3>
            <p className="text-green-700 mb-4">
              Using VoiceFlow Dialog Manager API directly (no React Hook conflicts) with database persistence.
            </p>
            <div className="text-sm text-green-600 bg-white p-3 rounded border">
              <strong>User:</strong> {user?.first_name || 'Unknown'}<br/>
              <strong>Email:</strong> {user?.email || 'Unknown'}<br/>
              <strong>VF User ID:</strong> {user?.id || 'None'}<br/>
              <strong>Previous Conversations:</strong> {conversationHistory.length}<br/>
              <strong>Memory Status:</strong> {conversationHistory.length > 0 ? 'Active' : 'New User'}
            </div>
            <p className="text-xs text-green-600 mt-3">
              Click Clementine's face to start VoiceFlow conversation via API!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b bg-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-pink-600" />
                  <span className="font-semibold text-gray-800">VoiceFlow API Chat</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">
                    {conversationHistory.length > 0 ? 'Memory Active' : 'New Session'}
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div>{message.text}</div>
                    {message.audioUrl && (
                      <audio
                        controls
                        className="mt-2 w-full h-8"
                        src={message.audioUrl}
                      />
                    )}
                    <div className="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">💭</div>
                      VoiceFlow is thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  disabled={isProcessing}
                />
                <button
                  onClick={sendMessage}
                  disabled={isProcessing || !currentMessage.trim()}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                🎯 VoiceFlow API + Supabase persistent memory + No React Hook conflicts
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default ChatPage;