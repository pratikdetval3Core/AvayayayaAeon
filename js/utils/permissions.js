/**
 * Permission System
 * Defines permission constants, role mappings, and UI helpers
 */

/**
 * Permission Constants
 * Define all available permissions in the system
 */
export const PERMISSIONS = {
  // Attendance permissions
  MARK_ATTENDANCE: 'canMarkAttendance',
  VIEW_OWN_ATTENDANCE: 'canViewOwnAttendance',
  VIEW_ALL_ATTENDANCE: 'canViewAllAttendance',
  APPROVE_ATTENDANCE: 'canApproveAttendance',
  REJECT_ATTENDANCE: 'canRejectAttendance',
  EDIT_ATTENDANCE: 'canEditAttendance',
  DELETE_ATTENDANCE: 'canDeleteAttendance',

  // Leave permissions
  APPLY_LEAVE: 'canApplyLeave',
  VIEW_OWN_LEAVE: 'canViewOwnLeave',
  VIEW_ALL_LEAVE: 'canViewAllLeave',
  APPROVE_LEAVE: 'canApproveLeave',
  REJECT_LEAVE: 'canRejectLeave',
  CANCEL_LEAVE: 'canCancelLeave',
  EDIT_LEAVE: 'canEditLeave',

  // Invoice permissions
  UPLOAD_INVOICE: 'canUploadInvoice',
  VIEW_OWN_INVOICES: 'canViewOwnInvoices',
  VIEW_ALL_INVOICES: 'canViewAllInvoices',
  PROCESS_INVOICES: 'canProcessInvoices',
  DELETE_INVOICE: 'canDeleteInvoice',
  EDIT_INVOICE: 'canEditInvoice',

  // KPI permissions
  SUBMIT_KPI: 'canSubmitKPI',
  VIEW_OWN_KPI: 'canViewOwnKPI',
  VIEW_ALL_KPIS: 'canViewAllKPIs',
  EDIT_KPI: 'canEditKPI',
  DELETE_KPI: 'canDeleteKPI',
  APPROVE_KPI: 'canApproveKPI',

  // Report permissions
  VIEW_OWN_REPORTS: 'canViewOwnReports',
  VIEW_ALL_REPORTS: 'canViewAllReports',
  EXPORT_REPORTS: 'canExportReports',
  VIEW_TEAM_REPORTS: 'canViewTeamReports',

  // User management permissions
  MANAGE_USERS: 'canManageUsers',
  VIEW_ALL_USERS: 'canViewAllUsers',
  CREATE_USER: 'canCreateUser',
  EDIT_USER: 'canEditUser',
  DELETE_USER: 'canDeleteUser',
  ASSIGN_ROLES: 'canAssignRoles',
  MANAGE_PERMISSIONS: 'canManagePermissions',

  // Profile permissions
  VIEW_OWN_PROFILE: 'canViewOwnProfile',
  EDIT_OWN_PROFILE: 'canEditOwnProfile',
  CHANGE_PASSWORD: 'canChangePassword',

  // System permissions
  ACCESS_DASHBOARD: 'canAccessDashboard',
  VIEW_NOTIFICATIONS: 'canViewNotifications',
  USE_GEOLOCATION: 'canUseGeolocation',
  USE_CAMERA: 'canUseCamera'
};

/**
 * Role Definitions
 * Define all available roles in the system
 */
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
  EMPLOYEE: 'employee',
  CONTRACTOR: 'contractor',
  INTERN: 'intern'
};

