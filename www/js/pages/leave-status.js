/**
 * Leave Status Page
 * Displays leave application status with filtering
 */
import authService from '../services/auth.js';
import leaveService from '../services/leave.js';
import { formatDateDisplay } from '../utils/date-utils.js';
import BottomNavigation from '../components/BottomNavigation.js';

class LeaveStatusPage {
  constructor() {
    this.currentUser = null;
    this.allLeaves = [];
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

    // Setup filters
    this.setupFilters();

    // Load leave applications
    await this.loadLeaveApplications();
  }

  /**
   * Setup filter dropdowns
   */
  setupFilters() {
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');

    // Set current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Populate year dropdown
    for (let year = currentYear; year >= currentYear - 5; year--) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    }

    // Set default values
    monthFilter.value = currentMonth;
    yearFilter.value = currentYear;

    // Add change listeners
    monthFilter.addEventListener('change', () => this.filterLeaves());
    yearFilter.addEventListener('change', () => this.filterLeaves());
  }

  /**
   * Load leave applications
   */
  async loadLeaveApplications() {
    try {
      this.allLeaves = await leaveService.getLeaveApplications(this.currentUser.id);
      this.filterLeaves();
    } catch (error) {
      console.error('Failed to load leave applications:', error);
      this.showEmptyState();
    }
  }

  /**
   * Filter leaves based on selected month and year
   */
  filterLeaves() {
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');

    const selectedMonth = monthFilter.value;
    const selectedYear = yearFilter.value;

    let filteredLeaves = this.allLeaves;

    if (selectedMonth && selectedYear) {
      filteredLeaves = this.allLeaves.filter(leave => {
        const leaveDate = new Date(leave.startDate);
        return leaveDate.getMonth() + 1 === parseInt(selectedMonth) &&
               leaveDate.getFullYear() === parseInt(selectedYear);
      });
    } else if (selectedYear) {
      filteredLeaves = this.allLeaves.filter(leave => {
        const leaveDate = new Date(leave.startDate);
        return leaveDate.getFullYear() === parseInt(selectedYear);
      });
    }

    this.renderLeaveStatus(filteredLeaves);
  }

  /**
   * Render leave status list
   */
  renderLeaveStatus(leaves) {
    const listContainer = document.getElementById('leaveStatusList');
    const emptyState = document.getElementById('emptyState');

    if (!listContainer || !emptyState) return;

    if (leaves.length === 0) {
      listContainer.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    listContainer.innerHTML = leaves.map(leave => this.createLeaveStatusCard(leave)).join('');
  }

  /**
   * Create leave status card HTML
   */
  createLeaveStatusCard(leave) {
    const statusBadgeClass = leaveService.getStatusBadgeClass(leave.status);
    const leaveTypeDisplay = leaveService.getLeaveTypeDisplayName(leave.leaveType);
    const statusClass = leave.status.toLowerCase();

    return `
      <div class="leave-status-card ${statusClass}">
        <div class="leave-status-header">
          <div class="leave-type">${leaveTypeDisplay}</div>
          <span class="badge ${statusBadgeClass}">${leave.status}</span>
        </div>
        <div class="leave-status-body">
          <div class="leave-info-row">
            <span class="leave-info-label">Start Date:</span>
            <span class="leave-info-value">${formatDateDisplay(leave.startDate)}</span>
          </div>
          <div class="leave-info-row">
            <span class="leave-info-label">End Date:</span>
            <span class="leave-info-value">${formatDateDisplay(leave.endDate)}</span>
          </div>
          <div class="leave-info-row">
            <span class="leave-info-label">Duration:</span>
            <span class="leave-info-value">${leave.duration} day${leave.duration !== 1 ? 's' : ''}</span>
          </div>
          <div class="leave-reason">
            <div class="leave-reason-label">Reason:</div>
            <div class="leave-reason-text">${this.escapeHtml(leave.reason)}</div>
          </div>
          ${leave.status === 'rejected' && leave.rejectionReason ? `
            <div class="leave-reason">
              <div class="leave-reason-label" style="color: var(--danger-color);">Rejection Reason:</div>
              <div class="leave-reason-text">${this.escapeHtml(leave.rejectionReason)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    const listContainer = document.getElementById('leaveStatusList');
    const emptyState = document.getElementById('emptyState');

    if (listContainer) {
      listContainer.innerHTML = '';
    }

    if (emptyState) {
      emptyState.style.display = 'block';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize page
new LeaveStatusPage();
