/**
 * User Management Page (Admin Only)
 * Handles user listing, search, filtering, and management
 */
import { authService } from '../services/auth.js';
import { userService } from '../services/user.js';
import BottomNavigation from '../components/BottomNavigation.js';
import { formatDate } from '../utils/date-utils.js';

class UserManagementPage {
  constructor() {
    this.allUsers = [];
    this.filteredUsers = [];
    this.selectedUser = null;
    this.init();
  }

  /**
   * Initialize user management page
   */
  async init() {
    // Check authentication and admin permission
    if (!authService.isAuthenticated()) {
      window.location.href = '/pages/login.html';
      return;
    }

    if (!authService.hasPermission('canManageUsers')) {
      alert('Access denied. Admin privileges required.');
      window.location.href = '/pages/dashboard.html';
      return;
    }

    // Initialize components
    this.initBottomNav();
    this.attachEventListeners();
    await this.loadUsers();
  }

  /**
   * Initialize bottom navigation
   */
  initBottomNav() {
    const bottomNav = new BottomNavigation('bottomNav', 'users');
    bottomNav.render();
  }

  /**
   * Load all users
   */
  async loadUsers() {
    try {
      const result = await userService.getAllUsers();

      if (result.success) {
        this.allUsers = result.users;
        this.filteredUsers = [...this.allUsers];
        this.renderUsersList();
      } else {
        this.showToast(result.error || 'Failed to load users', 'error');
        this.renderEmptyState('Failed to load users');
      }
    } catch (error) {
      console.error('Load users error:', error);
      this.showToast('Failed to load users', 'error');
      this.renderEmptyState('Failed to load users');
    }
  }

  /**
   * Render users list
   */
  renderUsersList() {
    const container = document.getElementById('usersList');
    const userCount = document.getElementById('userCount');

    // Update count
    userCount.textContent = `${this.filteredUsers.length} user${this.filteredUsers.length !== 1 ? 's' : ''}`;

    // Clear container
    container.innerHTML = '';

    if (this.filteredUsers.length === 0) {
      this.renderEmptyState('No users found');
      return;
    }

    // Render each user
    this.filteredUsers.forEach(user => {
      const userCard = this.createUserCard(user);
      container.appendChild(userCard);
    });
  }

  /**
   * Create user card element
   * @param {object} user - User data
   * @returns {HTMLElement}
   */
  createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.dataset.userId = user.id;

    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.innerHTML = '<i class="fas fa-user"></i>';

    const details = document.createElement('div');
    details.className = 'user-details';

    const nameRow = document.createElement('div');
    nameRow.className = 'user-name-row';

    const name = document.createElement('h3');
    name.className = 'user-name';
    name.textContent = user.username;

    nameRow.appendChild(name);

    const email = document.createElement('p');
    email.className = 'user-email';
    email.textContent = user.email;

    const meta = document.createElement('div');
    meta.className = 'user-meta';

    const roleBadge = document.createElement('span');
    roleBadge.className = 'badge badge-info';
    roleBadge.textContent = this.formatRole(user.role);

    const statusBadge = document.createElement('span');
    statusBadge.className = user.isActive ? 'badge badge-success' : 'badge badge-danger';
    statusBadge.textContent = user.isActive ? 'Active' : 'Inactive';

    meta.appendChild(roleBadge);
    meta.appendChild(statusBadge);

    details.appendChild(nameRow);
    details.appendChild(email);
    details.appendChild(meta);

    const arrow = document.createElement('i');
    arrow.className = 'fas fa-chevron-right user-arrow';

    card.appendChild(avatar);
    card.appendChild(details);
    card.appendChild(arrow);

    // Add click event
    card.addEventListener('click', () => {
      this.openUserDetailsModal(user);
    });

