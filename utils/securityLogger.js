/**
 * Security Logger Service - utils/securityLogger.js
 * 
 * This module provides comprehensive security logging capabilities:
 * - GDPR-compliant security and audit logging
 * - Data minimization for user data in logs
 * - Error tracking and reporting
 * - User activity monitoring
 * - Session-aware logging
 * - Configurable log retention periods
 * - Data processing purposes tracking
 */

import axios from 'axios';

// Logging API endpoint
const LOG_API_URL = process.env.REACT_APP_LOG_API_URL || 'http://localhost:5000/api/logging';

// Log levels
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY',
  AUDIT: 'AUDIT',
  GDPR: 'GDPR'
};

// Data processing purposes (GDPR)
const DATA_PURPOSES = {
  USER_REQUEST: 'Responding to user request',
  SYSTEM_FUNCTION: 'Necessary system function',
  ANALYTICS: 'Service improvement analytics',
  ERROR_REPORTING: 'Error diagnosis and resolution',
  SECURITY: 'Security monitoring',
  LEGAL_COMPLIANCE: 'Legal compliance requirement'
};

// PII field patterns to detect/redact
const PII_PATTERNS = [
  /\b[A-Z]{2}\s?\d{4,}\s?\d{4,}\s?\d{4,}\s?\d{4,}\b/g, // IBAN-like patterns
  /\b\d{3}-\d{3}-\d{3}|\d{3}\s\d{3}\s\d{3}\b/g, // Polish ID numbers
  /\b\d{6}[0-9A-Za-z]{8,}\b/g, // Payment/card numbers
  /\b(?:\+?48)?[-\s]?(?:(?:(?:5[01]|[5-9][0-9])|(?:6[0-9]|[7-8][0-9])|(?:9[0-9]))[-\s]?)?(?:\d[-\s]?){7}\d\b/g // Polish phone numbers
];

// Email patterns for redaction
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Initialize logger configuration
let loggerConfig = {
  enabled: true,
  minLevel: LOG_LEVELS.INFO,
  redactPII: true,
  useLocalStorage: true,
  useRemoteLogging: true,
  retentionDays: 90
};

/**
 * Initializes the security logger with configuration
 * 
 * @param {Object} config - Logger configuration
 */
export const initializeLogger = (config = {}) => {
  loggerConfig = { ...loggerConfig, ...config };
  
  // Log initialization
  logToConsole(LOG_LEVELS.INFO, 'Security logger initialized', { 
    config: { ...loggerConfig, remoteEndpoint: LOG_API_URL } 
  });
};

/**
 * Logs user activity for audit purposes with GDPR compliance
 * 
 * @param {Object} activityData - Activity information
 * @returns {Promise<boolean>} - Success status
 */
export const logUserActivity = async (activityData) => {
  if (!loggerConfig.enabled) return false;
  
  try {
    // Create activity log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: LOG_LEVELS.AUDIT,
      session: getSessionId(),
      userId: getAnonymizedUserId(),
      action: activityData.action,
      component: activityData.component || 'unknown',
      dataPurpose: DATA_PURPOSES.USER_REQUEST,
      ...prepareActivityData(activityData)
    };
    
    // Log activity
    await logToSystem(LOG_LEVELS.AUDIT, 'User activity', logEntry);
    return true;
  } catch (error) {
    console.error('Error logging user activity:', error);
    return false;
  }
};

/**
 * Logs errors with appropriate handling and PII redaction
 * 
 * @param {Object} errorData - Error information
 * @returns {Promise<string>} - Error ID for reference
 */
export const logError = async (errorData) => {
  if (!loggerConfig.enabled) return '';
  
  try {
    // Generate unique error ID for reference
    const errorId = generateErrorId();
    
    // Create error log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: LOG_LEVELS.ERROR,
      errorId: errorId,
      session: getSessionId(),
      userId: getAnonymizedUserId(),
      component: errorData.component || 'unknown',
      method: errorData.method || 'unknown',
      message: errorData.error || 'Unknown error',
      dataPurpose: DATA_PURPOSES.ERROR_REPORTING,
      details: redactSensitiveData(errorData.details || {})
    };
    
    // Log error
    await logToSystem(LOG_LEVELS.ERROR, 'Application error', logEntry);
    return errorId;
  } catch (error) {
    console.error('Error in error logging:', error);
    return '';
  }
};

/**
 * Logs GDPR-related events (consent, data access, erasure)
 * 
 * @param {Object} gdprData - GDPR event information
 * @returns {Promise<boolean>} - Success status
 */
