/**
 * Invoice Service
 * Handles invoice upload, retrieval, and management
 */
import Invoice from '../models/Invoice.js';
import { databaseService } from './database.js';
import geolocationService from './geolocation.js';
import authService from './auth.js';

class InvoiceService {
  constructor() {
    this.storeName = databaseService.stores.INVOICES;
    this.maxFileSizeMB = 10; // Maximum file size in MB
  }

  /**
   * Upload invoice with file handling and optional geolocation
   * @param {File} file - File object (PDF or image)
   * @param {object} metadata - Invoice metadata (description, amount, invoiceDate)
   * @param {boolean} locationEnabled - Whether to capture location
   * @returns {Promise<object>} Result with success status and invoice data
   */
  async uploadInvoice(file, metadata, locationEnabled = false) {
    try {
      // Get current user
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Validate file
      const fileValidation = this.validateFile(file);
      if (!fileValidation.isValid) {
        return {
          success: false,
          error: fileValidation.error
        };
      }

      // Convert file to base64
      const fileData = await this.fileToBase64(file);

      // Get location if enabled
      let location = null;
      if (locationEnabled) {
        try {
          const position = await geolocationService.getCurrentPosition();
          location = {
            lat: position.lat,
            lon: position.lon
          };
        } catch (error) {
          console.warn('Failed to get location for invoice:', error);
          // Continue without location
        }
      }

      // Create invoice object
      const invoice = new Invoice({
        userId: currentUser.id,
        fileName: file.name,
        fileData: fileData,
        fileType: file.type,
        description: metadata.description || '',
        amount: parseFloat(metadata.amount) || 0,
        invoiceDate: metadata.invoiceDate || new Date().toISOString().split('T')[0],
        location: location,
        locationEnabled: locationEnabled,
        status: 'pending',
        uploadedAt: Date.now()
      });

      // Validate invoice
      const validation = invoice.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Save to database
      await databaseService.add(this.storeName, invoice.toJSON());

      return {
        success: true,
        message: 'Invoice uploaded successfully',
        invoice: invoice.toJSON()
      };
    } catch (error) {
      console.error('Upload invoice error:', error);
      return {
        success: false,
        error: 'Failed to upload invoice. Please try again.'
      };
    }
  }

  /**
   * Get invoices for a user
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Array>} Array of invoice records
   */
  async getInvoices(userId = null) {
    try {
      await databaseService.ensureDB();

      // Use current user if userId not provided
      if (!userId) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          return [];
        }
        userId = currentUser.id;
      }

      // Get all invoices for user
      const invoices = await databaseService.getByIndex(
        this.storeName,
        'userId',
        userId
      );

      // Sort by uploadedAt descending (most recent first)
      invoices.sort((a, b) => {
        if (a.uploadedAt > b.uploadedAt) return -1;
        if (a.uploadedAt < b.uploadedAt) return 1;
        return 0;
      });

      return invoices;
    } catch (error) {
      console.error('Get invoices error:', error);
      return [];
    }
  }

  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<object|null>} Invoice record or null
   */
  async getInvoiceById(invoiceId) {
    try {
      const invoice = await databaseService.get(this.storeName, invoiceId);
      return invoice || null;
    } catch (error) {
      console.error('Get invoice by ID error:', error);
      return null;
    }
  }

  /**
   * Delete invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<object>} Result with success status
   */
  async deleteInvoice(invoiceId) {
    try {
      // Get invoice to verify ownership
      const invoice = await this.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      // Check if user owns the invoice
      const currentUser = authService.getCurrentUser();
      if (!currentUser || invoice.userId !== currentUser.id) {
        return {
          success: false,
          error: 'You do not have permission to delete this invoice'
        };
      }

      // Delete from database
      await databaseService.delete(this.storeName, invoiceId);

      return {
        success: true,
        message: 'Invoice deleted successfully'
      };
    } catch (error) {
      console.error('Delete invoice error:', error);
      return {
        success: false,
        error: 'Failed to delete invoice. Please try again.'
      };
    }
  }

  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} status - New status ('pending' | 'processed' | 'rejected')
   * @returns {Promise<object>} Result with success status
   */
  async updateInvoiceStatus(invoiceId, status) {
    try {
      // Validate status
      if (!['pending', 'processed', 'rejected'].includes(status)) {
        return {
          success: false,
          error: 'Invalid status. Must be "pending", "processed", or "rejected"'
        };
      }

      // Get invoice
      const invoiceData = await this.getInvoiceById(invoiceId);
      
      if (!invoiceData) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      // Update status
      const invoice = Invoice.fromJSON(invoiceData);
      invoice.updateStatus(status);

      // Save to database
      await databaseService.update(this.storeName, invoice.toJSON());

      return {
        success: true,
        message: `Invoice status updated to ${status}`,
        invoice: invoice.toJSON()
      };
    } catch (error) {
      console.error('Update invoice status error:', error);
      return {
        success: false,
        error: 'Failed to update invoice status. Please try again.'
      };
    }
  }

  /**
   * Validate file type and size
   * @param {File} file - File object
   * @returns {object} Validation result
   */
  validateFile(file) {
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      };
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only PDF, JPEG, JPG, and PNG files are allowed'
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.maxFileSizeMB) {
      return {
        isValid: false,
        error: `File size exceeds ${this.maxFileSizeMB}MB limit`
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Convert file to base64 string
   * @param {File} file - File object
   * @returns {Promise<string>} Base64 encoded string
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get invoices by status
   * @param {string} status - Status to filter by
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Array>} Array of invoice records
   */
  async getInvoicesByStatus(status, userId = null) {
    try {
      await databaseService.ensureDB();

      // Get all invoices with the specified status
      const invoices = await databaseService.getByIndex(
        this.storeName,
        'status',
        status
      );

      // Filter by userId if provided
      let filteredInvoices = invoices;
      if (userId) {
        filteredInvoices = invoices.filter(invoice => invoice.userId === userId);
      }

      // Sort by uploadedAt descending
      filteredInvoices.sort((a, b) => {
        if (a.uploadedAt > b.uploadedAt) return -1;
        if (a.uploadedAt < b.uploadedAt) return 1;
        return 0;
      });

      return filteredInvoices;
    } catch (error) {
      console.error('Get invoices by status error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
export default invoiceService;
