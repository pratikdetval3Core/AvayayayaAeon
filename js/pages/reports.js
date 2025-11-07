/**
 * Reports Page
 * Handles report generation, display, and export
 */
import authService from '../services/auth.js';
import reportService from '../services/reports.js';
import { databaseService } from '../services/database.js';
import BottomNavigation from '../components/BottomNavigation.js';

class ReportsPage {
  constructor() {
    this.currentUser = null;
    this.currentReport = null;
    this.isAdmin = false;
    
    this.elements = {
      reportForm: document.getElementById('reportForm'),
      reportType: document.getElementById('reportType'),
      startDate: document.getElementById('startDate'),
      endDate: document.getElementById('endDate'),
      userFilter: document.getElementById('userFilter'),
      userFilterGroup: document.getElementById('userFilterGroup'),
      generateBtn: document.getElementById('generateBtn'),
      exportBtn: document.getElementById('exportBtn'),
      reportDisplay: document.getElementById('reportDisplay'),
      reportTitle: document.getElementById('reportTitle'),
      reportMeta: document.getElementById('reportMeta'),
      reportStats: document.getElementById('reportStats'),
      reportChart: document.getElementById('reportChart'),
      reportTable: document.getElementById('reportTable'),
      reportTableHead: document.getElementById('reportTableHead'),
      reportTableBody: document.getElementById('reportTableBody'),
      emptyState: document.getElementById('emptyState'),
      loadingState: document.getElementById('loadingState')
    };
  }

  async init() {
    try {
      // Check authentication
      if (!authService.isAuthenticated()) {
        window.location.href = '/pages/login.html';
        return;
      }

      this.currentUser = authService.getCurrentUser();
      this.isAdmin = authService.hasPermission('canViewAllReports');

      // Initialize UI
      this.setupEventListeners();
      this.setDefaultDates();
      await this.loadUserFilter();
      this.renderBottomNav();

      console.log('Reports page initialized');
    } catch (error) {
      console.error('Failed to initialize reports page:', error);
      this.showError('Failed to load reports page');
    }
  }

