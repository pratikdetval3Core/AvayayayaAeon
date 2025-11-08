/**
 * Attendance Page Controller
 */
import authService from '../services/auth.js';
import attendanceService from '../services/attendance.js';
import geolocationService from '../services/geolocation.js';
import BottomNavigation from '../components/BottomNavigation.js';
import { formatTime, formatDate } from '../utils/date-utils.js';

class AttendancePage {
  constructor() {
    this.currentUser = null;
    this.todayAttendance = null;
    this.currentAttendanceId = null;
    this.pendingRejectionId = null;
    
    // DOM elements
    this.elements = {
      currentDateTime: document.getElementById('currentDateTime'),
      statusIndicator: document.getElementById('statusIndicator'),
      statusTitle: document.getElementById('statusTitle'),
      statusDescription: document.getElementById('statusDescription'),
      markInBtn: document.getElementById('markInBtn'),
      markOutBtn: document.getElementById('markOutBtn'),
      markInTime: document.getElementById('markInTime'),
      markOutTime: document.getElementById('markOutTime'),
      hoursWorked: document.getElementById('hoursWorked'),
      historyList: document.getElementById('historyList'),
      emptyState: document.getElementById('emptyState'),
      refreshHistoryBtn: document.getElementById('refreshHistoryBtn'),
      approvalSection: document.getElementById('approvalSection'),
      approvalList: document.getElementById('approvalList'),
      approvalEmptyState: document.getElementById('approvalEmptyState'),
      pendingCount: document.getElementById('pendingCount'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      toast: document.getElementById('toast'),
      rejectionModal: document.getElementById('rejectionModal'),
      rejectionReason: document.getElementById('rejectionReason'),
      closeModalBtn: document.getElementById('closeModalBtn'),
      cancelRejectBtn: document.getElementById('cancelRejectBtn'),
      confirmRejectBtn: document.getElementById('confirmRejectBtn')
    };
  }

  /**
   * Initialize page
   */
  async init() {
    // Check authentication
    if (!authService.isAuthenticated()) {
      window.location.href = '/pages/login.html';
      return;
    }

    this.currentUser = authService.getCurrentUser();

    // Initialize bottom navigation
    const bottomNav = new BottomNavigation('bottomNav', 'attendance');
    bottomNav.render();

    // Setup event listeners
    this.setupEventListeners();

    // Update current date/time
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);

    // Load initial data
    await this.loadData();

    // Check if user has approval permissions
    if (authService.hasPermission('canApproveAttendance')) {
      this.elements.approvalSection.style.display = 'block';
      await this.loadPendingApprovals();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mark In button
    this.elements.markInBtn.addEventListener('click', () => this.handleMarkIn());

    // Mark Out button
    this.elements.markOutBtn.addEventListener('click', () => this.handleMarkOut());

    // Refresh history button
    this.elements.refreshHistoryBtn.addEventListener('click', () => this.loadAttendanceHistory());

    // Modal close buttons
    this.elements.closeModalBtn.addEventListener('click', () => this.closeRejectionModal());
    this.elements.cancelRejectBtn.addEventListener('click', () => this.closeRejectionModal());
    this.elements.confirmRejectBtn.addEventListener('click', () => this.confirmReject());

    // Close modal on backdrop click
    this.elements.rejectionModal.addEventListener('click', (e) => {
      if (e.target === this.elements.rejectionModal) {
        this.closeRejectionModal();
      }
    });
  }

  /**
   * Update current date and time display
   */
  updateDateTime() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    this.elements.currentDateTime.textContent = now.toLocaleDateString('en-US', options);
  }