export const logGDPREvent = async (gdprData) => {
  if (!loggerConfig.enabled) return false;
  
  try {
    // Create GDPR log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: LOG_LEVELS.GDPR,
      session: getSessionId(),
      userId: getAnonymizedUserId(),
      action: gdprData.action, // 'consent_given', 'consent_withdrawn', 'data_accessed', 'data_erased'
      dataCategories: gdprData.dataCategories || [],
      dataPurpose: DATA_PURPOSES.LEGAL_COMPLIANCE,
      details: redactSensitiveData(gdprData.details || {})
    };
    
    // Log GDPR event
    await logToSystem(LOG_LEVELS.GDPR, 'GDPR event', logEntry);
    return true;
  } catch (error) {
    console.error('Error logging GDPR event:', error);
    return false;
  }
};

/**
 * Logs security events
 * 
 * @param {Object} securityData - Security event information
 * @returns {Promise<boolean>} - Success status
 */
export const logSecurityEvent = async (securityData) => {
  if (!loggerConfig.enabled) return false;
  
  try {
    // Create security log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: LOG_LEVELS.SECURITY,
      session: getSessionId(),
      userId: getAnonymizedUserId(),
      action: securityData.action, // 'login_attempt', 'password_change', 'permission_change', etc.
      status: securityData.status, // 'success', 'failure'
      dataPurpose: DATA_PURPOSES.SECURITY,
      ipAddress: securityData.ipAddress ? hashIpAddress(securityData.ipAddress) : null,
      details: redactSensitiveData(securityData.details || {})
    };
    
    // Log security event with high priority
    await logToSystem(LOG_LEVELS.SECURITY, 'Security event', logEntry, true);
    return true;
  } catch (error) {
    console.error('Error logging security event:', error);
    return false;
  }
};

/**
 * Main logging function that handles all log dispatch
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Log data
 * @param {boolean} highPriority - Whether this is a high priority log
 * @returns {Promise<boolean>} - Success status
 */
async function logToSystem(level, message, data, highPriority = false) {
  // Skip if disabled or below minimum level
  if (!loggerConfig.enabled || !isLevelEnabled(level)) {
    return false;
  }
  
  // Always log to console for debugging
  logToConsole(level, message, data);
  
  // Log to local storage if enabled
  if (loggerConfig.useLocalStorage) {
    logToLocalStorage(level, message, data);
  }
  
  // Log to remote API if enabled
  if (loggerConfig.useRemoteLogging || highPriority) {
    try {
      await logToRemote(level, message, data);
    } catch (error) {
      console.error('Remote logging failed:', error);
      // Ensure high priority logs are saved locally on remote failure
      if (highPriority) {
        logToLocalStorage(level, message, { ...data, remoteLoggingFailed: true });
      }
    }
  }
  
  return true;
}

/**
 * Logs to browser console with appropriate formatting
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Log data
 */
function logToConsole(level, message, data) {
  // Skip in production unless it's an error
  if (process.env.NODE_ENV === 'production' && level !== LOG_LEVELS.ERROR) {
    return;
  }
  
  const logPrefix = `[${level}] ${message}`;
  
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(logPrefix, data);
      break;
    case LOG_LEVELS.WARN:
      console.warn(logPrefix, data);
      break;
    case LOG_LEVELS.SECURITY:
    case LOG_LEVELS.AUDIT:
    case LOG_LEVELS.GDPR:
      console.info(`%c${logPrefix}`, 'color: #9c27b0; font-weight: bold', data);
      break;
    case LOG_LEVELS.INFO:
      console.info(logPrefix, data);
      break;
    default:
      console.log(logPrefix, data);
  }
}

/**
 * Logs to local storage with rotation policy
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Log data
 */
