/**
 * User Service
 * Handles user profile management and admin user operations
 */
import User from '../models/User.js';
import { databaseService } from './database.js';
import { authService } from './auth.js';
import { isValidEmail, validatePassword, validateUsername } from '../utils/validation.js';

class UserService {
  constructor() {
    this.permissionMap = {
      admin: [
        'canApproveAttendance',
        'canApproveLeave',
        'canViewAllReports',
        'canManageUsers',
        'canProcessInvoices',
        'canViewAllKPIs'
      ],
      manager: [
        'canApproveAttendance',
        'canApproveLeave',
        'canViewAllReports'
      ],
      employee: []
    };
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} Result with user data or error
   */
  async getUserProfile(userId) {
    try {
      await databaseService.ensureDB();
      const userData = await databaseService.get(databaseService.stores.USERS, userId);

      if (!userData) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = User.fromJSON(userData);
      
      // Return user data without password hash
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          userType: user.userType,
          role: user.role,
          permissions: user.permissions,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user profile'
      };
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {object} profileData - Profile data to update (username, email)
   * @returns {Promise<object>} Result with success status
   */
  async updateUserProfile(userId, profileData) {
    try {
      // Get current user data
      await databaseService.ensureDB();
      const userData = await databaseService.get(databaseService.stores.USERS, userId);

      if (!userData) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = User.fromJSON(userData);

      // Update username if provided
      if (profileData.username !== undefined) {
        const usernameValidation = validateUsername(profileData.username);
        if (!usernameValidation.isValid) {
          return {
            success: false,
            error: usernameValidation.error
          };
        }
        user.username = profileData.username;
      }

      // Update email if provided
      if (profileData.email !== undefined) {
        if (!isValidEmail(profileData.email)) {
          return {
            success: false,
            error: 'Invalid email format'
          };
        }

        // Check if new email is already in use by another user
        if (profileData.email !== user.email) {
          const existingUsers = await databaseService.getByIndex(
            databaseService.stores.USERS,
            'email',
            profileData.email
          );

          if (existingUsers && existingUsers.length > 0) {
            return {
              success: false,
              error: 'Email already in use'
            };
          }
        }

        user.email = profileData.email;
      }

      // Update timestamp
      user.updatedAt = Date.now();

      // Validate updated user
      const validation = user.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Save updated user
      await databaseService.update(databaseService.stores.USERS, user.toJSON());

      return {
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          userType: user.userType,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Update user profile error:', error);
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Result with success status
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Get current user data
      await databaseService.ensureDB();
      const userData = await databaseService.get(databaseService.stores.USERS, userId);

      if (!userData) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = User.fromJSON(userData);

      // Verify old password
      const isOldPasswordValid = await authService.verifyPassword(oldPassword, user.passwordHash);
      if (!isOldPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        };
      }

      // Check if new password is same as old password
      const isSamePassword = await authService.verifyPassword(newPassword, user.passwordHash);
      if (isSamePassword) {
        return {
          success: false,
          error: 'New password must be different from current password'
        };
      }

      // Hash new password
      const newPasswordHash = await authService.hashPassword(newPassword);
      user.passwordHash = newPasswordHash;
      user.updatedAt = Date.now();

      // Save updated user
      await databaseService.update(databaseService.stores.USERS, user.toJSON());

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Failed to change password'
      };
    }
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<object>} Result with users array or error
   */
  async getAllUsers() {
    try {
      // Check if current user is admin
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !authService.hasPermission('canManageUsers')) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      await databaseService.ensureDB();
      const usersData = await databaseService.getAll(databaseService.stores.USERS);

      // Map users without password hashes
      const users = usersData.map(userData => {
        const user = User.fromJSON(userData);
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          userType: user.userType,
          role: user.role,
          permissions: user.permissions,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        };
      });

