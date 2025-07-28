/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Volume2, VolumeX, Mail, ArrowLeft, Heart } from 'lucide-react';

function ChatPage() {
  const [hoveredArea, setHoveredArea] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [chatMode, setChatMode] = useState('voice'); // 'voice' or 'text'
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isVoiceFlowLoaded, setIsVoiceFlowLoaded] = useState(false);
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

  // Load VoiceFlow widget ONCE - using PROVEN working script from test
  useEffect(() => {
    // Ultimate protection against double loading
    if (window.voiceflowChatLoaded) {
      console.log('✅ VoiceFlow already loaded (global flag protection)');
      setIsVoiceFlowLoaded(true);
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="voiceflow"]')) {
      console.log('✅ VoiceFlow script already exists');
      window.voiceflowChatLoaded = true;
      setIsVoiceFlowLoaded(true);
      return;
    }

    console.log('🔧 Loading VoiceFlow widget with PROVEN working script...');
    window.voiceflowChatLoaded = true; // Set flag immediately
    
    // OFFICIAL VOICEFLOW SCRIPT - Exact same as working test page
    (function(d, t) {
        var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
        v.onload = function() {
          console.log('🔧 Official VoiceFlow script loaded, initializing...');
          
          window.voiceflow.chat.load({
            verify: { projectID: '68829d0cd2b91792a19c12a1' },
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production',
            voice: {
              url: "https://runtime-api.voiceflow.com"
            }
          });
          
          setIsVoiceFlowLoaded(true);
          console.log('✅ VoiceFlow widget initialized successfully for face navigation');
          
          // Additional debugging
          setTimeout(() => {
            console.log('🔍 VoiceFlow ready for face-based interaction');
          }, 2000);
        }
        v.onerror = function() {
          console.error('❌ Failed to load official VoiceFlow script');
          window.voiceflowChatLoaded = false; // Reset on error
          setIsVoiceFlowLoaded(false);
        }
        v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; 
        v.type = "text/javascript"; 
        s.parentNode.insertBefore(v, s);
    })(document, 'script');
    
    // No cleanup - let VoiceFlow persist
  }, []); // Empty dependency array - run once only

  // DOM inspection and widget visibility for debugging
  useEffect(() => {
    console.log('🔍 Widget left visible for audio debugging');
    
    // Add DOM inspection after widget loads
    if (isVoiceFlowLoaded) {
      setTimeout(() => {
        console.log('🔍 INSPECTING VOICEFLOW WIDGET DOM STRUCTURE:');
        
        // Find all VoiceFlow elements
        const voiceflowElements = document.querySelectorAll('[class*="voiceflow"], [id*="voiceflow"], iframe[src*="voiceflow"]');
        console.log('📋 VoiceFlow elements found:', voiceflowElements.length);
        
        // Log all buttons in the widget
        const allButtons = document.querySelectorAll('button');
        console.log('📋 All buttons on page:', allButtons.length);
        
        allButtons.forEach((button, index) => {
          const text = button.textContent.trim();
          const ariaLabel = button.getAttribute('aria-label');
          const classes = button.className;
          const title = button.getAttribute('title');
          
          console.log(`Button ${index}:`, {
            text,
            ariaLabel,
            classes,
            title,
            visible: button.offsetParent !== null,
            element: button
          });
        });
        
        // Look specifically for voice/call related buttons
        const voiceButtons = Array.from(allButtons).filter(button => {
          const text = button.textContent.toLowerCase();
          const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
          const classes = button.className.toLowerCase();
          const title = (button.getAttribute('title') || '').toLowerCase();
          
          return text.includes('voice') || text.includes('call') || text.includes('microphone') ||
                 ariaLabel.includes('voice') || ariaLabel.includes('call') || ariaLabel.includes('microphone') ||
                 classes.includes('voice') || classes.includes('call') || classes.includes('microphone') ||
                 title.includes('voice') || title.includes('call') || title.includes('microphone');
        });
        
        console.log('🎤 Voice-related buttons found:', voiceButtons);
        
        // Also check for SVG icons that might indicate voice
        const svgElements = document.querySelectorAll('svg');
        console.log('📋 SVG elements found:', svgElements.length);
        
        svgElements.forEach((svg, index) => {
          const classes = svg.className.baseVal || svg.className;
          const parent = svg.closest('button');
          if (parent) {
            console.log(`SVG ${index} in button:`, {
              svgClasses: classes,
              buttonText: parent.textContent.trim(),
              buttonClasses: parent.className
            });
          }
        });
        
      }, 3000); // Wait 3 seconds for widget to fully render
    }
  }, [isVoiceFlowLoaded]);

 const handleFaceClick = () => {
  console.log('👆 Face clicked! Attempting Shadow DOM voice activation...');
  
  if (!isVoiceFlowLoaded) {
    console.log('⏳ VoiceFlow still loading...');
    return;
  }

  try {
    // PROVEN WORKING METHOD: Access Shadow DOM directly
    if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat._shadowRoot) {
      console.log('🎯 Accessing VoiceFlow Shadow DOM...');
      
      const shadowRoot = window.voiceflow.chat._shadowRoot;
      const shadowButtons = shadowRoot.querySelectorAll('button');
      console.log(`📋 Found ${shadowButtons.length} buttons in shadow DOM`);
      
      // Look for the voice/call button using the proven selector
      const callButton = Array.from(shadowButtons).find(btn => 
        btn.textContent.includes('call') || 
        btn.textContent.includes('Call') ||
        btn.className.includes('vfrc-button')
      );
      
      if (callButton) {
        console.log('🎯 Found call button in shadow DOM:', callButton.textContent);
        callButton.click();
        console.log('✅ Successfully triggered voice chat via face click!');
        return;
      } else {
        console.log('❌ Call button not found in shadow DOM');
      }
    }
    
    // Fallback: Open chat first, then try shadow DOM
    console.log('🔄 Fallback: Opening chat first...');
    window.voiceflow.chat.open();
    
    setTimeout(() => {
      if (window.voiceflow.chat._shadowRoot) {
        const shadowRoot = window.voiceflow.chat._shadowRoot;
        const callBtn = shadowRoot.querySelector('button');
        if (callBtn && callBtn.textContent.includes('call')) {
          callBtn.click();
          console.log('✅ Voice activated via fallback method');
        }
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Error accessing VoiceFlow shadow DOM:', error);
    
    // Final fallback: Try the interact method
    try {
      window.voiceflow.chat.interact({ type: 'voice' });
      console.log('🎤 Attempted voice activation via interact method');
    } catch (e) {
      console.log('❌ All voice activation methods failed');
    }
  }
};

// Add this debugging helper
window.inspectVoiceFlow = () => {
  console.log('🔍 MANUAL DOM INSPECTION TRIGGERED:');
  if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat._shadowRoot) {
    const shadowRoot = window.voiceflow.chat._shadowRoot;
    const shadowButtons = shadowRoot.querySelectorAll('button');
    console.log('Shadow DOM buttons:', shadowButtons);
    shadowButtons.forEach((btn, i) => {
      console.log(`Button ${i}:`, btn.textContent, btn.className);
    });
  }
};

  const handleAreaEnter = (area) => {
    setHoveredArea(area);
  };

  const handleAreaLeave = () => {
    setHoveredArea(null);
  };

  // Calculate responsive coordinates based on current image size
  const getCoordinates = (topPercent, leftPercent, widthPercent, heightPercent) => {
    if (!imageRef.current) return {};
    
    // Get element references for positioning calculation
    const image = imageRef.current;
    const gridContainer = image.parentElement;
    const inlineBlockContainer = gridContainer.parentElement;
    const centeringWrapper = inlineBlockContainer.parentElement;
    
    // Calculate position relative to the centering wrapper
    const imageRect = image.getBoundingClientRect();
    const centeringRect = centeringWrapper.getBoundingClientRect();
    
    // Calculate offset of image within the centering wrapper
    const offsetTop = imageRect.top - centeringRect.top;
    const offsetLeft = imageRect.left - centeringRect.left;
    
    return {
      top: offsetTop + (topPercent / 100) * imageRect.height,
      left: offsetLeft + (leftPercent / 100) * imageRect.width,
      width: (widthPercent / 100) * imageRect.width,
      height: (heightPercent / 100) * imageRect.height,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      
      {/* Back Button - Minimal and elegant */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Chat Controls - Top right corner */}
      <div className="absolute top-6 right-6 flex space-x-3">
        {/* Voice Toggle */}
        <button
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={`p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
            isVoiceEnabled 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Text Mode Toggle */}
        <button
          onClick={() => setChatMode(chatMode === 'voice' ? 'text' : 'voice')}
          className={`p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
            chatMode === 'text' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white bg-opacity-80 text-gray-600'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Email Chat */}
        <button
          onClick={() => {/* Email functionality will go here */}}
          className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
        >
          <Mail className="w-5 h-5" />
        </button>
      </div>

      {/* Main Clementine Face - 90% of screen focus */}
      <div className="relative max-w-sm mx-auto mb-8">
        
        {/* IMAGE CONTAINER - Same structure as home page */}
        <div className="relative" style={{ display: 'inline-block', margin: '0 auto' }}>
          
          {/* IMAGE STACK - All images in same grid cell */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr'
          }}>
            
            {/* Base Image - Always visible */}
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
            
            {/* Speaking Animation - Shows when Clementine is talking */}
            {/* REMOVED: Fake animations that interfere with real VoiceFlow audio */}
            
            {/* Listening Animation - Shows when listening to user */}
            {/* REMOVED: Fake animations that interfere with real VoiceFlow audio */}
            
          </div>

          {/* CONVERSATION TRIGGER ZONE - Covers entire face for voice interaction */}
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

      {/* Status Indicators */}
      {/* REMOVED: Fake status indicators that interfere with real VoiceFlow audio */}
      <div className="text-center mb-4">
        <div className="text-xs text-gray-500">
          Click Clementine's face to start - VoiceFlow handles all audio
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
            <p className="text-xs">Just like a phone conversation - natural and flowing</p>
          </div>
        ) : (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-blue-600">Text Mode Active 💬</p>
            <p>Text chat interface will appear here</p>
          </div>
        )}
        
        {/* VoiceFlow Status */}
        <div className="mt-2 text-xs text-gray-400">
          {isVoiceFlowLoaded ? (
            <span className="text-green-600">✅ VoiceFlow Ready</span>
          ) : (
            <span className="text-orange-600">⏳ Loading VoiceFlow...</span>
          )}
        </div>
      </div>

      {/* Future Text Chat Area - Only shown in text mode */}
      {chatMode === 'text' && (
        <div className="mt-8 w-full max-w-md bg-white rounded-2xl shadow-xl p-4">
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Text chat interface coming soon...</p>
            <p className="text-xs mt-2">For now, enjoy voice conversations!</p>
          </div>
        </div>
      )}

      {/* VoiceFlow Integration Zone - Hidden container for the invisible widget */}
      <div id="voiceflow-container" style={{ display: 'none' }}>
        {/* VoiceFlow widget will be loaded here invisibly */}
      </div>

    </div>
  );
}

export default ChatPage;