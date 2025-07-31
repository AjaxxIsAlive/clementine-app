import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Volume2, VolumeX, Mail, ArrowLeft, Heart, User, Settings, RotateCcw } from 'lucide-react';
import LoginModal from '../components/LoginModal';

function ChatPage() {
  const [hoveredArea, setHoveredArea] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [chatMode, setChatMode] = useState('voice');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isVoiceFlowLoaded, setIsVoiceFlowLoaded] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [memoryData, setMemoryData] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userCredentials, setUserCredentials] = useState(null);
  const [currentProject, setCurrentProject] = useState('MEMORY');
  const imageRef = useRef(null);
  const navigate = useNavigate();

  // VoiceFlow Project Configuration - Safe Switching System
  const getVoiceFlowConfig = () => {
    const configs = {
      BASIC: {
        projectID: process.env.REACT_APP_VF_BASIC_PROJECT_ID || '68829d0cd2b91792a19c12a1',
        versionID: process.env.REACT_APP_VF_BASIC_VERSION_ID || 'production',
        hasMemory: false,
        description: 'Basic VoiceFlow - No Memory'
      },
      MEMORY: {
        projectID: process.env.REACT_APP_VF_MEMORY_PROJECT_ID || '688ab66ce2a73a8945d22dc7',
        versionID: process.env.REACT_APP_VF_MEMORY_VERSION_ID || '688ab66ce2a73a8945d22dc8',
        hasMemory: true,
        description: 'Current Memory Project - Working'
      },
      NEW_MEMORY: {
        projectID: process.env.REACT_APP_VF_NEW_MEMORY_PROJECT_ID || '688acb19383e983b5f35d603',
        versionID: process.env.REACT_APP_VF_NEW_MEMORY_VERSION_ID || '688acb19383e983b5f35d604',
        hasMemory: true,
        description: 'New Memory Project - Advanced'
      }
    };

    // Check for temporary override (for safe testing)
    const tempOverride = localStorage.getItem('temp_project_override');
    if (tempOverride) {
      localStorage.removeItem('temp_project_override'); // Remove after use
      setCurrentProject(tempOverride);
    }
    
    const activeProject = tempOverride || process.env.REACT_APP_VF_ACTIVE_PROJECT || currentProject;
    const config = configs[activeProject] || configs.MEMORY;
    
    console.log(`🔧 Using VoiceFlow Project: ${activeProject}`, config);
    return { ...config, activeProject };
  };

  // MEMORY SYSTEM - localStorage keys that match VoiceFlow variables
  const MEMORY_KEYS = {
    // Basic info
    userName: 'clementine_user_name',
    userAge: 'clementine_user_age',
    userLocation: 'clementine_user_location',
    userOccupation: 'clementine_user_occupation',
    
    // Relationship status
    relationshipStatus: 'clementine_relationship_status',
    partnerName: 'clementine_partner_name',
    relationshipDuration: 'clementine_relationship_duration',
    
    // Goals and challenges
    relationshipGoals: 'clementine_relationship_goals',
    currentChallenges: 'clementine_current_challenges',
    communicationStyle: 'clementine_communication_style',
    
    // Conversation context
    lastTopicDiscussed: 'clementine_last_topic',
    userMood: 'clementine_user_mood',
    sessionCount: 'clementine_session_count',
    lastActiveDate: 'clementine_last_active'
  };

  // Load memory data from localStorage
  const loadMemoryData = () => {
    const data = {};
    Object.entries(MEMORY_KEYS).forEach(([key, storageKey]) => {
      const value = localStorage.getItem(storageKey);
      data[key] = value || '';
    });
    
    // Update session count
    const currentCount = parseInt(data.sessionCount) || 0;
    const newCount = currentCount + 1;
    localStorage.setItem(MEMORY_KEYS.sessionCount, newCount.toString());
    localStorage.setItem(MEMORY_KEYS.lastActiveDate, new Date().toISOString());
    
    data.sessionCount = newCount.toString();
    data.lastActiveDate = new Date().toISOString();
    
    setMemoryData(data);
    console.log('🧠 Memory loaded:', data);
    return data;
  };

  // Save memory data to localStorage
  const saveMemoryData = (key, value) => {
    if (MEMORY_KEYS[key]) {
      localStorage.setItem(MEMORY_KEYS[key], value);
      setMemoryData(prev => ({ ...prev, [key]: value }));
      console.log(`💾 Saved ${key}:`, value);
    }
  };

  // Clear all memory
  const clearAllMemory = () => {
    Object.values(MEMORY_KEYS).forEach(storageKey => {
      localStorage.removeItem(storageKey);
    });
    localStorage.removeItem('clementine_user_id');
    setMemoryData({});
    console.log('🧹 All memory cleared');
    // Reload page to reset everything
    window.location.reload();
  };

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

  // Check for existing login and load memory
  useEffect(() => {
    const checkAuth = () => {
      const savedCredentials = localStorage.getItem('clementine_user_credentials');
      
      if (savedCredentials) {
        try {
          const credentials = JSON.parse(savedCredentials);
          setUserCredentials(credentials);
          console.log('✅ Found existing user:', credentials.email);
          loadMemoryData();
        } catch (error) {
          console.log('⚠️ Invalid credentials, showing login');
          setShowLoginModal(true);
        }
      } else {
        console.log('👋 New user, showing login');
        setShowLoginModal(true);
      }
    };

    checkAuth();
  }, []);

  // Handle successful login
  const handleLogin = (credentials) => {
    setUserCredentials(credentials);
    setShowLoginModal(false);
    console.log('🎉 User authenticated:', credentials);
    loadMemoryData();
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('clementine_user_credentials');
    localStorage.removeItem('clementine_user_id');
    localStorage.removeItem('clementine_user_email');
    localStorage.removeItem('clementine_user_name');
    setUserCredentials(null);
    setShowLoginModal(true);
    console.log('👋 User logged out');
  };

  // Load VoiceFlow widget ONCE with memory pre-population
  useEffect(() => {
    // Only load VoiceFlow if user is authenticated
    if (!userCredentials) {
      console.log('⏳ Waiting for user authentication...');
      return;
    }

    // Protection against double loading
    if (window.voiceflowChatLoaded) {
      console.log('✅ VoiceFlow already loaded');
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

    console.log('🔧 Loading VoiceFlow widget...');
    window.voiceflowChatLoaded = true;
    
    // Official VoiceFlow script
    (function(d, t) {
        var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
        v.onload = function() {
          console.log('🔧 VoiceFlow script loaded, initializing...');
          
          // Generate or retrieve persistent userID for conversation memory
          let persistentUserID = localStorage.getItem('clementine_user_id');
          
          if (!persistentUserID) {
            // Create new unique user ID and save to localStorage
            persistentUserID = 'clementine_user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
            localStorage.setItem('clementine_user_id', persistentUserID);
            console.log('🆔 Created new persistent user ID:', persistentUserID);
          } else {
            console.log('🔄 Using existing user ID:', persistentUserID);
          }

          // Prepare memory data for VoiceFlow pre-population
          const currentMemory = {};
          Object.entries(MEMORY_KEYS).forEach(([key, storageKey]) => {
            const value = localStorage.getItem(storageKey);
            if (value) {
              currentMemory[key] = value;
            }
          });

          console.log('🧠 Pre-populating VoiceFlow with memory:', currentMemory);
          console.log('🧠 Memory keys and values:');
          Object.entries(currentMemory).forEach(([key, value]) => {
            console.log(`  ${key}: "${value}"`);
          });
          console.log('🧠 returning_user:', Object.keys(currentMemory).length > 0);
          
          // Get dynamic VoiceFlow configuration
          const vfConfig = getVoiceFlowConfig();
          console.log('🔧 Using VoiceFlow configuration:', vfConfig);
          
          // Build configuration object
          const loadConfig = {
            verify: { projectID: vfConfig.projectID },
            url: 'https://general-runtime.voiceflow.com',
            versionID: vfConfig.versionID,
            userID: userCredentials.userID,
            voice: {
              url: "https://runtime-api.voiceflow.com"
            },
            assistant: {
              persistence: 'localStorage'
            }
          };

          // Only add memory payload if project supports it and we have memory data
          if (vfConfig.hasMemory && Object.keys(currentMemory).length > 0) {
            loadConfig.launch = {
              event: {
                type: 'launch',
                payload: {
                  user_name: currentMemory.userName || '',
                  user_email: userCredentials.email || '',
                  user_age: currentMemory.userAge || '',
                  session_count: currentMemory.sessionCount || '1',
                  returning_user: true,
                  relationship_status: currentMemory.relationshipStatus || '',
                  partner_name: currentMemory.partnerName || '',
                  last_active: currentMemory.lastActiveDate || '',
                  user_location: currentMemory.userLocation || '',
                  user_occupation: currentMemory.userOccupation || '',
                  relationship_duration: currentMemory.relationshipDuration || '',
                  relationship_goals: currentMemory.relationshipGoals || '',
                  current_challenges: currentMemory.currentChallenges || '',
                  communication_style: currentMemory.communicationStyle || '',
                  last_topic_discussed: currentMemory.lastTopicDiscussed || '',
                  user_mood: currentMemory.userMood || ''
                }
              }
            };
            console.log('🧠 Enhanced payload with all memory variables');
          } else if (vfConfig.hasMemory) {
            // New user on memory-enabled project
            loadConfig.launch = {
              event: {
                type: 'launch',
                payload: {
                  user_name: '',
                  user_email: userCredentials.email || '',
                  session_count: '1',
                  returning_user: false
                }
              }
            };
            console.log('🆕 New user payload for memory project');
          }

          window.voiceflow.chat.load(loadConfig);
          
          setIsVoiceFlowLoaded(true);
          console.log('✅ VoiceFlow widget initialized with memory');
          
          // Log payload data for debugging
          console.log('📤 Payload sent to VoiceFlow:', {
            user_name: currentMemory.userName || '',
            user_email: userCredentials.email || '',
            user_age: currentMemory.userAge || '',
            session_count: currentMemory.sessionCount || '1',
            returning_user: Object.keys(currentMemory).length > 0,
            relationship_status: currentMemory.relationshipStatus || '',
            partner_name: currentMemory.partnerName || '',
            last_active: currentMemory.lastActiveDate || ''
          });
          
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
  }, [userCredentials]);

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

  // Expose global utility functions
  useEffect(() => {
    // Manual inspection helper
    window.inspectVoiceFlow = () => {
      inspectVoiceFlowDOM();
      return window.voiceflow;
    };

    // Memory management functions
    window.saveClementineMemory = (key, value) => {
      saveMemoryData(key, value);
      return `Saved ${key}: ${value}`;
    };

    window.getClementineMemory = () => {
      console.log('🧠 Current memory:', memoryData);
      return memoryData;
    };

    window.clearClementineMemory = () => {
      clearAllMemory();
      return 'All memory cleared. Page will reload.';
    };

    // Utility function to reset user identity (for testing)
    window.resetClementineUser = () => {
      localStorage.removeItem('clementine_user_id');
      console.log('🔄 User ID reset - refresh page to create new identity');
      return 'User ID cleared. Refresh the page to get a new identity.';
    };

    // Utility function to check current user ID
    window.getClementineUserID = () => {
      const userID = localStorage.getItem('clementine_user_id');
      console.log('👤 Current user ID:', userID);
      return userID;
    };
  }, [memoryData]);

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
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={clearAllMemory}
          className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-red-600"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleLogout}
          className="p-3 bg-gray-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-600"
        >
          <User className="w-5 h-5" />
        </button>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="absolute top-20 right-6 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50">
          <h3 className="font-bold mb-2 text-sm">VoiceFlow Configuration</h3>
          <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
            <div><strong>Project:</strong> {getVoiceFlowConfig().activeProject}</div>
            <div><strong>ID:</strong> {getVoiceFlowConfig().projectID}</div>
            <div><strong>Version:</strong> {getVoiceFlowConfig().versionID}</div>
            <div><strong>Memory:</strong> {getVoiceFlowConfig().hasMemory ? '✅' : '❌'}</div>
          </div>
          
          <h4 className="font-bold mb-2 text-sm">Switch Project (⚠️ Safe Mode)</h4>
          <div className="space-y-2 mb-4">
            {['BASIC', 'MEMORY', 'NEW_MEMORY'].map(project => (
              <button
                key={project}
                onClick={() => {
                  if (window.confirm(`Switch to ${project} project? This will reload the page to prevent conflicts.`)) {
                    localStorage.setItem('temp_project_override', project);
                    window.location.reload();
                  }
                }}
                className={`w-full text-left p-2 text-xs rounded ${
                  getVoiceFlowConfig().activeProject === project 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">{project}</div>
                <div className="text-xs opacity-75">{
                  project === 'BASIC' ? 'No Memory' :
                  project === 'MEMORY' ? 'Current Working' :
                  'New Advanced'
                }</div>
              </button>
            ))}
          </div>

          <h4 className="font-bold mb-2 text-sm">Memory Status</h4>
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
            <div><strong>Sessions:</strong> {memoryData.sessionCount || '0'}</div>
            <div><strong>User ID:</strong> {localStorage.getItem('clementine_user_id')?.substring(0, 20)}...</div>
            {Object.entries(memoryData).map(([key, value]) => (
              value && <div key={key}><strong>{key}:</strong> {value.substring(0, 30)}{value.length > 30 ? '...' : ''}</div>
            ))}
          </div>
        </div>
      )}

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
                    {memoryData.userName ? `Welcome back, ${memoryData.userName.split(' ')[0]}!` : 'Start Talking'}
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
        <div className="mt-2 text-xs space-x-4">
          {isVoiceFlowLoaded ? (
            <span className="text-green-600">✅ VoiceFlow Ready</span>
          ) : (
            <span className="text-orange-600">⏳ Loading VoiceFlow...</span>
          )}
          {Object.keys(memoryData).some(key => memoryData[key]) ? (
            <span className="text-purple-600">🧠 Memory Active</span>
          ) : (
            <span className="text-gray-400">🧠 New User</span>
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
            <p className="text-xs">Pure voice conversation with memory persistence</p>
            {memoryData.sessionCount && (
              <p className="text-xs text-purple-500">Session #{memoryData.sessionCount}</p>
            )}
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

      {/* Login Modal */}
      <LoginModal
        isVisible={showLoginModal}
        onLogin={handleLogin}
        onClose={() => setShowLoginModal(false)}
      />

    </div>
  );
}

export default ChatPage;