function logToLocalStorage(level, message, data) {
  try {
    // Get existing logs
    const logsKey = `security_logs_${level.toLowerCase()}`;
    const existingLogs = JSON.parse(localStorage.getItem(logsKey) || '[]');
    
    // Add new log
    existingLogs.push({
      timestamp: new Date().toISOString(),
      message,
      ...data
    });
    
    // Limit log size
    const maxLogs = level === LOG_LEVELS.ERROR ? 100 : 50;
    const trimmedLogs = existingLogs.slice(-maxLogs);
    
    // Save back to storage
    localStorage.setItem(logsKey, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Error logging to local storage:', error);
  }
}

/**
 * Logs to remote logging API
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Log data
 * @returns {Promise<Object>} - API response
 */
async function logToRemote(level, message, data) {
  try {
    // Prepare log payload
    const logPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      application: 'financial-dashboard',
      ...data
    };
    
    // Send to logging API
    const response = await axios.post(`${LOG_API_URL}/${level.toLowerCase()}`, logPayload, {
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json',
        'X-Log-Source': 'web-client'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Remote logging error:', error);
    throw error;
  }
}

// Helper functions

/**
 * Checks if a log level is enabled
 * 
 * @param {string} level - Log level to check
 * @returns {boolean} - Whether level is enabled
 */
function isLevelEnabled(level) {
  const levels = Object.values(LOG_LEVELS);
  const minLevelIndex = levels.indexOf(loggerConfig.minLevel);
  const currentLevelIndex = levels.indexOf(level);
  
  return currentLevelIndex >= minLevelIndex;
}

/**
 * Gets or generates a session ID
 * 
 * @returns {string} - Session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('security_session_id');
  
  if (!sessionId) {
    sessionId = generateRandomId();
    sessionStorage.setItem('security_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Gets anonymized user ID for logging
 * 
 * @returns {string} - Anonymized user ID
 */
function getAnonymizedUserId() {
  const userId = localStorage.getItem('userId') || '';
  
  if (!userId) return 'anonymous';
  
  // Create a hash from user ID
  return hashUserId(userId);
}

/**
 * Prepares activity data for logging, removing sensitive information
 * 
 * @param {Object} activityData - Original activity data
 * @returns {Object} - Sanitized activity data
 */
function prepareActivityData(activityData) {
  // Create a copy to avoid modifying original
  const sanitizedData = { ...activityData };
  
  // Remove specific fields that might contain sensitive data
  delete sanitizedData.userProfile;
  delete sanitizedData.personalData;
  delete sanitizedData.financialData;
  delete sanitizedData.credentials;
  
  // Redact any remaining sensitive data
  return redactSensitiveData(sanitizedData);
}

/**
 * Redacts potentially sensitive data from objects
 * 
 * @param {Object|Array|string} data - Data to redact
 * @returns {Object|Array|string} - Redacted data
 */
function redactSensitiveData(data) {
  if (!loggerConfig.redactPII) return data;
  
  if (typeof data === 'string') {
    // Redact PII from strings
    let redactedString = data;
    
    // Apply each PII pattern
    PII_PATTERNS.forEach(pattern => {
      redactedString = redactedString.replace(pattern, '[REDACTED]');
    });
    
    // Redact emails
    redactedString = redactedString.replace(EMAIL_PATTERN, '[EMAIL]');
    
    return redactedString;
  } else if (Array.isArray(data)) {
    // Recursively redact array items
    return data.map(item => redactSensitiveData(item));
  } else if (data !== null && typeof data === 'object') {
    // Recursively redact object properties
    const redactedObject = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip known sensitive keys
      if (['password', 'token', 'secret', 'key', 'pin', 'pesel', 'nip'].includes(key.toLowerCase())) {
        redactedObject[key] = '[REDACTED]';
      } else {
        redactedObject[key] = redactSensitiveData(value);
      }
    }
    
    return redactedObject;
  }
  
  return data;
}

/**
 * Generates a random ID
 * 
 * @returns {string} - Random ID
 */
function generateRandomId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique error ID
 * 
 * @returns {string} - Error ID
 */
function generateErrorId() {
  return `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Creates a hash from a user ID
 * 
 * @param {string} userId - Original user ID
 * @returns {string} - Hashed user ID
 */
function hashUserId(userId) {
  // Simple string hash function - in production use a cryptographic hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'user-' + Math.abs(hash).toString(16);
}

/**
 * Hashes an IP address for secure logging
 * 
 * @param {string} ipAddress - Original IP address
 * @returns {string} - Partial hash of IP address
 */
function hashIpAddress(ipAddress) {
  // Only keep first portion of IP for general location tracking
  const ipParts = ipAddress.split('.');
  if (ipParts.length === 4) {
    // IPv4
    return `${ipParts[0]}.${ipParts[1]}.*.*`;
  }
  // IPv6 or other
  return '[REDACTED_IP]';
}

// Export the API for use in the application
export default {
  initializeLogger,
  logUserActivity,
  logError,
  logGDPREvent,
  logSecurityEvent,
  LOG_LEVELS,
  DATA_PURPOSES
};