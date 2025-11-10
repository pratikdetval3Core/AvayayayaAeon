/**
 * Leave Service
 * Handles leave application submission, approval, and history management
 */
import Leave from '../models/Leave.js';
import { databaseService } from './database.js';
import authService from './auth.js';

class LeaveService {
  constructor() {
    this.storeName = databaseService.stores.LEAVE;
    // Default leave balance per year (in days)
    this.defaultLeaveBalance = {
      sick: 10,
      casual: 12,
      vacation: 15,
      personal: 5,
      emergency: 3,
      unpaid: 0 // Unlimited
    };
  }

  /**
   * Submit leave application with validation
   * @param {object} leaveData - Leave application data
   * @returns {Promise<object>} Result with success status and leave data
   */
  async submitLeaveApplication(leaveData) {
    try {
      // Get current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Create leave application
      const leave = new Leave({
        userId: currentUser.id,
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
        status: 'pending'
      });

      // Auto-calculate duration
      leave.setDuration();

      // Validate leave application
      const validation = leave.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check leave balance (except for unpaid leave)
      if (leave.leaveType !== 'unpaid') {
        const balance = await this.getLeaveBalance(currentUser.id);
        const availableBalance = balance[leave.leaveType] || 0;
        
        if (leave.duration > availableBalance) {
          return {
            success: false,
            error: `Insufficient ${leave.leaveType} leave balance. Available: ${availableBalance} days, Requested: ${leave.duration} days`
          };
        }
      }

      // Save to database
      await databaseService.add(this.storeName, leave.toJSON());

      return {
        success: true,
        message: 'Leave application submitted successfully',
        leave: leave.toJSON()
      };
    } catch (error) {
      console.error('Submit leave application error:', error);
      return {
        success: false,
        error: 'Failed to submit leave application. Please try again.'
      };
    }
  }

  /**
   * Get leave applications for user's leave history
   * @param {string} userId - User ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Array>} Array of leave applications
   */
  async getLeaveApplications(userId, status = null) {
    try {
      await databaseService.ensureDB();
      
      // Get all leave applications for user
      const allLeaves = await databaseService.getByIndex(
        this.storeName,
        'userId',
        userId
      );

      // Filter by status if provided
      let filteredLeaves = allLeaves;
      if (status) {
        filteredLeaves = allLeaves.filter(leave => leave.status === status);
      }

      // Sort by start date descending (most recent first)
      filteredLeaves.sort((a, b) => {
        if (a.startDate > b.startDate) return -1;
        if (a.startDate < b.startDate) return 1;
        return 0;
      });

      return filteredLeaves;
    } catch (error) {
      console.error('Get leave applications error:', error);
      return [];
    }
  }

  /**
   * Get pending leave approvals for managers
   * @param {string} managerId - Manager ID (optional, for logging)
   * @returns {Promise<Array>} Array of pending leave applications
   */
  async getPendingLeaveApprovals(managerId = null) {
    try {
      await databaseService.ensureDB();
      
      // Get all pending leave applications
      const pendingLeaves = await databaseService.getByIndex(
        this.storeName,
        'status',
        'pending'
      );

      // Sort by start date ascending (earliest first)
      pendingLeaves.sort((a, b) => {
        if (a.startDate < b.startDate) return -1;
        if (a.startDate > b.startDate) return 1;
        return 0;
      });

      return pendingLeaves;
    } catch (error) {
      console.error('Get pending leave approvals error:', error);
      return [];
    }
  }

  /**
   * Approve leave application
   * @param {string} leaveId - Leave application ID
   * @param {string} approverId - Approver ID
   * @returns {Promise<object>} Result with success status
   */
  async approveLeave(leaveId, approverId) {
    try {
      // Check if user has permission
      if (!authService.hasPermission('canApproveLeave')) {
        return {
          success: false,
          error: 'You do not have permission to approve leave'
        };
      }

      // Get leave application
      const leaveData = await databaseService.get(this.storeName, leaveId);
      
      if (!leaveData) {
        return {
          success: false,
          error: 'Leave application not found'
        };
      }

      // Update leave status
      const leave = Leave.fromJSON(leaveData);
      leave.approve(approverId);

      // Save to database
      await databaseService.update(this.storeName, leave.toJSON());

      return {
        success: true,
        message: 'Leave application approved successfully',
        leave: leave.toJSON()
      };
    } catch (error) {
      console.error('Approve leave error:', error);
      return {
        success: false,
        error: 'Failed to approve leave. Please try again.'
      };
    }
  }

