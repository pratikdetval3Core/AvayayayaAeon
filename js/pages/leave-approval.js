/**
 * Leave Approval Page
 * Handles leave approval and rejection for managers
 */
import authService from '../services/auth.js';
import leaveService from '../services/leave.js';
import { formatDateDisplay } from '../utils/date-utils.js';
import BottomNavigation from '../components/BottomNavigation.js';

class LeaveApprovalPage {
  constructor() {
    this.currentUser = null;
    this.pendingLeaves = [];
    this.currentLeaveId = null;
    this.init();
  }

  async init() {
    // Check authentication
    if (!authService.isAuthenticated()) {
      window.location.href = '/pages/login.html';
      return;
    }

    this.currentUser = authService.getCurrentUser();

    // Check if user has approval permission
    if (!authService.hasPermission('canApproveLeave')) {
      alert('You do not have permission to access this page');
      window.location.href = '/pages/dashboard.html';
      return;
    }

    // Initialize bottom navigation
    const bottomNav = new BottomNavigation('bottomNav', 'leave');
    bottomNav.render();

    // Load pending leave approvals
    await this.loadPendingApprovals();

    // Setup modal handlers
    this.setupModalHandlers();
  }

  /**
   * Load pending leave approvals
   */
  async loadPendingApprovals() {
    try {
      this.pendingLeaves = await leaveService.getPendingLeaveApprovals(this.currentUser.id);
      await this.renderPendingApprovals();
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    }
  }

  /**
   * Render pending leave approvals
   */
  async renderPendingApprovals() {
    const approvalList = document.getElementById('approvalList');
    const emptyState = document.getElementById('emptyState');

    if (!approvalList || !emptyState) return;

    if (this.pendingLeaves.length === 0) {
      approvalList.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    approvalList.style.display = 'flex';
    emptyState.style.display = 'none';

    // Get user details for each leave
    const leavesWithUsers = await Promise.all(
      this.pendingLeaves.map(async (leave) => {
        const userDetails = await leaveService.getUserDetails(leave.userId);
        return { ...leave, userDetails };
      })
    );

    approvalList.innerHTML = leavesWithUsers.map(leave => this.createApprovalCard(leave)).join('');

    // Setup action button handlers
    this.setupActionHandlers();
  }

  /**
   * Create approval card HTML
   */
  createApprovalCard(leave) {
    const leaveTypeDisplay = leaveService.getLeaveTypeDisplayName(leave.leaveType);
    const userName = leave.userDetails?.username || 'Unknown User';
    const userEmail = leave.userDetails?.email || '';

    return `
      <div class="approval-card" data-leave-id="${leave.id}">
        <div class="approval-card-header">
          <div class="approval-card-employee">
            <div class="approval-card-name">${this.escapeHtml(userName)}</div>
            <div class="approval-card-email">${this.escapeHtml(userEmail)}</div>
          </div>
          <span class="badge badge-pending">Pending</span>
        </div>
        <div class="approval-card-body">
          <div class="approval-card-info">
            <div class="approval-info-item">
              <div class="approval-info-label">Leave Type</div>
              <div class="approval-info-value">${leaveTypeDisplay}</div>
            </div>
            <div class="approval-info-item">
              <div class="approval-info-label">Duration</div>
              <div class="approval-info-value">${leave.duration} day${leave.duration !== 1 ? 's' : ''}</div>
            </div>
            <div class="approval-info-item">
              <div class="approval-info-label">Start Date</div>
              <div class="approval-info-value">${formatDateDisplay(leave.startDate)}</div>
            </div>
            <div class="approval-info-item">
              <div class="approval-info-label">End Date</div>
              <div class="approval-info-value">${formatDateDisplay(leave.endDate)}</div>
            </div>
          </div>
          <div class="approval-card-reason">
            <div class="approval-card-reason-label">Reason:</div>
            <div class="approval-card-reason-text">${this.escapeHtml(leave.reason)}</div>
          </div>
        </div>
        <div class="approval-card-actions">
          <button class="btn btn-success approve-btn" data-leave-id="${leave.id}">
            <span class="btn-text">Approve</span>
            <span class="btn-loader" style="display: none;"></span>
          </button>
          <button class="btn btn-danger reject-btn" data-leave-id="${leave.id}">Reject</button>
        </div>
      </div>
    `;
  }

  /**
   * Setup action button handlers
   */
  setupActionHandlers() {
    // Approve buttons
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const leaveId = e.currentTarget.dataset.leaveId;
        await this.handleApprove(leaveId, e.currentTarget);
      });
    });

    // Reject buttons
    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leaveId = e.currentTarget.dataset.leaveId;
        this.showRejectionModal(leaveId);
      });
    });
  }

  /**
   * Handle approve action
   */
  async handleApprove(leaveId, button) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    // Show loading state
    button.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
      const result = await leaveService.approveLeave(leaveId, this.currentUser.id);

      if (result.success) {
        this.showNotification('Leave application approved successfully', 'success');
        await this.loadPendingApprovals();
      } else {
        alert(result.error || 'Failed to approve leave application');
        button.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('An error occurred. Please try again.');
      button.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }

  /**
   * Show rejection modal
   */
  showRejectionModal(leaveId) {
    this.currentLeaveId = leaveId;
    const modal = document.getElementById('rejectionModal');
    const rejectionReason = document.getElementById('rejectionReason');
    const modalError = document.getElementById('modalError');

    if (modal) {
      modal.style.display = 'flex';
      rejectionReason.value = '';
      modalError.textContent = '';
      modalError.classList.remove('show');
    }
  }

  /**
   * Hide rejection modal
   */
  hideRejectionModal() {
    const modal = document.getElementById('rejectionModal');
    if (modal) {
      modal.style.display = 'none';
      this.currentLeaveId = null;
    }
  }

  /**
   * Setup modal event handlers
   */
  setupModalHandlers() {
    const modal = document.getElementById('rejectionModal');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmRejectBtn = document.getElementById('confirmRejectBtn');

    // Close modal handlers
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideRejectionModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideRejectionModal());
    }

    // Click outside modal to close
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideRejectionModal();
        }
      });
    }

    // Confirm reject handler
    if (confirmRejectBtn) {
      confirmRejectBtn.addEventListener('click', async () => {
        await this.handleReject();
      });
    }
  }

  /**
   * Handle reject action
   */
  async handleReject() {
    const rejectionReason = document.getElementById('rejectionReason').value.trim();
    const modalError = document.getElementById('modalError');
    const confirmRejectBtn = document.getElementById('confirmRejectBtn');
    const btnText = confirmRejectBtn.querySelector('.btn-text');
    const btnLoader = confirmRejectBtn.querySelector('.btn-loader');

    // Validate reason
    if (!rejectionReason) {
      modalError.textContent = 'Please provide a reason for rejection';
      modalError.classList.add('show');
      return;
    }

    // Clear error
    modalError.textContent = '';
    modalError.classList.remove('show');

    // Show loading state
    confirmRejectBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
      const result = await leaveService.rejectLeave(
        this.currentLeaveId,
        this.currentUser.id,
        rejectionReason
      );

      if (result.success) {
        this.hideRejectionModal();
        this.showNotification('Leave application rejected', 'info');
        await this.loadPendingApprovals();
      } else {
        modalError.textContent = result.error || 'Failed to reject leave application';
        modalError.classList.add('show');
      }
    } catch (error) {
      console.error('Reject error:', error);
      modalError.textContent = 'An error occurred. Please try again.';
      modalError.classList.add('show');
    } finally {
      // Reset button state
      confirmRejectBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
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
new LeaveApprovalPage();
