import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FaceNavigation from './components/FaceNavigation';
import ChatPage from './pages/ChatPage';
import NativeVoiceFlowChat from './pages/NativeVoiceFlowChat';
import CustomVoiceFlowChat from './pages/CustomVoiceFlowChat';
import VoiceFlowAPIChat from './pages/VoiceFlowAPIChat';
import VoiceFlowOptions from './pages/VoiceFlowOptions';
import CustomVoiceFlowDemo from './pages/CustomVoiceFlowDemo';
import TestPage from './pages/TestPage';
import ChatPageTest from './pages/ChatPageTest';
import LoginModal from './components/LoginModal';
import authService from './services/authService';
import { supabase } from './supabaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [voiceFlowUserId, setVoiceFlowUserId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [session, setSession] = useState(null);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);
console.log('🔍 DEBUGGING SESSION DATA V2:');
console.log('Current Supabase session:', session);


  // Check for existing login on app start
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const existingAuth = await authService.checkExistingLogin();
        if (existingAuth.success) {
          setUser(existingAuth.user);
          setSessionId(existingAuth.sessionId);
          setVoiceFlowUserId(authService.getVoiceFlowUserId());
          console.log('✅ Existing auth found:', existingAuth.user);
        }
      } catch (error) {
        console.log('ℹ️ No existing auth found');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, []);

  const handleLogin = (authData) => {
    setUser(authData.user);
    setSessionId(authData.sessionId);
    setVoiceFlowUserId(authData.voiceFlowUserId);
    setShowLoginModal(false);
    console.log('✅ User logged in:', authData.user);
  };

  const handleLogout = () => {
    setUser(null);
    setSessionId(null);
    setVoiceFlowUserId(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userSessionId');
    console.log('👋 User logged out');
  };

  const requireAuth = (component) => {
    if (isCheckingAuth) {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>;
    }
    
    if (!user) {
      return <FaceNavigation onLoginClick={() => setShowLoginModal(true)} />;
    }
    
    return component;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/test" element={<TestPage />} />
          <Route path="/" element={<FaceNavigation onLoginClick={() => setShowLoginModal(true)} />} />
          <Route path="/chat" element={requireAuth(
            <ChatPage 
              user={user} 
              sessionId={sessionId} 
              voiceFlowUserId={voiceFlowUserId}
              onLogout={handleLogout}
            />
          )} />
          <Route path="/native-chat" element={<NativeVoiceFlowChat />} />
          <Route path="/custom-chat" element={<CustomVoiceFlowChat />} />
          <Route path="/custom-demo" element={<CustomVoiceFlowDemo />} />
          <Route path="/api-chat" element={<VoiceFlowAPIChat />} />
          <Route path="/voice-options" element={<VoiceFlowOptions />} />
          <Route path="/test-chat" element={<ChatPageTest />} />
          {/* We'll add other routes later */}
        </Routes>

        <LoginModal
          isVisible={showLoginModal}
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    </Router>
  );
}

export default App;