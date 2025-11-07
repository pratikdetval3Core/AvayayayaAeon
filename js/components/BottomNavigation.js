/**
 * Bottom Navigation Component
 * Provides mobile-friendly navigation with active state highlighting
 */

import authService from '../services/auth.js';

class BottomNavigation {
  constructor(containerId, currentPage) {
    this.container = document.getElementById(containerId);
    this.currentPage = currentPage;
    this.navItems = this.getNavItems();
  }

  /**
   * Get navigation items based on user permissions
   */
  getNavItems() {
    const currentUser = authService.getCurrentUser();
    
    const baseItems = [
      { 
        id: 'home', 
        icon: 'fa-home', 
        label: 'Home', 
        href: 'dashboard.html',
        permission: null
      },
      { 
        id: 'attendance', 
        icon: 'fa-user-check', 
        label: 'Attendance', 
        href: 'attendance.html',
        permission: null
      },
      { 
        id: 'leave', 
        icon: 'fa-calendar-alt', 
        label: 'Leave', 
        href: 'leave.html',
        permission: null
      },
      { 
        id: 'invoice', 
        icon: 'fa-file-invoice', 
        label: 'Invoice', 
        href: 'invoice.html',
        permission: null
      },
      { 
        id: 'kpi', 
        icon: 'fa-chart-line', 
        label: 'KPI', 
        href: 'kpi.html',
        permission: null
      },
      { 
        id: 'reports', 
        icon: 'fa-chart-bar', 
        label: 'Reports', 
        href: 'reports.html',
        permission: null
      },
      { 
        id: 'profile', 
        icon: 'fa-user', 
        label: 'Profile', 
        href: 'profile.html',
        permission: null
      }
    ];

    // Filter items based on permissions
    return baseItems.filter(item => {
      if (!item.permission) return true;
      return currentUser && authService.hasPermission(item.permission);
    });
  }

  /**
   * Render the navigation bar
   */
  render() {
    if (!this.container) {
      // Silently return if container not found (page doesn't need bottom nav)
      console.log('[BottomNav] Container not found');
      return;
    }

    console.log('[BottomNav] Rendering navigation');

    // Limit to 5 items for mobile bottom nav
    const displayItems = this.getDisplayItems();

    this.container.innerHTML = displayItems.map(item => {
      const isActive = this.isActive(item);
      return `
        <a href="${item.href}" 
           class="nav-item ${isActive ? 'active' : ''}" 
           data-nav="${item.id}"
           aria-label="${item.label}"
           aria-current="${isActive ? 'page' : 'false'}">
          <i class="fas ${item.icon} nav-icon"></i>
          <span class="nav-label">${item.label}</span>
        </a>
      `;
    }).join('');

    console.log('[BottomNav] Navigation rendered with', displayItems.length, 'items');

    this.attachEventListeners();
  }

  /**
   * Get items to display (limit to 5 for mobile)
   */
  getDisplayItems() {
    // For mobile, show only the most important 5 items
    const priorityOrder = ['home', 'attendance', 'leave', 'reports', 'profile'];
    
    // Sort items by priority
    const sortedItems = [...this.navItems].sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.id);
      const bIndex = priorityOrder.indexOf(b.id);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });

    return sortedItems.slice(0, 5);
  }

  /**
   * Check if navigation item is active
   */
  isActive(item) {
    if (!this.currentPage) return false;
    
    // Match by page name
    const currentPageName = this.currentPage.toLowerCase();
    const itemPageName = item.href.replace('.html', '').toLowerCase();
    
    return currentPageName === itemPageName || currentPageName === item.id;
  }

  /**
   * Attach event listeners to navigation items
   */
  attachEventListeners() {
    const navItems = this.container.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Allow default navigation behavior
        // Could add custom routing logic here if needed
      });
    });
  }

  /**
   * Update active state
   */
  updateActive(pageId) {
    this.currentPage = pageId;
    
    const navItems = this.container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const itemId = item.dataset.nav;
      if (itemId === pageId) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-current', 'false');
      }
    });
  }

  /**
   * Show navigation
   */
  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }

  /**
   * Hide navigation
   */
  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }
}

export default BottomNavigation;
