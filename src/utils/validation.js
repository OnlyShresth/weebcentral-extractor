/**
 * Validation utilities for user input
 */

/**
 * Validate WeebCentral profile URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export function validateProfileUrl(url) {
    if (!url || typeof url !== 'string') {
        return {
            valid: false,
            error: 'URL is required and must be a string'
        };
    }
    
    const trimmedUrl = url.trim();
    
    // Check if it's a valid URL
    try {
        new URL(trimmedUrl);
    } catch (e) {
        return {
            valid: false,
            error: 'Invalid URL format'
        };
    }
    
    // Check if it's a WeebCentral URL
    if (!trimmedUrl.includes('weebcentral.com')) {
        return {
            valid: false,
            error: 'URL must be from weebcentral.com'
        };
    }
    
    // Check if it's a user profile URL
    if (!trimmedUrl.includes('/users/')) {
        return {
            valid: false,
            error: 'URL must be a user profile URL (must contain /users/)'
        };
    }
    
    return {
        valid: true,
        url: trimmedUrl
    };
}

/**
 * Sanitize user ID to prevent path traversal
 * @param {string} userId - User ID to sanitize
 * @returns {string} Sanitized user ID
 */
export function sanitizeUserId(userId) {
    if (!userId) return 'unknown';
    
    // Remove any path traversal attempts and special characters
    return userId
        .replace(/\.\./g, '')
        .replace(/[\/\\]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .substring(0, 100); // Limit length
}

/**
 * Validate subscription data structure
 * @param {Array} subscriptions - Array of subscriptions to validate
 * @returns {Object} Validation result
 */
export function validateSubscriptions(subscriptions) {
    if (!Array.isArray(subscriptions)) {
        return {
            valid: false,
            error: 'Subscriptions must be an array'
        };
    }
    
    if (subscriptions.length === 0) {
        return {
            valid: true,
            warning: 'No subscriptions found'
        };
    }
    
    // Validate each subscription has required fields
    const invalidItems = subscriptions.filter(sub => !sub.title);
    
    if (invalidItems.length > 0) {
        return {
            valid: false,
            error: `${invalidItems.length} subscriptions are missing required 'title' field`
        };
    }
    
    return {
        valid: true,
        count: subscriptions.length
    };
}

/**
 * Validate export file type
 * @param {string} fileType - Type of export file
 * @returns {boolean} Whether the file type is valid
 */
export function validateFileType(fileType) {
    const validTypes = ['malXml', 'malText', 'mangaDexJson', 'mangaDexText', 'csv', 'summary'];
    return validTypes.includes(fileType);
}
