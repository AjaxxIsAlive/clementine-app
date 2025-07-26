import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FaceNavigation from './components/FaceNavigation';
import ChatPage from './pages/ChatPage';
import TestPage from './pages/TestPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/test" element={<TestPage />} />
          <Route path="/" element={<FaceNavigation />} />
          <Route path="/chat" element={<ChatPage />} />
          {/* We'll add other routes later */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;