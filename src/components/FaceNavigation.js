import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, Brain, Flag, User } from 'lucide-react';

function FaceNavigation({ onLoginClick }) {
  const [hoveredArea, setHoveredArea] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
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

  const handleAreaClick = (area) => {
    switch(area) {
      case 'chat':
        console.log('👆 Face clicked! Opening login...');
        onLoginClick(); // Trigger login modal instead of direct navigation
        break;
      case 'self-check':
        navigate('/self-check');
        break;
      case 'chemistry-check':
        navigate('/chemistry-check');
        break;
      case 'saved-info':
        navigate('/saved');
        break;
      case 'flag-decoder':
        navigate('/flag-decoder');
        break;
      default:
        break;
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
      <div className="relative max-w-sm mx-auto mb-8">
        
        {/* IMAGE CONTAINER */}
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
              src="/images/clementine-eyesclosed.jpg" 
              alt="Clementine" 
              className="w-full h-auto rounded-3xl shadow-2xl"
              style={{ 
                gridColumn: 1,
                gridRow: 1,
                zIndex: 1
              }}
              onLoad={() => {
                if (imageRef.current) {
                  const rect = imageRef.current.getBoundingClientRect();
                  setImageSize({ width: rect.width, height: rect.height });
                }
              }}
            />
            
            {/* Left Eye Overlay - Shows when left eye hovered */}
            {hoveredArea === 'self-check' && (
              <img 
                src="/images/clementine-left-eyeopen-hover.png" 
                alt="Left eye open" 
                className="w-full h-auto rounded-3xl"
                style={{ 
                  gridColumn: 1,
                  gridRow: 1,
                  zIndex: 2
                }}
              />
            )}
            
            {/* Right Eye Overlay - Shows when right eye hovered */}
            {hoveredArea === 'chemistry-check' && (
              <img 
                src="/images/clementine-right-eyeopen-hover.png" 
                alt="Right eye open" 
                className="w-full h-auto rounded-3xl"
                style={{ 
                  gridColumn: 1,
                  gridRow: 1,
                  zIndex: 2
                }}
              />
            )}
            
            {/* Mouth Overlay - Shows when mouth hovered */}
            {hoveredArea === 'chat' && (
              <img 
                src="/images/clementine-mouth-hover.png" 
                alt="" 
                className="w-full h-auto rounded-3xl"
                style={{ 
                  gridColumn: 1,
                  gridRow: 1,
                  zIndex: 2
                }}
                onError={(e) => {
                  console.log('Mouth image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            )}
            
          </div>

          {/* HOVER ZONES - Now using calculated pixel coordinates */}
          {imageSize.width > 0 && (
            <>
              {/* FOREHEAD AREA - Saved Info */}
              <div
                style={{
                  position: 'absolute',
                  ...getCoordinates(12, 25, 50, 18),
                  zIndex: 10,
                  cursor: 'pointer'
                }}
                onMouseEnter={() => handleAreaEnter('saved-info')}
                onMouseLeave={handleAreaLeave}
                onTouchStart={() => handleAreaEnter('saved-info')}
                onTouchEnd={handleAreaLeave}
                onClick={() => handleAreaClick('saved-info')}
              >
                {hoveredArea === 'saved-info' && (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <Brain size={16} />
                      Saved Info
                    </div>
                  </div>
                )}
              </div>

              {/* LEFT EYE - Self Check */}
              <div
                style={{
                  position: 'absolute',
                  ...getCoordinates(38, 15, 30, 15),
                  zIndex: 10,
                  cursor: 'pointer'
                }}
                onMouseEnter={() => handleAreaEnter('self-check')}
                onMouseLeave={handleAreaLeave}
                onTouchStart={() => handleAreaEnter('self-check')}
                onTouchEnd={handleAreaLeave}
                onClick={() => handleAreaClick('self-check')}
              >
                {hoveredArea === 'self-check' && (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <Eye size={14} />
                      Self Check
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT EYE - Chemistry Check */}
              <div
                style={{
                  position: 'absolute',
                  ...getCoordinates(38, 55, 30, 15),
                  zIndex: 10,
                  cursor: 'pointer'
                }}
                onMouseEnter={() => handleAreaEnter('chemistry-check')}
                onMouseLeave={handleAreaLeave}
                onTouchStart={() => handleAreaEnter('chemistry-check')}
                onTouchEnd={handleAreaLeave}
                onClick={() => handleAreaClick('chemistry-check')}
              >
                {hoveredArea === 'chemistry-check' && (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-pink-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <Eye size={14} />
                      Chemistry
                    </div>
                  </div>
                )}
              </div>

              {/* MOUTH AREA - Chat */}
              <div
                style={{
                  position: 'absolute',
                  ...getCoordinates(68, 25, 50, 12),
                  zIndex: 10,
                  cursor: 'pointer'
                }}
                onMouseEnter={() => handleAreaEnter('chat')}
                onMouseLeave={handleAreaLeave}
                onTouchStart={() => handleAreaEnter('chat')}
                onTouchEnd={handleAreaLeave}
                onClick={() => handleAreaClick('chat')}
              >
                {hoveredArea === 'chat' && (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <MessageSquare size={16} />
                      Chat
                    </div>
                  </div>
                )}
              </div>

              {/* FLAG ICON - Red Flag Decoder */}
              <div
                style={{
                  position: 'absolute',
                  ...getCoordinates(80, 75, 20, 15),
                  zIndex: 10,
                  cursor: 'pointer'
                }}
                onMouseEnter={() => handleAreaEnter('flag-decoder')}
                onMouseLeave={handleAreaLeave}
                onTouchStart={() => handleAreaEnter('flag-decoder')}
                onTouchEnd={handleAreaLeave}
                onClick={() => handleAreaClick('flag-decoder')}
              >
                {hoveredArea === 'flag-decoder' && (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <Flag size={14} />
                      Flags
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
        </div>

      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Meet Clementine</h1>
        <p className="text-gray-600">Your AI relationship advisor</p>
        <p className="text-sm text-gray-500 mt-2">Touch her face to explore</p>
        
        {/* Login Button */}
        <div className="mt-6">
          <button
            onClick={onLoginClick}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
          >
            <User size={20} />
            Login to Start Chatting
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Login to save your conversations and memories
          </p>
          
          {/* Admin Panel Link */}
          <div className="mt-4 space-y-2">
            <div>
              <a
                href="/admin"
                className="inline-block bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                🔧 Admin Panel (Add Test Users)
              </a>
            </div>
            
            {/* Test User Recognition Button */}
            <div>
              <button
                onClick={async () => {
                  const authService = (await import('../services/authService')).default;
                  console.log('🧪 Testing user recognition with existing user...');
                  const result = await authService.login('dot@mail.com');
                  if (result.success) {
                    console.log('✅ Recognition test successful!');
                    console.log('👤 User:', result.user.first_name, '(' + result.user.email + ')');
                    console.log('🔗 Session ID:', result.sessionId);
                    console.log('📚 Has history:', result.conversationHistory?.length > 0);
                    alert(`✅ User Recognition Test:\n- User: ${result.user.first_name}\n- Email: ${result.user.email}\n- Session ID: ${result.sessionId ? 'Yes' : 'No'}\n- Conversations: ${result.conversationHistory?.length || 0}`);
                  } else {
                    console.error('❌ Recognition test failed:', result.error);
                    alert('❌ Test failed: ' + result.error);
                  }
                }}
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                🧪 Test User Recognition
              </button>
            </div>
            
            {/* Test VoiceFlow Context Button */}
            <div>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing VoiceFlow context passing...');
                    
                    // Get stored user
                    const storedUser = JSON.parse(localStorage.getItem('clementine_user') || '{}');
                    if (!storedUser.id) {
                      alert('❌ No user logged in. Please test user recognition first.');
                      return;
                    }
                    
                    // Import VoiceFlow service and test context
                    const VoiceFlowService = (await import('../services/voiceflow')).default;
                    const voiceflowService = new VoiceFlowService();
                    
                    // Set user context
                    const contextResult = await voiceflowService.setUserContext(storedUser);
                    console.log('📤 VoiceFlow context result:', contextResult);
                    
                    // Show what was sent
                    alert(`✅ VoiceFlow Context Test:\n- User: ${storedUser.first_name}\n- Session ID: ${storedUser.session_id ? 'Yes' : 'No'}\n- Context Variables Set: ${contextResult ? 'Yes' : 'No'}\n\nCheck console for full details.`);
                    
                  } catch (error) {
                    console.error('❌ VoiceFlow context test failed:', error);
                    alert('❌ VoiceFlow test failed: ' + error.message);
                  }
                }}
                className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                🎯 Test VoiceFlow Context
              </button>
            </div>
            
            {/* Test Enhanced Memory System Button */}
            <div>
              <button
                onClick={async () => {
                  try {
                    console.log('🧠 Testing Enhanced Memory System...');
                    
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabase = createClient(
                      process.env.REACT_APP_SUPABASE_URL,
                      process.env.REACT_APP_SUPABASE_ANON_KEY
                    );
                    
                    // Get current user
                    const storedUser = JSON.parse(localStorage.getItem('clementine_user') || '{}');
                    if (!storedUser.id) {
                      alert('❌ No user logged in. Please test user recognition first.');
                      return;
                    }
                    
                    // Test personal data storage
                    const mockPersonalData = {
                      attachmentStyle: ['secure'],
                      relationshipStatus: ['single'],
                      familyInfo: ['close with family'],
                      importantDates: ['birthday: Dec 25'],
                      emotionalTriggers: ['stress about work'],
                      conversationTopics: ['relationships', 'career'],
                      testTimestamp: new Date().toISOString()
                    };
                    
                    const { data, error } = await supabase
                      .from('profiles')
                      .update({ personal_data: mockPersonalData })
                      .eq('id', storedUser.id)
                      .select();
                      
                    if (error) {
                      console.error('Memory test failed:', error);
                      alert('❌ Memory test failed: ' + error.message);
                    } else {
                      console.log('✅ Personal data stored:', mockPersonalData);
                      alert(`✅ Enhanced Memory Test:\n- Personal data stored: ${Object.keys(mockPersonalData).length} fields\n- Attachment style: ${mockPersonalData.attachmentStyle.join(', ')}\n- Topics: ${mockPersonalData.conversationTopics.join(', ')}\n\nClementine can now remember these details!`);
                    }
                    
                  } catch (error) {
                    console.error('❌ Memory system test failed:', error);
                    alert('❌ Memory test failed: ' + error.message);
                  }
                }}
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                🧠 Test Memory System
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FaceNavigation;