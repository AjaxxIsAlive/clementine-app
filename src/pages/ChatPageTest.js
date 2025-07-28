import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function ChatPageTest() {
  const navigate = useNavigate();

  // Load VoiceFlow widget script ONCE - using OFFICIAL script format
  useEffect(() => {
    // Ultimate protection against double loading
    if (window.voiceflowTestLoaded) {
      console.log('✅ VoiceFlow already loaded (global flag protection)');
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="voiceflow"]')) {
      console.log('✅ VoiceFlow script already exists');
      window.voiceflowTestLoaded = true;
      return;
    }

    console.log('🔧 Loading VoiceFlow widget with OFFICIAL script...');
    window.voiceflowTestLoaded = true; // Set flag immediately
    
    // OFFICIAL VOICEFLOW SCRIPT - Exact format from dashboard
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
          console.log('✅ Official VoiceFlow widget initialized successfully');
        }
        v.onerror = function() {
          console.error('❌ Failed to load official VoiceFlow script');
          window.voiceflowTestLoaded = false; // Reset on error
        }
        v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; 
        v.type = "text/javascript"; 
        s.parentNode.insertBefore(v, s);
    })(document, 'script');
    
    // No cleanup - let VoiceFlow persist
  }, []); // Empty dependency array - run once only

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Main Content */}
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">VoiceFlow Widget Test</h1>
        <p className="text-gray-600 mb-6">
          This page loads the standard VoiceFlow widget to test if audio works properly.
        </p>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-sm text-gray-500 space-y-2">
            <p>✅ Standard VoiceFlow widget loading</p>
            <p>✅ No custom hiding or modifications</p>
            <p>✅ Audio should work normally</p>
          </div>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <p>Look for the VoiceFlow chat bubble in the bottom-right corner</p>
          <p>Click it to test voice conversations</p>
          <p>Check browser console for loading status</p>
        </div>
      </div>

      {/* VoiceFlow widget will appear automatically in bottom-right corner */}
      
    </div>
  );
}

export default ChatPageTest;