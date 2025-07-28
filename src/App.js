import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FaceNavigation from './components/FaceNavigation';
import ChatPage from './pages/ChatPageNew';
import NativeVoiceFlowChat from './pages/NativeVoiceFlowChat';
import CustomVoiceFlowChat from './pages/CustomVoiceFlowChat';
import VoiceFlowAPIChat from './pages/VoiceFlowAPIChat';
import VoiceFlowOptions from './pages/VoiceFlowOptions';
import CustomVoiceFlowDemo from './pages/CustomVoiceFlowDemo';
import TestPage from './pages/TestPage';
import ChatPageTest from './pages/ChatPageTest';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/test" element={<TestPage />} />
          <Route path="/" element={<FaceNavigation />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/native-chat" element={<NativeVoiceFlowChat />} />
          <Route path="/custom-chat" element={<CustomVoiceFlowChat />} />
          <Route path="/custom-demo" element={<CustomVoiceFlowDemo />} />
          <Route path="/api-chat" element={<VoiceFlowAPIChat />} />
          <Route path="/voice-options" element={<VoiceFlowOptions />} />
          <Route path="/test-chat" element={<ChatPageTest />} />
          {/* We'll add other routes later */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;