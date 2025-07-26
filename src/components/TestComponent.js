import React from 'react';
import voiceFlowAPI from '../services/voiceflow';

function TestComponent() {
  const testVoiceFlow = async () => {
    try {
      const response = await voiceFlowAPI.startConversation();
      console.log('VoiceFlow test response:', response);
      alert('VoiceFlow connection works!');
    } catch (error) {
      console.error('VoiceFlow test failed:', error);
      alert('VoiceFlow connection failed');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>VoiceFlow Test</h2>
      <button onClick={testVoiceFlow}>Test VoiceFlow Connection</button>
    </div>
  );
}

export default TestComponent;
