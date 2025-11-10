/**
 * Attendance Service
 * Handles attendance marking, approval, and history management
 */
import Attendance from '../models/Attendance.js';
import { databaseService } from './database.js';
import geolocationService from './geolocation.js';
import authService from './auth.js';

class AttendanceService {
  constructor() {
    this.storeName = databaseService.stores.ATTENDANCE;
  }

  /**
   * Mark in with geolocation capture
   * @param {string} userId - User ID
   * @returns {Promise<object>} Result with success status and attendance data
   */
  async markIn(userId) {
    try {
      // Check if user already marked in today
      const today = new Date().toISOString().split('T')[0];
      const existingAttendance = await this.getAttendanceStatus(userId, today);

      if (existingAttendance && existingAttendance.markInTime) {
        return {
          success: false,
          error: 'Already marked in for today'
        };
      }

      // Get current location
      let location = null;
      try {
        const position = await geolocationService.getCurrentPosition();
        location = {
          lat: position.lat,
          lon: position.lon
        };
      } catch (error) {
        console.warn('Failed to get location for mark in:', error);
        // Continue without location
      }

      // Create or update attendance record
      let attendance;
      if (existingAttendance) {
        attendance = Attendance.fromJSON(existingAttendance);
        attendance.markIn(location);
      } else {
        attendance = new Attendance({
          userId: userId,
          date: today
        });
        attendance.markIn(location);
      }

      // Validate attendance
      const validation = attendance.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Save to database
      if (existingAttendance) {
        await databaseService.update(this.storeName, attendance.toJSON());
      } else {
        await databaseService.add(this.storeName, attendance.toJSON());
      }

      return {
        success: true,
        message: 'Marked in successfully',
        attendance: attendance.toJSON()
      };
    } catch (error) {
      console.error('Mark in error:', error);
      return {
        success: false,
        error: 'Failed to mark in. Please try again.'
      };
    }
  }

  /**
   * Mark out with geolocation capture
   * @param {string} userId - User ID
   * @returns {Promise<object>} Result with success status and attendance data
   */
  async markOut(userId) {
    try {
      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const existingAttendance = await this.getAttendanceStatus(userId, today);

      if (!existingAttendance) {
        return {
          success: false,
          error: 'No mark in record found for today'
        };
      }

      if (!existingAttendance.markInTime) {
        return {
          success: false,
          error: 'Please mark in first'
        };
      }

      if (existingAttendance.markOutTime) {
        return {
          success: false,
          error: 'Already marked out for today'
        };
      }

      // Get current location
      let location = null;
      try {
        const position = await geolocationService.getCurrentPosition();
        location = {
          lat: position.lat,
          lon: position.lon
        };
      } catch (error) {
        console.warn('Failed to get location for mark out:', error);
        // Continue without location
      }

      // Update attendance record
      const attendance = Attendance.fromJSON(existingAttendance);
      attendance.markOut(location);

      // Validate attendance
      const validation = attendance.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Save to database
      await databaseService.update(this.storeName, attendance.toJSON());

      return {
        success: true,
        message: 'Marked out successfully',
        attendance: attendance.toJSON()
      };
    } catch (error) {
      console.error('Mark out error:', error);
      return {
        success: false,
        error: 'Failed to mark out. Please try again.'
      };
    }
  }

  /**
   * Get attendance status for a specific date
   * @param {string} userId - User ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<object|null>} Attendance record or null
   */
  async getAttendanceStatus(userId, date) {
    try {
      await databaseService.ensureDB();
      
      // Query by userId_date composite index
      const records = await databaseService.getByIndex(
        this.storeName,
        'userId_date',
        [userId, date]
      );

      return records && records.length > 0 ? records[0] : null;
    } catch (error) {
      console.error('Get attendance status error:', error);
      return null;
    }
  }

