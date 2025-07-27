import React, { useEffect, useRef } from 'react';

function VoiceFlowWidget() {
  const widgetRef = useRef(null);

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
          
          // Enable voice features
          assistant: {
            voice: true, // Enable voice input/output
            speechRecognition: true, // Enable speech recognition
            tts: true, // Enable text-to-speech
          },
          
          // Custom styling to match your app
          styling: {
            primaryColor: '#ec4899', // Pink theme
            backgroundColor: '#ffffff',
            fontFamily: 'Arial, sans-serif',
          },
          
          // Auto-open and focus on voice
          autostart: true,
          allowDangerousHTML: true,
        });
      }
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Chat with Clementine
        </h1>
        <p className="text-gray-600">
          Your AI relationship advisor with native voice chat
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Using VoiceFlow's native voice interface
        </p>
      </div>
      
      {/* The VoiceFlow widget will automatically inject here */}
      <div ref={widgetRef} id="voiceflow-chat" />
    </div>
  );
}

export default VoiceFlowWidget;