/**
 * Role-to-Permission Mapping
 * Maps each role to its set of permissions
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // All permissions - admins have full access
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.MANAGER]: [
    // Attendance
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    PERMISSIONS.VIEW_ALL_ATTENDANCE,
    PERMISSIONS.APPROVE_ATTENDANCE,
    PERMISSIONS.REJECT_ATTENDANCE,
    PERMISSIONS.EDIT_ATTENDANCE,
    
    // Leave
    PERMISSIONS.APPLY_LEAVE,
    PERMISSIONS.VIEW_OWN_LEAVE,
    PERMISSIONS.VIEW_ALL_LEAVE,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.REJECT_LEAVE,
    PERMISSIONS.EDIT_LEAVE,
    
    // Invoice
    PERMISSIONS.UPLOAD_INVOICE,
    PERMISSIONS.VIEW_OWN_INVOICES,
    PERMISSIONS.VIEW_ALL_INVOICES,
    PERMISSIONS.PROCESS_INVOICES,
    
    // KPI
    PERMISSIONS.SUBMIT_KPI,
    PERMISSIONS.VIEW_OWN_KPI,
    PERMISSIONS.VIEW_ALL_KPIS,
    PERMISSIONS.APPROVE_KPI,
    
    // Reports
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_TEAM_REPORTS,
    
    // User management (limited)
    PERMISSIONS.VIEW_ALL_USERS,
    
    // Profile
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.CHANGE_PASSWORD,
    
    // System
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.USE_GEOLOCATION,
    PERMISSIONS.USE_CAMERA
  ],
  
  [ROLES.TEAM_LEAD]: [
    // Attendance
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    PERMISSIONS.VIEW_ALL_ATTENDANCE,
    PERMISSIONS.APPROVE_ATTENDANCE,
    PERMISSIONS.REJECT_ATTENDANCE,
    
    // Leave
    PERMISSIONS.APPLY_LEAVE,
    PERMISSIONS.VIEW_OWN_LEAVE,
    PERMISSIONS.VIEW_TEAM_REPORTS,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.REJECT_LEAVE,
    
    // Invoice
    PERMISSIONS.UPLOAD_INVOICE,
    PERMISSIONS.VIEW_OWN_INVOICES,
    
    // KPI
    PERMISSIONS.SUBMIT_KPI,
    PERMISSIONS.VIEW_OWN_KPI,
    PERMISSIONS.VIEW_ALL_KPIS,
    
    // Reports
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_TEAM_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    
    // Profile
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.CHANGE_PASSWORD,
    
    // System
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.USE_GEOLOCATION,
    PERMISSIONS.USE_CAMERA
  ],
  
  [ROLES.EMPLOYEE]: [
    // Attendance
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    
    // Leave
    PERMISSIONS.APPLY_LEAVE,
    PERMISSIONS.VIEW_OWN_LEAVE,
    PERMISSIONS.CANCEL_LEAVE,
    
    // Invoice
    PERMISSIONS.UPLOAD_INVOICE,
    PERMISSIONS.VIEW_OWN_INVOICES,
    PERMISSIONS.DELETE_INVOICE,
    
    // KPI
    PERMISSIONS.SUBMIT_KPI,
    PERMISSIONS.VIEW_OWN_KPI,
    PERMISSIONS.EDIT_KPI,
    PERMISSIONS.DELETE_KPI,
    
    // Reports
    PERMISSIONS.VIEW_OWN_REPORTS,
    
    // Profile
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.CHANGE_PASSWORD,
    
    // System
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.USE_GEOLOCATION,
    PERMISSIONS.USE_CAMERA
  ],
  
  [ROLES.CONTRACTOR]: [
    // Attendance
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    
    // Invoice
    PERMISSIONS.UPLOAD_INVOICE,
    PERMISSIONS.VIEW_OWN_INVOICES,
    
    // KPI
    PERMISSIONS.SUBMIT_KPI,
    PERMISSIONS.VIEW_OWN_KPI,
    
    // Reports
    PERMISSIONS.VIEW_OWN_REPORTS,
    
    // Profile
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.CHANGE_PASSWORD,
    
    // System
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.USE_GEOLOCATION,
    PERMISSIONS.USE_CAMERA
  ],
  
  [ROLES.INTERN]: [
    // Attendance
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    
    // Leave
    PERMISSIONS.APPLY_LEAVE,
    PERMISSIONS.VIEW_OWN_LEAVE,
    
    // KPI
    PERMISSIONS.SUBMIT_KPI,
    PERMISSIONS.VIEW_OWN_KPI,
    
    // Reports
    PERMISSIONS.VIEW_OWN_REPORTS,
    
    // Profile
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.CHANGE_PASSWORD,
    
    // System
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.USE_GEOLOCATION,
    PERMISSIONS.USE_CAMERA
  ]
};

/**
 * Permission Checker Class
 * Provides methods to check permissions for current user
 */
class PermissionChecker {
  constructor() {
    this.currentUser = null;
  }

  /**
   * Set current user
   * @param {object} user - User object with permissions
   */
  setCurrentUser(user) {
    this.currentUser = user;
  }

