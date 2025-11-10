/**
 * Dashboard Page Controller
 */

import authService from '../services/auth.js';
import mockDataService from '../services/mock-data.js';
import { formatDate, getCurrentDate } from '../utils/date-utils.js';
import BottomNavigation from '../components/BottomNavigation.js';

let bottomNav;

/**
 * Initialize dashboard page
 */
function initDashboard() {
  // Check authentication
  if (!authService.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const currentUser = authService.getCurrentUser();
  
  // Update welcome message
  updateWelcomeSection(currentUser);
  
  // Load today's summary
  loadTodaysSummary();
  
  // Load recent activity
  loadRecentActivity();
  
  // Initialize bottom navigation
  bottomNav = new BottomNavigation('bottomNav', 'home');
  bottomNav.render();
  
  // Setup quick action handlers
  setupQuickActions();
  
  // Setup logout button
  setupLogoutButton();
}

/**
 * Setup logout button handler
 */
function setupLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        authService.logout();
        window.location.href = 'login.html';
      }
    });
  }
}

/**
 * Update welcome section with user info and current date
 */
function updateWelcomeSection(user) {
  const userNameEl = document.getElementById('userName');
  const currentDateEl = document.getElementById('currentDate');
  
  if (userNameEl) {
    userNameEl.textContent = user.username;
  }
  
  if (currentDateEl) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = today.toLocaleDateString('en-US', options);
  }
}

/**
 * Load today's attendance summary
 */
async function loadTodaysSummary() {
  const attendanceStatusEl = document.getElementById('attendanceStatus');
  const hoursWorkedEl = document.getElementById('hoursWorked');
  const currentUser = authService.getCurrentUser();
  
  try {
    // Get mock attendance data
    const today = new Date().toISOString().split('T')[0];
    const attendance = mockDataService.getAttendanceByUser(currentUser.id);
    const todayAttendance = attendance.find(a => a.date === today);
    
    if (attendanceStatusEl) {
      if (todayAttendance) {
        attendanceStatusEl.textContent = 'Present';
        attendanceStatusEl.className = 'summary-value status-present';
      } else {
        attendanceStatusEl.textContent = 'Not Marked';
        attendanceStatusEl.className = 'summary-value status-absent';
      }
    }
    
    if (hoursWorkedEl) {
      if (todayAttendance && todayAttendance.checkOutTime) {
        const checkIn = new Date(todayAttendance.checkInTime);
        const checkOut = new Date(todayAttendance.checkOutTime);
        const hours = Math.floor((checkOut - checkIn) / (1000 * 60 * 60));
        const minutes = Math.floor(((checkOut - checkIn) % (1000 * 60 * 60)) / (1000 * 60));
        hoursWorkedEl.textContent = `${hours}h ${minutes}m`;
      } else {
        hoursWorkedEl.textContent = '0h 0m';
      }
    }
  } catch (error) {
    console.error('Error loading today\'s summary:', error);
  }
}

/**
 * Load recent activity feed
 */
async function loadRecentActivity() {
  const activityFeedEl = document.getElementById('activityFeed');
  
  if (!activityFeedEl) return;
  
  try {
    const currentUser = authService.getCurrentUser();
    const activities = mockDataService.getRecentActivity(currentUser.id, currentUser.userType, 5);
    
    if (activities.length === 0) {
      activityFeedEl.innerHTML = `
        <div class="activity-empty">
          <i class="fas fa-inbox activity-empty-icon"></i>
          <p class="activity-empty-text">No recent activity</p>
        </div>
      `;
    } else {
      activityFeedEl.innerHTML = activities.map(activity => {
        const icon = activity.type === 'invoice' ? 'fa-file-invoice' : 
                     activity.type === 'leave' ? 'fa-calendar-alt' : 
                     'fa-chart-line';
        const timeAgo = getTimeAgo(activity.time);
        
        return `
          <div class="activity-item">
            <div class="activity-icon-wrapper">
              <i class="fas ${icon} activity-icon"></i>
            </div>
            <div class="activity-content">
              <div class="activity-title">${activity.message}</div>
              <div class="activity-time">${timeAgo}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
  }
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}



/**
 * Setup quick action card handlers
 */
function setupQuickActions() {
  const actionCards = document.querySelectorAll('.action-card');
  
  actionCards.forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      handleQuickAction(action);
    });
  });
  
  // Add user management link for admins
  addAdminQuickActions();
}

/**
 * Add admin-specific quick actions
 */
function addAdminQuickActions() {
  if (!authService.hasPermission('canManageUsers')) {
    return;
  }
  
  const actionCardsContainer = document.querySelector('.action-cards');
  if (!actionCardsContainer) return;
  
  // Check if user management card already exists
  if (document.querySelector('[data-action="user-management"]')) {
    return;
  }
  
  const userManagementCard = document.createElement('div');
  userManagementCard.className = 'action-card';
  userManagementCard.dataset.action = 'user-management';
  userManagementCard.innerHTML = `
    <div class="action-icon-wrapper">
      <i class="fas fa-users-cog action-icon"></i>
    </div>
    <h3 class="action-title">Manage Users</h3>
    <p class="action-description">Admin user management</p>
  `;
  
  userManagementCard.addEventListener('click', () => {
    handleQuickAction('user-management');
  });
  
  actionCardsContainer.appendChild(userManagementCard);
}

/**
 * Handle quick action navigation
 */
function handleQuickAction(action) {
  const routes = {
    'attendance': 'attendance.html',
    'invoice': 'invoice.html',
    'leave': 'leave-menu.html',
    'kpi': 'kpi.html',
    'employee-details': 'employee-details.html',
    'user-management': 'user-management.html'
  };
  
  if (routes[action]) {
    window.location.href = routes[action];
  }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

export { initDashboard };
