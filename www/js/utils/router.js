/**
 * Client-Side Router
 * Handles navigation, route guards, and page transitions
 */

import authService from '../services/auth.js';
import { PERMISSIONS, ROLES, permissionChecker } from './permissions.js';
import { showToast } from './feedback.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.isNavigating = false;
  }

  /**
   * Register a route
   */
  addRoute(path, config) {
    this.routes.set(path, {
      path,
      component: config.component,
      meta: config.meta || {},
      beforeEnter: config.beforeEnter || null
    });
  }

  /**
   * Register multiple routes
   */
  addRoutes(routes) {
    routes.forEach(route => {
      this.addRoute(route.path, route);
    });
  }

  /**
   * Add global before navigation hook
   */
  beforeEach(hook) {
    this.beforeEachHooks.push(hook);
  }

  /**
   * Add global after navigation hook
   */
  afterEach(hook) {
    this.afterEachHooks.push(hook);
  }

  /**
   * Navigate to a route
   */
  async push(path, state = {}) {
    if (this.isNavigating) {
      console.warn('Navigation already in progress');
      return;
    }

    this.isNavigating = true;

    try {
      const route = this.routes.get(path);
      
      if (!route) {
        console.error(`Route not found: ${path}`);
        this.isNavigating = false;
        return;
      }

      // Run global before hooks
      for (const hook of this.beforeEachHooks) {
        const result = await hook(route, this.currentRoute);
        if (result === false) {
          this.isNavigating = false;
          return;
        }
        if (typeof result === 'string') {
          // Redirect to different route
          this.isNavigating = false;
          return this.push(result);
        }
      }

      // Run route-specific before enter hook
      if (route.beforeEnter) {
        const result = await route.beforeEnter(route, this.currentRoute);
        if (result === false) {
          this.isNavigating = false;
          return;
        }
        if (typeof result === 'string') {
          this.isNavigating = false;
          return this.push(result);
        }
      }

      // Update browser history
      window.history.pushState(state, '', path);

      // Perform navigation
      await this.loadRoute(route);

      // Run global after hooks
      for (const hook of this.afterEachHooks) {
        await hook(route, this.currentRoute);
      }

      this.currentRoute = route;
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Replace current route (no history entry)
   */
  async replace(path, state = {}) {
    const route = this.routes.get(path);
    
    if (!route) {
      console.error(`Route not found: ${path}`);
      return;
    }

    window.history.replaceState(state, '', path);
    await this.loadRoute(route);
    this.currentRoute = route;
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }

  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }

  /**
   * Load and render a route
   */
  async loadRoute(route) {
    // Add page transition animation
    await this.transitionOut();

    // Load the component/page
    if (route.component) {
      if (typeof route.component === 'function') {
        await route.component();
      } else if (typeof route.component === 'string') {
        // Load HTML page
        window.location.href = route.component;
        return;
      }
    }

    // Transition in
    await this.transitionIn();
  }

  /**
   * Page transition out animation
   */
  async transitionOut() {
    const app = document.getElementById('app');
    if (!app) return;

    app.style.opacity = '1';
    app.style.transition = 'opacity 150ms ease-out';
    
    // Trigger reflow
    app.offsetHeight;
    
    app.style.opacity = '0';
    
    return new Promise(resolve => {
      setTimeout(resolve, 150);
    });
  }

  /**
   * Page transition in animation
   */
  async transitionIn() {
    const app = document.getElementById('app');
    if (!app) return;

    app.style.opacity = '0';
    
    // Trigger reflow
    app.offsetHeight;
    
    app.style.transition = 'opacity 150ms ease-in';
    app.style.opacity = '1';
    
    return new Promise(resolve => {
      setTimeout(() => {
        app.style.transition = '';
        resolve();
      }, 150);
    });
  }

  /**
   * Initialize router and handle browser navigation
   */
  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      const path = window.location.pathname;
      const route = this.routes.get(path);
      
      if (route) {
        this.loadRoute(route);
        this.currentRoute = route;
      }
    });

    // Intercept link clicks for client-side routing
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-route]');
      
      if (link) {
        event.preventDefault();
        const path = link.getAttribute('href') || link.dataset.route;
        this.push(path);
      }
    });
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Create singleton instance
const router = new Router();

/**
 * Authentication guard
 * Redirects to login if user is not authenticated
 */
export function requireAuth(to, from) {
  if (!authService.isAuthenticated()) {
    return '/pages/login.html';
  }
  return true;
}

/**
 * Guest guard
 * Redirects to dashboard if user is already authenticated
 */
export function requireGuest(to, from) {
  if (authService.isAuthenticated()) {
    return '/pages/dashboard.html';
  }
  return true;
}

/**
 * Permission guard factory
 * Creates a guard that checks for specific permission
 */
export function requirePermission(permission) {
  return function(to, from) {
    if (!authService.isAuthenticated()) {
      return '/pages/login.html';
    }
    
    if (!authService.hasPermission(permission)) {
      console.warn(`Permission denied: ${permission}`);
      return '/pages/dashboard.html';
    }
    
    return true;
  };
}

/**
 * Role guard factory
 * Creates a guard that checks for specific role
 */
