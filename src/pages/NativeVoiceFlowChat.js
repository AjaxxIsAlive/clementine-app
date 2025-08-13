import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

function NativeVoiceFlowChat() {
  useEffect(() => {
    // Load VoiceFlow chat widget script
    const script = document.createElement('script');
    script.src = 'https://cdn.voiceflow.com/widget/bundle.mjs';
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      // Initialize VoiceFlow widget with your project details
      if (window.voiceflow && window.voiceflow.chat) {
        window.voiceflow.chat.load({
          verify: { projectID: process.env.REACT_APP_VOICEFLOW_PROJECT_ID },
          url: 'https://general-runtime.voiceflow.com',
          versionID: process.env.REACT_APP_VOICEFLOW_VERSION_ID,
          
          // Widget configuration
          assistant: {
            title: 'Clementine',
            description: 'Your AI Relationship Advisor',
            avatar: '/images/clementine-face.jpg', // Use your Clementine image
            color: '#ec4899', // Pink theme
            
            // Voice features - THIS IS THE KEY!
            voice: {
              enabled: true,
              autoplay: true,
              language: 'en-US',
            },
          },
          
          // Custom styling
          launcher: {
            hidden: true, // Hide the default launcher since we have our own interface
          },
          
          // Auto-start the conversation
          autostart: true,
          
          // Mobile optimization
          mobile: {
            fullscreen: true,
            voice: {
              enabled: true,
              pushToTalk: true, // Enable push-to-talk on mobile
            }
          }
        });

        // Auto-open the chat
        setTimeout(() => {
          if (window.voiceflow.chat.open) {
                  }
        }, 1000);
      }
    };

    script.onerror = (error) => {
      console.error('Failed to load VoiceFlow widget:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)',
        animation: 'gradient-shift 3s ease infinite'
      }}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Native VoiceFlow Chat
            <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full ml-2 animate-pulse">
              ✨ NATIVE VOICE ✨
            </span>
          </h1>
          <p className="text-gray-600">
            Using VoiceFlow's native voice technology - the same you tested!
          </p>
          <div className="mt-4 bg-white rounded-lg p-4 max-w-md mx-auto shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2">🎯 Why This Works Better:</h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>✅ Same tech you tested in VoiceFlow</li>
              <li>✅ Native speech recognition</li>
              <li>✅ ElevenLabs voice integration</li>
              <li>✅ Mobile optimized</li>
              <li>✅ Push-to-talk support</li>
              <li>✅ No browser compatibility issues</li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">How to Use Native Voice Chat:</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🎤 Voice Input:</h3>
              <ul className="space-y-1">
                <li>• Click the microphone icon in the chat</li>
                <li>• Speak naturally to Clementine</li>
                <li>• Voice will be processed instantly</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🔊 Voice Output:</h3>
              <ul className="space-y-1">
                <li>• Clementine responds with natural voice</li>
                <li>• High-quality ElevenLabs audio</li>
                <li>• Click speaker to stop/start</li>
              </ul>
            </div>
          </div>
        </div>

        {/* The VoiceFlow widget will automatically inject into the page */}
        <div className="text-center">
          <div className="inline-block bg-white rounded-lg p-4 shadow-lg">
            <p className="text-gray-600 mb-2">
              🚀 VoiceFlow chat widget loading...
            </p>
            <p className="text-xs text-gray-500">
              The native chat interface will appear shortly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NativeVoiceFlowChat;
