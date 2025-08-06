import { supabase } from './supabase.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionId = null;
  }

  // Generate a unique session ID that links React user to VoiceFlow
  generateSessionId(userId) {
    return `vf_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Simple email/username login (no password for demo)
  async login(emailOrUsername, displayName = null) {
    try {
      console.log('🔐 Attempting login:', emailOrUsername);

      if (!supabase) {
        throw new Error('Supabase not available');
      }

      // Check if user exists in profiles - Updated to use first_name
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${emailOrUsername},first_name.eq.${emailOrUsername}`)
        .single();

      let user;
      
      if (existingUser && !fetchError) {
        // Existing user - update session_id
        console.log('👤 Existing user found:', existingUser.first_name || existingUser.email);
        
        const newSessionId = this.generateSessionId(existingUser.id);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            session_id: newSessionId,
            // Use existing schema columns
            last_session_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) throw updateError;
        user = updatedUser;
        
      } else {
        // New user - create profile
        console.log('✨ Creating new user:', emailOrUsername);
        
        const newSessionId = this.generateSessionId(emailOrUsername);
        
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({
            email: emailOrUsername.includes('@') ? emailOrUsername : null,
            // Use first_name instead of name
            first_name: emailOrUsername.includes('@') ? displayName : emailOrUsername,
            session_id: newSessionId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Use existing schema column
            last_session_date: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        user = newUser;
      }

      // Set authentication state
      this.currentUser = user;
      this.isAuthenticated = true;
      this.sessionId = user.session_id;

      // Store in localStorage for persistence - Updated to use first_name
      localStorage.setItem('clementine_user', JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        session_id: user.session_id,
        loginTime: new Date().toISOString()
      }));

      console.log('✅ Login successful:', {
        name: user.first_name || user.email,
        session_id: user.session_id
      });

      return {
        success: true,
        user: this.currentUser,
        sessionId: this.sessionId
      };

    } catch (error) {
      console.error('❌ Login failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user is already logged in (from localStorage)
  async checkExistingLogin() {
    try {
      const stored = localStorage.getItem('clementine_user');
      if (!stored) return false;

      const userData = JSON.parse(stored);
      
      // Check if login is still valid (within 30 days)
      const loginTime = new Date(userData.loginTime);
      const now = new Date();
      const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        localStorage.removeItem('clementine_user');
        return false;
      }

      // Verify user still exists in database
      if (supabase) {
        const { data: user, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .single();

        if (error || !user) {
          localStorage.removeItem('clementine_user');
          return false;
        }

        this.currentUser = user;
        this.sessionId = user.session_id;
      } else {
        // Fallback to localStorage data if Supabase unavailable
        this.currentUser = userData;
        this.sessionId = userData.session_id;
      }

      this.isAuthenticated = true;
      console.log('🔄 Restored login session:', this.currentUser.first_name || this.currentUser.email);
      return {
        success: true,
        user: this.currentUser,
        sessionId: this.sessionId
      };

    } catch (error) {
      console.error('❌ Error checking existing login:', error);
      localStorage.removeItem('clementine_user');
      return false;
    }
  }

  // Logout
  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionId = null;
    localStorage.removeItem('clementine_user');
    console.log('🚪 User logged out');
  }

  // Get current user session ID for VoiceFlow
  getVoiceFlowUserId() {
    return this.sessionId || 'anonymous_user';
  }

  // Get user display name
  getUserDisplayName() {
    if (!this.currentUser) return 'Guest';
    return this.currentUser.first_name || this.currentUser.email || 'User';
  }

  // Update user profile data (for memory persistence)
  async updateUserProfile(updates) {
    if (!this.isAuthenticated || !supabase) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      this.currentUser = { ...this.currentUser, ...data };
      
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('clementine_user') || '{}');
      localStorage.setItem('clementine_user', JSON.stringify({
        ...stored,
        ...data
      }));

      return true;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      return false;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;