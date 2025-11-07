/**
 * Invoice Page Controller
 */
import authService from '../services/auth.js';
import invoiceService from '../services/invoice.js';
import geolocationService from '../services/geolocation.js';
import BottomNavigation from '../components/BottomNavigation.js';
import { formatDate, formatDateTime } from '../utils/date-utils.js';

class InvoicePage {
  constructor() {
    this.currentUser = null;
    this.selectedFile = null;
    this.currentLocation = null;
    this.selectedInvoiceId = null;
    
    // DOM elements
    this.elements = {
      invoiceFile: document.getElementById('invoiceFile'),
      fileInputDisplay: document.getElementById('fileInputDisplay'),
      filePreview: document.getElementById('filePreview'),
      previewName: document.getElementById('previewName'),
      previewSize: document.getElementById('previewSize'),
      removeFileBtn: document.getElementById('removeFileBtn'),
      description: document.getElementById('description'),
      amount: document.getElementById('amount'),
      invoiceDate: document.getElementById('invoiceDate'),
      locationToggle: document.getElementById('locationToggle'),
      locationDisplay: document.getElementById('locationDisplay'),
      latValue: document.getElementById('latValue'),
      lonValue: document.getElementById('lonValue'),
      uploadBtn: document.getElementById('uploadBtn'),
      invoiceUploadForm: document.getElementById('invoiceUploadForm'),
      invoicesList: document.getElementById('invoicesList'),
      emptyState: document.getElementById('emptyState'),
      refreshInvoicesBtn: document.getElementById('refreshInvoicesBtn'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      loadingText: document.getElementById('loadingText'),
      toast: document.getElementById('toast'),
      invoiceModal: document.getElementById('invoiceModal'),
      modalBody: document.getElementById('modalBody'),
      closeModalBtn: document.getElementById('closeModalBtn'),
      closeDetailsBtn: document.getElementById('closeDetailsBtn'),
      deleteInvoiceBtn: document.getElementById('deleteInvoiceBtn')
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
    const bottomNav = new BottomNavigation('bottomNav', 'invoice');
    bottomNav.render();

    // Setup event listeners
    this.setupEventListeners();

    // Set default invoice date to today
    this.elements.invoiceDate.value = new Date().toISOString().split('T')[0];

    // Load invoices
    await this.loadInvoices();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // File input change
    this.elements.invoiceFile.addEventListener('change', (e) => this.handleFileSelect(e));

    // Remove file button
    this.elements.removeFileBtn.addEventListener('click', () => this.removeFile());

    // Drag and drop
    this.setupDragAndDrop();

    // Location toggle
    this.elements.locationToggle.addEventListener('change', (e) => this.handleLocationToggle(e));

    // Form submit
    this.elements.invoiceUploadForm.addEventListener('submit', (e) => this.handleSubmit(e));

    // Refresh invoices button
    this.elements.refreshInvoicesBtn.addEventListener('click', () => this.loadInvoices());

    // Modal close buttons
    this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
    this.elements.closeDetailsBtn.addEventListener('click', () => this.closeModal());
    this.elements.deleteInvoiceBtn.addEventListener('click', () => this.handleDeleteInvoice());

    // Close modal on backdrop click
    this.elements.invoiceModal.addEventListener('click', (e) => {
      if (e.target === this.elements.invoiceModal) {
        this.closeModal();
      }
    });
  }

  /**
   * Setup drag and drop for file input
   */
  setupDragAndDrop() {
    const dropZone = this.elements.fileInputDisplay;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.elements.invoiceFile.files = files;
        this.handleFileSelect({ target: { files: files } });
      }
    });
  }

  /**
   * Handle file selection
   */
  handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }

    // Validate file
    const validation = invoiceService.validateFile(file);
    if (!validation.isValid) {
      this.showToast(validation.error, 'error');
      this.elements.invoiceFile.value = '';
      return;
    }

    this.selectedFile = file;
    this.showFilePreview(file);
  }

  /**
   * Show file preview
   */
  showFilePreview(file) {
    this.elements.fileInputDisplay.style.display = 'none';
    this.elements.filePreview.style.display = 'flex';
    
    this.elements.previewName.textContent = file.name;
    this.elements.previewSize.textContent = this.formatFileSize(file.size);
  }

  /**
   * Remove selected file
   */
  removeFile() {
    this.selectedFile = null;
    this.elements.invoiceFile.value = '';
    this.elements.fileInputDisplay.style.display = 'flex';
    this.elements.filePreview.style.display = 'none';
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
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();

    // Validate file
    if (!this.selectedFile) {
      this.showToast('Please select a file to upload', 'error');
      return;
    }

    // Validate form fields
    const description = this.elements.description.value.trim();
    const amount = parseFloat(this.elements.amount.value);
    const invoiceDate = this.elements.invoiceDate.value;

    if (!description) {
      this.showToast('Please enter a description', 'error');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      this.showToast('Please enter a valid amount', 'error');
      return;
    }

    if (!invoiceDate) {
      this.showToast('Please select an invoice date', 'error');
      return;
    }

    // Show loading
    this.showLoading('Uploading invoice...');

    try {
      // Prepare metadata
      const metadata = {
        description: description,
        amount: amount,
        invoiceDate: invoiceDate
      };

      // Upload invoice
      const result = await invoiceService.uploadInvoice(
        this.selectedFile,
        metadata,
        this.elements.locationToggle.checked
      );

      if (result.success) {
        this.showToast('Invoice uploaded successfully', 'success');
        this.resetForm();
        await this.loadInvoices();
      } else {
        this.showToast(result.error || 'Failed to upload invoice', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      this.showToast('Failed to upload invoice. Please try again.', 'error');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Reset form
   */
  resetForm() {
    this.elements.invoiceUploadForm.reset();
    this.removeFile();
    this.elements.locationToggle.checked = false;
    this.elements.locationDisplay.style.display = 'none';
    this.currentLocation = null;
    this.elements.invoiceDate.value = new Date().toISOString().split('T')[0];
  }

  /**
   * Load invoices
   */
  async loadInvoices() {
    try {
      const invoices = await invoiceService.getInvoices(this.currentUser.id);
      this.renderInvoices(invoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      this.showToast('Failed to load invoices', 'error');
    }
  }

  /**
   * Render invoices list
   */
  renderInvoices(invoices) {
    if (!invoices || invoices.length === 0) {
      this.elements.emptyState.style.display = 'block';
      this.elements.invoicesList.innerHTML = '';
      this.elements.invoicesList.appendChild(this.elements.emptyState);
      return;
    }

    this.elements.emptyState.style.display = 'none';
    this.elements.invoicesList.innerHTML = '';

    invoices.forEach(invoice => {
      const item = this.createInvoiceItem(invoice);
      this.elements.invoicesList.appendChild(item);
    });
  }

  /**
   * Create invoice item element
   */
  createInvoiceItem(invoice) {
    const item = document.createElement('div');
    item.className = 'invoice-item';
    item.dataset.invoiceId = invoice.id;

    const statusBadge = this.createStatusBadge(invoice.status);
    const fileIcon = this.getFileIcon(invoice.fileType);

    item.innerHTML = `
      <div class="invoice-header">
        <div class="invoice-info">
          <div class="invoice-filename">
            <i class="${fileIcon}"></i>
            ${invoice.fileName}
          </div>
          <div class="invoice-description">${invoice.description}</div>
        </div>
        ${statusBadge}
      </div>
      <div class="invoice-details">
        <div class="detail-item">
          <span class="detail-label">Amount</span>
          <span class="detail-value amount">$${invoice.amount.toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Invoice Date</span>
          <span class="detail-value">${formatDate(invoice.invoiceDate)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Uploaded</span>
          <span class="detail-value">${formatDate(new Date(invoice.uploadedAt).toISOString().split('T')[0])}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Location</span>
          <span class="detail-value">${invoice.locationEnabled && invoice.location ? '✓ Captured' : 'N/A'}</span>
        </div>
      </div>
    `;

    // Add click event to show details
    item.addEventListener('click', () => this.showInvoiceDetails(invoice));

    return item;
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType) {
    if (fileType === 'application/pdf') {
      return 'fas fa-file-pdf';
    } else if (fileType.startsWith('image/')) {
      return 'fas fa-file-image';
    }
    return 'fas fa-file-alt';
  }

  /**
   * Create status badge
   */
  createStatusBadge(status) {
    const badgeClass = `badge status-${status}`;
    const badgeText = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="${badgeClass}">${badgeText}</span>`;
  }

  /**
   * Show invoice details in modal
   */
  showInvoiceDetails(invoice) {
    this.selectedInvoiceId = invoice.id;

    const statusBadge = this.createStatusBadge(invoice.status);
    const fileIcon = this.getFileIcon(invoice.fileType);

    this.elements.modalBody.innerHTML = `
      <div class="invoice-detail-grid">
        <div class="invoice-detail-row">
          <label>File Name</label>
          <div class="value">
            <i class="${fileIcon}"></i> ${invoice.fileName}
          </div>
        </div>
        <div class="invoice-detail-row">
          <label>Status</label>
          <div class="value">${statusBadge}</div>
        </div>
        <div class="invoice-detail-row">
          <label>Description</label>
          <div class="value">${invoice.description}</div>
        </div>
        <div class="invoice-detail-row">
          <label>Amount</label>
          <div class="value large">$${invoice.amount.toFixed(2)}</div>
        </div>
        <div class="invoice-detail-row">
          <label>Invoice Date</label>
          <div class="value">${formatDate(invoice.invoiceDate)}</div>
        </div>
        <div class="invoice-detail-row">
          <label>Uploaded At</label>
          <div class="value">${formatDateTime(invoice.uploadedAt)}</div>
        </div>
        <div class="invoice-detail-row">
          <label>File Size</label>
          <div class="value">${this.formatFileSize(invoice.fileData.length * 0.75)}</div>
        </div>
        ${invoice.locationEnabled && invoice.location ? `
          <div class="invoice-detail-row">
            <label>Location</label>
            <div class="value">
              Lat: ${invoice.location.lat.toFixed(6)}, Lon: ${invoice.location.lon.toFixed(6)}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.elements.invoiceModal.style.display = 'flex';
  }

  /**
   * Close modal
   */
  closeModal() {
    this.elements.invoiceModal.style.display = 'none';
    this.selectedInvoiceId = null;
  }

  /**
   * Handle delete invoice
   */
  async handleDeleteInvoice() {
    if (!this.selectedInvoiceId) {
      return;
    }

    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    this.closeModal();
    this.showLoading('Deleting invoice...');

    try {
      const result = await invoiceService.deleteInvoice(this.selectedInvoiceId);

      if (result.success) {
        this.showToast('Invoice deleted successfully', 'success');
        await this.loadInvoices();
      } else {
        this.showToast(result.error || 'Failed to delete invoice', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      this.showToast('Failed to delete invoice. Please try again.', 'error');
    } finally {
      this.hideLoading();
      this.selectedInvoiceId = null;
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
    }, 3000);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const page = new InvoicePage();
  page.init();
});

export default InvoicePage;
