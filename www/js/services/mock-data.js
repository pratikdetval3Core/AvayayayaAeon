/**
 * Mock Data Service
 * Provides static mock data for prototype demonstration
 * No database required - all data is in-memory
 */

class MockDataService {
  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize all mock data
   */
  initializeMockData() {
    // Mock Users
    this.users = [
      {
        id: 'user_admin_001',
        email: 'admin@company.com',
        firstName: 'Admin',
        lastName: 'User',
        userType: 'admin',
        department: 'Management',
        position: 'System Administrator',
        isActive: true
      },
      {
        id: 'user_emp_001',
        email: 'john.doe@company.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'employee',
        department: 'Engineering',
        position: 'Senior Software Engineer',
        isActive: true
      },
      {
        id: 'user_emp_002',
        email: 'jane.smith@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        userType: 'employee',
        department: 'Marketing',
        position: 'Marketing Manager',
        isActive: true
      }
    ];

    // Mock Attendance Records (last 7 days)
    this.attendance = this.generateMockAttendance();

    // Mock Invoices
    this.invoices = [
      {
        id: 'inv_001',
        userId: 'user_emp_001',
        fileName: 'office_supplies.pdf',
        description: 'Office supplies purchase',
        amount: 150.00,
        invoiceDate: '2024-01-15',
        status: 'pending',
        uploadedAt: Date.now() - 2 * 24 * 60 * 60 * 1000
      },
      {
        id: 'inv_002',
        userId: 'user_emp_001',
        fileName: 'travel_expenses.pdf',
        description: 'Client meeting travel',
        amount: 450.00,
        invoiceDate: '2024-01-10',
        status: 'processed',
        uploadedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
      },
      {
        id: 'inv_003',
        userId: 'user_emp_002',
        fileName: 'marketing_materials.pdf',
        description: 'Marketing campaign materials',
        amount: 320.00,
        invoiceDate: '2024-01-12',
        status: 'pending',
        uploadedAt: Date.now() - 3 * 24 * 60 * 60 * 1000
      }
    ];

    // Mock Leave Applications
    this.leave = [
      {
        id: 'leave_001',
        userId: 'user_emp_001',
        leaveType: 'vacation',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        reason: 'Family vacation',
        status: 'pending',
        appliedAt: Date.now() - 1 * 24 * 60 * 60 * 1000
      },
      {
        id: 'leave_002',
        userId: 'user_emp_002',
        leaveType: 'sick',
        startDate: '2024-01-20',
        endDate: '2024-01-21',
        reason: 'Medical appointment',
        status: 'approved',
        appliedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        reviewedBy: 'user_admin_001'
      }
    ];

    // Mock KPI Entries
    this.kpis = [
      {
        id: 'kpi_001',
        userId: 'user_emp_001',
        title: 'Complete project milestone',
        description: 'Finished Phase 1 of the project',
        value: '100%',
        status: 'completed',
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
      },
      {
        id: 'kpi_002',
        userId: 'user_emp_001',
        title: 'Code review',
        description: 'Reviewed 15 pull requests',
        value: '15 PRs',
        status: 'completed',
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
      },
      {
        id: 'kpi_003',
        userId: 'user_emp_002',
        title: 'Marketing campaign',
        description: 'Launch Q1 campaign',
        value: '80%',
        status: 'in_progress',
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
      }
    ];
  }

  /**
   * Generate mock attendance for last 7 days
   */
  generateMockAttendance() {
    const attendance = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Add attendance for employees
      ['user_emp_001', 'user_emp_002'].forEach(userId => {
        const checkIn = new Date(date);
        checkIn.setHours(9, Math.floor(Math.random() * 30), 0);
        
        const checkOut = new Date(date);
        checkOut.setHours(17, Math.floor(Math.random() * 60), 0);
        
        attendance.push({
          id: `att_${userId}_${dateStr}`,
          userId: userId,
          date: dateStr,
          checkInTime: checkIn.toISOString(),
          checkOutTime: checkOut.toISOString(),
          status: 'present'
        });
      });
    }
    
    return attendance;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  /**
   * Get user by ID
   */
  getUserById(id) {
    return this.users.find(u => u.id === id);
  }

  /**
   * Get all users
   */
  getAllUsers() {
    return [...this.users];
  }

  /**
   * Get attendance for user
   */
  getAttendanceByUser(userId) {
    return this.attendance.filter(a => a.userId === userId);
  }

  /**
   * Get all attendance
   */
  getAllAttendance() {
    return [...this.attendance];
  }

