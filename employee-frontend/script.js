// Employee Management System Frontend
// Main application script with enhanced security, validation, and UX

// Import utilities (in browser environment, these will be loaded via script tags)
//const CONFIG = window.CONFIG || {};
// const {
//     sanitizeHTML,
//     sanitizeAttribute,
//     escapeForJS,
//     validators,
//     safeSetInnerHTML,
//     safeSetTextContent,
//     createElementFromHTML,
//     showLoading,
//     hideLoading,
//     showError,
//     showSuccess,
//     validateForm
// } = window.utils || {};
// const { cachedFetch, apiCache } = window.cache || {};

// Fallback implementations if modules not loaded
if (!CONFIG.API_BASE) {
    CONFIG.API_BASE = 'http://localhost:8080/api';
}

if (!sanitizeHTML) {
    window.utils = {
        sanitizeHTML: (str) => str.replace(/[<>"'&]/g, (m) => ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;','&':'&amp;'}[m])),
        sanitizeAttribute: (str) => str.replace(/[<>"'&]/g, (m) => ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;','&':'&amp;'}[m])),
        escapeForJS: (str) => str.replace(/['"\\]/g, '\\$&'),
        validators: {
            email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
            required: (value) => value && value.trim().length > 0,
            minLength: (value, min) => value && value.length >= min,
            dateRange: (start, end) => new Date(start) <= new Date(end),
            futureDate: (date) => {
                const inputDate = new Date(date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return inputDate >= today;
            }
        },
        safeSetInnerHTML: (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; },
        safeSetTextContent: (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; },
        showLoading: (id, msg) => safeSetInnerHTML(id, `<div class="flex items-center justify-center p-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div><span>${msg}</span></div>`),
        hideLoading: (id) => safeSetInnerHTML(id, ''),
        showError: (msg, id) => { const el = document.getElementById(id || 'errorMessage'); if (el) { el.textContent = msg; el.classList.remove('hidden'); el.setAttribute('role', 'alert'); setTimeout(() => el.classList.add('hidden'), 5000); }},
        showSuccess: (msg, id) => { const el = document.getElementById(id || 'successMessage'); if (el) { el.textContent = msg; el.classList.remove('hidden'); el.setAttribute('role', 'status'); setTimeout(() => el.classList.add('hidden'), 3000); }},
        validateForm: (data, rules) => {
            const errors = [];
            for (const [field, value] of Object.entries(data)) {
                const fieldRules = rules[field] || [];
                for (const rule of fieldRules) {
                    const [ruleName, ...params] = Array.isArray(rule) ? rule : [rule];
                    if (ruleName === 'required' && !validators.required(value)) errors.push(`${field} is required`);
                    else if (ruleName === 'email' && !validators.email(value)) errors.push(`Please enter a valid email`);
                    else if (ruleName === 'minLength' && !validators.minLength(value, params[0])) errors.push(`${field} must be at least ${params[0]} characters`);
                }
            }
            return errors;
        }
    };
}

if (!cachedFetch) {
    window.cache = {
        apiCache: new Map(),
        cachedFetch: async (url, options = {}, useCache = true) => {
            const cacheKey = `${options.method || 'GET'}-${url}-${JSON.stringify(options.body || {})}`;
            if (useCache && options.method === 'GET') {
                const cached = window.cache.apiCache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < 300000) return cached.data;
            }
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (useCache && options.method === 'GET') {
                window.cache.apiCache.set(cacheKey, { data, timestamp: Date.now() });
            }
            return data;
        }
    };
}

// Global state
let statusChart, trendChart;
let employeeIdToDelete = null;
let myProfileRecord = null;
let currentSection = 'analytics';

// Authentication headers
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Basic ${localStorage.getItem('auth_token')}`
});

// Enhanced session check with accessibility
const checkSession = async () => {
    try {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('username');
        const role = localStorage.getItem('user_role') || 'EMPLOYEE';

        if (token) {
            // Update UI for authenticated state
            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('dashboard-view').classList.remove('hidden');

            safeSetTextContent('display-username', user);
            safeSetTextContent('role-badge', role);

            // Set ARIA attributes for screen readers
            document.getElementById('display-username').setAttribute('aria-label', `Logged in as ${user}`);
            document.getElementById('role-badge').setAttribute('aria-label', `Role: ${role}`);

            // Admin-specific UI
            if (role === 'ADMIN') {
                document.body.classList.add('is-admin');
                safeSetTextContent('leave-header', "Company-Wide Leave Requests");
            } else {
                document.body.classList.remove('is-admin');
                safeSetTextContent('leave-header', "My Applications History");
            }

            // Load user identity
            await syncMyIdentity();
            showSection('analytics');
        }
    } catch (error) {
        console.error('Session check failed:', error);
        showError('Session validation failed. Please log in again.');
        logout();
    }
};

// Enhanced authentication toggle with accessibility
const toggleAuth = (isRegister) => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('auth-title');
    const authIcon = document.getElementById('auth-icon');

    if (isRegister) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authTitle.textContent = "Join the Team";
        authIcon.className = "fas fa-user-plus text-2xl";
        authIcon.setAttribute('aria-label', 'Registration form');
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authTitle.textContent = "Welcome Back";
        authIcon.className = "fas fa-lock text-2xl";
        authIcon.setAttribute('aria-label', 'Login form');
    }
};

// Enhanced login with validation and accessibility
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Client-side validation
    const errors = validateForm({ username, password }, {
        username: ['required', ['minLength', 2]],
        password: ['required', ['minLength', 6]]
    });

    if (errors.length > 0) {
        showError(errors.join('. '));
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner mr-2"></div> Signing in...';

    try {
        const credentials = btoa(`${username}:${password}`);
        const res = await fetch(`${CONFIG.API_BASE}/employees`, {
            headers: { 'Authorization': `Basic ${credentials}` }
        });

        if (res.ok) {
            const role = username.toLowerCase().includes('admin') ? 'ADMIN' : 'EMPLOYEE';
            localStorage.setItem('auth_token', credentials);
            localStorage.setItem('username', username);
            localStorage.setItem('user_role', role);

            // Announce successful login to screen readers
            showSuccess('Login successful! Redirecting...');

            setTimeout(() => checkSession(), 1000);
        } else {
            showError("Authentication failed. Please check your credentials.");
        }
    } catch (err) {
        showError("Network error. Please check your connection and try again.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In';
    }
});

// Enhanced registration with validation
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById('reg-firstName').value.trim(),
        lastName: document.getElementById('reg-lastName').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        username: document.getElementById('reg-username').value.trim(),
        password: document.getElementById('reg-password').value
    };

    // Validation rules
    const errors = validateForm(formData, {
        firstName: ['required', ['minLength', 2]],
        lastName: ['required', ['minLength', 2]],
        email: ['required', 'email'],
        username: ['required', ['minLength', 3]],
        password: ['required', ['minLength', 8]]
    });

    if (errors.length > 0) {
        showError(errors.join('. '));
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner mr-2"></div> Creating account...';

    try {
        const res = await fetch(`${CONFIG.API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            showSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => toggleAuth(false), 2000);
        } else {
            const errorData = await res.json().catch(() => ({}));
            showError(errorData.message || "Registration failed. Username might be taken.");
        }
    } catch (err) {
        showError("Network error. Please try again.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account';
    }
});

// Logout with cleanup
const logout = () => {
    localStorage.clear();
    apiCache.clear();
    location.reload();
};

// Enhanced section navigation with keyboard support
const showSection = (id) => {
    // Update active section
    currentSection = id;

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
        s.setAttribute('aria-hidden', 'true');
    });

    // Show selected section
    const targetSection = document.getElementById(`section-${id}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.setAttribute('aria-hidden', 'false');
    }

    // Update navigation buttons
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('bg-indigo-700');
        l.classList.add('hover:bg-indigo-700');
        l.setAttribute('aria-current', 'false');
    });

    const activeNav = document.getElementById(`nav-${id}`);
    if (activeNav) {
        activeNav.classList.remove('hover:bg-indigo-700');
        activeNav.classList.add('bg-indigo-700');
        activeNav.setAttribute('aria-current', 'page');
    }

    // Load section data
    if (id === 'employees') fetchEmployees();
    if (id === 'leaves') fetchLeaves();
    if (id === 'analytics') renderAnalytics();
};

// Keyboard navigation for navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const sections = ['analytics', 'employees', 'leaves'];
        const currentIndex = sections.indexOf(currentSection);

        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            showSection(sections[currentIndex - 1]);
        } else if (e.key === 'ArrowRight' && currentIndex < sections.length - 1) {
            showSection(sections[currentIndex + 1]);
        }
    }
});

// Identity synchronization with error handling
const syncMyIdentity = async () => {
    try {
        const employees = await cachedFetch(`${CONFIG.API_BASE}/employees`, {
            headers: getAuthHeaders()
        });

        const user = localStorage.getItem('username').toLowerCase();
        myProfileRecord = employees.find(e =>
            e.firstName.toLowerCase() === user ||
            e.email.toLowerCase().includes(user)
        );

        if (!myProfileRecord) {
            console.warn('Could not find user profile in employee records');
        }
    } catch (e) {
        console.error("Identity sync failed:", e);
        showError("Failed to load user profile. Some features may not work correctly.");
    }
};

// Enhanced employee fetching with loading states and sanitization
const fetchEmployees = async () => {
    const tableBody = document.getElementById('employee-table-body');
    if (!tableBody) return;

    showLoading('employee-table-body', 'Loading employees...');

    try {
        const data = await cachedFetch(`${CONFIG.API_BASE}/employees`, {
            headers: getAuthHeaders()
        });

        const isAdmin = localStorage.getItem('user_role') === 'ADMIN';

        const employeeRows = data.map(emp => {
            const name = sanitizeHTML(`${emp.firstName} ${emp.lastName}`);
            const email = sanitizeHTML(emp.email);
            const position = sanitizeHTML(emp.position || 'Associate');
            const isCurrentUser = myProfileRecord?.id === emp.id;

            const userIndicator = isCurrentUser ? '<span class="text-[8px] bg-indigo-100 text-indigo-600 px-1 rounded ml-1" aria-label="This is you">You</span>' : '';

            const actions = isAdmin ? `
                <td class="p-4 text-center">
                    <button onclick="editEmployee(${emp.id}, '${escapeForJS(emp.firstName)}', '${escapeForJS(emp.lastName)}', '${escapeForJS(emp.email)}', '${escapeForJS(emp.position || '')}')"
                            class="text-indigo-600 hover:text-indigo-900 mx-2 transition p-1 focus-ring"
                            title="Edit ${name}"
                            aria-label="Edit employee ${name}">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button onclick="askDelete(${emp.id})"
                            class="text-red-400 hover:text-red-600 mx-2 transition p-1 focus-ring"
                            title="Delete ${name}"
                            aria-label="Delete employee ${name}">
                        <i class="fas fa-trash-alt" aria-hidden="true"></i>
                    </button>
                </td>
            ` : '<td class="p-4 text-center hidden"></td>';

            return `
                <tr class="hover:bg-indigo-50/30 transition border-b border-gray-50 last:border-0" role="row">
                    <td class="p-4 font-bold text-gray-900" role="gridcell">${name}${userIndicator}</td>
                    <td class="p-4 text-gray-500 font-medium" role="gridcell">${email}</td>
                    <td class="p-4 italic text-gray-400 text-xs" role="gridcell">${position}</td>
                    ${actions}
                </tr>
            `;
        }).join('');

        safeSetInnerHTML('employee-table-body', employeeRows);
        tableBody.setAttribute('aria-label', `Employee directory with ${data.length} employees`);
    } catch (e) {
        console.error('Failed to fetch employees:', e);
        safeSetInnerHTML('employee-table-body', '<tr><td colspan="4" class="p-8 text-center text-red-500">Failed to load employees. Please try again.</td></tr>');
    }
};

// Enhanced employee form toggle
const toggleEmployeeForm = () => {
    const formContainer = document.getElementById('employee-form-container');
    if (formContainer) {
        const isHidden = formContainer.classList.contains('hidden');
        formContainer.classList.toggle('hidden');

        const toggleBtn = document.querySelector('[onclick="toggleEmployeeForm()"]');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', !isHidden);
        }

        if (!isHidden) {
            // Form is being hidden, reset it
            document.getElementById('employee-form').reset();
            document.getElementById('employee-id').value = '';
        }
    }
};

// Enhanced employee form submission with validation
document.getElementById('employee-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        position: document.getElementById('position').value.trim()
    };

    const errors = validateForm(formData, {
        firstName: ['required', ['minLength', 2]],
        lastName: ['required', ['minLength', 2]],
        email: ['required', 'email'],
        position: [] // Optional
    });

    if (errors.length > 0) {
        showError(errors.join('. '));
        return;
    }

    const id = document.getElementById('employee-id').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${CONFIG.API_BASE}/employees/${id}` : `${CONFIG.API_BASE}/employees`;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner mr-2"></div> Saving...';

    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            showSuccess(id ? 'Employee updated successfully!' : 'Employee added successfully!');
            document.getElementById('employee-form').reset();
            document.getElementById('employee-id').value = '';
            toggleEmployeeForm();

            // Clear cache and refresh data
            apiCache.delete(`${CONFIG.API_BASE}/employees`);
            await syncMyIdentity();
            fetchEmployees();
        } else {
            const errorData = await res.json().catch(() => ({}));
            showError(errorData.message || 'Failed to save employee.');
        }
    } catch (err) {
        showError('Network error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Changes';
    }
});

