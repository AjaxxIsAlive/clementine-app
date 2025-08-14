import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Volume2, VolumeX, Mail, ArrowLeft, Heart, LogOut, User } from 'lucide-react';

function ChatPage({ user, sessionId, voiceFlowUserId, onLogout }) {
  const [hoveredArea, setHoveredArea] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [chatMode, setChatMode] = useState('voice');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isVoiceFlowLoaded, setIsVoiceFlowLoaded] = useState(false);
  const imageRef = useRef(null);
  const navigate = useNavigate();

  // Update image size when window resizes or image loads
  useEffect(() => {
    const updateImageSize = () => {
  if (!imageRef.current) return;
  setTimeout(() => {
    if (!imageRef.current) return; // ← extra guard fixes the null crash
    const rect = imageRef.current.getBoundingClientRect();
    setImageSize({ width: rect.width, height: rect.height });
  }, 50);
};

    updateImageSize();
    window.addEventListener('resize', updateImageSize);
    
    return () => window.removeEventListener('resize', updateImageSize);
  }, []);

  // Load VoiceFlow widget ONCE
useEffect(() => {
  if (!user) return; // wait for auth

  const vfUserID = user?.id || sessionId || 'guest';
  const vfVars = {
    session_id: sessionId || 'guest',
    userName: user?.first_name || 'Guest',
    userEmail: user?.email || '',
    supabase_user_id: user?.id || ''
  };

  (function (d, t) {
    const v = d.createElement(t);
    const s = d.getElementsByTagName(t)[0];

    v.onload = function () {
      const loadPromise = window.voiceflow.chat.load({
        verify: { projectID: process.env.REACT_APP_VOICEFLOW_PROJECT_ID },
        url: 'https://general-runtime.voiceflow.com',
        versionID: process.env.REACT_APP_VOICEFLOW_VERSION_ID,
        voice: { url: 'https://runtime-api.voiceflow.com' },
        userID: vfUserID,
        variables: {
          userName: vfVars.userName || '',
          userEmail: vfVars.userEmail || '',
          supabase_user_id: vfVars.supabase_user_id || '',
          session_id: vfVars.session_id || ''
        }
      });

      Promise.resolve(loadPromise).then(() => {
        console.log('VF OPEN INIT >>', JSON.stringify({ vfUserID, vfVars }, null, 2));
        window.voiceflow.chat.open();
        setIsVoiceFlowLoaded(true);
      });
    };

    v.src = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';
    v.type = 'module';
    s.parentNode.insertBefore(v, s);
  })(document, 'script');
}, [user, sessionId]);

  // Hide VoiceFlow widget completely while preserving functionality
