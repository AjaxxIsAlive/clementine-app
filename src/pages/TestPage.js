import React from 'react';

function TestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #10b981, #3b82f6, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
        🚀 TEST PAGE ACTIVE 🚀
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Timestamp: {new Date().toLocaleString()}
      </h2>
      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '2rem',
        borderRadius: '1rem',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          If you can see this page, the development server is working!
        </p>
        <p>
          Go back to ChatPage to see the updated interface
        </p>
      </div>
    </div>
  );
}

export default TestPage;
