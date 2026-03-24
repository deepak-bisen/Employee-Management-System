// Utility functions for sanitization, validation, and DOM manipulation

// Sanitization functions
const sanitizeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

const sanitizeAttribute = (str) => {
    return str.replace(/[<>"'&]/g, (match) => {
        const entityMap = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;'
        };
        return entityMap[match];
    });
};

const escapeForJS = (str) => {
    return str.replace(/['"\\]/g, '\\$&');
};

// Validation functions
const validators = {
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    required: (value) => {
        return value && value.trim().length > 0;
    },

    minLength: (value, min) => {
        return value && value.length >= min;
    },

    dateRange: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start <= end;
    },

    futureDate: (date) => {
        const inputDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate >= today;
    }
};

// Safe DOM manipulation
const safeSetInnerHTML = (elementId, html) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
    }
};

const safeSetTextContent = (elementId, text) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
};

const createElementFromHTML = (htmlString) => {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
};

// Loading states
const showLoading = (elementId, message = 'Loading...') => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                <span class="text-gray-600">${message}</span>
            </div>
        `;
    }
};

const hideLoading = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
};

// Error handling
const showError = (message, elementId = 'errorMessage') => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-live', 'assertive');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
};

const showSuccess = (message, elementId = 'successMessage') => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
        element.setAttribute('role', 'status');
        element.setAttribute('aria-live', 'polite');

        // Auto-hide after 3 seconds
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    }
};

// Form validation
const validateForm = (formData, rules) => {
    const errors = [];

    for (const [field, value] of Object.entries(formData)) {
        const fieldRules = rules[field];
        if (!fieldRules) continue;

        for (const rule of fieldRules) {
            const [ruleName, ...params] = Array.isArray(rule) ? rule : [rule];

            if (ruleName === 'required' && !validators.required(value)) {
                errors.push(`${field} is required`);
            } else if (ruleName === 'email' && !validators.email(value)) {
                errors.push(`Please enter a valid email address`);
            } else if (ruleName === 'minLength' && !validators.minLength(value, params[0])) {
                errors.push(`${field} must be at least ${params[0]} characters long`);
            }
        }
    }

    return errors;
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        sanitizeAttribute,
        escapeForJS,
        validators,
        safeSetInnerHTML,
        safeSetTextContent,
        createElementFromHTML,
        showLoading,
        hideLoading,
        showError,
        showSuccess,
        validateForm
    };
}