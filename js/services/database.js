/**
 * IndexedDB wrapper for structured data storage
 * Manages database schema and CRUD operations
 */
class DatabaseService {
  constructor() {
    this.dbName = 'EmployeePayrollDB';
    this.version = 1;
    this.db = null;
    
    // Object store names
    this.stores = {
      USERS: 'users',
      ATTENDANCE: 'attendance',
      INVOICES: 'invoices',
      LEAVE: 'leave',
      KPIS: 'kpis'
    };
  }

  /**
   * Initialize database and create object stores
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create Users store
        if (!db.objectStoreNames.contains(this.stores.USERS)) {
          const userStore = db.createObjectStore(this.stores.USERS, { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('userType', 'userType', { unique: false });
          userStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // Create Attendance store with optimized compound indexes
        if (!db.objectStoreNames.contains(this.stores.ATTENDANCE)) {
          const attendanceStore = db.createObjectStore(this.stores.ATTENDANCE, { keyPath: 'id' });
          attendanceStore.createIndex('userId', 'userId', { unique: false });
          attendanceStore.createIndex('date', 'date', { unique: false });
          attendanceStore.createIndex('status', 'status', { unique: false });
          attendanceStore.createIndex('userId_date', ['userId', 'date'], { unique: false });
          attendanceStore.createIndex('userId_status', ['userId', 'status'], { unique: false });
          attendanceStore.createIndex('status_date', ['status', 'date'], { unique: false });
        }

        // Create Invoices store with optimized indexes
        if (!db.objectStoreNames.contains(this.stores.INVOICES)) {
          const invoiceStore = db.createObjectStore(this.stores.INVOICES, { keyPath: 'id' });
          invoiceStore.createIndex('userId', 'userId', { unique: false });
          invoiceStore.createIndex('status', 'status', { unique: false });
          invoiceStore.createIndex('invoiceDate', 'invoiceDate', { unique: false });
          invoiceStore.createIndex('userId_status', ['userId', 'status'], { unique: false });
          invoiceStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        }

        // Create Leave store with optimized indexes
        if (!db.objectStoreNames.contains(this.stores.LEAVE)) {
          const leaveStore = db.createObjectStore(this.stores.LEAVE, { keyPath: 'id' });
          leaveStore.createIndex('userId', 'userId', { unique: false });
          leaveStore.createIndex('status', 'status', { unique: false });
          leaveStore.createIndex('startDate', 'startDate', { unique: false });
          leaveStore.createIndex('userId_status', ['userId', 'status'], { unique: false });
          leaveStore.createIndex('status_startDate', ['status', 'startDate'], { unique: false });
        }

        // Create KPIs store with optimized indexes
        if (!db.objectStoreNames.contains(this.stores.KPIS)) {
          const kpiStore = db.createObjectStore(this.stores.KPIS, { keyPath: 'id' });
          kpiStore.createIndex('userId', 'userId', { unique: false });
          kpiStore.createIndex('status', 'status', { unique: false });
          kpiStore.createIndex('createdAt', 'createdAt', { unique: false });
          kpiStore.createIndex('userId_status', ['userId', 'status'], { unique: false });
          kpiStore.createIndex('userId_createdAt', ['userId', 'createdAt'], { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  /**
   * Generic add operation
   * @param {string} storeName - Object store name
   * @param {Object} data - Data to add
   * @returns {Promise<string>} ID of added record
   */
  async add(storeName, data) {
    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(new Error(`Failed to add to ${storeName}`));
        };

        transaction.onerror = () => {
          reject(new Error(`Transaction failed for ${storeName}`));
        };
      });
    } catch (error) {
      console.error(`Add operation failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Generic get operation by ID
   * @param {string} storeName - Object store name
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>}
   */
  async get(storeName, id) {
    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(new Error(`Failed to get from ${storeName}`));
        };
      });
    } catch (error) {
      console.error(`Get operation failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Generic get all operation
   * @param {string} storeName - Object store name
   * @returns {Promise<Array>}
   */
  async getAll(storeName) {
    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(new Error(`Failed to get all from ${storeName}`));
        };
      });
    } catch (error) {
      console.error(`GetAll operation failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Generic update operation
   * @param {string} storeName - Object store name
   * @param {Object} data - Data to update (must include id)
   * @returns {Promise<string>}
   */
  async update(storeName, data) {
    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(new Error(`Failed to update ${storeName}`));
        };

        transaction.onerror = () => {
          reject(new Error(`Transaction failed for ${storeName}`));
        };
      });
    } catch (error) {
      console.error(`Update operation failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Generic delete operation
   * @param {string} storeName - Object store name
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async delete(storeName, id) {
    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to delete from ${storeName}`));
        };

        transaction.onerror = () => {
          reject(new Error(`Transaction failed for ${storeName}`));
        };
      });
    } catch (error) {
      console.error(`Delete operation failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Query by index
   * @param {string} storeName - Object store name
   * @param {string} indexName - Index name
   * @param {*} value - Value to query
   * @returns {Promise<Array>}
   */
  async getByIndex(storeName, indexName, value) {
    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(new Error(`Failed to query ${storeName} by ${indexName}`));
        };
      });
    } catch (error) {
      console.error(`Query by index failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Query with range
   * @param {string} storeName - Object store name
   * @param {string} indexName - Index name
   * @param {IDBKeyRange} range - Key range
   * @returns {Promise<Array>}
   */
  async getByRange(storeName, indexName, range) {
    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(range);

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(new Error(`Failed to query ${storeName} by range`));
        };
      });
    } catch (error) {
      console.error(`Query by range failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Clear all data from a store
   * @param {string} storeName - Object store name
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    try {
      await this.ensureDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to clear ${storeName}`));
        };
      });
    } catch (error) {
      console.error(`Clear operation failed for ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete entire database
   * @returns {Promise<void>}
   */
  async deleteDatabase() {
    this.close();
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete database'));
      };
    });
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