      return {
        success: true,
        users
      };
    } catch (error) {
      console.error('Get all users error:', error);
      return {
        success: false,
        error: 'Failed to retrieve users'
      };
    }
  }

  /**
   * Update user role (admin only)
   * @param {string} userId - User ID
   * @param {string} newRole - New role to assign
   * @returns {Promise<object>} Result with success status
   */
  async updateUserRole(userId, newRole) {
    try {
      // Check if current user is admin
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !authService.hasPermission('canManageUsers')) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      // Validate role
      const validRoles = ['employee', 'manager', 'admin'];
      if (!validRoles.includes(newRole)) {
        return {
          success: false,
          error: 'Invalid role. Must be employee, manager, or admin'
        };
      }

      // Get user data
      await databaseService.ensureDB();
      const userData = await databaseService.get(databaseService.stores.USERS, userId);

      if (!userData) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = User.fromJSON(userData);

      // Prevent admin from removing their own admin role
      if (user.id === currentUser.id && user.role === 'admin' && newRole !== 'admin') {
        return {
          success: false,
          error: 'Cannot remove your own admin privileges'
        };
      }

      // Update role and permissions
      user.role = newRole;
      user.permissions = this.permissionMap[newRole] || [];
      
      // Update user type based on role
      if (newRole === 'admin') {
        user.userType = 'admin';
      } else {
        user.userType = 'employee';
      }
      
      user.updatedAt = Date.now();

      // Save updated user
      await databaseService.update(databaseService.stores.USERS, user.toJSON());

      return {
        success: true,
        message: 'User role updated successfully',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          userType: user.userType,
          permissions: user.permissions
        }
      };
    } catch (error) {
      console.error('Update user role error:', error);
      return {
        success: false,
        error: 'Failed to update user role'
      };
    }
  }

  /**
   * Update user permissions (admin only)
   * @param {string} userId - User ID
   * @param {string[]} permissions - Array of permissions to assign
   * @returns {Promise<object>} Result with success status
   */
  async updateUserPermissions(userId, permissions) {
    try {
      // Check if current user is admin
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !authService.hasPermission('canManageUsers')) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      // Validate permissions array
      if (!Array.isArray(permissions)) {
        return {
          success: false,
          error: 'Permissions must be an array'
        };
      }

      const validPermissions = [
        'canApproveAttendance',
        'canApproveLeave',
        'canViewAllReports',
        'canManageUsers',
        'canProcessInvoices',
        'canViewAllKPIs'
      ];

      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return {
          success: false,
          error: `Invalid permissions: ${invalidPermissions.join(', ')}`
        };
      }

      // Get user data
      await databaseService.ensureDB();
      const userData = await databaseService.get(databaseService.stores.USERS, userId);

      if (!userData) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = User.fromJSON(userData);

      // Update permissions
      user.permissions = permissions;
      user.updatedAt = Date.now();

      // Save updated user
      await databaseService.update(databaseService.stores.USERS, user.toJSON());

      return {
        success: true,
        message: 'User permissions updated successfully',
        user: {
          id: user.id,
          username: user.username,
          permissions: user.permissions
        }
      };
    } catch (error) {
      console.error('Update user permissions error:', error);
      return {
        success: false,
        error: 'Failed to update user permissions'
      };
    }
  }

  /**
   * Deactivate or activate user (admin only)
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status (true to activate, false to deactivate)
   * @returns {Promise<object>} Result with success status
   */
  async deactivateUser(userId, isActive = false) {
    try {
      // Check if current user is admin
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !authService.hasPermission('canManageUsers')) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      // Get user data
      await databaseService.ensureDB();
      const userData = await databaseService.get(databaseService.stores.USERS, userId);

      if (!userData) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = User.fromJSON(userData);

      // Prevent admin from deactivating themselves
      if (user.id === currentUser.id) {
        return {
          success: false,
          error: 'Cannot deactivate your own account'
        };
      }

      // Update active status
      user.isActive = isActive;
      user.updatedAt = Date.now();

      // Save updated user
      await databaseService.update(databaseService.stores.USERS, user.toJSON());

      return {
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: {
          id: user.id,
          username: user.username,
          isActive: user.isActive
        }
      };
    } catch (error) {
      console.error('Deactivate user error:', error);
      return {
        success: false,
        error: 'Failed to update user status'
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
