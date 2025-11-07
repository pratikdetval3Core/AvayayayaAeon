/**
 * Report Service
 * Handles report generation, data aggregation, and export functionality
 */
import { databaseService } from './database.js';
import authService from './auth.js';
import attendanceService from './attendance.js';
import leaveService from './leave.js';
import kpiService from './kpi.js';

class ReportService {
  constructor() {
    this.attendanceStore = databaseService.stores.ATTENDANCE;
    this.leaveStore = databaseService.stores.LEAVE;
    this.kpiStore = databaseService.stores.KPIS;
    this.userStore = databaseService.stores.USERS;
  }

  /**
   * Generate attendance report with date range filtering
   * @param {string} userId - User ID (null for all users if admin)
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<object>} Attendance report data
   */
  async generateAttendanceReport(userId, startDate, endDate) {
    try {
      await databaseService.ensureDB();

      let attendanceRecords = [];

      // Get attendance records based on user role
      if (userId) {
        // Get records for specific user
        attendanceRecords = await attendanceService.getAttendanceHistory(userId, startDate, endDate);
      } else {
        // Admin: Get all attendance records
        const allRecords = await databaseService.getAll(this.attendanceStore);
        
        // Filter by date range
        attendanceRecords = allRecords.filter(record => {
          const recordDate = record.date;
          return recordDate >= startDate && recordDate <= endDate;
        });
      }

      // Calculate statistics
      const stats = {
        totalDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter(r => r.markInTime && r.markOutTime).length,
        pendingApprovals: attendanceRecords.filter(r => r.status === 'pending').length,
        approvedDays: attendanceRecords.filter(r => r.status === 'approved').length,
        rejectedDays: attendanceRecords.filter(r => r.status === 'rejected').length,
        totalHoursWorked: 0,
        averageHoursPerDay: 0
      };

      // Calculate total hours worked
      attendanceRecords.forEach(record => {
        if (record.hoursWorked) {
          stats.totalHoursWorked += record.hoursWorked;
        }
      });

      // Calculate average hours per day
      if (stats.presentDays > 0) {
        stats.averageHoursPerDay = Math.round((stats.totalHoursWorked / stats.presentDays) * 100) / 100;
      }

      // Get user details for records
      const recordsWithUserDetails = await this._enrichWithUserDetails(attendanceRecords);

      return {
        type: 'attendance',
        startDate,
        endDate,
        userId,
        stats,
        records: recordsWithUserDetails,
        generatedAt: Date.now()
      };
    } catch (error) {
      console.error('Generate attendance report error:', error);
      throw new Error('Failed to generate attendance report');
    }
  }

  /**
   * Generate leave report
   * @param {string} userId - User ID (null for all users if admin)
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<object>} Leave report data
   */
  async generateLeaveReport(userId, startDate, endDate) {
    try {
      await databaseService.ensureDB();

      let leaveRecords = [];

      // Get leave records based on user role
      if (userId) {
        // Get records for specific user
        const allLeaves = await leaveService.getLeaveApplications(userId);
        leaveRecords = allLeaves.filter(leave => {
          return leave.startDate >= startDate && leave.startDate <= endDate;
        });
      } else {
        // Admin: Get all leave records
        const allRecords = await databaseService.getAll(this.leaveStore);
        
        // Filter by date range
        leaveRecords = allRecords.filter(record => {
          return record.startDate >= startDate && record.startDate <= endDate;
        });
      }

      // Calculate statistics
      const stats = {
        totalApplications: leaveRecords.length,
        pendingApplications: leaveRecords.filter(r => r.status === 'pending').length,
        approvedApplications: leaveRecords.filter(r => r.status === 'approved').length,
        rejectedApplications: leaveRecords.filter(r => r.status === 'rejected').length,
        totalDaysRequested: 0,
        totalDaysApproved: 0,
        leaveByType: {}
      };

      // Calculate leave days and breakdown by type
      leaveRecords.forEach(record => {
        stats.totalDaysRequested += record.duration || 0;
        
        if (record.status === 'approved') {
          stats.totalDaysApproved += record.duration || 0;
        }

        // Count by leave type
        const type = record.leaveType;
        if (!stats.leaveByType[type]) {
          stats.leaveByType[type] = {
            count: 0,
            days: 0,
            approved: 0
          };
        }
        stats.leaveByType[type].count++;
        stats.leaveByType[type].days += record.duration || 0;
        if (record.status === 'approved') {
          stats.leaveByType[type].approved += record.duration || 0;
        }
      });

      // Get leave balance if single user
      let leaveBalance = null;
      if (userId) {
        leaveBalance = await leaveService.getLeaveBalance(userId);
      }

      // Get user details for records
      const recordsWithUserDetails = await this._enrichWithUserDetails(leaveRecords);

      return {
        type: 'leave',
        startDate,
        endDate,
        userId,
        stats,
        leaveBalance,
        records: recordsWithUserDetails,
        generatedAt: Date.now()
      };
    } catch (error) {
      console.error('Generate leave report error:', error);
      throw new Error('Failed to generate leave report');
    }
  }

