import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

function VoiceFlowSDK() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const voiceflowRef = useRef(null);

  useEffect(() => {
    // Load VoiceFlow Runtime SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.voiceflow.com/runtime/bundle.mjs';
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      initializeVoiceFlow();
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initializeVoiceFlow = async () => {
    try {
      if (window.VoiceflowRuntime) {
        // Initialize VoiceFlow Runtime with voice capabilities
        voiceflowRef.current = new window.VoiceflowRuntime({
          versionID: process.env.REACT_APP_VOICEFLOW_VERSION_ID,
          projectID: process.env.REACT_APP_VOICEFLOW_PROJECT_ID,
          apiKey: process.env.REACT_APP_VOICEFLOW_API_KEY,
          
          // Enable voice features
          config: {
            voice: {
              enabled: true,
              autoplay: true,
              language: 'en-US',
            },
            tts: {
              enabled: true,
              voice: 'elevenlabs', // Use ElevenLabs voice from VoiceFlow
            },
            stt: {
              enabled: true,
              continuous: true,
            }
          }
        });

        // Set up event listeners for voice
        voiceflowRef.current.on('voice.start', () => {
          setIsListening(true);
          setError('');
        });

        voiceflowRef.current.on('voice.end', () => {
          setIsListening(false);
        });

        voiceflowRef.current.on('voice.transcript', (data) => {
          setTranscript(data.transcript);
        });

        voiceflowRef.current.on('voice.audio.start', () => {
          setIsSpeaking(true);
        });

        voiceflowRef.current.on('voice.audio.end', () => {
          setIsSpeaking(false);
        });

        voiceflowRef.current.on('voice.error', (error) => {
          setError(error.message);
          setIsListening(false);
          setIsSpeaking(false);
        });

        // Launch the conversation
        await voiceflowRef.current.launch();
        
      } else {
        setError('VoiceFlow SDK failed to load');
      }
    } catch (error) {
      console.error('VoiceFlow initialization error:', error);
      setError('Failed to initialize voice chat');
    }
  };

  const startVoiceInput = async () => {
    if (voiceflowRef.current) {
      try {
        await voiceflowRef.current.startVoiceInput();
      } catch (error) {
        setError('Failed to start voice input');
      }
    }
  };

  const stopVoiceInput = async () => {
    if (voiceflowRef.current) {
      try {
        await voiceflowRef.current.stopVoiceInput();
      } catch (error) {
        setError('Failed to stop voice input');
      }
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const stopAudio = async () => {
    if (voiceflowRef.current) {
      try {
        await voiceflowRef.current.stopAudio();
      } catch (error) {
        setError('Failed to stop audio');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Voice Chat with Clementine
        </h1>
        <p className="text-gray-600">
          Powered by VoiceFlow's native voice technology
        </p>
      </div>

      {/* Voice Interface */}
      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 max-w-md w-full">
        <div className="text-center">
          {/* Main Voice Button */}
          <button
            onClick={toggleVoiceInput}
            disabled={isSpeaking}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 mb-4 mx-auto ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : isSpeaking 
                ? 'bg-blue-500 cursor-not-allowed' 
                : 'bg-pink-500 hover:bg-pink-600'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Status */}
          <div className="mb-4">
            {isListening && (
              <p className="text-red-500 font-medium animate-pulse">
                🎤 Listening...
              </p>
            )}
            {isSpeaking && (
              <div className="flex items-center justify-center space-x-2">
                <Volume2 className="w-5 h-5 text-blue-500" />
                <p className="text-blue-500 font-medium">
                  Clementine is speaking...
                </p>
                <button
                  onClick={stopAudio}
                  className="text-red-500 hover:text-red-700"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              </div>
            )}
            {!isListening && !isSpeaking && (
              <p className="text-gray-500">
                Tap the microphone to start talking
              </p>
            )}
          </div>

          {/* Live Transcript */}
          {transcript && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                "{transcript}"
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">
                {error}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Tap mic to start/stop voice input</p>
            <p>• Clementine will respond with voice</p>
            <p>• Tap speaker icon to stop audio</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceFlowSDK;