    return card;
  }

  /**
   * Render empty state
   * @param {string} message - Empty state message
   */
  renderEmptyState(message) {
    const container = document.getElementById('usersList');
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Format role for display
   * @param {string} role - User role
   * @returns {string}
   */
  formatRole(role) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  /**
   * Format user type for display
   * @param {string} userType - User type
   * @returns {string}
   */
  formatUserType(userType) {
    return userType.charAt(0).toUpperCase() + userType.slice(1);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
      window.location.href = '/pages/dashboard.html';
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Role filter
    document.getElementById('roleFilter').addEventListener('change', () => {
      this.applyFilters();
    });

    // Status filter
    document.getElementById('statusFilter').addEventListener('change', () => {
      this.applyFilters();
    });

    // Modal close buttons
    document.getElementById('closeModalBtn').addEventListener('click', () => {
      this.closeUserDetailsModal();
    });

    // Modal backdrop click
    document.getElementById('userDetailsModal').addEventListener('click', (e) => {
      if (e.target.id === 'userDetailsModal') {
        this.closeUserDetailsModal();
      }
    });

    // Update role button
    document.getElementById('updateRoleBtn').addEventListener('click', () => {
      this.handleUpdateRole();
    });

    // Update permissions button
    document.getElementById('updatePermissionsBtn').addEventListener('click', () => {
      this.handleUpdatePermissions();
    });

    // Toggle status button
    document.getElementById('toggleStatusBtn').addEventListener('click', () => {
      this.handleToggleStatus();
    });

    // Active toggle
    document.getElementById('userActiveToggle').addEventListener('change', (e) => {
      const toggleBtn = document.getElementById('toggleStatusBtn');
      const toggleText = document.getElementById('toggleStatusText');
      if (e.target.checked) {
        toggleText.textContent = 'Deactivate User';
        toggleBtn.className = 'btn btn-danger';
      } else {
        toggleText.textContent = 'Activate User';
        toggleBtn.className = 'btn btn-secondary';
      }
    });
  }

  /**
   * Handle search
   * @param {string} query - Search query
   */
  handleSearch(query) {
    this.applyFilters();
  }

  /**
   * Apply filters
   */
  applyFilters() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    this.filteredUsers = this.allUsers.filter(user => {
      // Search filter
      const matchesSearch = !searchQuery || 
        user.username.toLowerCase().includes(searchQuery) ||
        user.email.toLowerCase().includes(searchQuery);

      // Role filter
      const matchesRole = !roleFilter || user.role === roleFilter;

      // Status filter
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });

    this.renderUsersList();
  }

  /**
   * Open user details modal
   * @param {object} user - User data
   */
  openUserDetailsModal(user) {
    this.selectedUser = user;

    // Populate user info
    document.getElementById('modalUserName').textContent = user.username;
    document.getElementById('modalUserEmail').textContent = user.email;
    document.getElementById('modalUserRole').textContent = this.formatRole(user.role);
    document.getElementById('modalUserRole').className = 'badge badge-info';
    document.getElementById('modalUserStatus').textContent = user.isActive ? 'Active' : 'Inactive';
    document.getElementById('modalUserStatus').className = user.isActive ? 'badge badge-success' : 'badge badge-danger';

    // Populate details
    document.getElementById('modalUserId').textContent = user.id;
    document.getElementById('modalUserType').textContent = this.formatUserType(user.userType);
    document.getElementById('modalCreatedAt').textContent = formatDate(user.createdAt, 'datetime');
    document.getElementById('modalLastLogin').textContent = user.lastLogin 
      ? formatDate(user.lastLogin, 'datetime')
      : 'Never';

    // Set role select
    document.getElementById('modalRoleSelect').value = user.role;

    // Set permissions checkboxes
    const checkboxes = document.querySelectorAll('.permission-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = user.permissions.includes(checkbox.value);
    });

    // Set active toggle
    document.getElementById('userActiveToggle').checked = user.isActive;
    const toggleText = document.getElementById('toggleStatusText');
    const toggleBtn = document.getElementById('toggleStatusBtn');
    if (user.isActive) {
      toggleText.textContent = 'Deactivate User';
      toggleBtn.className = 'btn btn-danger';
    } else {
      toggleText.textContent = 'Activate User';
      toggleBtn.className = 'btn btn-secondary';
    }

    // Show modal
    document.getElementById('userDetailsModal').classList.add('active');
  }

  /**
   * Close user details modal
   */
  closeUserDetailsModal() {
    document.getElementById('userDetailsModal').classList.remove('active');
    this.selectedUser = null;
  }

  /**
   * Handle update role
   */
  async handleUpdateRole() {
    if (!this.selectedUser) return;

    const newRole = document.getElementById('modalRoleSelect').value;

    if (newRole === this.selectedUser.role) {
      this.showToast('No changes to save', 'info');
      return;
    }

    if (confirm(`Are you sure you want to change ${this.selectedUser.username}'s role to ${this.formatRole(newRole)}?`)) {
      try {
        const result = await userService.updateUserRole(this.selectedUser.id, newRole);

        if (result.success) {
          this.showToast('Role updated successfully', 'success');
          
          // Update local data
          this.selectedUser.role = newRole;
          this.selectedUser.userType = result.user.userType;
          this.selectedUser.permissions = result.user.permissions;
          
          // Update modal display
          document.getElementById('modalUserRole').textContent = this.formatRole(newRole);
          document.getElementById('modalUserType').textContent = this.formatUserType(result.user.userType);
          
          // Update permissions checkboxes
          const checkboxes = document.querySelectorAll('.permission-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = result.user.permissions.includes(checkbox.value);
          });
          
          // Refresh users list
          await this.loadUsers();
        } else {
          this.showToast(result.error || 'Failed to update role', 'error');
        }
      } catch (error) {
        console.error('Update role error:', error);
        this.showToast('Failed to update role', 'error');
      }
    }
  }

  /**
   * Handle update permissions
   */
  async handleUpdatePermissions() {
    if (!this.selectedUser) return;

    const checkboxes = document.querySelectorAll('.permission-checkbox');
    const permissions = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    // Check if permissions changed
    const currentPermissions = this.selectedUser.permissions.sort().join(',');
    const newPermissions = permissions.sort().join(',');

    if (currentPermissions === newPermissions) {
      this.showToast('No changes to save', 'info');
      return;
    }

    if (confirm(`Are you sure you want to update ${this.selectedUser.username}'s permissions?`)) {
      try {
        const result = await userService.updateUserPermissions(this.selectedUser.id, permissions);

        if (result.success) {
          this.showToast('Permissions updated successfully', 'success');
          
          // Update local data
          this.selectedUser.permissions = permissions;
          
          // Refresh users list
          await this.loadUsers();
        } else {
          this.showToast(result.error || 'Failed to update permissions', 'error');
        }
      } catch (error) {
        console.error('Update permissions error:', error);
        this.showToast('Failed to update permissions', 'error');
      }
    }
  }

  /**
   * Handle toggle status
   */
  async handleToggleStatus() {
    if (!this.selectedUser) return;

    const isActive = document.getElementById('userActiveToggle').checked;
    const action = isActive ? 'deactivate' : 'activate';

    if (confirm(`Are you sure you want to ${action} ${this.selectedUser.username}?`)) {
      try {
        const result = await userService.deactivateUser(this.selectedUser.id, !isActive);

        if (result.success) {
          this.showToast(`User ${action}d successfully`, 'success');
          
          // Update local data
          this.selectedUser.isActive = !isActive;
          
          // Update modal display
          document.getElementById('modalUserStatus').textContent = this.selectedUser.isActive ? 'Active' : 'Inactive';
          document.getElementById('modalUserStatus').className = this.selectedUser.isActive ? 'badge badge-success' : 'badge badge-danger';
          document.getElementById('userActiveToggle').checked = this.selectedUser.isActive;
          
          const toggleText = document.getElementById('toggleStatusText');
          const toggleBtn = document.getElementById('toggleStatusBtn');
          if (this.selectedUser.isActive) {
            toggleText.textContent = 'Deactivate User';
            toggleBtn.className = 'btn btn-danger';
          } else {
            toggleText.textContent = 'Activate User';
            toggleBtn.className = 'btn btn-secondary';
          }
          
          // Refresh users list
          await this.loadUsers();
        } else {
          this.showToast(result.error || `Failed to ${action} user`, 'error');
          // Reset toggle
          document.getElementById('userActiveToggle').checked = this.selectedUser.isActive;
        }
      } catch (error) {
        console.error('Toggle status error:', error);
        this.showToast(`Failed to ${action} user`, 'error');
        // Reset toggle
        document.getElementById('userActiveToggle').checked = this.selectedUser.isActive;
      }
    } else {
      // Reset toggle if cancelled
      document.getElementById('userActiveToggle').checked = this.selectedUser.isActive;
    }
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, info)
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UserManagementPage();
});