export function requireRole(role) {
  return function(to, from) {
    if (!authService.isAuthenticated()) {
      return '/pages/login.html';
    }
    
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== role && currentUser.userType !== 'admin') {
      console.warn(`Role required: ${role}`);
      showToast('You do not have permission to access this page', 'error');
      return '/pages/dashboard.html';
    }
    
    return true;
  };
}

/**
 * Admin-only guard
 * Redirects non-admin users to dashboard
 */
export function requireAdmin(to, from) {
  if (!authService.isAuthenticated()) {
    return '/pages/login.html';
  }
  
  const currentUser = authService.getCurrentUser();
  if (currentUser.userType !== 'admin' && currentUser.role !== ROLES.ADMIN) {
    console.warn('Admin access required');
    showToast('Admin access required', 'error');
    return '/pages/dashboard.html';
  }
  
  return true;
}

/**
 * Manager-only guard
 * Redirects non-manager users to dashboard
 */
export function requireManager(to, from) {
  if (!authService.isAuthenticated()) {
    return '/pages/login.html';
  }
  
  const currentUser = authService.getCurrentUser();
  const allowedRoles = [ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD];
  
  if (!allowedRoles.includes(currentUser.role)) {
    console.warn('Manager access required');
    showToast('Manager access required', 'error');
    return '/pages/dashboard.html';
  }
  
  return true;
}

/**
 * Multiple permissions guard factory
 * Creates a guard that checks for any of the specified permissions
 */
export function requireAnyPermission(permissions) {
  return function(to, from) {
    if (!authService.isAuthenticated()) {
      return '/pages/login.html';
    }
    
    if (!authService.hasAnyPermission(permissions)) {
      console.warn(`One of these permissions required: ${permissions.join(', ')}`);
      showToast('You do not have permission to access this page', 'error');
      return '/pages/dashboard.html';
    }
    
    return true;
  };
}

/**
 * All permissions guard factory
 * Creates a guard that checks for all of the specified permissions
 */
export function requireAllPermissions(permissions) {
  return function(to, from) {
    if (!authService.isAuthenticated()) {
      return '/pages/login.html';
    }
    
    if (!authService.hasAllPermissions(permissions)) {
      console.warn(`All of these permissions required: ${permissions.join(', ')}`);
      showToast('You do not have permission to access this page', 'error');
      return '/pages/dashboard.html';
    }
    
    return true;
  };
}

/**
 * Multiple roles guard factory
 * Creates a guard that checks for any of the specified roles
 */
export function requireAnyRole(roles) {
  return function(to, from) {
    if (!authService.isAuthenticated()) {
      return '/pages/login.html';
    }
    
    const currentUser = authService.getCurrentUser();
    if (!roles.includes(currentUser.role) && currentUser.userType !== 'admin') {
      console.warn(`One of these roles required: ${roles.join(', ')}`);
      showToast('You do not have permission to access this page', 'error');
      return '/pages/dashboard.html';
    }
    
    return true;
  };
}

/**
 * Custom guard factory
 * Creates a guard with custom validation logic
 */
export function createGuard(validator, redirectPath = '/pages/dashboard.html', errorMessage = 'Access denied') {
  return function(to, from) {
    if (!authService.isAuthenticated()) {
      return '/pages/login.html';
    }
    
    const currentUser = authService.getCurrentUser();
    const isValid = validator(currentUser, to, from);
    
    if (!isValid) {
      console.warn(errorMessage);
      showToast(errorMessage, 'error');
      return redirectPath;
    }
    
    return true;
  };
}

/**
 * Combine multiple guards
 * All guards must pass for navigation to proceed
 */
export function combineGuards(...guards) {
  return async function(to, from) {
    for (const guard of guards) {
      const result = await guard(to, from);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}

/**
 * Session expiration guard
 * Checks if session is still valid
 */
export function checkSessionExpiration(to, from) {
  if (!authService.isAuthenticated()) {
    return '/pages/login.html';
  }
  
  const expiration = authService.getSessionExpiration();
  if (expiration && Date.now() > expiration) {
    authService.logout();
    showToast('Your session has expired. Please log in again.', 'warning');
    return '/pages/login.html';
  }
  
  // Refresh session if expiring soon
  if (authService.isSessionExpiringSoon()) {
    authService.refreshSession();
  }
  
  return true;
}

/**
 * Apply route guards to page navigation
 * Call this function on page load to check access
 */
export function applyRouteGuards(guards = []) {
  const currentPath = window.location.pathname;
  
  // Always check authentication and session
  const defaultGuards = [checkSessionExpiration];
  const allGuards = [...defaultGuards, ...guards];
  
  for (const guard of allGuards) {
    const result = guard({ path: currentPath }, null);
    
    if (result !== true) {
      // Redirect to the returned path
      window.location.href = result;
      return false;
    }
  }
  
  return true;
}

/**
 * Initialize route protection
 * Sets up global navigation guards
 */
export function initRouteProtection() {
  // Add global before navigation hook for session check
  router.beforeEach(checkSessionExpiration);
  
  // Handle unauthorized access attempts
  window.addEventListener('unauthorized', (event) => {
    showToast('You do not have permission to perform this action', 'error');
    console.warn('Unauthorized access attempt:', event.detail);
  });
}

// Export permission and role constants for convenience
export { PERMISSIONS, ROLES };

export default router;
