/**
 * KPI Page Controller
 */
import authService from '../services/auth.js';
import kpiService from '../services/kpi.js';
import cameraService from '../services/camera.js';
import geolocationService from '../services/geolocation.js';
import BottomNavigation from '../components/BottomNavigation.js';
import { formatDate, formatDateTime } from '../utils/date-utils.js';

class KPIPage {
  constructor() {
    this.currentUser = null;
    this.capturedImage = null;
    this.currentLocation = null;
    this.selectedKPIId = null;
    
    // DOM elements
    this.elements = {
      kpiTitle: document.getElementById('kpiTitle'),
      kpiDescription: document.getElementById('kpiDescription'),
      kpiValue: document.getElementById('kpiValue'),
      kpiStatus: document.getElementById('kpiStatus'),
      captureBtn: document.getElementById('captureBtn'),
      uploadImageBtn: document.getElementById('uploadImageBtn'),
      imageFileInput: document.getElementById('imageFileInput'),
      imagePreview: document.getElementById('imagePreview'),
      previewImage: document.getElementById('previewImage'),
      removeImageBtn: document.getElementById('removeImageBtn'),
      imageSize: document.getElementById('imageSize'),
      locationToggle: document.getElementById('locationToggle'),
      locationDisplay: document.getElementById('locationDisplay'),
      latValue: document.getElementById('latValue'),
      lonValue: document.getElementById('lonValue'),
      submitBtn: document.getElementById('submitBtn'),
      kpiForm: document.getElementById('kpiForm'),
      kpiList: document.getElementById('kpiList'),
      emptyState: document.getElementById('emptyState'),
      refreshKPIsBtn: document.getElementById('refreshKPIsBtn'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      loadingText: document.getElementById('loadingText'),
      toast: document.getElementById('toast'),
      kpiModal: document.getElementById('kpiModal'),
      modalBody: document.getElementById('modalBody'),
      closeModalBtn: document.getElementById('closeModalBtn'),
      closeDetailsBtn: document.getElementById('closeDetailsBtn'),
      deleteKPIBtn: document.getElementById('deleteKPIBtn'),
      cameraModal: document.getElementById('cameraModal'),
      cameraVideo: document.getElementById('cameraVideo'),
      cameraCanvas: document.getElementById('cameraCanvas'),
      closeCameraBtn: document.getElementById('closeCameraBtn'),
      cancelCameraBtn: document.getElementById('cancelCameraBtn'),
      takePictureBtn: document.getElementById('takePictureBtn')
    };
  }

  /**
   * Initialize page
   */
  async init() {
    // Check authentication
    if (!authService.isAuthenticated()) {
      window.location.href = '/pages/login.html';
      return;
    }

    this.currentUser = authService.getCurrentUser();

    // Initialize bottom navigation
    const bottomNav = new BottomNavigation('bottomNav', 'kpi');
    bottomNav.render();

    // Setup event listeners
    this.setupEventListeners();

    // Load KPIs
    await this.loadKPIs();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Capture button
    this.elements.captureBtn.addEventListener('click', () => this.handleCaptureImage());

    // Upload image button
    this.elements.uploadImageBtn.addEventListener('click', () => {
      this.elements.imageFileInput.click();
    });

    // Image file input
    this.elements.imageFileInput.addEventListener('change', (e) => this.handleImageFileSelect(e));

    // Remove image button
    this.elements.removeImageBtn.addEventListener('click', () => this.removeImage());

    // Location toggle
    this.elements.locationToggle.addEventListener('change', (e) => this.handleLocationToggle(e));

    // Form submit
    this.elements.kpiForm.addEventListener('submit', (e) => this.handleSubmit(e));

    // Refresh KPIs button
    this.elements.refreshKPIsBtn.addEventListener('click', () => this.loadKPIs());

    // Modal close buttons
    this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
    this.elements.closeDetailsBtn.addEventListener('click', () => this.closeModal());
    this.elements.deleteKPIBtn.addEventListener('click', () => this.handleDeleteKPI());

    // Close modal on backdrop click
    this.elements.kpiModal.addEventListener('click', (e) => {
      if (e.target === this.elements.kpiModal) {
        this.closeModal();
      }
    });

    // Camera modal buttons
    this.elements.closeCameraBtn.addEventListener('click', () => this.closeCameraModal());
    this.elements.cancelCameraBtn.addEventListener('click', () => this.closeCameraModal());
    this.elements.takePictureBtn.addEventListener('click', () => this.takePicture());

    // Close camera modal on backdrop click
    this.elements.cameraModal.addEventListener('click', (e) => {
      if (e.target === this.elements.cameraModal) {
        this.closeCameraModal();
      }
    });
  }

  /**
   * Handle capture image
   */
  async handleCaptureImage() {
    if (!cameraService.isCameraAvailable()) {
      this.showToast('Camera is not available on this device', 'error');
      return;
    }

    try {
      this.showLoading('Accessing camera...');
      
      // Use camera service to capture image
      const base64Image = await cameraService.captureImage({
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080
      });

      this.capturedImage = base64Image;
      this.showImagePreview(base64Image);
      this.showToast('Image captured successfully', 'success');
    } catch (error) {
      console.error('Camera capture error:', error);
      this.showToast(error.message || 'Failed to capture image', 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Handle image file selection
   */
  async handleImageFileSelect(e) {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file', 'error');
      this.elements.imageFileInput.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showToast('Image size must be less than 10MB', 'error');
      this.elements.imageFileInput.value = '';
      return;
    }

    try {
      this.showLoading('Processing image...');
      
      // Compress and convert to base64
      const base64Image = await cameraService.captureFromFile(file, {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080
      });

      this.capturedImage = base64Image;
      this.showImagePreview(base64Image);
      this.showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Image processing error:', error);
      this.showToast('Failed to process image', 'error');
    } finally {
      this.hideLoading();
      this.elements.imageFileInput.value = '';
    }
  }

  /**
   * Show image preview
   */
  showImagePreview(base64Image) {
    this.elements.previewImage.src = base64Image;
    this.elements.imagePreview.style.display = 'block';
    
    // Calculate and display image size
    const sizeInBytes = base64Image.length * 0.75;
    this.elements.imageSize.textContent = this.formatFileSize(sizeInBytes);
  }

  /**
   * Remove captured image
   */
  removeImage() {
    this.capturedImage = null;
    this.elements.previewImage.src = '';
    this.elements.imagePreview.style.display = 'none';
    this.elements.imageFileInput.value = '';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Handle location toggle
   */
  async handleLocationToggle(e) {
    const isEnabled = e.target.checked;

    if (isEnabled) {
      this.elements.locationDisplay.style.display = 'block';
      await this.updateLocation();
    } else {
      this.elements.locationDisplay.style.display = 'none';
      this.currentLocation = null;
    }
  }

  /**
   * Update location display
   */
  async updateLocation() {
    try {
      const position = await geolocationService.getCurrentPosition();
      this.currentLocation = {
        lat: position.lat,
        lon: position.lon
      };

      this.elements.latValue.textContent = position.lat.toFixed(6);
      this.elements.lonValue.textContent = position.lon.toFixed(6);
    } catch (error) {
      console.error('Failed to get location:', error);
      this.showToast('Failed to get location. Please enable location services.', 'error');
      this.elements.locationToggle.checked = false;
      this.elements.locationDisplay.style.display = 'none';
    }
  }

  /**
   * Take picture from camera modal
   */
  async takePicture() {
    try {
      const canvas = this.elements.cameraCanvas;
      const video = this.elements.cameraVideo;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Compress and get base64
      const base64Image = await cameraService.compressImage(canvas, 0.8, 1920, 1080);
      
      this.capturedImage = base64Image;
      this.showImagePreview(base64Image);
      this.closeCameraModal();
      this.showToast('Image captured successfully', 'success');
    } catch (error) {
      console.error('Failed to take picture:', error);
      this.showToast('Failed to capture image', 'error');
    }
  }

  /**
   * Close camera modal
   */
  closeCameraModal() {
    cameraService.stopCamera();
    this.elements.cameraModal.style.display = 'none';
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();

    // Validate form fields
    const title = this.elements.kpiTitle.value.trim();
    const description = this.elements.kpiDescription.value.trim();
    const value = this.elements.kpiValue.value.trim();
    const status = this.elements.kpiStatus.value;

    if (!title) {
      this.showToast('Please enter a title', 'error');
      return;
    }

    if (!description) {
      this.showToast('Please enter a description', 'error');
      return;
    }

    if (!value) {
      this.showToast('Please enter a value', 'error');
      return;
    }

    // Show loading
    this.showLoading('Submitting KPI...');

    try {
      // Prepare KPI data
      const kpiData = {
        userId: this.currentUser.id,
        title: title,
        description: description,
        value: value,
        status: status
      };

      // Submit KPI
      const kpi = await kpiService.submitKPI(
        kpiData,
        this.capturedImage,
        this.elements.locationToggle.checked ? this.currentLocation : null
      );

      this.showToast('KPI submitted successfully', 'success');
      this.resetForm();
      await this.loadKPIs();
    } catch (error) {
      console.error('Submit error:', error);
      this.showToast(error.message || 'Failed to submit KPI. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Reset form
   */
  resetForm() {
    this.elements.kpiForm.reset();
    this.removeImage();
    this.elements.locationToggle.checked = false;
    this.elements.locationDisplay.style.display = 'none';
    this.currentLocation = null;
  }

  /**
   * Load KPIs
   */
  async loadKPIs() {
    try {
      const kpis = await kpiService.getKPIs(this.currentUser.id);
      this.renderKPIs(kpis);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      this.showToast('Failed to load KPIs', 'error');
    }
  }

  /**
   * Render KPIs list
   */
  renderKPIs(kpis) {
    if (!kpis || kpis.length === 0) {
      this.elements.emptyState.style.display = 'block';
      this.elements.kpiList.innerHTML = '';
      this.elements.kpiList.appendChild(this.elements.emptyState);
      return;
    }

    this.elements.emptyState.style.display = 'none';
    this.elements.kpiList.innerHTML = '';

    kpis.forEach(kpi => {
      const item = this.createKPIItem(kpi);
      this.elements.kpiList.appendChild(item);
    });
  }

  /**
   * Create KPI item element
   */
  createKPIItem(kpi) {
    const item = document.createElement('div');
    item.className = 'kpi-item';
    item.dataset.kpiId = kpi.id;

    const statusBadge = `<span class="status-badge ${kpi.status}">${kpi.getFormattedStatus()}</span>`;
    const hasImage = kpi.hasImage();
    const hasLocation = kpi.hasLocation();

    item.innerHTML = `
      <div class="kpi-item-header">
        <div>
          <h3 class="kpi-item-title">${kpi.title}</h3>
          <div class="kpi-item-date">${formatDateTime(kpi.createdAt)}</div>
        </div>
        ${statusBadge}
      </div>
      <div class="kpi-item-body">
        <p class="kpi-item-description">${kpi.description}</p>
        <div class="kpi-item-value">
          <i class="fas fa-chart-line"></i>
          <span>${kpi.value}</span>
        </div>
      </div>
      ${hasImage ? `
        <div class="kpi-item-image">
          <img src="${kpi.image}" alt="${kpi.title}">
        </div>
      ` : ''}
      <div class="kpi-item-footer">
        <div class="kpi-item-meta">
          <div class="kpi-meta-item ${hasImage ? 'has-image' : ''}">
            <i class="fas fa-${hasImage ? 'check-circle' : 'times-circle'}"></i>
            <span>${hasImage ? 'Image' : 'No Image'}</span>
          </div>
          <div class="kpi-meta-item ${hasLocation ? 'has-location' : ''}">
            <i class="fas fa-${hasLocation ? 'map-marker-alt' : 'map-marker'}"></i>
            <span>${hasLocation ? 'Location' : 'No Location'}</span>
          </div>
        </div>
      </div>
    `;

    // Add click event to show details
    item.addEventListener('click', () => this.showKPIDetails(kpi));

    return item;
  }

  /**
   * Show KPI details in modal
   */
  showKPIDetails(kpi) {
    this.selectedKPIId = kpi.id;

    const statusBadge = `<span class="status-badge ${kpi.status}">${kpi.getFormattedStatus()}</span>`;

    this.elements.modalBody.innerHTML = `
      <div class="kpi-detail-section">
        <div class="kpi-detail-label">Title</div>
        <div class="kpi-detail-value">${kpi.title}</div>
      </div>
      
      <div class="kpi-detail-section">
        <div class="kpi-detail-label">Status</div>
        <div class="kpi-detail-value">${statusBadge}</div>
      </div>
      
      <div class="kpi-detail-section">
        <div class="kpi-detail-label">Description</div>
        <div class="kpi-detail-value">${kpi.description}</div>
      </div>
      
      <div class="kpi-detail-section">
        <div class="kpi-detail-label">Value/Metric</div>
        <div class="kpi-detail-value">${kpi.value}</div>
      </div>
      
      <div class="kpi-detail-section">
        <div class="kpi-detail-label">Created At</div>
        <div class="kpi-detail-value">${formatDateTime(kpi.createdAt)}</div>
      </div>
      
      ${kpi.hasImage() ? `
        <div class="kpi-detail-section">
          <div class="kpi-detail-label">Image</div>
          <div class="kpi-detail-image">
            <img src="${kpi.image}" alt="${kpi.title}">
          </div>
          <div class="kpi-detail-value" style="margin-top: 0.5rem;">
            Size: ${this.formatFileSize(kpi.image.length * 0.75)}
          </div>
        </div>
      ` : ''}
      
      ${kpi.hasLocation() ? `
        <div class="kpi-detail-section">
          <div class="kpi-detail-label">Location</div>
          <div class="kpi-detail-location">
            <i class="fas fa-map-marker-alt"></i>
            <span>Lat: ${kpi.location.lat.toFixed(6)}, Lon: ${kpi.location.lon.toFixed(6)}</span>
          </div>
        </div>
      ` : ''}
    `;

    this.elements.kpiModal.style.display = 'flex';
  }

  /**
   * Close modal
   */
  closeModal() {
    this.elements.kpiModal.style.display = 'none';
    this.selectedKPIId = null;
  }

  /**
   * Handle delete KPI
   */
  async handleDeleteKPI() {
    if (!this.selectedKPIId) {
      return;
    }

    if (!confirm('Are you sure you want to delete this KPI?')) {
      return;
    }

    this.closeModal();
    this.showLoading('Deleting KPI...');

    try {
      await kpiService.deleteKPI(this.selectedKPIId);
      this.showToast('KPI deleted successfully', 'success');
      await this.loadKPIs();
    } catch (error) {
      console.error('Delete error:', error);
      this.showToast('Failed to delete KPI. Please try again.', 'error');
    } finally {
      this.hideLoading();
      this.selectedKPIId = null;
    }
  }

  /**
   * Show loading overlay
   */
  showLoading(text = 'Loading...') {
    this.elements.loadingText.textContent = text;
    this.elements.loadingOverlay.style.display = 'flex';
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    this.elements.loadingOverlay.style.display = 'none';
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
      this.elements.toast.className = 'toast';
      this.elements.toast.textContent = ''; // Clear content when hiding
    }, 3000);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const page = new KPIPage();
  page.init();
});

export default KPIPage;
