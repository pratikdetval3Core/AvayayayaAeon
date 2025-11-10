/**
 * Leave Menu Page
 * Hub for all leave-related pages
 */
import authService from '../services/auth.js';
import BottomNavigation from '../components/BottomNavigation.js';

class LeaveMenuPage {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Check authentication
    if (!authService.isAuthenticated()) {
      window.location.href = '/pages/login.html';
      return;
    }

    this.currentUser = authService.getCurrentUser();

    // Initialize bottom navigation
    const bottomNav = new BottomNavigation('bottomNav', 'leave');
    bottomNav.render();

    // Show/hide leave approval based on user role
    this.setupMenuItems();
  }

  /**
   * Setup menu items based on user permissions
   */
  setupMenuItems() {
    const leaveApprovalItem = document.getElementById('leaveApprovalItem');
    
    // Show leave approval for managers and admins
    if (this.currentUser && (this.currentUser.role === 'manager' || this.currentUser.role === 'admin')) {
      if (leaveApprovalItem) {
        leaveApprovalItem.style.display = 'flex';
      }
    }
  }
}

// Initialize page
new LeaveMenuPage();
