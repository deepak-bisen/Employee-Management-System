document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:8080/api/employees';

    // Helper to get Auth Headers for every request
    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            // If no token, redirect to login
            window.location.href = 'login.html';
            return {};
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${token}`
        };
    };

    // Form elements
    const employeeForm = document.getElementById('employee-form');
    const employeeIdInput = document.getElementById('employee-id');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const positionInput = document.getElementById('position');
    const clearBtn = document.getElementById('clear-btn');
    
    // Table
    const employeeTableBody = document.getElementById('employee-table-body');

    // Modal elements
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    let employeeIdToDelete = null;

    // --- API Functions ---
    const fetchEmployees = async () => {
        try {
            const response = await fetch(API_URL, {
                headers: getAuthHeaders()
            });
            
            if (response.status === 401 || response.status === 403) {
                window.location.href = 'login.html';
                return;
            }

            if (!response.ok) throw new Error('Network response was not ok');
            const employees = await response.json();
            renderEmployees(employees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            employeeTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-red-500 font-bold italic">Access Denied. Please ensure you are logged in as an Admin.</td></tr>`;
        }
    };

    const saveEmployee = async (employeeData, id) => {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(employeeData),
            });

            if (response.ok) {
                clearForm();
                fetchEmployees();
            } else if (response.status === 403) {
                alert("Permission Denied: Only Admins can modify employee data.");
            } else {
                console.error('Failed to save employee:', await response.text());
            }
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };

    const performDeleteEmployee = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                fetchEmployees();
            } else if (response.status === 403) {
                alert("Permission Denied: Only Admins can delete employees.");
            } else {
                console.error('Failed to delete employee:', await response.text());
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        } finally {
            closeModal();
        }
    };
    
    // --- UI Rendering ---
    const renderEmployees = (employees) => {
        employeeTableBody.innerHTML = '';
        if (!employees || employees.length === 0) {
            employeeTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-500 font-medium">No records found.</td></tr>`;
            return;
        }

        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 border-b border-gray-100 transition';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${employee.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">${employee.firstName} ${employee.lastName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">${employee.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${employee.position}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                    <button class="text-indigo-600 hover:text-indigo-900 transition p-1" onclick="window.editEmployeeHandler(${employee.id}, '${employee.firstName}', '${employee.lastName}', '${employee.email}', '${employee.position}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="text-red-600 hover:text-red-900 transition p-1" onclick="window.deleteEmployeeHandler(${employee.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            employeeTableBody.appendChild(row);
        });
    };

    // --- Event Handlers & Form Logic ---
    if (employeeForm) {
        employeeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const employeeData = {
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                email: emailInput.value,
                position: positionInput.value,
            };
            saveEmployee(employeeData, employeeIdInput.value);
        });
    }

    const clearForm = () => {
        if (employeeForm) employeeForm.reset();
        employeeIdInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (clearBtn) clearBtn.addEventListener('click', clearForm);

    // Make handlers globally accessible
    window.editEmployeeHandler = (id, firstName, lastName, email, position) => {
        employeeIdInput.value = id;
        firstNameInput.value = firstName;
        lastNameInput.value = lastName;
        emailInput.value = email;
        positionInput.value = position;
        firstNameInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteEmployeeHandler = (id) => {
        employeeIdToDelete = id;
        openModal();
    };

    // --- Modal Logic ---
    const openModal = () => confirmationModal && confirmationModal.classList.remove('hidden');
    const closeModal = () => {
        if (confirmationModal) confirmationModal.classList.add('hidden');
        employeeIdToDelete = null;
    };

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (employeeIdToDelete) {
                performDeleteEmployee(employeeIdToDelete);
            }
        });
    }
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModal);

    // Initial fetch
    fetchEmployees();
});