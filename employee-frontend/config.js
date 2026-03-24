// Environment configuration
const CONFIG = {
    API_BASE: 'http://localhost:8080/api',
    APP_NAME: 'EMS Pro',
    VERSION: '1.0.0'
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}