  /**
   * Get current user
   * @returns {object|null} Current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    if (!this.currentUser) {
      return false;
    }

    // Admin has all permissions
    if (this.currentUser.userType === 'admin' || this.currentUser.role === ROLES.ADMIN) {
      return true;
    }

    // Check if user has specific permission
    return this.currentUser.permissions && this.currentUser.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has at least one permission
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  hasRole(role) {
    if (!this.currentUser) {
      return false;
    }
    return this.currentUser.role === role;
  }

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Array of roles to check
   * @returns {boolean} True if user has at least one role
   */
  hasAnyRole(roles) {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Get all permissions for current user
   * @returns {string[]} Array of permissions
   */
  getUserPermissions() {
    if (!this.currentUser) {
      return [];
    }

    // Admin has all permissions
    if (this.currentUser.userType === 'admin' || this.currentUser.role === ROLES.ADMIN) {
      return Object.values(PERMISSIONS);
    }

    return this.currentUser.permissions || [];
  }

  /**
   * Get permissions for a specific role
   * @param {string} role - Role name
   * @returns {string[]} Array of permissions
   */
  getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || [];
  }
}

/**
 * UI Helper Functions
 * Functions to show/hide elements based on permissions
 */

/**
 * Show element if user has permission
 * @param {HTMLElement} element - DOM element
 * @param {string|string[]} permission - Permission(s) required
 * @param {PermissionChecker} checker - Permission checker instance
 */
export function showIfHasPermission(element, permission, checker) {
  if (!element) return;

  const hasPermission = Array.isArray(permission)
    ? checker.hasAnyPermission(permission)
    : checker.hasPermission(permission);

  if (hasPermission) {
    element.style.display = '';
    element.removeAttribute('hidden');
  } else {
    element.style.display = 'none';
    element.setAttribute('hidden', 'true');
  }
}

/**
 * Hide element if user doesn't have permission
 * @param {HTMLElement} element - DOM element
 * @param {string|string[]} permission - Permission(s) required
 * @param {PermissionChecker} checker - Permission checker instance
 */
export function hideIfNoPermission(element, permission, checker) {
  showIfHasPermission(element, permission, checker);
}

/**
 * Enable element if user has permission
 * @param {HTMLElement} element - DOM element
 * @param {string|string[]} permission - Permission(s) required
 * @param {PermissionChecker} checker - Permission checker instance
 */
export function enableIfHasPermission(element, permission, checker) {
  if (!element) return;

  const hasPermission = Array.isArray(permission)
    ? checker.hasAnyPermission(permission)
    : checker.hasPermission(permission);

  if (hasPermission) {
    element.disabled = false;
    element.classList.remove('disabled');
  } else {
    element.disabled = true;
    element.classList.add('disabled');
  }
}

/**
 * Add permission-based class to element
 * @param {HTMLElement} element - DOM element
 * @param {string|string[]} permission - Permission(s) required
 * @param {PermissionChecker} checker - Permission checker instance
 * @param {string} className - Class name to add if has permission
 */
export function addClassIfHasPermission(element, permission, checker, className) {
  if (!element) return;

  const hasPermission = Array.isArray(permission)
    ? checker.hasAnyPermission(permission)
    : checker.hasPermission(permission);

  if (hasPermission) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

/**
 * Apply permission-based visibility to multiple elements
 * @param {object} config - Configuration object with selector-permission pairs
 * @param {PermissionChecker} checker - Permission checker instance
 */
export function applyPermissionVisibility(config, checker) {
  Object.entries(config).forEach(([selector, permission]) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      showIfHasPermission(element, permission, checker);
    });
  });
}

/**
 * Create permission-aware button
 * @param {string} text - Button text
 * @param {string|string[]} permission - Required permission(s)
 * @param {PermissionChecker} checker - Permission checker instance
 * @param {Function} onClick - Click handler
 * @returns {HTMLButtonElement} Button element
 */
export function createPermissionButton(text, permission, checker, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = 'btn btn-primary';

  const hasPermission = Array.isArray(permission)
    ? checker.hasAnyPermission(permission)
    : checker.hasPermission(permission);

  if (!hasPermission) {
    button.disabled = true;
    button.classList.add('disabled');
    button.title = 'You do not have permission to perform this action';
  } else {
    button.addEventListener('click', onClick);
  }

  return button;
}

// Export singleton instance
export const permissionChecker = new PermissionChecker();
export default permissionChecker;