  /**
   * Add attendance record
   */
  addAttendance(record) {
    this.attendance.unshift(record);
    return record;
  }

  /**
   * Get invoices for user
   */
  getInvoicesByUser(userId) {
    return this.invoices.filter(i => i.userId === userId);
  }

  /**
   * Get all invoices
   */
  getAllInvoices() {
    return [...this.invoices];
  }

  /**
   * Add invoice
   */
  addInvoice(invoice) {
    this.invoices.unshift(invoice);
    return invoice;
  }

  /**
   * Update invoice status
   */
  updateInvoiceStatus(invoiceId, status) {
    const invoice = this.invoices.find(i => i.id === invoiceId);
    if (invoice) {
      invoice.status = status;
    }
    return invoice;
  }

  /**
   * Get leave applications for user
   */
  getLeaveByUser(userId) {
    return this.leave.filter(l => l.userId === userId);
  }

  /**
   * Get all leave applications
   */
  getAllLeave() {
    return [...this.leave];
  }

  /**
   * Get pending leave applications
   */
  getPendingLeave() {
    return this.leave.filter(l => l.status === 'pending');
  }

  /**
   * Add leave application
   */
  addLeave(leave) {
    this.leave.unshift(leave);
    return leave;
  }

  /**
   * Update leave status
   */
  updateLeaveStatus(leaveId, status, reviewedBy) {
    const leave = this.leave.find(l => l.id === leaveId);
    if (leave) {
      leave.status = status;
      leave.reviewedBy = reviewedBy;
      leave.reviewedAt = Date.now();
    }
    return leave;
  }

  /**
   * Get KPIs for user
   */
  getKPIsByUser(userId) {
    return this.kpis.filter(k => k.userId === userId);
  }

  /**
   * Get all KPIs
   */
  getAllKPIs() {
    return [...this.kpis];
  }

  /**
   * Add KPI entry
   */
  addKPI(kpi) {
    this.kpis.unshift(kpi);
    return kpi;
  }

  /**
   * Get dashboard statistics for user
   */
  getDashboardStats(userId, userType) {
    if (userType === 'admin') {
      return {
        totalEmployees: this.users.filter(u => u.userType === 'employee').length,
        presentToday: this.attendance.filter(a => {
          const today = new Date().toISOString().split('T')[0];
          return a.date === today && a.status === 'present';
        }).length,
        pendingLeave: this.leave.filter(l => l.status === 'pending').length,
        pendingInvoices: this.invoices.filter(i => i.status === 'pending').length
      };
    } else {
      const userAttendance = this.getAttendanceByUser(userId);
      const userLeave = this.getLeaveByUser(userId);
      const userInvoices = this.getInvoicesByUser(userId);
      const userKPIs = this.getKPIsByUser(userId);
      
      return {
        attendanceCount: userAttendance.length,
        leaveBalance: 15 - userLeave.filter(l => l.status === 'approved').length,
        pendingInvoices: userInvoices.filter(i => i.status === 'pending').length,
        completedKPIs: userKPIs.filter(k => k.status === 'completed').length
      };
    }
  }

  /**
   * Get recent activity
   */
  getRecentActivity(userId, userType, limit = 5) {
    const activities = [];
    
    if (userType === 'admin') {
      // Admin sees all recent activities
      this.leave.slice(0, limit).forEach(l => {
        const user = this.getUserById(l.userId);
        activities.push({
          type: 'leave',
          message: `${user.firstName} ${user.lastName} applied for ${l.leaveType} leave`,
          time: l.appliedAt
        });
      });
    } else {
      // Employee sees their own activities
      const userInvoices = this.getInvoicesByUser(userId).slice(0, 2);
      const userLeave = this.getLeaveByUser(userId).slice(0, 2);
      const userKPIs = this.getKPIsByUser(userId).slice(0, 2);
      
      userInvoices.forEach(i => {
        activities.push({
          type: 'invoice',
          message: `Invoice ${i.fileName} - ${i.status}`,
          time: i.uploadedAt
        });
      });
      
      userLeave.forEach(l => {
        activities.push({
          type: 'leave',
          message: `Leave application - ${l.status}`,
          time: l.appliedAt
        });
      });
      
      userKPIs.forEach(k => {
        activities.push({
          type: 'kpi',
          message: `KPI: ${k.title} - ${k.status}`,
          time: k.createdAt
        });
      });
    }
    
    // Sort by time and limit
    return activities.sort((a, b) => b.time - a.time).slice(0, limit);
  }
}

// Export singleton instance
const mockDataService = new MockDataService();
export default mockDataService;
