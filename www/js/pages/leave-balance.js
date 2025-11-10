/**
 * Leave Balance Page
 * Displays employee leave balance information
 */
import authService from '../services/auth.js';
import leaveService from '../services/leave.js';
import BottomNavigation from '../components/BottomNavigation.js';

class LeaveBalancePage {
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

    // Load leave balance
    await this.loadLeaveBalance();
  }

  /**
   * Load and display leave balance
   */
  async loadLeaveBalance() {
    try {
      const leaveBalance = await leaveService.getLeaveBalance(this.currentUser.id);
      this.renderLeaveBalance(leaveBalance);
    } catch (error) {
      console.error('Failed to load leave balance:', error);
      this.showEmptyState();
    }
  }

  /**
   * Render leave balance table
   */
  renderLeaveBalance(leaveBalance) {
    const tableBody = document.getElementById('leaveBalanceTable');
    const emptyState = document.getElementById('emptyState');

    if (!tableBody || !emptyState) return;

    const leaveTypes = [
      { key: 'sick', label: 'Sick Leave' },
      { key: 'casual', label: 'Casual Leave' },
      { key: 'vacation', label: 'Vacation Leave' },
      { key: 'personal', label: 'Personal Leave' },
      { key: 'emergency', label: 'Emergency Leave' },
      { key: 'privilege', label: 'Privilege Leave' }
    ];

    // Filter leave types that have data
    const hasData = leaveTypes.some(type => 
      leaveBalance[type.key] !== undefined && leaveBalance[type.key] !== null
    );

    if (!hasData) {
      this.showEmptyState();
      return;
    }

    tableBody.innerHTML = leaveTypes.map(type => {
      const total = leaveBalance[`${type.key}Total`] || 0;
      const availed = leaveBalance[`${type.key}Availed`] || 0;
      const balance = total - availed;

      // Only show leave types with total > 0
      if (total === 0) return '';

      return `
        <tr>
          <td>${type.label}</td>
          <td>${total}</td>
          <td>${availed}</td>
          <td>${balance}</td>
        </tr>
      `;
    }).filter(row => row !== '').join('');

    emptyState.style.display = 'none';
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    const tableBody = document.getElementById('leaveBalanceTable');
    const emptyState = document.getElementById('emptyState');

    if (tableBody) {
      tableBody.innerHTML = '';
    }

    if (emptyState) {
      emptyState.style.display = 'block';
    }
  }
}

// Initialize page
new LeaveBalancePage();