// Safe employee editing
window.editEmployee = (id, f, l, e, p) => {
    document.getElementById('employee-id').value = id;
    document.getElementById('firstName').value = f;
    document.getElementById('lastName').value = l;
    document.getElementById('email').value = e;
    document.getElementById('position').value = p || '';

    if (document.getElementById('employee-form-container').classList.contains('hidden')) {
        toggleEmployeeForm();
    }

    // Focus first input for accessibility
    document.getElementById('firstName').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Enhanced delete confirmation with accessibility
window.askDelete = (id) => {
    employeeIdToDelete = id;
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        // Focus the cancel button for accessibility
        const cancelBtn = modal.querySelector('#cancel-delete-btn');
        if (cancelBtn) cancelBtn.focus();
    }
};

window.closeConfirmModal = () => {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
    employeeIdToDelete = null;
};

// Enhanced delete operation
document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    if (!employeeIdToDelete) return;

    const btn = document.getElementById('confirm-delete-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mr-2"></div> Deleting...';

    try {
        const res = await fetch(`${CONFIG.API_BASE}/employees/${employeeIdToDelete}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.ok) {
            showSuccess('Employee deleted successfully!');
            closeConfirmModal();

            // Clear cache and refresh
            apiCache.delete(`${CONFIG.API_BASE}/employees`);
            fetchEmployees();
        } else {
            showError('Failed to delete employee.');
        }
    } catch (err) {
        showError('Network error. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Delete';
        employeeIdToDelete = null;
    }
});

// Enhanced leave fetching with filtering and sanitization
const fetchLeaves = async () => {
    const tableBody = document.getElementById('leave-table-body');
    if (!tableBody) return;

    showLoading('leave-table-body', 'Loading leave requests...');

    try {
        let data = await cachedFetch(`${CONFIG.API_BASE}/leaves`, {
            headers: getAuthHeaders()
        });

        const role = localStorage.getItem('user_role');

        // Filter for non-admin users
        if (role !== 'ADMIN' && myProfileRecord) {
            data = data.filter(l => l.employee && l.employee.id === myProfileRecord.id);
        }

        if (data.length === 0) {
            safeSetInnerHTML('leave-table-body', '<tr><td colspan="5" class="p-8 text-center text-gray-300 italic text-xs" role="gridcell">No leave requests recorded</td></tr>');
            return;
        }

        const leaveRows = data.map(l => {
            const employeeName = l.employee
                ? sanitizeHTML(`${l.employee.firstName} ${l.employee.lastName}`)
                : '<span class="text-red-400" aria-label="Unlinked employee">System (Unlinked)</span>';

            const period = sanitizeHTML(`${l.startDate} to ${l.endDate}`);
            const reason = sanitizeHTML(l.reason);
            const statusBadge = `<span class="status-badge ${getStatusStyle(l.status)}" role="status" aria-label="Status: ${l.status}">${l.status}</span>`;

            const adminActions = role === 'ADMIN' ? `
                <td class="p-4 text-center">
                    <button onclick="setLeaveStatus(${l.id}, 'APPROVED')"
                            class="text-green-500 hover:scale-125 transition mx-1 focus-ring"
                            title="Approve request"
                            aria-label="Approve leave request for ${employeeName}">
                        <i class="fas fa-check-circle" aria-hidden="true"></i>
                    </button>
                    <button onclick="setLeaveStatus(${l.id}, 'REJECTED')"
                            class="text-red-400 hover:scale-125 transition mx-1 focus-ring"
                            title="Reject request"
                            aria-label="Reject leave request for ${employeeName}">
                        <i class="fas fa-times-circle" aria-hidden="true"></i>
                    </button>
                </td>
            ` : '<td class="p-4 text-center hidden"></td>';

            return `
                <tr class="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition" role="row">
                    <td class="p-4 font-bold text-gray-800 text-xs" role="gridcell">${employeeName}</td>
                    <td class="p-4 text-xs font-mono text-gray-400" role="gridcell">${period}</td>
                    <td class="p-4 italic text-gray-500 text-xs" role="gridcell">"${reason}"</td>
                    <td class="p-4 text-center" role="gridcell">${statusBadge}</td>
                    ${adminActions}
                </tr>
            `;
        }).join('');

        safeSetInnerHTML('leave-table-body', leaveRows);
        tableBody.setAttribute('aria-label', `Leave requests table with ${data.length} entries`);
    } catch (e) {
        console.error('Failed to fetch leaves:', e);
        safeSetInnerHTML('leave-table-body', '<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to load leave requests. Please try again.</td></tr>');
    }
};

// Status styling helper
const getStatusStyle = (status) => {
    switch (status) {
        case 'APPROVED': return 'status-approved';
        case 'REJECTED': return 'status-rejected';
        default: return 'status-pending';
    }
};

// Enhanced leave status update
window.setLeaveStatus = async (id, status) => {
    try {
        await fetch(`${CONFIG.API_BASE}/leaves/${id}/status?status=${status}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        showSuccess(`Leave request ${status.toLowerCase()} successfully!`);

        // Clear cache and refresh
        apiCache.delete(`${CONFIG.API_BASE}/leaves`);
        fetchLeaves();
        renderAnalytics();
    } catch (error) {
        console.error('Failed to update leave status:', error);
        showError('Failed to update leave status. Please try again.');
    }
};

// Modal management with accessibility
window.openLeaveModal = () => {
    const modal = document.getElementById('leave-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        // Focus first input
        const startDateInput = document.getElementById('leave-start');
        if (startDateInput) startDateInput.focus();
    }
};

window.closeLeaveModal = () => {
    const modal = document.getElementById('leave-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
};

// Enhanced leave form submission with validation
document.getElementById('leave-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const startDate = document.getElementById('leave-start').value;
    const endDate = document.getElementById('leave-end').value;
    const reason = document.getElementById('leave-reason').value.trim();

    // Validation
    const errors = validateForm({
        startDate,
        endDate,
        reason
    }, {
        startDate: ['required'],
        endDate: ['required'],
        reason: ['required', ['minLength', 5]]
    });

    if (!validators.dateRange(startDate, endDate)) {
        errors.push('End date must be after start date');
    }

    if (!validators.futureDate(startDate)) {
        errors.push('Start date must be in the future');
    }

    if (!validators.futureDate(endDate)) {
        errors.push('End date must be in the future');
    }

    if (errors.length > 0) {
        showError(errors.join('. '));
        return;
    }

    if (!myProfileRecord && localStorage.getItem('user_role') !== 'ADMIN') {
        showError("Identity error: You are not correctly linked to an Employee record. Please contact Admin.");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner mr-2"></div> Submitting...';

    const payload = {
        startDate,
        endDate,
        reason,
        status: 'PENDING',
        employee: myProfileRecord
    };

    try {
        const res = await fetch(`${CONFIG.API_BASE}/leaves`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showSuccess('Leave request submitted successfully!');
            closeLeaveModal();
            document.getElementById('leave-form').reset();

            // Clear cache and refresh
            apiCache.delete(`${CONFIG.API_BASE}/leaves`);
            fetchLeaves();
            renderAnalytics();
        } else {
            const errorData = await res.json().catch(() => ({}));
            showError(errorData.message || 'Failed to submit leave request.');
        }
    } catch (err) {
        showError('Network error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Request';
    }
});

// Enhanced analytics rendering
const renderAnalytics = async () => {
    try {
        const leaves = await cachedFetch(`${CONFIG.API_BASE}/leaves`, {
            headers: getAuthHeaders()
        });

        const stats = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
        const monthlyData = new Array(12).fill(0);

        leaves.forEach(l => {
            if (stats[l.status] !== undefined) stats[l.status]++;
            const month = new Date(l.startDate).getMonth();
            if (month >= 0 && month < 12) monthlyData[month]++;
        });

        // Destroy existing charts
        if (statusChart) statusChart.destroy();
        if (trendChart) trendChart.destroy();

        // Create status chart
        const statusCtx = document.getElementById('leaveStatusChart');
        if (statusCtx) {
            statusChart = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Approved', 'Rejected'],
                    datasets: [{
                        data: [stats.PENDING, stats.APPROVED, stats.REJECTED],
                        backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // Create trend chart
        const trendCtx = document.getElementById('leaveTrendChart');
        if (trendCtx) {
            trendChart = new Chart(trendCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                    datasets: [{
                        label: 'Requests',
                        data: monthlyData,
                        backgroundColor: '#6366f1',
                        borderRadius: 4
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { display: false },
                            ticks: { stepSize: 1 }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Failed to render analytics:', error);
        showError('Failed to load analytics data.');
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Alt + number shortcuts for sections
        if (e.altKey && e.key >= '1' && e.key <= '3') {
            const sections = ['analytics', 'employees', 'leaves'];
            const index = parseInt(e.key) - 1;
            if (sections[index]) {
                e.preventDefault();
                showSection(sections[index]);
            }
        }

        // Escape key to close modals
        if (e.key === 'Escape') {
            closeConfirmModal();
            closeLeaveModal();
        }
    });

    // Periodic cache cleanup
    setInterval(() => {
        if (window.cache && window.cache.apiCache) {
            window.cache.apiCache.cleanup();
        }
    }, 60000); // Clean every minute
});

// Export functions for global access
window.showSection = showSection;
window.toggleEmployeeForm = toggleEmployeeForm;
window.logout = logout;
window.toggleAuth = toggleAuth;