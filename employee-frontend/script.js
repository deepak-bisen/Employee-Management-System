document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:8080/api/employees';

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
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const employees = await response.json();
            renderEmployees(employees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            employeeTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-red-500">Failed to load employees. Is the backend server running?</td></tr>`;
        }
    };

    const saveEmployee = async (employeeData, id) => {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData),
            });

            if (response.ok) {
                clearForm();
                fetchEmployees();
            } else {
                console.error('Failed to save employee:', await response.text());
            }
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };

    const performDeleteEmployee = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchEmployees();
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
        if (employees.length === 0) {
            employeeTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-500">No employees found. Add one using the form above.</td></tr>`;
            return;
        }

        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${employee.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${employee.firstName} ${employee.lastName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${employee.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${employee.position}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <button class="text-indigo-600 hover:text-indigo-900" onclick="window.editEmployeeHandler(${employee.id}, '${employee.firstName}', '${employee.lastName}', '${employee.email}', '${employee.position}')">Edit</button>
                    <button class="text-red-600 hover:text-red-900" onclick="window.deleteEmployeeHandler(${employee.id})">Delete</button>
                </td>
            `;
            employeeTableBody.appendChild(row);
        });
    };

    // --- Event Handlers & Form Logic ---
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

    const clearForm = () => {
        employeeForm.reset();
        employeeIdInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };



    clearBtn.addEventListener('click', clearForm);

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
    const openModal = () => confirmationModal.classList.remove('hidden');
    const closeModal = () => {
        confirmationModal.classList.add('hidden');
        employeeIdToDelete = null;
    };

    confirmDeleteBtn.addEventListener('click', () => {
        if (employeeIdToDelete) {
            performDeleteEmployee(employeeIdToDelete);
        }
    });
    cancelDeleteBtn.addEventListener('click', closeModal);

    // Initial fetch
    fetchEmployees();
});