  /**
   * Reject leave application
   * @param {string} leaveId - Leave application ID
   * @param {string} approverId - Approver ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<object>} Result with success status
   */
  async rejectLeave(leaveId, approverId, reason) {
    try {
      // Check if user has permission
      if (!authService.hasPermission('canApproveLeave')) {
        return {
          success: false,
          error: 'You do not have permission to reject leave'
        };
      }

      // Validate reason
      if (!reason || reason.trim() === '') {
        return {
          success: false,
          error: 'Rejection reason is required'
        };
      }

      // Get leave application
      const leaveData = await databaseService.get(this.storeName, leaveId);
      
      if (!leaveData) {
        return {
          success: false,
          error: 'Leave application not found'
        };
      }

      // Update leave status
      const leave = Leave.fromJSON(leaveData);
      leave.reject(approverId, reason);

      // Save to database
      await databaseService.update(this.storeName, leave.toJSON());

      return {
        success: true,
        message: 'Leave application rejected',
        leave: leave.toJSON()
      };
    } catch (error) {
      console.error('Reject leave error:', error);
      return {
        success: false,
        error: 'Failed to reject leave. Please try again.'
      };
    }
  }

  /**
   * Get leave balance calculation
   * @param {string} userId - User ID
   * @returns {Promise<object>} Leave balance by type
   */
  async getLeaveBalance(userId) {
    try {
      await databaseService.ensureDB();
      
      // Get current year's approved leaves
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      
      const allLeaves = await databaseService.getByIndex(
        this.storeName,
        'userId',
        userId
      );

      // Filter approved leaves for current year
      const approvedLeaves = allLeaves.filter(leave => {
        return leave.status === 'approved' && 
               leave.startDate >= yearStart && 
               leave.startDate <= yearEnd;
      });

      // Calculate used leave by type
      const usedLeave = {};
      approvedLeaves.forEach(leave => {
        const type = leave.leaveType;
        usedLeave[type] = (usedLeave[type] || 0) + leave.duration;
      });

      // Calculate remaining balance
      const balance = {};
      Object.keys(this.defaultLeaveBalance).forEach(type => {
        const total = this.defaultLeaveBalance[type];
        const used = usedLeave[type] || 0;
        balance[type] = Math.max(0, total - used);
      });

      return balance;
    } catch (error) {
      console.error('Get leave balance error:', error);
      return { ...this.defaultLeaveBalance };
    }
  }

  /**
   * Calculate leave duration utility
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {number} Number of days
   */
  calculateLeaveDuration(startDate, endDate) {
    if (!startDate || !endDate) {
      return 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    return diffDays;
  }

  /**
   * Get user details for a leave application
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} User data or null
   */
  async getUserDetails(userId) {
    try {
      const userData = await databaseService.get(databaseService.stores.USERS, userId);
      if (userData) {
        return {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role
        };
      }
      return null;
    } catch (error) {
      console.error('Get user details error:', error);
      return null;
    }
  }

  /**
   * Get leave type display name
   * @param {string} leaveType - Leave type
   * @returns {string} Formatted leave type
   */
  getLeaveTypeDisplayName(leaveType) {
    const displayNames = {
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      vacation: 'Vacation Leave',
      personal: 'Personal Leave',
      emergency: 'Emergency Leave',
      unpaid: 'Unpaid Leave'
    };
    return displayNames[leaveType] || leaveType;
  }

  /**
   * Get status badge class
   * @param {string} status - Leave status
   * @returns {string} CSS class name
   */
  getStatusBadgeClass(status) {
    const classes = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  }
}

// Export singleton instance
export const leaveService = new LeaveService();
export default leaveService;
