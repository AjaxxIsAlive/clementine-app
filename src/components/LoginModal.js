import React, { useState } from 'react';
import { X, User, Mail } from 'lucide-react';
import authService from '../services/authService';

function LoginModal({ isVisible, onLogin, onClose }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailOrUsername.trim()) {
      setError('Please enter your email or username');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(emailOrUsername.trim(), name.trim() || null);
      
      if (result.success) {
        console.log('✅ Login successful:', result.user);
        
        // Call the onLogin callback with user data
        onLogin({
          user: result.user,
          sessionId: result.sessionId,
          voiceFlowUserId: authService.getVoiceFlowUserId()
        });
        
        // Reset form
        setEmailOrUsername('');
        setName('');
        setError('');
        onClose();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (guestName) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await authService.login(guestName, guestName);
      if (result.success) {
        onLogin({
          user: result.user,
          sessionId: result.sessionId,
          voiceFlowUserId: authService.getVoiceFlowUserId()
        });
        onClose();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Welcome to Clementine</h2>
              <p className="text-sm text-gray-600">Your AI relationship advisor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter your email or username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name (optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="How should I call you?"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login / Create Account'}
          </button>
        </form>

        {/* Quick Login Options */}
        <div className="px-6 pb-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3 mt-4">Or try a quick demo:</p>
          <div className="flex space-x-3">
            <button
              onClick={() => handleQuickLogin('Demo User')}
              disabled={isLoading}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Demo User
            </button>
            <button
              onClick={() => handleQuickLogin('Guest')}
              disabled={isLoading}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Guest
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p><strong>No password required!</strong> Simple login for demo purposes.</p>
            <p>Your conversations and memories will be saved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;