  setupEventListeners() {
    // Form submission
    this.elements.reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.generateReport();
    });

    // Export button
    this.elements.exportBtn.addEventListener('click', () => {
      this.exportReport();
    });
  }

  setDefaultDates() {
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.elements.startDate.value = firstDay.toISOString().split('T')[0];
    this.elements.endDate.value = lastDay.toISOString().split('T')[0];

    // Set max date to today
    this.elements.endDate.max = today.toISOString().split('T')[0];
  }

  async loadUserFilter() {
    // Show user filter only for admins
    if (this.isAdmin) {
      this.elements.userFilterGroup.style.display = 'block';

      try {
        // Load all users
        const users = await databaseService.getAll(databaseService.stores.USERS);
        
        // Clear existing options (except "All Users")
        this.elements.userFilter.innerHTML = '<option value="">All Users</option>';
        
        // Add user options
        users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = `${user.username} (${user.email})`;
          this.elements.userFilter.appendChild(option);
        });
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    } else {
      this.elements.userFilterGroup.style.display = 'none';
    }
  }

  async generateReport() {
    try {
      // Get form values
      const reportType = this.elements.reportType.value;
      const startDate = this.elements.startDate.value;
      const endDate = this.elements.endDate.value;
      const selectedUserId = this.elements.userFilter.value;

      // Validate inputs
      if (!reportType || !startDate || !endDate) {
        this.showError('Please fill in all required fields');
        return;
      }

      if (startDate > endDate) {
        this.showError('Start date must be before end date');
        return;
      }

      // Show loading state
      this.showLoading(true);
      this.elements.reportDisplay.style.display = 'none';

      // Determine user ID for report (role-based filtering)
      let userId = null;
      if (this.isAdmin && selectedUserId) {
        // Admin selected a specific user
        userId = selectedUserId;
      } else if (!this.isAdmin) {
        // Employee can only see their own reports
        userId = this.currentUser.id;
      }
      // If admin and no user selected, userId remains null (all users)

      // Generate report based on type
      let reportData;
      switch (reportType) {
        case 'attendance':
          reportData = await reportService.generateAttendanceReport(userId, startDate, endDate);
          break;
        case 'leave':
          reportData = await reportService.generateLeaveReport(userId, startDate, endDate);
          break;
        case 'kpi':
          reportData = await reportService.generateKPIReport(userId, startDate, endDate);
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Store current report
      this.currentReport = reportData;

      // Display report
      this.displayReport(reportData);

      // Hide loading state
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
      this.showError('Failed to generate report. Please try again.');
      this.showLoading(false);
    }
  }

  displayReport(reportData) {
    const { type, startDate, endDate, stats, records } = reportData;

    // Show report display
    this.elements.reportDisplay.style.display = 'block';

    // Update report header
    this.elements.reportTitle.textContent = `${this.formatReportType(type)} Report`;
    this.elements.reportMeta.textContent = `Period: ${this.formatDate(startDate)} to ${this.formatDate(endDate)} | Generated: ${new Date(reportData.generatedAt).toLocaleString()}`;

    // Display statistics
    this.displayStats(stats, type);

    // Display chart (simplified version)
    this.displayChart(stats, type);

    // Display data table
    if (records && records.length > 0) {
      this.displayTable(records, type);
      this.elements.emptyState.style.display = 'none';
    } else {
      this.elements.reportTable.style.display = 'none';
      this.elements.emptyState.style.display = 'block';
    }
  }

  displayStats(stats, type) {
    this.elements.reportStats.innerHTML = '';

    // Create stat cards based on report type
    const statCards = this.getStatCards(stats, type);

    statCards.forEach(stat => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <div class="stat-label">${stat.label}</div>
        <div class="stat-value">${stat.value}</div>
        ${stat.subtext ? `<div class="stat-subtext">${stat.subtext}</div>` : ''}
      `;
      this.elements.reportStats.appendChild(card);
    });
  }

  getStatCards(stats, type) {
    const cards = [];

    if (type === 'attendance') {
      cards.push(
        { label: 'Total Days', value: stats.totalDays },
        { label: 'Present Days', value: stats.presentDays },
        { label: 'Total Hours', value: stats.totalHoursWorked.toFixed(2) },
        { label: 'Avg Hours/Day', value: stats.averageHoursPerDay.toFixed(2) },
        { label: 'Approved', value: stats.approvedDays, subtext: 'days' },
        { label: 'Pending', value: stats.pendingApprovals, subtext: 'approvals' }
      );
    } else if (type === 'leave') {
      cards.push(
        { label: 'Total Applications', value: stats.totalApplications },
        { label: 'Days Requested', value: stats.totalDaysRequested },
        { label: 'Days Approved', value: stats.totalDaysApproved },
        { label: 'Approved', value: stats.approvedApplications, subtext: 'applications' },
        { label: 'Pending', value: stats.pendingApplications, subtext: 'applications' },
        { label: 'Rejected', value: stats.rejectedApplications, subtext: 'applications' }
      );
    } else if (type === 'kpi') {
      cards.push(
        { label: 'Total KPIs', value: stats.totalKPIs },
        { label: 'Completed', value: stats.completedKPIs },
        { label: 'In Progress', value: stats.inProgressKPIs },
        { label: 'Pending', value: stats.pendingKPIs },
        { label: 'With Images', value: stats.withImages },
        { label: 'With Location', value: stats.withLocation }
      );
    }

    return cards;
  }

  displayChart(stats, type) {
    // For now, hide chart - in production, you'd use Chart.js or similar
    this.elements.reportChart.style.display = 'none';
    
    // TODO: Implement chart rendering with a library like Chart.js
    // Example: Create pie chart for status distribution
  }

  displayTable(records, type) {
    this.elements.reportTable.style.display = 'table';

    // Clear existing content
    this.elements.reportTableHead.innerHTML = '';
    this.elements.reportTableBody.innerHTML = '';

    // Create table headers based on type
    const headers = this.getTableHeaders(type);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    this.elements.reportTableHead.appendChild(headerRow);

    // Create table rows
    records.forEach(record => {
      const row = this.createTableRow(record, type);
      this.elements.reportTableBody.appendChild(row);
    });
  }

  getTableHeaders(type) {
    if (type === 'attendance') {
      return this.isAdmin 
        ? ['Date', 'User', 'Mark In', 'Mark Out', 'Hours', 'Status']
        : ['Date', 'Mark In', 'Mark Out', 'Hours', 'Status'];
    } else if (type === 'leave') {
      return this.isAdmin
        ? ['User', 'Type', 'Start Date', 'End Date', 'Duration', 'Status']
        : ['Type', 'Start Date', 'End Date', 'Duration', 'Status'];
    } else if (type === 'kpi') {
      return this.isAdmin
        ? ['User', 'Title', 'Value', 'Status', 'Image', 'Location', 'Created']
        : ['Title', 'Value', 'Status', 'Image', 'Location', 'Created'];
    }
    return [];
  }

  createTableRow(record, type) {
    const row = document.createElement('tr');

    if (type === 'attendance') {
      if (this.isAdmin) {
        row.innerHTML = `
          <td>${record.date}</td>
          <td>${record.userDetails?.username || 'Unknown'}</td>
          <td>${record.markInTime ? this.formatTime(record.markInTime) : '-'}</td>
          <td>${record.markOutTime ? this.formatTime(record.markOutTime) : '-'}</td>
          <td>${record.hoursWorked ? record.hoursWorked.toFixed(2) : '-'}</td>
          <td><span class="badge ${this.getStatusBadgeClass(record.status)}">${record.status}</span></td>
        `;
      } else {
        row.innerHTML = `
          <td>${record.date}</td>
          <td>${record.markInTime ? this.formatTime(record.markInTime) : '-'}</td>
          <td>${record.markOutTime ? this.formatTime(record.markOutTime) : '-'}</td>
          <td>${record.hoursWorked ? record.hoursWorked.toFixed(2) : '-'}</td>
          <td><span class="badge ${this.getStatusBadgeClass(record.status)}">${record.status}</span></td>
        `;
      }
    } else if (type === 'leave') {
      if (this.isAdmin) {
        row.innerHTML = `
          <td>${record.userDetails?.username || 'Unknown'}</td>
          <td>${this.formatLeaveType(record.leaveType)}</td>
          <td>${record.startDate}</td>
          <td>${record.endDate}</td>
          <td>${record.duration} days</td>
          <td><span class="badge ${this.getStatusBadgeClass(record.status)}">${record.status}</span></td>
        `;
      } else {
        row.innerHTML = `
          <td>${this.formatLeaveType(record.leaveType)}</td>
          <td>${record.startDate}</td>
          <td>${record.endDate}</td>
          <td>${record.duration} days</td>
          <td><span class="badge ${this.getStatusBadgeClass(record.status)}">${record.status}</span></td>
        `;
      }
    } else if (type === 'kpi') {
      const hasImage = record.image ? 'Yes' : 'No';
      const hasLocation = record.locationEnabled && record.location ? 'Yes' : 'No';
      const createdDate = new Date(record.createdAt).toLocaleDateString();

      if (this.isAdmin) {
        row.innerHTML = `
          <td>${record.userDetails?.username || 'Unknown'}</td>
          <td>${record.title}</td>
          <td>${record.value}</td>
          <td><span class="badge ${this.getStatusBadgeClass(record.status)}">${record.status}</span></td>
          <td>${hasImage}</td>
          <td>${hasLocation}</td>
          <td>${createdDate}</td>
        `;
      } else {
        row.innerHTML = `
          <td>${record.title}</td>
          <td>${record.value}</td>
          <td><span class="badge ${this.getStatusBadgeClass(record.status)}">${record.status}</span></td>
          <td>${hasImage}</td>
          <td>${hasLocation}</td>
          <td>${createdDate}</td>
        `;
      }
    }

    return row;
  }

  async exportReport() {
    if (!this.currentReport) {
      this.showError('No report to export');
      return;
    }

    try {
      // Export as CSV
      const csvUrl = await reportService.exportReport(this.currentReport, 'csv');
      
      // Create download link
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = `${this.currentReport.type}_report_${this.currentReport.startDate}_to_${this.currentReport.endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(csvUrl), 100);

      this.showSuccess('Report exported successfully');
    } catch (error) {
      console.error('Failed to export report:', error);
      this.showError('Failed to export report');
    }
  }

  showLoading(show) {
    this.elements.loadingState.style.display = show ? 'flex' : 'none';
    this.elements.generateBtn.disabled = show;
    
    if (show) {
      this.elements.generateBtn.querySelector('.btn-text').style.display = 'none';
      this.elements.generateBtn.querySelector('.btn-loader').style.display = 'inline';
    } else {
      this.elements.generateBtn.querySelector('.btn-text').style.display = 'inline';
      this.elements.generateBtn.querySelector('.btn-loader').style.display = 'none';
    }
  }

  showError(message) {
    alert(message); // In production, use a toast notification
  }

  showSuccess(message) {
    alert(message); // In production, use a toast notification
  }

  formatReportType(type) {
    const types = {
      attendance: 'Attendance',
      leave: 'Leave',
      kpi: 'KPI'
    };
    return types[type] || type;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatLeaveType(type) {
    const types = {
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      vacation: 'Vacation',
      personal: 'Personal Leave',
      emergency: 'Emergency Leave',
      unpaid: 'Unpaid Leave'
    };
    return types[type] || type;
  }

  getStatusBadgeClass(status) {
    const classes = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      in_progress: 'badge-info',
      completed: 'badge-success'
    };
    return classes[status] || 'badge-secondary';
  }

  renderBottomNav() {
    const bottomNav = new BottomNavigation('bottomNav', 'reports');
    const navContainer = document.getElementById('bottomNav');
    if (navContainer) {
      navContainer.innerHTML = bottomNav.render();
    }
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const page = new ReportsPage();
  page.init();
});
