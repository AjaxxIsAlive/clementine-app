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
  const [isVoiceFlowLoaded, setIsVoiceFlowLoaded] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const imageRef = useRef(null);
  const navigate = useNavigate();

  // Initialize VoiceFlow with proper async loading and error handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.voiceflow.com/widget-next/bundle.mjs';
      script.type = 'module';
      script.async = true;
      
      script.onload = () => {
        const initializeVoiceFlow = async () => {
          try {
            // Wait for VoiceFlow to be fully available
            let attempts = 0;
            while ((!window.voiceflow || !window.voiceflow.chat) && attempts < 50) {
              console.log('⏳ Waiting for VoiceFlow to be available...');
              await new Promise(resolve => setTimeout(resolve, 100));
              attempts++;
            }

            if (!window.voiceflow || !window.voiceflow.chat) {
              throw new Error('VoiceFlow failed to load after 5 seconds');
            }

            const config = {
              verify: { projectID: process.env.REACT_APP_VOICEFLOW_PROJECT_ID },
              url: 'https://general-runtime.voiceflow.com',
              versionID: process.env.REACT_APP_VOICEFLOW_VERSION_ID,
              
              assistant: {
                title: 'Clementine',
                description: 'Your AI Relationship Advisor',
                avatar: {
                  image: '/images/clementine-face.jpg',
                  name: 'Clementine'
                },
                color: '#ec4899',
                persistence: 'memory', // Reset on page refresh for fresh sessions
                type: 'chat',
                renderMode: 'popover',
                voice: {
                  enabled: true,
                  autoplay: true,
                  language: 'en-US',
                  wakeWord: false,
                  startListening: true,
                },
              },
              
              // Hide launcher for custom face interface
              launcher: { 
                hidden: true 
              },
              
              // Fresh session each time
              session: {
                userID: 'clementine-face-user-' + Date.now(),
              },
              
              autostart: false,
            };

            console.log('🔧 Loading VoiceFlow with simplified config');
            
            // Load VoiceFlow with basic configuration first
            await window.voiceflow.chat.load(config);
            
            console.log('✅ VoiceFlow basic load complete');
            
            // Add event listeners for voice activity tracking
            if (window.voiceflow.chat.listen) {
              window.voiceflow.chat.listen('voice.start', () => {
                console.log('🎤 Voice recording started');
                setIsListening(true);
                setIsSpeaking(false);
              });
              
              window.voiceflow.chat.listen('voice.end', () => {
                console.log('🎤 Voice recording ended');
                setIsListening(false);
              });
              
              window.voiceflow.chat.listen('audio.start', () => {
                console.log('🔊 Audio playback started');
                setIsSpeaking(true);
                setIsListening(false);
              });
              
              window.voiceflow.chat.listen('audio.end', () => {
                console.log('🔊 Audio playback ended');
                setIsSpeaking(false);
              });
              
              window.voiceflow.chat.listen('response', (response) => {
                console.log('💬 VoiceFlow response received:', response);
              });
            }
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setIsVoiceFlowLoaded(true);
            console.log('✅ VoiceFlow widget loaded and ready for voice interaction');
            
          } catch (error) {
            console.error('❌ Error initializing VoiceFlow:', error);
            setIsVoiceFlowLoaded(false);
          }
        };

        // Start initialization
        initializeVoiceFlow();
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load VoiceFlow script');
        setIsVoiceFlowLoaded(false);
      };
      
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, []);  // Hide VoiceFlow widget UI elements
  useEffect(() => {
    const hideVoiceFlowUI = () => {
      // Hide all VoiceFlow UI elements to keep only the face interface
      const style = document.createElement('style');
      style.textContent = `
        /* AGGRESSIVE VOICEFLOW HIDING - Completely hide all widget UI */
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
        div[style*="position: fixed"],
        div[style*="z-index: 2147483647"],
        div[style*="z-index: 2147483646"],
        div[style*="bottom: 20px"],
        div[style*="right: 20px"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        
        /* Hide any overlay or backdrop */
        .vf-overlay,
        .vf-backdrop,
        div[role="dialog"],
        div[aria-modal="true"] {
          display: none !important;
        }
        
        /* Ensure our face interface stays visible and clickable */
        .face-container,
        .face-container * {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          z-index: 1000 !important;
        }
        
        /* Ensure our face interface is always visible */
        .clementine-face-interface {
          z-index: 9999 !important;
          position: relative !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    };

    return hideVoiceFlowUI();
  }, []);

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

  const requestMicrophonePermission = async () => {
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');
      
      // Stop the stream since we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      return false;
    }
  };

  const activateVoiceMode = async () => {
    try {
      console.log('🔊 Activating voice mode...');
      
      // Try to access VoiceFlow's internal voice methods
      if (window.voiceflow && window.voiceflow.chat) {
        // Send a launch interaction to start the conversation
        if (window.voiceflow.chat.interact) {
          window.voiceflow.chat.interact({
            type: 'launch'
          });
          console.log('✅ Launch interaction sent');
        }
        
        // Try alternative voice activation methods
        if (window.voiceflow.chat.startListening) {
          window.voiceflow.chat.startListening();
          console.log('✅ startListening called');
        }
      }
      
      console.log('✅ Voice mode activation attempted');
    } catch (error) {
      console.error('⚠️ Voice mode activation error:', error);
    }
  };

  const handleFaceClick = async () => {
    console.log('👆 Face clicked! VoiceFlow loaded:', isVoiceFlowLoaded);
    
    if (!isVoiceFlowLoaded) {
      console.log('⏳ VoiceFlow still loading, please wait...');
      return;
    }

    // Check if VoiceFlow is actually available
    if (!window.voiceflow || !window.voiceflow.chat) {
      console.error('❌ VoiceFlow not available');
      return;
    }

    try {
      if (!conversationStarted) {
        console.log('🎤 Starting voice conversation with Clementine...');
        
        // Request microphone permission first
        const micPermission = await requestMicrophonePermission();
        if (!micPermission) {
          console.log('⚠️ Microphone permission required for voice chat');
          // Continue anyway, user might grant permission later
        }
        
        // Start the conversation - use show() instead of open() for overlay mode
        if (window.voiceflow.chat.show) {
          window.voiceflow.chat.show();
        } else {
          window.voiceflow.chat.open();
        }
        setConversationStarted(true);
        
        console.log('✅ VoiceFlow conversation opened');
        
        // Wait a moment for the widget to initialize, then activate voice
        setTimeout(async () => {
          await activateVoiceMode();
        }, 1500);
        
        // Visual feedback
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          setIsSpeaking(true);
          setTimeout(() => setIsSpeaking(false), 3000);
        }, 2000);
        
      } else {
        console.log('🗣️ Conversation already active - triggering voice interaction');
        
        // Activate voice mode for ongoing conversation
        await activateVoiceMode();
        
        // Try to interact or restart if needed
        if (window.voiceflow.chat.interact) {
          window.voiceflow.chat.interact({
            type: 'text',
            payload: 'continue voice conversation'
          });
        } else {
          // Fallback: restart conversation
          window.voiceflow.chat.open();
        }
        
        // Visual feedback
        setIsListening(true);
        setTimeout(() => setIsListening(false), 1500);
      }
      
    } catch (error) {
      console.error('❌ Error with VoiceFlow interaction:', error);
      // Reset state on error
      setConversationStarted(false);
      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  const handleVoiceToggle = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    
    // If disabling voice and conversation is active, close it
    if (isVoiceEnabled && conversationStarted && window.voiceflow && window.voiceflow.chat) {
      window.voiceflow.chat.close();
    }
  };

  const handleEmailChat = () => {
    // Future feature: Export conversation to email
    console.log('📧 Email chat feature coming soon...');
  };

  const handleAreaEnter = (area) => {
    setHoveredArea(area);
  };

  const handleAreaLeave = () => {
    setHoveredArea(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 clementine-face-interface">
      
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
          onClick={handleVoiceToggle}
          className={`p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
            isVoiceEnabled 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
          title={isVoiceEnabled ? 'Voice Enabled' : 'Voice Disabled'}
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
          title="Toggle Text Mode"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Email Chat */}
        <button
          onClick={handleEmailChat}
          className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
          title="Email Conversation"
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
            {isSpeaking && (
              <img 
                src="/images/clementine-mouth-hover.png" 
                alt="Speaking" 
                className="w-full h-auto rounded-3xl animate-pulse"
                style={{ 
                  gridColumn: 1,
                  gridRow: 1,
                  zIndex: 2
                }}
                onError={(e) => {
                  console.log('Speaking animation image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            )}
            
            {/* Listening Animation - Shows when listening to user */}
            {isListening && (
              <img 
                src="/images/clementine-left-eye-hover.png" 
                alt="Listening" 
                className="w-full h-auto rounded-3xl"
                style={{ 
                  gridColumn: 1,
                  gridRow: 1,
                  zIndex: 2,
                  animation: 'pulse 2s infinite'
                }}
                onError={(e) => {
                  console.log('Listening animation image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            )}
            
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
                  {!isVoiceFlowLoaded ? (
                    <div className="bg-blue-600 bg-opacity-90 text-white px-4 py-2 rounded-full text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 animate-pulse" />
                      Loading...
                    </div>
                  ) : !conversationStarted ? (
                    <div className="bg-pink-600 bg-opacity-90 text-white px-4 py-2 rounded-full text-lg flex items-center gap-2 animate-pulse">
                      <Heart className="w-5 h-5" />
                      Start Talking
                    </div>
                  ) : (
                    <div className="bg-purple-600 bg-opacity-90 text-white px-4 py-2 rounded-full text-lg flex items-center gap-2 animate-pulse">
                      <Heart className="w-5 h-5" />
                      Keep Talking
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
        </div>

      </div>

      {/* Status Indicators */}
      <div className="text-center mb-4">
        {!isVoiceFlowLoaded && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm animate-pulse mb-2">
            🔄 Loading Clementine's voice system...
          </div>
        )}
        {isListening && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm animate-pulse mb-2">
            🎤 Clementine is listening...
          </div>
        )}
        {isSpeaking && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm animate-pulse mb-2">
            🗣️ Clementine is speaking...
          </div>
        )}
        {conversationStarted && !isListening && !isSpeaking && (
          <div className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm mb-2">
            💬 In conversation - speak naturally
          </div>
        )}
      </div>

      {/* Title and Instructions */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Chat with Clementine</h1>
        <p className="text-gray-600 mb-2">Your AI relationship advisor</p>
        
        {!isVoiceFlowLoaded ? (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-blue-600">Loading voice system... 🔄</p>
            <p>Preparing your telephone-like conversation experience</p>
          </div>
        ) : chatMode === 'voice' ? (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-purple-600">Voice Mode Active 🎤</p>
            {!conversationStarted ? (
              <>
                <p>Click anywhere on Clementine's face to start talking</p>
                <p className="text-xs">Just like a phone conversation - natural and flowing</p>
              </>
            ) : (
              <>
                <p>Conversation active - speak naturally anytime</p>
                <p className="text-xs">Clementine can hear you and will respond with voice</p>
              </>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium text-blue-600">Text Mode Active 💬</p>
            <p>Text chat interface will appear here</p>
          </div>
        )}
      </div>

      {/* VoiceFlow Integration Zone - This is where the hidden widget will go */}
      <div id="voiceflow-container" style={{ display: 'none' }}>
        {/* VoiceFlow widget will be loaded here invisibly */}
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

    </div>
  );
}

export default ChatPage;
