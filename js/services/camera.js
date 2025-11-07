/**
 * Camera Service
 * Handles camera access, image capture, and image processing
 */

class CameraService {
  constructor() {
    this.stream = null;
    this.permissionGranted = false;
  }

  /**
   * Request permission to access device camera
   * @returns {Promise<boolean>} True if permission granted
   */
  async requestCameraPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera is not supported by this browser');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      // Stop the stream immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      
      this.permissionGranted = true;
      return true;
    } catch (error) {
      this.permissionGranted = false;
      throw this._handleCameraError(error);
    }
  }

  /**
   * Capture image from camera
   * @param {Object} options - Capture options
   * @param {number} options.quality - Image quality (0-1, default: 0.8)
   * @param {number} options.maxWidth - Maximum width (default: 1920)
   * @param {number} options.maxHeight - Maximum height (default: 1080)
   * @returns {Promise<string>} Base64 encoded image
   */
  async captureImage(options = {}) {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080
    } = options;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera is not supported by this browser');
    }

    try {
      // Get camera stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: maxWidth },
          height: { ideal: maxHeight }
        },
        audio: false
      });

      // Create video element
      const video = document.createElement('video');
      video.srcObject = this.stream;
      video.setAttribute('playsinline', 'true');
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Wait a bit for camera to adjust
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop camera stream
      this.stopCamera();

      // Compress and convert to base64
      const base64Image = await this.compressImage(canvas, quality, maxWidth, maxHeight);
      
      return base64Image;
    } catch (error) {
      this.stopCamera();
      throw this._handleCameraError(error);
    }
  }

  /**
   * Capture image using file input (fallback method)
   * @param {File} file - Image file from input
   * @param {Object} options - Compression options
   * @returns {Promise<string>} Base64 encoded image
   */
  async captureFromFile(file, options = {}) {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080
    } = options;

    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Invalid image file');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = width * ratio;
              height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext('2d');
            context.drawImage(img, 0, 0, width, height);

            const base64 = canvas.toDataURL('image/jpeg', quality);
            resolve(base64);
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target.result;
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress image and convert to base64
   * @param {HTMLCanvasElement|HTMLImageElement} source - Image source
   * @param {number} quality - Compression quality (0-1)
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {Promise<string>} Base64 encoded image
   */
  async compressImage(source, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        let width, height;

        if (source instanceof HTMLCanvasElement) {
          width = source.width;
          height = source.height;
        } else if (source instanceof HTMLImageElement) {
          width = source.naturalWidth || source.width;
          height = source.naturalHeight || source.height;
        } else {
          reject(new Error('Invalid image source'));
          return;
        }

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { alpha: false });
        
        // Enable image smoothing for better quality
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Fill with white background for transparency
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, width, height);
        
        context.drawImage(source, 0, 0, width, height);

        // Convert to base64 with compression
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      } catch (error) {
        reject(new Error(`Image compression failed: ${error.message}`));
      }
    });
  }

  /**
   * Compress image with progressive quality reduction
   * @param {HTMLCanvasElement|HTMLImageElement} source - Image source
   * @param {number} targetSizeKB - Target size in KB
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {Promise<string>} Base64 encoded image
   */
  async compressToSize(source, targetSizeKB = 500, maxWidth = 1920, maxHeight = 1080) {
    let quality = 0.9;
    let compressed = await this.compressImage(source, quality, maxWidth, maxHeight);
    
    // Calculate size in KB
    let sizeKB = (compressed.length * 0.75) / 1024; // Base64 is ~33% larger
    
    // Reduce quality until target size is reached
    while (sizeKB > targetSizeKB && quality > 0.1) {
      quality -= 0.1;
      compressed = await this.compressImage(source, quality, maxWidth, maxHeight);
      sizeKB = (compressed.length * 0.75) / 1024;
    }
    
    return compressed;
  }

  /**
   * Convert file to base64
   * @param {File} file - Image file
   * @returns {Promise<string>} Base64 encoded string
   */
  convertToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Stop camera stream
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Check if camera is available
   * @returns {boolean}
   */
  isCameraAvailable() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Handle camera errors
   * @private
   */
  _handleCameraError(error) {
    let message = 'Unable to access camera';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = 'Camera permission denied. Please enable camera access in your browser settings.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      message = 'No camera found on this device.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      message = 'Camera is already in use by another application.';
    } else if (error.name === 'OverconstrainedError') {
      message = 'Camera does not meet the required specifications.';
    } else if (error.name === 'NotSupportedError') {
      message = 'Camera is not supported by this browser.';
    } else if (error.message) {
      message = `Camera error: ${error.message}`;
    }

    const err = new Error(message);
    err.name = error.name;
    return err;
  }

  /**
   * Get image dimensions from base64
   * @param {string} base64 - Base64 encoded image
   * @returns {Promise<{width: number, height: number}>}
   */
  getImageDimensions(base64) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64;
    });
  }
}

// Export singleton instance
const cameraService = new CameraService();
export default cameraService;
