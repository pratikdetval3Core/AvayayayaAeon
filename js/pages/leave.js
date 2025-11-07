/**
 * Leave Application Page
 * Handles leave application form submission and display
 */
import authService from '../services/auth.js';
import leaveService from '../services/leave.js';
import { formatDateDisplay } from '../utils/date-utils.js';
import BottomNavigation from '../components/BottomNavigation.js';

class LeavePage {
  constructor() {
    this.currentUser = null;
    this.leaveBalance = {};
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

    // Load leave applications
    await this.loadLeaveApplications();

    // Setup form handlers
    this.setupFormHandlers();

    // Setup date change handlers
    this.setupDateHandlers();
  }

  /**
   * Load and display leave balance
   */
  async loadLeaveBalance() {
    try {
      this.leaveBalance = await leaveService.getLeaveBalance(this.currentUser.id);
      this.renderLeaveBalance();
    } catch (error) {
      console.error('Failed to load leave balance:', error);
    }
  }

  /**
   * Render leave balance cards
   */
  renderLeaveBalance() {
    const balanceGrid = document.getElementById('leaveBalanceGrid');
    if (!balanceGrid) return;

    const leaveTypes = [
      { key: 'sick', label: 'Sick' },
      { key: 'casual', label: 'Casual' },
      { key: 'vacation', label: 'Vacation' },
      { key: 'personal', label: 'Personal' },
      { key: 'emergency', label: 'Emergency' }
    ];

    balanceGrid.innerHTML = leaveTypes.map(type => `
      <div class="balance-card">
        <div class="balance-card-type">${type.label}</div>
        <div class="balance-card-value">${this.leaveBalance[type.key] || 0}</div>
        <div class="balance-card-label">days left</div>
      </div>
    `).join('');
  }

  /**
   * Setup form event handlers
   */
  setupFormHandlers() {
    const form = document.getElementById('leaveApplicationForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleFormSubmit();
    });
  }

  /**
   * Setup date change handlers for duration calculation
   */
  setupDateHandlers() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const durationInput = document.getElementById('duration');

    const updateDuration = () => {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      if (startDate && endDate) {
        const duration = leaveService.calculateLeaveDuration(startDate, endDate);
        durationInput.value = `${duration} day${duration !== 1 ? 's' : ''}`;
      } else {
        durationInput.value = '';
      }
    };

    startDateInput.addEventListener('change', updateDuration);
    endDateInput.addEventListener('change', updateDuration);
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const formError = document.getElementById('formError');

    // Get form data
    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value;

    // Clear previous errors
    formError.textContent = '';
    formError.classList.remove('show');

    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      formError.textContent = 'End date must be on or after start date';
      formError.classList.add('show');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
      const result = await leaveService.submitLeaveApplication({
        leaveType,
        startDate,
        endDate,
        reason
      });

      if (result.success) {
        // Show success message
        this.showNotification('Leave application submitted successfully', 'success');

        // Reset form
        document.getElementById('leaveApplicationForm').reset();
        document.getElementById('duration').value = '';

        // Reload leave balance and applications
        await this.loadLeaveBalance();
        await this.loadLeaveApplications();
      } else {
        formError.textContent = result.error || 'Failed to submit leave application';
        formError.classList.add('show');
      }
    } catch (error) {
      console.error('Submit error:', error);
      formError.textContent = 'An error occurred. Please try again.';
      formError.classList.add('show');
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }

  /**
   * Load and display leave applications
   */
  async loadLeaveApplications() {
    try {
      const leaves = await leaveService.getLeaveApplications(this.currentUser.id);
      this.renderLeaveApplications(leaves);
    } catch (error) {
      console.error('Failed to load leave applications:', error);
    }
  }

  /**
   * Render leave applications list
   */
  renderLeaveApplications(leaves) {
    const leaveList = document.getElementById('leaveList');
    const emptyState = document.getElementById('emptyState');

    if (!leaveList || !emptyState) return;

    if (leaves.length === 0) {
      leaveList.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    leaveList.style.display = 'flex';
    emptyState.style.display = 'none';

    leaveList.innerHTML = leaves.map(leave => this.createLeaveCard(leave)).join('');
  }

  /**
   * Create leave card HTML
   */
  createLeaveCard(leave) {
    const statusBadgeClass = leaveService.getStatusBadgeClass(leave.status);
    const leaveTypeDisplay = leaveService.getLeaveTypeDisplayName(leave.leaveType);

    let rejectionSection = '';
    if (leave.status === 'rejected' && leave.rejectionReason) {
      rejectionSection = `
        <div class="leave-card-rejection">
          <div class="leave-card-rejection-label">Rejection Reason:</div>
          <div class="leave-card-rejection-text">${this.escapeHtml(leave.rejectionReason)}</div>
        </div>
      `;
    }

    return `
      <div class="leave-card">
        <div class="leave-card-header">
          <div class="leave-card-type">${leaveTypeDisplay}</div>
          <span class="badge ${statusBadgeClass}">${leave.status}</span>
        </div>
        <div class="leave-card-body">
          <div class="leave-card-row">
            <span class="leave-card-label">Start Date:</span>
            <span class="leave-card-value">${formatDateDisplay(leave.startDate)}</span>
          </div>
          <div class="leave-card-row">
            <span class="leave-card-label">End Date:</span>
            <span class="leave-card-value">${formatDateDisplay(leave.endDate)}</span>
          </div>
          <div class="leave-card-row">
            <span class="leave-card-label">Duration:</span>
            <span class="leave-card-value">${leave.duration} day${leave.duration !== 1 ? 's' : ''}</span>
          </div>
          <div class="leave-card-reason">
            <div class="leave-card-reason-label">Reason:</div>
            <div class="leave-card-reason-text">${this.escapeHtml(leave.reason)}</div>
          </div>
          ${rejectionSection}
        </div>
      </div>
    `;
  }

  /**
   * Show notification message
   */
  showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a toast component
    alert(message);
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
new LeavePage();
