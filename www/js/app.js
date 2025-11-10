/**
 * Main Application Entry Point
 */

// Import services
import authService from './services/auth.js';

// Import router
import { setupRoutes } from './router/routes.js';

// Import utilities
import { getCurrentDate, getCurrentTimestamp } from './utils/date-utils.js';
import { generateUUID } from './utils/uuid.js';
import { isValidEmail } from './utils/validation.js';

// Import error handling and feedback systems
import { initErrorHandler } from './utils/error-handler.js';
import { showNotification } from './utils/feedback.js';

/**
 * Initialize the application
 */
function initApp() {
  console.log('Employee Management System initialized');
  console.log('Current Date:', getCurrentDate());
  console.log('Timestamp:', getCurrentTimestamp());
  
  // Initialize error handler
  initErrorHandler();
  
  // Setup router and routes
  setupRoutes();
  
  // Check authentication and redirect if needed
  if (!authService.isAuthenticated()) {
    // Redirect to login page if not on a public page
    const currentPath = window.location.pathname;
    const publicPages = [
      '/pages/login.html', 
      '/pages/signup.html', 
      '/pages/welcome.html',
      '/pages/demo-setup.html'
    ];
    
    if (!publicPages.includes(currentPath)) {
      window.location.href = 'pages/login.html';
      return;
    }
  } else {
    // If authenticated and on index.html or public pages, redirect to dashboard
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '/index.html') {
      window.location.href = 'pages/dashboard.html';
      return;
    }
  }
  
  // Log current user if authenticated
  if (authService.isAuthenticated()) {
    const currentUser = authService.getCurrentUser();
    console.log('Current User:', currentUser);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export { initApp };