// TEMP: hide-widget CSS disabled during deploy (was causing unterminated template string)
useEffect(() => {}, [isVoiceFlowLoaded]);

  // Function to inspect VoiceFlow DOM structure
  const inspectVoiceFlowDOM = () => {
    console.log('🔍 INSPECTING VOICEFLOW DOM STRUCTURE:');
    
    // Check for shadow DOM
    if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat._shadowRoot) {
      const shadowRoot = window.voiceflow.chat._shadowRoot;
      const shadowButtons = shadowRoot.querySelectorAll('button');
      console.log(`📋 Found ${shadowButtons.length} buttons in shadow DOM`);
      
      shadowButtons.forEach((btn, i) => {
        console.log(`Shadow Button ${i}:`, {
          text: btn.textContent.trim(),
          className: btn.className,
          attributes: Array.from(btn.attributes).map(attr => `${attr.name}="${attr.value}"`),
          visible: btn.offsetParent !== null
        });
      });
    }
    
    // Check regular DOM
    const allButtons = document.querySelectorAll('button');
    console.log(`📋 Found ${allButtons.length} buttons in regular DOM`);
    
    allButtons.forEach((btn, i) => {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('voice') || text.includes('call') || text.includes('start')) {
        console.log(`Potential Voice Button ${i}:`, {
          text: btn.textContent.trim(),
          className: btn.className,
          ariaLabel: btn.getAttribute('aria-label'),
          visible: btn.offsetParent !== null
        });
      }
    });
  };

  // Handle face click - try to activate voice
  const handleFaceClick = () => {
    console.log('👆 Face clicked! Attempting voice activation...');
    
    if (!isVoiceFlowLoaded) {
      console.log('⏳ VoiceFlow still loading...');
      return;
    }

    if (!window?.voiceflow?.chat) { 
    console.log('❌ Voiceflow not initialized yet'); 
    return; 
  }

    try {
      // Method 1: Try Shadow DOM access
      if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat._shadowRoot) {
        console.log('🎯 Accessing VoiceFlow Shadow DOM...');
        
        const shadowRoot = window.voiceflow.chat._shadowRoot;
        const shadowButtons = shadowRoot.querySelectorAll('button');
        console.log(`📋 Found ${shadowButtons.length} buttons in shadow DOM`);
        
        // Look for voice/call button
        const callButton = Array.from(shadowButtons).find(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('call') || text.includes('voice') || text.includes('start');
        });
        
        if (callButton) {
          console.log('🎯 Found voice button:', callButton.textContent);
          callButton.click();
          console.log('✅ Voice activated via shadow DOM!');
          return;
        }
      }
      
      // Method 2: Try opening chat first
      console.log('🔄 Opening VoiceFlow chat...');
            
      // Then try to find voice button after delay
      setTimeout(() => {
        if (window.voiceflow.chat._shadowRoot) {
          const shadowRoot = window.voiceflow.chat._shadowRoot;
          const callBtn = shadowRoot.querySelector('button');
          if (callBtn && callBtn.textContent.toLowerCase().includes('call')) {
            callBtn.click();
            console.log('✅ Voice activated via delayed method');
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error accessing VoiceFlow:', error);
      
      // Fallback: Try API method
      try {
        if (window.voiceflow && window.voiceflow.chat.interact) {
          window.voiceflow.chat.interact({ type: 'voice' });
          console.log('🎤 Attempted voice via API');
        }
      } catch (e) {
        console.log('❌ All voice activation methods failed');
      }
    }
  };

  // Manual inspection helper
  window.inspectVoiceFlow = () => {
    inspectVoiceFlowDOM();
    return window.voiceflow;
  };

  const handleAreaEnter = (area) => {
    setHoveredArea(area);
  };

  const handleAreaLeave = () => {
    setHoveredArea(null);
  };

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
            <div className="text-xs text-gray-500">Connected to VoiceFlow</div>
          </div>
          <button
            onClick={onLogout}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
          </button>
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
                zIndex: 1
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
          Click Clementine's face to start voice conversation
        </div>
        <div className="mt-2 text-xs">
          {isVoiceFlowLoaded ? (
            <span className="text-green-600">✅ VoiceFlow Ready</span>
          ) : (
            <span className="text-orange-600">⏳ Loading VoiceFlow...</span>
          )}
        </div>
      </div>

      {/* Title and Instructions */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Clementine - Version 3</h1>
        <p className="text-gray-600 mb-2">Your AI relationship advisor</p>
        
        {chatMode === 'voice' ? (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-purple-600">Voice Mode Active 🎤</p>
            <p>Click anywhere on Clementine's face to start talking</p>
            <p className="text-xs">Pure voice conversation with VoiceFlow</p>
          </div>
        ) : (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-blue-600">Text Mode Active 💬</p>
            <p>Text chat interface will appear here</p>
          </div>
        )}
      </div>

      {/* Text Chat Area */}
      {chatMode === 'text' && (
        <div className="mt-8 w-full max-w-md bg-white rounded-2xl shadow-xl p-4">
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Text chat interface coming soon...</p>
            <p className="text-xs mt-2">For now, enjoy voice conversations!</p>
          </div>
        </div>
      )}

      {/* Hidden VoiceFlow Container */}
      <div id="voiceflow-container" style={{ display: 'none' }}>
        {/* VoiceFlow widget loads here */}
      </div>

    </div>
  );
}

export default ChatPage;