  /**
   * Get attendance history with date range filtering
   * @param {string} userId - User ID
   * @param {string} startDate - Start date in YYYY-MM-DD format (optional)
   * @param {string} endDate - End date in YYYY-MM-DD format (optional)
   * @returns {Promise<Array>} Array of attendance records
   */
  async getAttendanceHistory(userId, startDate = null, endDate = null) {
    try {
      await databaseService.ensureDB();
      
      // Get all attendance records for user
      const allRecords = await databaseService.getByIndex(
        this.storeName,
        'userId',
        userId
      );

      // Filter by date range if provided
      let filteredRecords = allRecords;
      
      if (startDate || endDate) {
        filteredRecords = allRecords.filter(record => {
          const recordDate = record.date;
          
          if (startDate && recordDate < startDate) {
            return false;
          }
          
          if (endDate && recordDate > endDate) {
            return false;
          }
          
          return true;
        });
      }

      // Sort by date descending (most recent first)
      filteredRecords.sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return 0;
      });

      return filteredRecords;
    } catch (error) {
      console.error('Get attendance history error:', error);
      return [];
    }
  }

  /**
   * Calculate hours worked between mark in and mark out times
   * @param {number} markInTime - Mark in timestamp
   * @param {number} markOutTime - Mark out timestamp
   * @returns {number|null} Hours worked or null if invalid
   */
  calculateHoursWorked(markInTime, markOutTime) {
    if (!markInTime || !markOutTime) {
      return null;
    }

    if (markOutTime <= markInTime) {
      return null;
    }

    const diffMs = markOutTime - markInTime;
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get pending attendance approvals for managers
   * @param {string} managerId - Manager ID (optional, for logging)
   * @returns {Promise<Array>} Array of pending attendance records
   */
  async getPendingApprovals(managerId = null) {
    try {
      await databaseService.ensureDB();
      
      // Get all pending attendance records
      const pendingRecords = await databaseService.getByIndex(
        this.storeName,
        'status',
        'pending'
      );

      // Sort by date descending (most recent first)
      pendingRecords.sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return 0;
      });

      return pendingRecords;
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return [];
    }
  }

  /**
   * Approve attendance record
   * @param {string} attendanceId - Attendance record ID
   * @param {string} managerId - Manager ID
   * @returns {Promise<object>} Result with success status
   */
  async approveAttendance(attendanceId, managerId) {
    try {
      // Check if manager has permission
      if (!authService.hasPermission('canApproveAttendance')) {
        return {
          success: false,
          error: 'You do not have permission to approve attendance'
        };
      }

      // Get attendance record
      const attendanceData = await databaseService.get(this.storeName, attendanceId);
      
      if (!attendanceData) {
        return {
          success: false,
          error: 'Attendance record not found'
        };
      }

      // Update attendance status
      const attendance = Attendance.fromJSON(attendanceData);
      attendance.approve(managerId);

      // Save to database
      await databaseService.update(this.storeName, attendance.toJSON());

      return {
        success: true,
        message: 'Attendance approved successfully',
        attendance: attendance.toJSON()
      };
    } catch (error) {
      console.error('Approve attendance error:', error);
      return {
        success: false,
        error: 'Failed to approve attendance. Please try again.'
      };
    }
  }

  /**
   * Reject attendance record
   * @param {string} attendanceId - Attendance record ID
   * @param {string} managerId - Manager ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<object>} Result with success status
   */
  async rejectAttendance(attendanceId, managerId, reason) {
    try {
      // Check if manager has permission
      if (!authService.hasPermission('canApproveAttendance')) {
        return {
          success: false,
          error: 'You do not have permission to reject attendance'
        };
      }

      // Validate reason
      if (!reason || reason.trim() === '') {
        return {
          success: false,
          error: 'Rejection reason is required'
        };
      }

      // Get attendance record
      const attendanceData = await databaseService.get(this.storeName, attendanceId);
      
      if (!attendanceData) {
        return {
          success: false,
          error: 'Attendance record not found'
        };
      }

      // Update attendance status
      const attendance = Attendance.fromJSON(attendanceData);
      attendance.reject(managerId, reason);

      // Save to database
      await databaseService.update(this.storeName, attendance.toJSON());

      return {
        success: true,
        message: 'Attendance rejected',
        attendance: attendance.toJSON()
      };
    } catch (error) {
      console.error('Reject attendance error:', error);
      return {
        success: false,
        error: 'Failed to reject attendance. Please try again.'
      };
    }
  }

  /**
   * Get user details for an attendance record
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
}

// Export singleton instance
export const attendanceService = new AttendanceService();
export default attendanceService;
