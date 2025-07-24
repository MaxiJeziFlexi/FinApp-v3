/**
 * Security and activity logging utility
 */

/**
 * Log user activity for audit purposes
 * @param {Object} activity - Activity data
 */
export const logUserActivity = async (activity) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('userId') || 'anonymous',
      sessionId: localStorage.getItem('sessionId') || 'unknown',
      ...activity
    };
    
    // In production, this would send to a logging service
    console.log('User Activity:', logEntry);
    
    // Store locally for development
    const logs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('userActivityLogs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
};

/**
 * Log error for debugging and monitoring
 * @param {Object} error - Error data
 */
export const logError = async (error) => {
  try {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('userId') || 'anonymous',
      sessionId: localStorage.getItem('sessionId') || 'unknown',
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...error
    };
    
    // In production, this would send to an error monitoring service
    console.error('Application Error:', errorEntry);
    
    // Store locally for development
    const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    errorLogs.push(errorEntry);
    
    // Keep only last 50 error logs
    if (errorLogs.length > 50) {
      errorLogs.splice(0, errorLogs.length - 50);
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};

/**
 * Get user activity logs
 * @returns {Array} - Array of activity logs
 */
export const getUserActivityLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
  } catch (error) {
    console.error('Failed to get user activity logs:', error);
    return [];
  }
};

/**
 * Get error logs
 * @returns {Array} - Array of error logs
 */
export const getErrorLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('errorLogs') || '[]');
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return [];
  }
};

/**
 * Clear all logs
 */
export const clearLogs = () => {
  try {
    localStorage.removeItem('userActivityLogs');
    localStorage.removeItem('errorLogs');
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
};

export default {
  logUserActivity,
  logError,
  getUserActivityLogs,
  getErrorLogs,
  clearLogs
};