import React, { useState } from 'react';
import { X, User, Mail, Lock } from 'lucide-react';

function LoginModal({ isVisible, onLogin, onClose }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !name.trim()) {
      alert('Please fill in both email and name');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create user credentials
      const userID = 'clementine_user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const credentials = {
        email: email.trim(),
        name: name.trim(),
        userID: userID,
        loginTime: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem('clementine_user_credentials', JSON.stringify(credentials));
      localStorage.setItem('clementine_user_id', userID);
      localStorage.setItem('clementine_user_email', email.trim());
      localStorage.setItem('clementine_user_name', name.trim());
      
      console.log('✅ User credentials saved:', credentials);
      
      // Call the onLogin callback
      onLogin(credentials);
      
      // Reset form
      setEmail('');
      setName('');
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Login failed. Please try again.');
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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-6">
            <p className="text-gray-600">
              To provide personalized advice and remember our conversations, 
              please share your basic information.
            </p>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter your first name"
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-pink-800">
                <strong>Privacy Promise:</strong> Your information is stored locally on your device 
                and used only to personalize your experience with Clementine. We never share or sell your data.
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim() || !name.trim()}
            className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up your profile...</span>
              </div>
            ) : (
              'Start Talking with Clementine'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to have personalized conversations with Clementine 
            and allow local storage of your preferences.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;