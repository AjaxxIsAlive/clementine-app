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
      if (imageRef.current) {
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

  // Load VoiceFlow widget ONCE
  useEffect(() => {
    // This defines a clean, URL-safe ID for the Voiceflow session
    const voiceflowUserID = user ? user.id : sessionId || 'guest';

    // Official VoiceFlow script
    (function(d, t) {
        var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
        v.onload = function() {
          console.log('🔧 VoiceFlow script loaded, initializing...');
          
          window.voiceflow.chat.load({
            verify: { projectID: process.env.REACT_APP_VOICEFLOW_PROJECT_ID },
            url: 'https://general-runtime.voiceflow.com',
            versionID: process.env.REACT_APP_VOICEFLOW_VERSION_ID,
            voice: {
              url: "https://runtime-api.voiceflow.com"
            },
            userID: voiceflowUserID,
            variables: {
              session_id: sessionId || 'guest',
              userName: user ? user.first_name : 'Guest',
              userEmail: user ? user.email : ''
            }
          });
          
          setIsVoiceFlowLoaded(true);
          console.log('✅ VoiceFlow widget initialized');
          
          // Add DOM inspection after initialization
          setTimeout(() => {
            inspectVoiceFlowDOM();
          }, 3000);
        }
        v.onerror = function() {
          console.error('❌ Failed to load VoiceFlow script');
          window.voiceflowChatLoaded = false;
          setIsVoiceFlowLoaded(false);
        }
        v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; 
        v.type = "text/javascript"; 
        s.parentNode.insertBefore(v, s);
    })(document, 'script');
  }, [user, sessionId, voiceFlowUserId]);

  // Hide VoiceFlow widget completely while preserving functionality
  useEffect(() => {
    if (isVoiceFlowLoaded) {
      // Wait a moment for widget to fully render
      setTimeout(() => {
        const style = document.createElement('style');
        style.id = 'voiceflow-hiding-styles';
        style.textContent = `
          /* COMPREHENSIVE VOICEFLOW WIDGET HIDING */
          /* Hide main widget containers */
          iframe[src*="voiceflow"],
          div[data-voiceflow],
          div[class*="voiceflow"],
          div[id*="voiceflow"],
          .vf-chat,
          .vf-widget,
          .vf-launcher,
          .vf-chat-widget,
          .vf-chat-container,
          .vf-floating-chat,
          #voiceflow-chat,
          #vf-chat-widget,
          [class*="VoiceflowWebChat"],
          [id*="VoiceflowWebChat"],
          
          /* Hide by z-index patterns */
          div[style*="z-index: 2147483647"],
          div[style*="z-index: 2147483646"],
          div[style*="z-index: 999999"],
          
          /* Hide floating/fixed positioned elements */
          div[style*="position: fixed"][style*="bottom"],
          div[style*="position: fixed"][style*="right"],
          
          /* VoiceFlow specific selectors */
          .voiceflow-chat,
          [data-widget="voiceflow"],
          [data-testid*="voiceflow"] {
            /* Keep in DOM but make completely invisible */
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            width: 1px !important;
            height: 1px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: -999999 !important;
            visibility: hidden !important;
            overflow: hidden !important;
            /* DO NOT use display: none - breaks audio/voice APIs */
          }
          
          /* Exception: Keep our container visible */
          #voiceflow-container {
            display: block !important;
            position: static !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          
          /* Ensure audio elements remain functional */
          iframe[src*="voiceflow"] audio,
          div[data-voiceflow] audio,
          .vf-chat audio,
          .vf-widget audio,
          [class*="voiceflow"] audio {
            position: absolute !important;
            left: -9998px !important;
            top: -9998px !important;
            width: 1px !important;
            height: 1px !important;
            opacity: 0 !important;
            visibility: hidden !important;
            /* Keep audio functional - no display: none */
            pointer-events: none !important;
          }
        `;
        
        document.head.appendChild(style);
        console.log('🙈 VoiceFlow widget hidden completely (functionality preserved)');
        
        // Additional aggressive hiding after delay
        setTimeout(() => {
          // Find any remaining visible VoiceFlow elements
          const allElements = document.querySelectorAll('*');
          Array.from(allElements).forEach(el => {
            const classes = el.className?.toString() || '';
            const id = el.id || '';
            
            if ((classes.includes('voiceflow') || id.includes('voiceflow')) && 
                el.id !== 'voiceflow-container') {
              // Apply hiding styles directly
              el.style.position = 'absolute';
              el.style.left = '-9999px';
              el.style.top = '-9999px';
              el.style.width = '1px';
              el.style.height = '1px';
              el.style.opacity = '0';
              el.style.visibility = 'hidden';
              el.style.pointerEvents = 'none';
              el.style.zIndex = '-999999';
            }
          });
          
          console.log('🔍 Applied additional hiding to any remaining VoiceFlow elements');
        }, 2000);
        
      }, 1000);
    }
  }, [isVoiceFlowLoaded]);

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
      window.voiceflow.chat.open();
      
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Chat with Clementine</h1>
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