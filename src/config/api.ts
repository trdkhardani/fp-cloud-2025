// API Configuration
export const API_CONFIG = {
  baseUrl: (() => {
    // Check if we're in development mode
    if (import.meta.env.DEV) {
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    }
    
    // In production (Docker), use the current host with API path
    // This works because nginx proxies /api/* to the backend
    return window.location.origin;
  })(),
  apiKey: import.meta.env.VITE_API_KEY || '',
  faceService: import.meta.env.VITE_FACE_SERVICE || 'deepface',
  minConfidence: Number(import.meta.env.VITE_MIN_CONFIDENCE) || 85,
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Timeouts
  requestTimeout: 30000, // 30 seconds
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  
  // Image processing
  maxImageSize: 5 * 1024 * 1024, // 5MB
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Face detection settings
  faceDetection: {
    minFaceSize: 100, // minimum face size in pixels
    maxFaces: 1, // only process single face for attendance
  },
} as const;

// Validation helper
export const validateApiConfig = () => {
  const errors: string[] = [];
  
  if (!API_CONFIG.baseUrl) {
    errors.push('API base URL is required');
  }
  
  if (API_CONFIG.minConfidence < 0 || API_CONFIG.minConfidence > 100) {
    errors.push('Minimum confidence must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}; 