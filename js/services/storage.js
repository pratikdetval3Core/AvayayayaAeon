/**
 * LocalStorage wrapper for session and authentication data
 * Handles session management with expiration
 */
class StorageService {
  constructor() {
    this.SESSION_KEY = 'app_session';
    this.USER_KEY = 'app_user';
    this.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Store user session data with expiration timestamp
   * @param {Object} userData - User data to store
   */
  setSession(userData) {
    const session = {
      user: userData,
      expiresAt: Date.now() + this.SESSION_DURATION,
      createdAt: Date.now()
    };
    
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
      // Also set currentUser for index.html compatibility
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Failed to set session:', error);
      return false;
    }
  }

  /**
   * Retrieve current session data
   * @returns {Object|null} Session data or null if expired/not found
   */
  getSession() {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      
      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Get current user data
   * @returns {Object|null} User data or null if session expired
   */
  getCurrentUser() {
    const session = this.getSession();
    return session ? session.user : null;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if valid session exists
   */
  isAuthenticated() {
    return this.getSession() !== null;
  }

  /**
   * Update session expiration time
   */
  refreshSession() {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + this.SESSION_DURATION;
      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return true;
      } catch (error) {
        console.error('Failed to refresh session:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Clear session data (logout)
   */
  clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem('currentUser');
      return true;
    } catch (error) {
      console.error('Failed to clear session:', error);
      return false;
    }
  }

  /**
   * Get session expiration time
   * @returns {number|null} Timestamp of expiration or null
   */
  getSessionExpiration() {
    const session = this.getSession();
    return session ? session.expiresAt : null;
  }

  /**
   * Check if session will expire soon (within 1 hour)
   * @returns {boolean} True if session expires within 1 hour
   */
  isSessionExpiringSoon() {
    const expiresAt = this.getSessionExpiration();
    if (!expiresAt) return false;
    
    const oneHour = 60 * 60 * 1000;
    return (expiresAt - Date.now()) < oneHour;
  }

  /**
   * Store arbitrary data in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve data from localStorage
   * @param {string} key - Storage key
   * @returns {*} Stored value or null
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage data
   */
  clearAll() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
