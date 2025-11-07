/**
 * Profile Page
 * Handles user profile display and management
 */
import { authService } from '../services/auth.js';
import { userService } from '../services/user.js';
import { geolocationService } from '../services/geolocation.js';
import BottomNavigation from '../components/BottomNavigation.js';
import { LocationDisplay } from '../components/LocationDisplay.js';
import { formatDate } from '../utils/date-utils.js';

class ProfilePage {
  constructor() {
    this.currentUser = null;
    this.locationDisplay = null;
    this.init();
  }

  /**
   * Initialize profile page
   */
  async init() {
    // Check authentication
    if (!authService.isAuthenticated()) {
      window.location.href = '/pages/login.html';
      return;
    }

    this.currentUser = authService.getCurrentUser();
    
    // Initialize components
    this.initBottomNav();
    this.initLocationDisplay();
    this.loadUserProfile();
    this.attachEventListeners();
  }

  /**
   * Initialize bottom navigation
   */
  initBottomNav() {
    const bottomNav = new BottomNavigation('bottomNav', 'profile');
    bottomNav.render();
  }

  /**
   * Initialize location display component
   */
  initLocationDisplay() {
    const container = document.getElementById('locationDisplay');
    if (container) {
      this.locationDisplay = new LocationDisplay(container);
    }
  }

  /**
   * Load user profile data
   */
  async loadUserProfile() {
    try {
      const result = await userService.getUserProfile(this.currentUser.id);

      if (result.success) {
        this.displayUserProfile(result.user);
      } else {
        this.showToast(result.error || 'Failed to load profile', 'error');
      }
    } catch (error) {
      console.error('Load profile error:', error);
      this.showToast('Failed to load profile', 'error');
    }
  }

  /**
   * Display user profile data
   * @param {object} user - User data
   */
  displayUserProfile(user) {
    // Profile card
    document.getElementById('profileName').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRole').textContent = this.formatRole(user.role);
    document.getElementById('profileStatus').textContent = user.isActive ? 'Active' : 'Inactive';
    document.getElementById('profileStatus').className = user.isActive ? 'badge badge-success' : 'badge badge-danger';

    // Details section
    document.getElementById('detailUsername').textContent = user.username;
    document.getElementById('detailEmail').textContent = user.email;
    document.getElementById('detailUserType').textContent = this.formatUserType(user.userType);
    document.getElementById('detailRole').textContent = this.formatRole(user.role);
    document.getElementById('detailLastLogin').textContent = user.lastLogin 
      ? formatDate(user.lastLogin, 'datetime')
      : 'Never';

    // Store user data for editing
    this.currentUserData = user;
  }

  /**
   * Format user type for display
   * @param {string} userType - User type
   * @returns {string}
   */
  formatUserType(userType) {
    return userType.charAt(0).toUpperCase() + userType.slice(1);
  }

  /**
   * Format role for display
   * @param {string} role - User role
   * @returns {string}
   */
  formatRole(role) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
      window.location.href = '/pages/dashboard.html';
    });

    // Edit profile button
    document.getElementById('editProfileBtn').addEventListener('click', () => {
      this.openEditModal();
    });

    // Close modal buttons
    document.getElementById('closeModalBtn').addEventListener('click', () => {
      this.closeEditModal();
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      this.closeEditModal();
    });

    // Edit profile form
    document.getElementById('editProfileForm').addEventListener('submit', (e) => {
      this.handleEditProfile(e);
    });

    // Change password form
    document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
      this.handleChangePassword(e);
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.handleLogout();
    });

    // Close modal on backdrop click
    document.getElementById('editProfileModal').addEventListener('click', (e) => {
      if (e.target.id === 'editProfileModal') {
        this.closeEditModal();
      }
    });
  }

  /**
   * Open edit profile modal
   */
  openEditModal() {
    if (this.currentUserData) {
      document.getElementById('editUsername').value = this.currentUserData.username;
      document.getElementById('editEmail').value = this.currentUserData.email;
    }
    document.getElementById('editProfileModal').classList.add('active');
  }

  /**
   * Close edit profile modal
   */
  closeEditModal() {
    document.getElementById('editProfileModal').classList.remove('active');
    document.getElementById('editProfileForm').reset();
  }

  /**
   * Handle edit profile form submission
   * @param {Event} e - Form submit event
   */
  async handleEditProfile(e) {
    e.preventDefault();

    const username = document.getElementById('editUsername').value.trim();
    const email = document.getElementById('editEmail').value.trim();

    // Check if anything changed
    if (username === this.currentUserData.username && email === this.currentUserData.email) {
      this.showToast('No changes to save', 'info');
      this.closeEditModal();
      return;
    }

    try {
      const result = await userService.updateUserProfile(this.currentUser.id, {
        username,
        email
      });

      if (result.success) {
        this.showToast('Profile updated successfully', 'success');
        this.closeEditModal();
        
        // Reload profile data
        await this.loadUserProfile();
        
        // Update session if email changed
        if (email !== this.currentUserData.email) {
          this.currentUser.email = email;
          this.currentUser.username = username;
        }
      } else {
        this.showToast(result.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      this.showToast('Failed to update profile', 'error');
    }
  }

  /**
   * Handle change password form submission
   * @param {Event} e - Form submit event
   */
  async handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      this.showToast('New passwords do not match', 'error');
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      this.showToast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      const result = await userService.changePassword(
        this.currentUser.id,
        currentPassword,
        newPassword
      );

      if (result.success) {
        this.showToast('Password changed successfully', 'success');
        document.getElementById('changePasswordForm').reset();
      } else {
        this.showToast(result.error || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Change password error:', error);
      this.showToast('Failed to change password', 'error');
    }
  }

  /**
   * Handle logout
   */
  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      authService.logout();
      window.location.href = '/pages/login.html';
    }
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, info)
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProfilePage();
});
