/**
 * Application Routes Configuration
 */

import router, { 
  requireAuth, 
  requireGuest, 
  requirePermission,
  requireAdmin,
  requireManager,
  requireAnyPermission,
  combineGuards,
  PERMISSIONS
} from '../utils/router.js';

/**
 * Define application routes
 */
export function setupRoutes() {
  // Public routes
  router.addRoute('/pages/login.html', {
    path: '/pages/login.html',
    component: 'pages/login.html',
    meta: { requiresAuth: false },
    beforeEnter: requireGuest
  });

  router.addRoute('/pages/signup.html', {
    path: '/pages/signup.html',
    component: 'pages/signup.html',
    meta: { requiresAuth: false },
    beforeEnter: requireGuest
  });

  // Protected routes
  router.addRoute('/pages/dashboard.html', {
    path: '/pages/dashboard.html',
    component: 'pages/dashboard.html',
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  });

  router.addRoute('/pages/attendance.html', {
    path: '/pages/attendance.html',
    component: 'pages/attendance.html',
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  });

  router.addRoute('/pages/invoice.html', {
    path: '/pages/invoice.html',
    component: 'pages/invoice.html',
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  });

  router.addRoute('/pages/leave.html', {
    path: '/pages/leave.html',
    component: 'pages/leave.html',
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  });

  router.addRoute('/pages/leave-approval.html', {
    path: '/pages/leave-approval.html',
    component: 'pages/leave-approval.html',
    meta: { requiresAuth: true, requiresPermission: PERMISSIONS.APPROVE_LEAVE },
    beforeEnter: combineGuards(requireAuth, requirePermission(PERMISSIONS.APPROVE_LEAVE))
  });

  router.addRoute('/pages/kpi.html', {
    path: '/pages/kpi.html',
    component: 'pages/kpi.html',
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  });

  router.addRoute('/pages/reports.html', {
    path: '/pages/reports.html',
    component: 'pages/reports.html',
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  });

  router.addRoute('/pages/profile.html', {
    path: '/pages/profile.html',
    component: 'pages/profile.html',
    meta: { requiresAuth: true },
    beforeEnter: requireAuth
  });

  // Admin routes
  router.addRoute('/pages/user-management.html', {
    path: '/pages/user-management.html',
    component: 'pages/user-management.html',
    meta: { requiresAuth: true, requiresPermission: PERMISSIONS.MANAGE_USERS },
    beforeEnter: combineGuards(requireAuth, requireAdmin)
  });

  router.addRoute('/pages/admin/users.html', {
    path: '/pages/admin/users.html',
    component: 'pages/admin/users.html',
    meta: { requiresAuth: true, requiresAdmin: true },
    beforeEnter: combineGuards(requireAuth, requireAdmin)
  });

  // Global navigation guards
  router.beforeEach((to, from) => {
    // Log navigation for debugging
    console.log(`Navigating from ${from?.path || 'initial'} to ${to.path}`);
    return true;
  });

  router.afterEach((to, from) => {
    // Update page title
    const pageName = to.path.split('/').pop().replace('.html', '');
    document.title = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - Employee Management`;
    
    // Scroll to top
    window.scrollTo(0, 0);
  });

  // Initialize router
  router.init();
}

export default router;