  /**
   * Generate KPI report
   * @param {string} userId - User ID (null for all users if admin)
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<object>} KPI report data
   */
  async generateKPIReport(userId, startDate, endDate) {
    try {
      await databaseService.ensureDB();

      let kpiRecords = [];

      // Convert dates to timestamps for comparison
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate + 'T23:59:59').getTime();

      // Get KPI records based on user role
      if (userId) {
        // Get records for specific user
        const allKPIs = await kpiService.getKPIs(userId);
        kpiRecords = allKPIs.filter(kpi => {
          return kpi.createdAt >= startTime && kpi.createdAt <= endTime;
        }).map(kpi => kpi.toJSON());
      } else {
        // Admin: Get all KPI records
        const allRecords = await databaseService.getAll(this.kpiStore);
        
        // Filter by date range
        kpiRecords = allRecords.filter(record => {
          return record.createdAt >= startTime && record.createdAt <= endTime;
        });
      }

      // Calculate statistics
      const stats = {
        totalKPIs: kpiRecords.length,
        pendingKPIs: kpiRecords.filter(r => r.status === 'pending').length,
        inProgressKPIs: kpiRecords.filter(r => r.status === 'in_progress').length,
        completedKPIs: kpiRecords.filter(r => r.status === 'completed').length,
        withImages: kpiRecords.filter(r => r.image).length,
        withLocation: kpiRecords.filter(r => r.locationEnabled && r.location).length
      };

      // Get user details for records
      const recordsWithUserDetails = await this._enrichWithUserDetails(kpiRecords);

      return {
        type: 'kpi',
        startDate,
        endDate,
        userId,
        stats,
        records: recordsWithUserDetails,
        generatedAt: Date.now()
      };
    } catch (error) {
      console.error('Generate KPI report error:', error);
      throw new Error('Failed to generate KPI report');
    }
  }

  /**
   * Export report to CSV or PDF format
   * @param {object} reportData - Report data to export
   * @param {string} format - Export format ('csv' or 'pdf')
   * @returns {Promise<string>} Download URL or data
   */
  async exportReport(reportData, format = 'csv') {
    try {
      if (format === 'csv') {
        return this._exportToCSV(reportData);
      } else if (format === 'pdf') {
        return this._exportToPDF(reportData);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export report error:', error);
      throw new Error('Failed to export report');
    }
  }

  /**
   * Get report summary for dashboard widgets
   * @param {string} userId - User ID
   * @param {string} reportType - Type of report ('attendance', 'leave', 'kpi')
   * @returns {Promise<object>} Summary data
   */
  async getReportSummary(userId, reportType) {
    try {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
      const startDate = `${currentMonth}-01`;
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString().split('T')[0];

      let summary = {};

      switch (reportType) {
        case 'attendance':
          const attendanceReport = await this.generateAttendanceReport(userId, startDate, endDate);
          summary = {
            type: 'attendance',
            period: 'This Month',
            presentDays: attendanceReport.stats.presentDays,
            totalHours: attendanceReport.stats.totalHoursWorked,
            averageHours: attendanceReport.stats.averageHoursPerDay,
            pendingApprovals: attendanceReport.stats.pendingApprovals
          };
          break;

        case 'leave':
          const leaveReport = await this.generateLeaveReport(userId, startDate, endDate);
          summary = {
            type: 'leave',
            period: 'This Month',
            totalApplications: leaveReport.stats.totalApplications,
            approvedDays: leaveReport.stats.totalDaysApproved,
            pendingApplications: leaveReport.stats.pendingApplications,
            leaveBalance: leaveReport.leaveBalance
          };
          break;

        case 'kpi':
          const kpiReport = await this.generateKPIReport(userId, startDate, endDate);
          summary = {
            type: 'kpi',
            period: 'This Month',
            totalKPIs: kpiReport.stats.totalKPIs,
            completedKPIs: kpiReport.stats.completedKPIs,
            inProgressKPIs: kpiReport.stats.inProgressKPIs,
            pendingKPIs: kpiReport.stats.pendingKPIs
          };
          break;

        default:
          throw new Error('Invalid report type');
      }

      return summary;
    } catch (error) {
      console.error('Get report summary error:', error);
      throw new Error('Failed to get report summary');
    }
  }

  /**
   * Enrich records with user details
   * @private
   * @param {Array} records - Array of records
   * @returns {Promise<Array>} Records with user details
   */
  async _enrichWithUserDetails(records) {
    const enrichedRecords = [];

    for (const record of records) {
      const userData = await databaseService.get(this.userStore, record.userId);
      enrichedRecords.push({
        ...record,
        userDetails: userData ? {
          username: userData.username,
          email: userData.email,
          role: userData.role
        } : null
      });
    }

    return enrichedRecords;
  }

  /**
   * Export report to CSV format
   * @private
   * @param {object} reportData - Report data
   * @returns {string} CSV data as blob URL
   */
  _exportToCSV(reportData) {
    let csvContent = '';
    const { type, records, startDate, endDate } = reportData;

    // Add header
    csvContent += `Report Type: ${type.toUpperCase()}\n`;
    csvContent += `Period: ${startDate} to ${endDate}\n`;
    csvContent += `Generated: ${new Date(reportData.generatedAt).toLocaleString()}\n\n`;

    // Add column headers and data based on report type
    if (type === 'attendance') {
      csvContent += 'Date,User,Email,Mark In,Mark Out,Hours Worked,Status\n';
      records.forEach(record => {
        const markIn = record.markInTime ? new Date(record.markInTime).toLocaleString() : '-';
        const markOut = record.markOutTime ? new Date(record.markOutTime).toLocaleString() : '-';
        const hours = record.hoursWorked || '-';
        const user = record.userDetails?.username || 'Unknown';
        const email = record.userDetails?.email || '-';
        
        csvContent += `${record.date},${user},${email},${markIn},${markOut},${hours},${record.status}\n`;
      });
    } else if (type === 'leave') {
      csvContent += 'User,Email,Leave Type,Start Date,End Date,Duration,Reason,Status\n';
      records.forEach(record => {
        const user = record.userDetails?.username || 'Unknown';
        const email = record.userDetails?.email || '-';
        const reason = (record.reason || '').replace(/,/g, ';'); // Escape commas
        
        csvContent += `${user},${email},${record.leaveType},${record.startDate},${record.endDate},${record.duration},${reason},${record.status}\n`;
      });
    } else if (type === 'kpi') {
      csvContent += 'User,Email,Title,Description,Value,Status,Has Image,Has Location,Created At\n';
      records.forEach(record => {
        const user = record.userDetails?.username || 'Unknown';
        const email = record.userDetails?.email || '-';
        const title = (record.title || '').replace(/,/g, ';');
        const description = (record.description || '').replace(/,/g, ';');
        const value = (record.value || '').replace(/,/g, ';');
        const hasImage = record.image ? 'Yes' : 'No';
        const hasLocation = record.locationEnabled && record.location ? 'Yes' : 'No';
        const createdAt = new Date(record.createdAt).toLocaleString();
        
        csvContent += `${user},${email},${title},${description},${value},${record.status},${hasImage},${hasLocation},${createdAt}\n`;
      });
    }

    // Create blob and download URL
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  /**
   * Export report to PDF format (simplified version)
   * @private
   * @param {object} reportData - Report data
   * @returns {string} PDF data as blob URL
   */
  _exportToPDF(reportData) {
    // For a basic implementation, we'll create an HTML representation
    // In a production app, you'd use a library like jsPDF
    
    const { type, records, startDate, endDate, stats } = reportData;
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${type.toUpperCase()} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563eb; }
          .header { margin-bottom: 20px; }
          .stats { background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2563eb; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${type.toUpperCase()} Report</h1>
          <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Generated:</strong> ${new Date(reportData.generatedAt).toLocaleString()}</p>
        </div>
        
        <div class="stats">
          <h2>Summary Statistics</h2>
          ${this._formatStatsHTML(stats, type)}
        </div>
        
        ${this._formatRecordsHTML(records, type)}
      </body>
      </html>
    `;

    // Create blob and download URL
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  /**
   * Format statistics as HTML
   * @private
   */
  _formatStatsHTML(stats, type) {
    let html = '<ul>';
    
    for (const [key, value] of Object.entries(stats)) {
      if (typeof value === 'object') {
        html += `<li><strong>${this._formatLabel(key)}:</strong><ul>`;
        for (const [subKey, subValue] of Object.entries(value)) {
          html += `<li>${this._formatLabel(subKey)}: ${subValue}</li>`;
        }
        html += '</ul></li>';
      } else {
        html += `<li><strong>${this._formatLabel(key)}:</strong> ${value}</li>`;
      }
    }
    
    html += '</ul>';
    return html;
  }

  /**
   * Format records as HTML table
   * @private
   */
  _formatRecordsHTML(records, type) {
    if (records.length === 0) {
      return '<p>No records found for this period.</p>';
    }

    let html = '<table><thead><tr>';
    
    // Add headers based on type
    if (type === 'attendance') {
      html += '<th>Date</th><th>User</th><th>Mark In</th><th>Mark Out</th><th>Hours</th><th>Status</th>';
    } else if (type === 'leave') {
      html += '<th>User</th><th>Type</th><th>Start Date</th><th>End Date</th><th>Duration</th><th>Status</th>';
    } else if (type === 'kpi') {
      html += '<th>User</th><th>Title</th><th>Value</th><th>Status</th><th>Created</th>';
    }
    
    html += '</tr></thead><tbody>';
    
    // Add rows
    records.forEach(record => {
      html += '<tr>';
      
      if (type === 'attendance') {
        const markIn = record.markInTime ? new Date(record.markInTime).toLocaleString() : '-';
        const markOut = record.markOutTime ? new Date(record.markOutTime).toLocaleString() : '-';
        html += `<td>${record.date}</td>`;
        html += `<td>${record.userDetails?.username || 'Unknown'}</td>`;
        html += `<td>${markIn}</td>`;
        html += `<td>${markOut}</td>`;
        html += `<td>${record.hoursWorked || '-'}</td>`;
        html += `<td>${record.status}</td>`;
      } else if (type === 'leave') {
        html += `<td>${record.userDetails?.username || 'Unknown'}</td>`;
        html += `<td>${record.leaveType}</td>`;
        html += `<td>${record.startDate}</td>`;
        html += `<td>${record.endDate}</td>`;
        html += `<td>${record.duration} days</td>`;
        html += `<td>${record.status}</td>`;
      } else if (type === 'kpi') {
        html += `<td>${record.userDetails?.username || 'Unknown'}</td>`;
        html += `<td>${record.title}</td>`;
        html += `<td>${record.value}</td>`;
        html += `<td>${record.status}</td>`;
        html += `<td>${new Date(record.createdAt).toLocaleDateString()}</td>`;
      }
      
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
  }

  /**
   * Format label for display
   * @private
   */
  _formatLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

// Export singleton instance
export const reportService = new ReportService();
export default reportService;
