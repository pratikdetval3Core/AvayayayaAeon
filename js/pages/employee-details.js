/**
 * Employee Details Page
 * Displays employee information in tabbed interface
 */
import authService from '../services/auth.js';
import BottomNavigation from '../components/BottomNavigation.js';

class EmployeeDetailsPage {
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
    const bottomNav = new BottomNavigation('bottomNav', 'profile');
    bottomNav.render();

    // Setup tab switching
    this.setupTabs();

    // Load employee data
    await this.loadEmployeeData();
  }

  /**
   * Setup tab switching functionality
   */
  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Show corresponding content
        const tabId = tab.dataset.tab;
        const content = document.getElementById(`${tabId}-tab`);
        if (content) {
          content.classList.add('active');
        }
      });
    });
  }

  /**
   * Load employee data
   */
  async loadEmployeeData() {
    try {
      // Get employee data from current user
      let employee = this.currentUser;

      // If employee data is missing, use sample data
      if (!employee.employeeCode) {
        employee = {
          ...employee,
          // General Info
          employeeCode: 'PD0001',
          username: employee.username || 'John Doe',
          dateOfJoining: '2025-11-01',
          dateOfBirth: '2000-01-01',
          gender: 'Male',
          mobile: '8780149175',
          permanentAddress: 'Ahmedabad, Ahmedabad',
          temporaryAddress: 'Ahmedabad, Ahmedabad',
          // Official Info
          designation: 'Advisor - 1',
          department: 'Engineering',
          location: 'Ahmedabad',
          state: 'GUJ',
          dateOfConfirmation: 'N/A',
          // Other Info
          bankName: 'ICICI BANK',
          ifscCode: 'ICICI000001',
          accountNumber: '0000001504',
          pfNumber: 'PF123456',
          esiNumber: 'ESI789012',
          panNumber: 'AAABC1234P',
          aadharNumber: '123456780987',
          uanNumber: 'UAN123456',
          voterIdNumber: 'VOT123456'
        };
      }

      // General Tab
      this.setFieldValue('employeeCode', employee.employeeCode || 'N/A');
      this.setFieldValue('employeeName', employee.username || employee.name || 'N/A');
      this.setFieldValue('dateOfJoining', this.formatDate(employee.dateOfJoining) || 'N/A');
      this.setFieldValue('dateOfBirth', this.formatDate(employee.dateOfBirth) || 'N/A');
      this.setFieldValue('gender', employee.gender || 'N/A');
      this.setFieldValue('email', employee.email || 'N/A');
      this.setFieldValue('mobile', employee.mobile || employee.phone || 'N/A');
      this.setFieldValue('permanentAddress', employee.permanentAddress || 'N/A');
      this.setFieldValue('temporaryAddress', employee.temporaryAddress || employee.permanentAddress || 'N/A');

      // Official Tab
      this.setFieldValue('designation', employee.designation || employee.role || 'N/A');
      this.setFieldValue('department', employee.department || 'N/A');
      this.setFieldValue('location', employee.location || 'N/A');
      this.setFieldValue('state', employee.state || 'N/A');
      this.setFieldValue('dateOfConfirmation', this.formatDate(employee.dateOfConfirmation) || 'N/A');

      // Other Tab
      this.setFieldValue('bankName', employee.bankName || 'N/A');
      this.setFieldValue('ifscCode', employee.ifscCode || 'N/A');
      this.setFieldValue('accountNumber', employee.accountNumber || 'N/A');
      this.setFieldValue('pfNumber', employee.pfNumber || 'N/A');
      this.setFieldValue('esiNumber', employee.esiNumber || 'N/A');
      this.setFieldValue('panNumber', employee.panNumber || 'N/A');
      this.setFieldValue('aadharNumber', employee.aadharNumber || 'N/A');
      this.setFieldValue('uanNumber', employee.uanNumber || 'N/A');
      this.setFieldValue('voterIdNumber', employee.voterIdNumber || 'N/A');
    } catch (error) {
      console.error('Failed to load employee data:', error);
    }
  }

  /**
   * Set field value
   */
  setFieldValue(fieldId, value) {
    const element = document.getElementById(fieldId);
    if (element) {
      element.textContent = value || 'N/A';
      if (value === 'N/A' || !value) {
        element.classList.add('empty-value');
      }
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }
}

// Initialize page
new EmployeeDetailsPage();