  /**
   * Load all data
   */
  async loadData() {
    this.showLoading();
    try {
      await Promise.all([
        this.loadTodayStatus(),
        this.loadAttendanceHistory()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Failed to load attendance data', 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Load today's attendance status
   */
  async loadTodayStatus() {
    const today = new Date().toISOString().split('T')[0];
    this.todayAttendance = await attendanceService.getAttendanceStatus(this.currentUser.id, today);

    this.updateStatusDisplay();
    this.updateButtonStates();
    this.updateTodaySummary();
  }

  /**
   * Update status indicator display
   */
  updateStatusDisplay() {
    if (!this.todayAttendance || !this.todayAttendance.markInTime) {
      // Not marked in
      this.elements.statusIndicator.className = 'status-indicator';
      this.elements.statusTitle.textContent = 'Not Marked';
      this.elements.statusDescription.textContent = 'Mark in to start your day';
    } else if (this.todayAttendance.markInTime && !this.todayAttendance.markOutTime) {
      // Marked in
      this.elements.statusIndicator.className = 'status-indicator marked-in';
      this.elements.statusTitle.textContent = 'Marked In';
      this.elements.statusDescription.textContent = 'You are currently at work';
    } else {
      // Marked out
      this.elements.statusIndicator.className = 'status-indicator marked-out';
      this.elements.statusTitle.textContent = 'Marked Out';
      this.elements.statusDescription.textContent = 'Your day is complete';
    }
  }

  /**
   * Update button states based on attendance status
   */
  updateButtonStates() {
    if (!this.todayAttendance || !this.todayAttendance.markInTime) {
      // Can mark in
      this.elements.markInBtn.disabled = false;
      this.elements.markOutBtn.disabled = true;
    } else if (this.todayAttendance.markInTime && !this.todayAttendance.markOutTime) {
      // Can mark out
      this.elements.markInBtn.disabled = true;
      this.elements.markOutBtn.disabled = false;
    } else {
      // Already marked out
      this.elements.markInBtn.disabled = true;
      this.elements.markOutBtn.disabled = true;
    }
  }

  /**
   * Update today's summary display
   */
  updateTodaySummary() {
    if (!this.todayAttendance) {
      this.elements.markInTime.textContent = '--:--';
      this.elements.markOutTime.textContent = '--:--';
      this.elements.hoursWorked.textContent = '0.00 hrs';
      return;
    }

    // Mark in time
    if (this.todayAttendance.markInTime) {
      this.elements.markInTime.textContent = formatTime(this.todayAttendance.markInTime);
    } else {
      this.elements.markInTime.textContent = '--:--';
    }

    // Mark out time
    if (this.todayAttendance.markOutTime) {
      this.elements.markOutTime.textContent = formatTime(this.todayAttendance.markOutTime);
    } else {
      this.elements.markOutTime.textContent = '--:--';
    }

    // Hours worked
    if (this.todayAttendance.hoursWorked !== null) {
      this.elements.hoursWorked.textContent = `${this.todayAttendance.hoursWorked.toFixed(2)} hrs`;
    } else {
      this.elements.hoursWorked.textContent = '0.00 hrs';
    }
  }

  /**
   * Handle mark in action
   */
  async handleMarkIn() {
    this.showLoading();
    try {
      const result = await attendanceService.markIn(this.currentUser.id);
      
      if (result.success) {
        this.showToast('Marked in successfully', 'success');
        await this.loadTodayStatus();
        await this.loadAttendanceHistory();
      } else {
        this.showToast(result.error || 'Failed to mark in', 'error');
      }
    } catch (error) {
      console.error('Mark in error:', error);
      this.showToast('Failed to mark in. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle mark out action
   */
  async handleMarkOut() {
    this.showLoading();
    try {
      const result = await attendanceService.markOut(this.currentUser.id);
      
      if (result.success) {
        this.showToast('Marked out successfully', 'success');
        await this.loadTodayStatus();
        await this.loadAttendanceHistory();
      } else {
        this.showToast(result.error || 'Failed to mark out', 'error');
      }
    } catch (error) {
      console.error('Mark out error:', error);
      this.showToast('Failed to mark out. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Load attendance history
   */
  async loadAttendanceHistory() {
    try {
      // Get last 30 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const history = await attendanceService.getAttendanceHistory(
        this.currentUser.id,
        startDate,
        endDate
      );

      this.renderAttendanceHistory(history);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      this.showToast('Failed to load attendance history', 'error');
    }
  }

  /**
   * Render attendance history
   */
  renderAttendanceHistory(history) {
    if (!history || history.length === 0) {
      this.elements.emptyState.style.display = 'block';
      this.elements.historyList.innerHTML = '';
      this.elements.historyList.appendChild(this.elements.emptyState);
      return;
    }

    this.elements.emptyState.style.display = 'none';
    this.elements.historyList.innerHTML = '';

    history.forEach(record => {
      const item = this.createHistoryItem(record);
      this.elements.historyList.appendChild(item);
    });
  }

  /**
   * Create history item element
   */
  createHistoryItem(record) {
    const item = document.createElement('div');
    item.className = 'history-item';

    const statusBadge = this.createStatusBadge(record.status);
    
    item.innerHTML = `
      <div class="history-header">
        <span class="history-date">${formatDate(record.date)}</span>
        ${statusBadge}
      </div>
      <div class="history-details">
        <div class="detail-item">
          <span class="detail-label">Mark In</span>
          <span class="detail-value">${record.markInTime ? formatTime(record.markInTime) : '--:--'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Mark Out</span>
          <span class="detail-value">${record.markOutTime ? formatTime(record.markOutTime) : '--:--'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Hours Worked</span>
          <span class="detail-value">${record.hoursWorked !== null ? record.hoursWorked.toFixed(2) + ' hrs' : '--'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Location</span>
          <span class="detail-value">${record.markInLocation ? geolocationService.formatSimple(record.markInLocation.lat, record.markInLocation.lon) : 'N/A'}</span>
        </div>
      </div>
    `;

    return item;
  }

  /**
   * Load pending approvals
   */
  async loadPendingApprovals() {
    try {
      const pendingRecords = await attendanceService.getPendingApprovals(this.currentUser.id);
      
      // Update pending count
      this.elements.pendingCount.textContent = pendingRecords.length;
      
      this.renderPendingApprovals(pendingRecords);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      this.showToast('Failed to load pending approvals', 'error');
    }
  }

  /**
   * Render pending approvals
   */
  async renderPendingApprovals(records) {
    if (!records || records.length === 0) {
      this.elements.approvalEmptyState.style.display = 'block';
      this.elements.approvalList.innerHTML = '';
      this.elements.approvalList.appendChild(this.elements.approvalEmptyState);
      return;
    }

    this.elements.approvalEmptyState.style.display = 'none';
    this.elements.approvalList.innerHTML = '';

    for (const record of records) {
      const item = await this.createApprovalItem(record);
      this.elements.approvalList.appendChild(item);
    }
  }

  /**
   * Create approval item element
   */
  async createApprovalItem(record) {
    const item = document.createElement('div');
    item.className = 'approval-item';

    // Get user details
    const userDetails = await attendanceService.getUserDetails(record.userId);
    const userName = userDetails ? userDetails.username : 'Unknown User';
    const userEmail = userDetails ? userDetails.email : '';

    item.innerHTML = `
      <div class="approval-header">
        <div class="approval-user">
          <div class="approval-user-name">${userName}</div>
          <div class="approval-user-email">${userEmail}</div>
        </div>
      </div>
      <div class="approval-details">
        <div class="detail-item">
          <span class="detail-label">Date</span>
          <span class="detail-value">${formatDate(record.date)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Mark In</span>
          <span class="detail-value">${record.markInTime ? formatTime(record.markInTime) : '--:--'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Mark Out</span>
          <span class="detail-value">${record.markOutTime ? formatTime(record.markOutTime) : '--:--'}</span>
        </div>
      </div>
      <div class="approval-actions">
        <button class="btn btn-secondary btn-approve" data-id="${record.id}">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn btn-danger btn-reject" data-id="${record.id}">
          <i class="fas fa-times"></i> Reject
        </button>
      </div>
    `;

    // Add event listeners
    const approveBtn = item.querySelector('.btn-approve');
    const rejectBtn = item.querySelector('.btn-reject');

    approveBtn.addEventListener('click', () => this.handleApprove(record.id));
    rejectBtn.addEventListener('click', () => this.handleReject(record.id));

    return item;
  }

  /**
   * Handle approve action
   */
  async handleApprove(attendanceId) {
    this.showLoading();
    try {
      const result = await attendanceService.approveAttendance(attendanceId, this.currentUser.id);
      
      if (result.success) {
        this.showToast('Attendance approved successfully', 'success');
        await this.loadPendingApprovals();
      } else {
        this.showToast(result.error || 'Failed to approve attendance', 'error');
      }
    } catch (error) {
      console.error('Approve error:', error);
      this.showToast('Failed to approve attendance. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle reject action
   */
  handleReject(attendanceId) {
    this.pendingRejectionId = attendanceId;
    this.elements.rejectionReason.value = '';
    this.elements.rejectionModal.style.display = 'flex';
  }

  /**
   * Confirm rejection
   */
  async confirmReject() {
    const reason = this.elements.rejectionReason.value.trim();
    
    if (!reason) {
      this.showToast('Please provide a rejection reason', 'error');
      return;
    }

    this.closeRejectionModal();
    this.showLoading();

    try {
      const result = await attendanceService.rejectAttendance(
        this.pendingRejectionId,
        this.currentUser.id,
        reason
      );
      
      if (result.success) {
        this.showToast('Attendance rejected', 'success');
        await this.loadPendingApprovals();
      } else {
        this.showToast(result.error || 'Failed to reject attendance', 'error');
      }
    } catch (error) {
      console.error('Reject error:', error);
      this.showToast('Failed to reject attendance. Please try again.', 'error');
    } finally {
      this.hideLoading();
      this.pendingRejectionId = null;
    }
  }

  /**
   * Close rejection modal
   */
  closeRejectionModal() {
    this.elements.rejectionModal.style.display = 'none';
    this.elements.rejectionReason.value = '';
    this.pendingRejectionId = null;
  }

  /**
   * Create status badge
   */
  createStatusBadge(status) {
    const badgeClass = `badge status-${status}`;
    const badgeText = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="${badgeClass}">${badgeText}</span>`;
  }

  /**
   * Show loading overlay
   */
  showLoading() {
    this.elements.loadingOverlay.style.display = 'flex';
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    this.elements.loadingOverlay.style.display = 'none';
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
      this.elements.toast.className = 'toast';
      this.elements.toast.textContent = ''; // Clear content when hiding
    }, 3000);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const page = new AttendancePage();
  page.init();
});

export default AttendancePage;
