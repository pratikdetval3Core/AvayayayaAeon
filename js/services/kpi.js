/**
 * KPI Service
 * Handles KPI data management, submission, and retrieval
 */
import databaseService from './database.js';
import KPI from '../models/KPI.js';

class KPIService {
  constructor() {
    this.storeName = databaseService.stores.KPIS;
  }

  /**
   * Submit a new KPI entry
   * @param {Object} kpiData - KPI data
   * @param {string} kpiData.userId - User ID
   * @param {string} kpiData.title - KPI title
   * @param {string} kpiData.description - KPI description
   * @param {string} kpiData.value - KPI value/metric
   * @param {string} kpiData.status - KPI status (in_progress, completed, pending)
   * @param {string|null} image - Base64 encoded image (optional)
   * @param {Object|null} location - Location data {lat, lon} (optional)
   * @returns {Promise<KPI>} Created KPI instance
   */
  async submitKPI(kpiData, image = null, location = null) {
    try {
      // Create KPI instance
      const kpi = new KPI({
        userId: kpiData.userId,
        title: kpiData.title,
        description: kpiData.description,
        value: kpiData.value,
        status: kpiData.status || 'pending',
        image: image,
        location: location,
        locationEnabled: location !== null
      });

      // Validate KPI data
      const validation = kpi.validate();
      if (!validation.isValid) {
        throw new Error(`KPI validation failed: ${validation.errors.join(', ')}`);
      }

      // Save to database
      await databaseService.add(this.storeName, kpi.toJSON());

      return kpi;
    } catch (error) {
      console.error('Failed to submit KPI:', error);
      throw new Error(`Failed to submit KPI: ${error.message}`);
    }
  }

  /**
   * Get all KPIs for a user
   * @param {string} userId - User ID
   * @returns {Promise<KPI[]>} Array of KPI instances
   */
  async getKPIs(userId) {
    try {
      const kpis = await databaseService.getByIndex(this.storeName, 'userId', userId);
      
      // Sort by createdAt descending (newest first)
      kpis.sort((a, b) => b.createdAt - a.createdAt);
      
      return kpis.map(kpi => KPI.fromJSON(kpi));
    } catch (error) {
      console.error('Failed to get KPIs:', error);
      throw new Error(`Failed to get KPIs: ${error.message}`);
    }
  }

  /**
   * Get a single KPI by ID
   * @param {string} kpiId - KPI ID
   * @returns {Promise<KPI|null>} KPI instance or null if not found
   */
  async getKPIById(kpiId) {
    try {
      const kpiData = await databaseService.get(this.storeName, kpiId);
      
      if (!kpiData) {
        return null;
      }
      
      return KPI.fromJSON(kpiData);
    } catch (error) {
      console.error('Failed to get KPI by ID:', error);
      throw new Error(`Failed to get KPI: ${error.message}`);
    }
  }

  /**
   * Update KPI status
   * @param {string} kpiId - KPI ID
   * @param {string} status - New status (in_progress, completed, pending)
   * @returns {Promise<KPI>} Updated KPI instance
   */
  async updateKPIStatus(kpiId, status) {
    try {
      // Get existing KPI
      const kpi = await this.getKPIById(kpiId);
      
      if (!kpi) {
        throw new Error('KPI not found');
      }

      // Update status
      kpi.updateStatus(status);

      // Save to database
      await databaseService.update(this.storeName, kpi.toJSON());

      return kpi;
    } catch (error) {
      console.error('Failed to update KPI status:', error);
      throw new Error(`Failed to update KPI status: ${error.message}`);
    }
  }

  /**
   * Delete a KPI
   * @param {string} kpiId - KPI ID
   * @returns {Promise<void>}
   */
  async deleteKPI(kpiId) {
    try {
      await databaseService.delete(this.storeName, kpiId);
    } catch (error) {
      console.error('Failed to delete KPI:', error);
      throw new Error(`Failed to delete KPI: ${error.message}`);
    }
  }

  /**
   * Get KPIs by status
   * @param {string} userId - User ID
   * @param {string} status - Status to filter by
   * @returns {Promise<KPI[]>} Array of KPI instances
   */
  async getKPIsByStatus(userId, status) {
    try {
      const allKPIs = await this.getKPIs(userId);
      return allKPIs.filter(kpi => kpi.status === status);
    } catch (error) {
      console.error('Failed to get KPIs by status:', error);
      throw new Error(`Failed to get KPIs by status: ${error.message}`);
    }
  }

  /**
   * Get KPIs within a date range
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<KPI[]>} Array of KPI instances
   */
  async getKPIsByDateRange(userId, startDate, endDate) {
    try {
      const allKPIs = await this.getKPIs(userId);
      
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      return allKPIs.filter(kpi => {
        return kpi.createdAt >= startTime && kpi.createdAt <= endTime;
      });
    } catch (error) {
      console.error('Failed to get KPIs by date range:', error);
      throw new Error(`Failed to get KPIs by date range: ${error.message}`);
    }
  }

  /**
   * Update KPI data
   * @param {string} kpiId - KPI ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<KPI>} Updated KPI instance
   */
  async updateKPI(kpiId, updates) {
    try {
      // Get existing KPI
      const kpi = await this.getKPIById(kpiId);
      
      if (!kpi) {
        throw new Error('KPI not found');
      }

      // Update KPI
      kpi.update(updates);

      // Validate updated KPI
      const validation = kpi.validate();
      if (!validation.isValid) {
        throw new Error(`KPI validation failed: ${validation.errors.join(', ')}`);
      }

      // Save to database
      await databaseService.update(this.storeName, kpi.toJSON());

      return kpi;
    } catch (error) {
      console.error('Failed to update KPI:', error);
      throw new Error(`Failed to update KPI: ${error.message}`);
    }
  }

  /**
   * Get KPI statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics object
   */
  async getKPIStatistics(userId) {
    try {
      const kpis = await this.getKPIs(userId);
      
      const stats = {
        total: kpis.length,
        pending: 0,
        inProgress: 0,
        completed: 0,
        withImages: 0,
        withLocation: 0
      };

      kpis.forEach(kpi => {
        if (kpi.isPending()) stats.pending++;
        if (kpi.isInProgress()) stats.inProgress++;
        if (kpi.isCompleted()) stats.completed++;
        if (kpi.hasImage()) stats.withImages++;
        if (kpi.hasLocation()) stats.withLocation++;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get KPI statistics:', error);
      throw new Error(`Failed to get KPI statistics: ${error.message}`);
    }
  }
}

// Export singleton instance
const kpiService = new KPIService();
export default kpiService;
