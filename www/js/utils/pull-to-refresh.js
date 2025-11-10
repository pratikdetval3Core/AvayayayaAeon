/**
 * Pull to Refresh
 * Implements pull-to-refresh functionality for mobile
 */

class PullToRefresh {
  constructor(options = {}) {
    this.options = {
      container: options.container || document.body,
      threshold: options.threshold || 80,
      maxPull: options.maxPull || 120,
      onRefresh: options.onRefresh || (() => {}),
      ...options
    };
    
    this.startY = 0;
    this.currentY = 0;
    this.pulling = false;
    this.refreshing = false;
    
    this.init();
  }

  /**
   * Initialize pull to refresh
   */
  init() {
    this.createRefreshIndicator();
    this.attachEventListeners();
  }

  /**
   * Create refresh indicator element
   */
  createRefreshIndicator() {
    this.indicator = document.createElement('div');
    this.indicator.className = 'pull-to-refresh-indicator';
    this.indicator.innerHTML = `
      <div class="pull-to-refresh-content">
        <div class="pull-to-refresh-icon">↓</div>
        <div class="pull-to-refresh-text">Pull to refresh</div>
      </div>
    `;
    
    // Insert at the beginning of container
    this.options.container.insertBefore(
      this.indicator,
      this.options.container.firstChild
    );
    
    // Add styles
    this.addStyles();
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('pull-to-refresh-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'pull-to-refresh-styles';
    style.textContent = `
      .pull-to-refresh-indicator {
        position: absolute;
        top: -80px;
        left: 0;
        right: 0;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
        z-index: 100;
      }
      
      .pull-to-refresh-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      
      .pull-to-refresh-icon {
        font-size: 24px;
        transition: transform 0.2s ease;
      }
      
      .pull-to-refresh-indicator.pulling .pull-to-refresh-icon {
        transform: rotate(180deg);
      }
      
      .pull-to-refresh-indicator.refreshing .pull-to-refresh-icon {
        animation: spin 1s linear infinite;
      }
      
      .pull-to-refresh-text {
        font-size: 14px;
        color: var(--text-secondary);
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    let touchStarted = false;
    
    this.options.container.addEventListener('touchstart', (e) => {
      // Only trigger if at top of page
      if (window.scrollY === 0 && !this.refreshing) {
        touchStarted = true;
        this.startY = e.touches[0].clientY;
      }
    }, { passive: true });
    
    this.options.container.addEventListener('touchmove', (e) => {
      if (!touchStarted || this.refreshing) return;
      
      this.currentY = e.touches[0].clientY;
      const pullDistance = this.currentY - this.startY;
      
      if (pullDistance > 0) {
        this.pulling = true;
        
        // Prevent default scroll
        if (window.scrollY === 0) {
          e.preventDefault();
        }
        
        // Calculate pull amount with resistance
        const pull = Math.min(pullDistance * 0.5, this.options.maxPull);
        
        // Update indicator position
        this.indicator.style.transform = `translateY(${pull}px)`;
        
        // Update indicator state
        if (pull >= this.options.threshold) {
          this.indicator.classList.add('pulling');
          this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Release to refresh';
        } else {
          this.indicator.classList.remove('pulling');
          this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Pull to refresh';
        }
      }
    }, { passive: false });
    
    this.options.container.addEventListener('touchend', () => {
      if (!touchStarted || this.refreshing) return;
      
      touchStarted = false;
      
      if (this.pulling) {
        const pullDistance = this.currentY - this.startY;
        const pull = Math.min(pullDistance * 0.5, this.options.maxPull);
        
        if (pull >= this.options.threshold) {
          this.triggerRefresh();
        } else {
          this.reset();
        }
        
        this.pulling = false;
      }
    }, { passive: true });
  }

  /**
   * Trigger refresh
   */
  async triggerRefresh() {
    if (this.refreshing) return;
    
    this.refreshing = true;
    this.indicator.classList.add('refreshing');
    this.indicator.classList.remove('pulling');
    this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Refreshing...';
    this.indicator.querySelector('.pull-to-refresh-icon').textContent = '⟳';
    
    // Keep indicator visible
    this.indicator.style.transform = `translateY(${this.options.threshold}px)`;
    
    try {
      // Call refresh callback
      await this.options.onRefresh();
      
      // Show success briefly
      this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Updated!';
      this.indicator.querySelector('.pull-to-refresh-icon').textContent = '✓';
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('[Pull to Refresh] Error:', error);
      
      // Show error briefly
      this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Failed to refresh';
      this.indicator.querySelector('.pull-to-refresh-icon').textContent = '✗';
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      this.reset();
    }
  }

  /**
   * Reset indicator
   */
  reset() {
    this.refreshing = false;
    this.indicator.classList.remove('refreshing', 'pulling');
    this.indicator.style.transform = 'translateY(0)';
    this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Pull to refresh';
    this.indicator.querySelector('.pull-to-refresh-icon').textContent = '↓';
  }

  /**
   * Destroy pull to refresh
   */
  destroy() {
    if (this.indicator && this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator);
    }
  }

  /**
   * Enable pull to refresh
   */
  enable() {
    this.indicator.style.display = 'flex';
  }

  /**
   * Disable pull to refresh
   */
  disable() {
    this.indicator.style.display = 'none';
  }
}

export default PullToRefresh;
